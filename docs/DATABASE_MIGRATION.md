# Database Migration Guide

This file documents how to migrate from the local SQLite database to cloud database services.

## Current Local Setup
- **Database**: Expo SQLite (local file-based)
- **Location**: Device storage (`magicdecks.db`)
- **Service**: `services/databaseService.ts`

## Migration Options

### 1. Supabase (Recommended)
```typescript
// Install: npm install @supabase/supabase-js

// services/supabaseService.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'your-project-url';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
  async getAllDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select(`
        *,
        cards (*)
      `)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // ... other methods
}
```

### 2. Firebase Firestore
```typescript
// Install: npm install firebase

// services/firebaseService.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class FirebaseService {
  async getAllDecks(): Promise<Deck[]> {
    const querySnapshot = await getDocs(collection(db, 'decks'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Deck[];
  }
  
  // ... other methods
}
```

### 3. Custom REST API
```typescript
// services/apiService.ts
export class ApiService {
  private baseUrl = 'https://your-api.com';
  
  async getAllDecks(): Promise<Deck[]> {
    const response = await fetch(`${this.baseUrl}/decks`);
    if (!response.ok) throw new Error('Failed to fetch decks');
    return response.json();
  }
  
  // ... other methods
}
```

## Migration Steps

### Phase 1: Add Cloud Service
1. Choose your cloud provider
2. Create new service file (e.g., `supabaseService.ts`)
3. Implement same interface as `databaseService.ts`
4. Test with a few operations

### Phase 2: Data Migration
1. Export data from SQLite:
```typescript
// Add to databaseService.ts
async exportAllData(): Promise<{decks: Deck[], cards: Card[]}> {
  const decks = await this.getAllDecks();
  // Return all data for migration
  return { decks, cards: [] };
}
```

2. Import to cloud service:
```typescript
// Migration script
const localData = await databaseService.exportAllData();
for (const deck of localData.decks) {
  await cloudService.createDeck(deck);
}
```

### Phase 3: Switch Services
1. Update `DeckContext.tsx`:
```typescript
// Replace this line:
import { databaseService } from '../services/databaseService';

// With your chosen service:
import { supabaseService as databaseService } from '../services/supabaseService';
// or
import { firebaseService as databaseService } from '../services/firebaseService';
// or  
import { apiService as databaseService } from '../services/apiService';
```

2. Test thoroughly
3. Remove local database dependency

### Phase 4: Add Cloud Features
Once migrated, you can add cloud-specific features:
- Real-time updates
- User authentication
- Data sync across devices
- Backup and restore
- Collaborative features

## Environment Configuration
```typescript
// config/database.ts
const DATABASE_CONFIG = {
  development: {
    type: 'sqlite',
    service: () => import('../services/databaseService'),
  },
  production: {
    type: 'supabase',
    service: () => import('../services/supabaseService'),
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  }
};
```

This allows you to use local database in development and cloud in production!

## Benefits of This Approach
- ✅ **Offline Development**: Work without internet
- ✅ **Fast Iteration**: No API latency during development  
- ✅ **Easy Testing**: Reset database instantly
- ✅ **Same Interface**: Minimal code changes when migrating
- ✅ **Gradual Migration**: Test cloud service alongside local
- ✅ **Fallback Option**: Keep local as backup option