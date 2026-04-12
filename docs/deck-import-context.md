# Deck Import Context System

This document explains the new React Context + Hook structure for managing deck import and analysis data in the Magic App.

## Overview

The deck import process now uses a centralized state management system that allows users to:

1. **Paste raw decklist** and analyze it automatically
2. **Manually edit analyzed data** before saving to database
3. **Track validation** and unsaved changes
4. **Store data** using existing `add_deck_scripts` functions

## Architecture

### Core Files

- **`contexts/DeckImportContext.tsx`** - React Context provider with reducer-based state management
- **`hooks/useDeckImportHelpers.ts`** - Custom hook with helper functions
- **`utils/deckImportHelpers.ts`** - Pure utility functions for data conversion
- **`components/deck-import/DeckImportComponents.tsx`** - Reusable UI components
- **`examples/AddDeckWithContext.tsx`** - Integration examples

### Data Flow

```
Raw Decklist → Parse/Validate → EditableDeckData → User Edits → Database Storage
     ↓              ↓                    ↓             ↓            ↓
 TextInput    add_deck_scripts      Context State   UI Components   Database
```

## Data Structure

### EditableDeckData Interface

```typescript
interface EditableDeckData {
  // Basic metadata
  deckName: string;
  owner: string;
  selectedCommander: string; // User-selected after analysis

  // Database-aligned structures
  cardCounts: DeckCardCountsInsert;
  colorIdentity: DeckColorIdentityInsert;
  manaCurve: DeckManaCurveInsert;

  // User-editable card lists
  ramp: {
    rampCards: string[]; // All ramp cards
    fastManaCards: string[]; // Sol Ring, Mana Crypt, etc.
    landRampCards: string[]; // Cultivate, Rampant Growth, etc.
    manaDorkCards: string[]; // Llanowar Elves, Birds, etc.
    rockCards: string[]; // Signets, Talismans, etc.
    stats: DeckRampInsert; // Calculated statistics
  };

  interaction: {
    singleTargetRemovalCards: string[]; // Path to Exile, Swords, etc.
    boardWipeCards: string[]; // Wrath of God, Cyclonic Rift
    counterspellCards: string[];
    stackInteractionCards: string[]; // All instant-speed interaction
    stats: DeckInteractionInsert;
  };

  wincons: {
    comboPieceCards: string[];
    knownCombos: string[]; // Text descriptions
    finisherCards: string[]; // Game-ending cards
    stats: DeckWinconSpeedInsert;
  };

  archetype: DeckArchetypeInsert;
}
```

## Usage Examples

### Basic Setup

```tsx
import { DeckImportProvider } from "../contexts/DeckImportContext";

function App() {
  return (
    <DeckImportProvider>
      <YourComponents />
    </DeckImportProvider>
  );
}
```

### Using the Context

```tsx
import { useDeckImport } from "../contexts/DeckImportContext";

function DeckEditor() {
  const { state, actions } = useDeckImport();

  // Access any data
  const deckName = state.editableData.deckName;
  const rampCards = state.editableData.ramp.rampCards;

  // Update data
  actions.updateDeckName("My New Deck");
  actions.updateRampCards("rampCards", ["Sol Ring", "Arcane Signet"]);

  return <div>...</div>;
}
```

### Using Helper Functions

```tsx
import { useDeckImportHelpers } from "../hooks/useDeckImportHelpers";

function DeckAnalysis() {
  const {
    canAnalyze,
    canSave,
    getAllCardNames,
    hasUnsavedChanges,
    getValidationErrors,
  } = useDeckImportHelpers();

  return (
    <div>
      <button disabled={!canAnalyze}>Analyze</button>
      <button disabled={!canSave}>Save</button>
      {hasUnsavedChanges && <p>Unsaved changes!</p>}
    </div>
  );
}
```

## Key Benefits

### 1. **Centralized State Management**

- All deck import data in one place
- No prop drilling between components
- Consistent state updates with reducer pattern

### 2. **Manual Data Editing**

- Users can edit analyzed card lists before saving
- Real-time validation and error feedback
- Unsaved changes tracking

### 3. **Database Schema Alignment**

- Data structures match `start_model_schema.sql` exactly
- No extra features beyond schema requirements
- Seamless integration with `add_deck_scripts` functions

### 4. **Type Safety**

- Full TypeScript support
- Compile-time validation of data structures
- IDE autocomplete for all data fields

### 5. **Reusable Components**

- Modular UI components for each data section
- Easy to customize and extend
- Consistent styling across the app

## Integration with Existing Code

### Replace add_deck.tsx

```tsx
// Old approach - manual state management
const [deckName, setDeckName] = useState("");
const [rampCards, setRampCards] = useState([]);
// ... many more useState calls

// New approach - context-based
return (
  <DeckImportProvider>
    <DecklistInput />
    <RampCardEditor />
    <SaveControls />
  </DeckImportProvider>
);
```

### Connect to add_deck_scripts

The context automatically integrates with your existing functions:

```typescript
// Functions from add_deck_scripts are called automatically
const analyzed = parseDecklist(rawText); // ✓ Used
const validation = validateDecklist(rawText); // ✓ Used
const plan = buildDeckImportPlan(parsed, opts); // ✓ Used
const result = storeDeckImportPlan(plan); // ✓ Used
```

## Workflow

### 1. User Pastes Decklist

- Context validates and parses automatically
- Commander slot is ignored for analysis defaults
- Shows validation errors/warnings
- Generates empty card lists for manual editing

### 2. User Chooses Commander

- Commander is selected after analysis from analyzed candidates
- Save remains disabled until a commander is chosen

### 3. User Edits Data

- Add/remove cards from ramp, interaction, wincon lists
- Edit deck metadata (name, owner)
- Adjust archetype classification
- Statistics recalculate automatically

### 4. User Saves Deck

- Context uses the explicit commander selection as `commander_override`
- Context converts editable data to database format
- Calls existing `add_deck_scripts` functions
- Stores to database via `databaseService`
- Provides success/error feedback

## Extensibility

### Adding New Card Categories

```typescript
// 1. Add to EditableDeckData interface
interface EditableDeckData {
  // ... existing fields
  removal: {
    removalCards: string[];
    stats: DeckRemovalInsert;
  };
}

// 2. Add action types
type DeckImportAction =
  | { type: "UPDATE_REMOVAL_CARDS"; payload: { cards: string[] } }
  | /* ... existing actions */;

// 3. Add reducer case
case "UPDATE_REMOVAL_CARDS":
  return {
    ...state,
    editableData: {
      ...state.editableData,
      removal: { ...state.editableData.removal, removalCards: action.payload.cards }
    }
  };

// 4. Add action function
actions: {
  updateRemovalCards: (cards: string[]) =>
    dispatch({ type: "UPDATE_REMOVAL_CARDS", payload: { cards } })
}
```

### Creating Custom Components

```tsx
function CustomCardEditor() {
  const { state, actions } = useDeckImport();

  // Access any context data
  // Use any context actions
  // Implement your custom UI

  return <YourCustomUI />;
}
```

This architecture provides a solid foundation for deck import functionality while maintaining alignment with your database schema and existing codebase.
