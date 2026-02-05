import * as SQLite from 'expo-sqlite';
import { 
  Deck, 
  Card, 
  DeckCard, 
  User, 
  Game, 
  GameParticipant, 
  CreateDeckRequest,
  UpdateDeckRequest,
  GameCreateRequest 
} from '../types/deck';

class DatabaseService {
  private db: SQLite.SQLiteDatabase;
  private initialized = false;

  constructor() {
    this.db = SQLite.openDatabaseSync('magicdecks.db');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create tables using comprehensive schema
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        
        -- Users table
        CREATE TABLE IF NOT EXISTS mtg_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          email TEXT UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Updated decks table matching schema
        CREATE TABLE IF NOT EXISTS decks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL DEFAULT 1,
          name TEXT NOT NULL,
          
          -- Deck composition and stats
          colors TEXT NOT NULL, -- JSON string array
          commander_name TEXT,
          commander_cmc INTEGER,
          average_mana_value REAL,
          bracket_level INTEGER CHECK (bracket_level BETWEEN 1 AND 5),
          
          -- Game statistics  
          winrate REAL DEFAULT 0.0 CHECK (winrate >= 0.0 AND winrate <= 1.0),
          total_games INTEGER DEFAULT 0 CHECK (total_games >= 0),
          wins INTEGER DEFAULT 0 CHECK (wins >= 0),
          losses INTEGER DEFAULT 0 CHECK (losses >= 0),
          
          -- Metadata
          description TEXT,
          last_played TEXT, -- ISO date string
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          -- Constraints
          FOREIGN KEY (user_id) REFERENCES mtg_users(id) ON DELETE CASCADE,
          CHECK (wins + losses <= total_games)
        );

        -- Cards table (master card database)
        CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY, -- Scryfall ID or similar
          name TEXT NOT NULL,
          mana_cost TEXT,
          cmc INTEGER,
          type_line TEXT,
          rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'mythic')),
          colors TEXT, -- JSON array
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Deck cards junction table
        CREATE TABLE IF NOT EXISTS deck_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deck_id INTEGER NOT NULL,
          card_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          category TEXT DEFAULT 'main', -- 'main', 'sideboard', 'maybeboard'
          
          -- Constraints
          FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
          FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
          UNIQUE (deck_id, card_id, category)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
        CREATE INDEX IF NOT EXISTS idx_decks_last_played ON decks(last_played);
        CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
        CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards(card_id);
        
        -- Ensure default user exists
        INSERT OR IGNORE INTO mtg_users (id, name, email) VALUES (1, 'Default User', 'user@example.com');
      `);

      // Check if we need to seed data
      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM decks');
      if (result && (result as any).count === 0) {
        await this.seedInitialData();
      }

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async seedInitialData(): Promise<void> {
    console.log('Seeding initial data...');
    
    // Sample data with new schema structure
    const sampleDecks = [
      {
        name: "Morska",
        colors: JSON.stringify(["white", "blue", "green"]),
        commander_name: "Atraxa, Grand Unifier",
        commander_cmc: 7,
        average_mana_value: 3.2,
        bracket_level: 4,
        winrate: 0.65, // Database stores as 0.0-1.0
        total_games: 47,
        wins: 30,
        losses: 17,
        description: "A control deck focused on card advantage and late game dominance.",
        last_played: new Date('2024-10-20').toISOString(),
      },
      {
        name: "Blaster",
        colors: JSON.stringify(["red", "green"]),
        commander_name: "Xenagos, God of Revels",
        commander_cmc: 5,
        average_mana_value: 2.8,
        bracket_level: 3,
        winrate: 0.55,
        total_games: 32,
        wins: 18,
        losses: 14,
        description: "An aggressive deck that aims to deal damage quickly.",
        last_played: new Date('2024-10-22').toISOString(),
      },
      {
        name: "War Doctor",
        colors: JSON.stringify(["white", "red", "green"]),
        commander_name: "Atla Palani, Nest Tender",
        commander_cmc: 3,
        average_mana_value: 4.1,
        bracket_level: 3,
        winrate: 0.70,
        total_games: 28,
        wins: 20,
        losses: 8,
        description: "A midrange deck with powerful creatures and removal.",
        last_played: new Date('2024-10-25').toISOString(),
      }
    ];

    for (const deck of sampleDecks) {
      const result = await this.db.runAsync(
        `INSERT INTO decks (user_id, name, colors, commander_name, commander_cmc, average_mana_value, 
         bracket_level, winrate, total_games, wins, losses, description, last_played) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, // default user_id
          deck.name, 
          deck.colors, 
          deck.commander_name,
          deck.commander_cmc,
          deck.average_mana_value,
          deck.bracket_level,
          deck.winrate, 
          deck.total_games,
          deck.wins,
          deck.losses,
          deck.description, 
          deck.last_played
        ]
      );

      // Add sample cards to master cards table and link via deck_cards
      const deckId = result.lastInsertRowId;
      const sampleCards = [
        { id: "lightning_bolt", name: "Lightning Bolt", mana_cost: "{R}", cmc: 1, type_line: "Instant", rarity: "common", colors: JSON.stringify(["red"]) },
        { id: "counterspell", name: "Counterspell", mana_cost: "{U}{U}", cmc: 2, type_line: "Instant", rarity: "common", colors: JSON.stringify(["blue"]) },
        { id: "wrath_of_god", name: "Wrath of God", mana_cost: "{2}{W}{W}", cmc: 4, type_line: "Sorcery", rarity: "rare", colors: JSON.stringify(["white"]) },
      ];

      for (const card of sampleCards) {
        // Insert card if it doesn't exist
        await this.db.runAsync(
          `INSERT OR IGNORE INTO cards (id, name, mana_cost, cmc, type_line, rarity, colors) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [card.id, card.name, card.mana_cost, card.cmc, card.type_line, card.rarity, card.colors]
        );

        // Link card to deck
        await this.db.runAsync(
          `INSERT INTO deck_cards (deck_id, card_id, quantity, category) 
           VALUES (?, ?, ?, ?)`,
          [deckId, card.id, Math.floor(Math.random() * 4) + 1, 'main'] // Random quantity 1-4
        );
      }
    }
  }

  async getAllDecks(): Promise<Deck[]> {
    await this.initialize();
    
    const decks = await this.db.getAllAsync(`
      SELECT * FROM decks ORDER BY updated_at DESC
    `) as any[];

    // Get cards for each deck via junction table
    const decksWithCards: Deck[] = [];
    for (const deck of decks) {
      const deckCards = await this.db.getAllAsync(`
        SELECT 
          dc.id,
          dc.deck_id,
          dc.card_id,
          dc.quantity,
          dc.category,
          c.name as card_name,
          c.mana_cost,
          c.cmc,
          c.type_line,
          c.rarity,
          c.colors as card_colors
        FROM deck_cards dc
        LEFT JOIN cards c ON dc.card_id = c.id
        WHERE dc.deck_id = ?
      `, [deck.id]) as any[];

      decksWithCards.push(this.mapDeckFromDatabase(deck, deckCards));
    }

    return decksWithCards;
  }

  // Helper method to convert database row to Deck object
  private mapDeckFromDatabase(deckRow: any, cardRows: any[] = []): Deck {
    return {
      id: deckRow.id,
      user_id: deckRow.user_id,
      name: deckRow.name,
      colors: JSON.parse(deckRow.colors),
      commander_name: deckRow.commander_name,
      commander_cmc: deckRow.commander_cmc,
      average_mana_value: deckRow.average_mana_value,
      bracket_level: deckRow.bracket_level,
      winrate: Math.round(deckRow.winrate * 100), // Convert 0.0-1.0 to percentage 0-100
      total_games: deckRow.total_games,
      wins: deckRow.wins,
      losses: deckRow.losses,
      description: deckRow.description,
      last_played: deckRow.last_played ? new Date(deckRow.last_played) : undefined,
      created_at: deckRow.created_at,
      updated_at: deckRow.updated_at,
      cards: cardRows.map(cardRow => ({
        id: cardRow.id,
        deck_id: cardRow.deck_id,
        card_id: cardRow.card_id,
        quantity: cardRow.quantity,
        category: cardRow.category,
        card: cardRow.card_name ? {
          id: cardRow.card_id,
          name: cardRow.card_name,
          mana_cost: cardRow.mana_cost,
          cmc: cardRow.cmc,
          type_line: cardRow.type_line,
          rarity: cardRow.rarity,
          colors: cardRow.card_colors ? JSON.parse(cardRow.card_colors) : [],
          created_at: '', // Not loaded in this query
        } : undefined
      }))
    };
  }

  async getDeckById(id: number): Promise<Deck | null> {
    await this.initialize();

    const deck = await this.db.getFirstAsync(
      'SELECT * FROM decks WHERE id = ?',
      [id]
    ) as any;

    if (!deck) return null;

    const deckCards = await this.db.getAllAsync(`
      SELECT 
        dc.id,
        dc.deck_id,
        dc.card_id,
        dc.quantity,
        dc.category,
        c.name as card_name,
        c.mana_cost,
        c.cmc,
        c.type_line,
        c.rarity,
        c.colors as card_colors
      FROM deck_cards dc
      LEFT JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `, [id]) as any[];

    return this.mapDeckFromDatabase(deck, deckCards);
  }

  async createDeck(deckRequest: CreateDeckRequest): Promise<Deck> {
    await this.initialize();

    const result = await this.db.runAsync(
      `INSERT INTO decks (user_id, name, colors, commander_name, commander_cmc, 
       average_mana_value, bracket_level, winrate, total_games, wins, losses, description, last_played) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deckRequest.user_id || 1, // Default to user 1
        deckRequest.name,
        JSON.stringify(deckRequest.colors),
        deckRequest.commander_name || null,
        deckRequest.commander_cmc || null,
        deckRequest.average_mana_value || null,
        deckRequest.bracket_level || null,
        (deckRequest.winrate || 0) / 100, // Convert percentage to 0.0-1.0
        0, // total_games (new decks start with 0)
        0, // wins (new decks start with 0)
        0, // losses (new decks start with 0)
        deckRequest.description || null,
        deckRequest.last_played?.toISOString() || null
      ]
    );

    const deckId = result.lastInsertRowId;

    // Insert cards if provided
    if (deckRequest.cards) {
      for (const deckCard of deckRequest.cards) {
        // Insert card into master cards table if it doesn't exist
        if (deckCard.card) {
          await this.db.runAsync(
            `INSERT OR IGNORE INTO cards (id, name, mana_cost, cmc, type_line, rarity, colors) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              deckCard.card.id,
              deckCard.card.name,
              deckCard.card.mana_cost || null,
              deckCard.card.cmc,
              deckCard.card.type_line,
              deckCard.card.rarity,
              JSON.stringify(deckCard.card.colors)
            ]
          );
        }

        // Link card to deck
        await this.db.runAsync(
          `INSERT INTO deck_cards (deck_id, card_id, quantity, category) 
           VALUES (?, ?, ?, ?)`,
          [deckId, deckCard.card_id, deckCard.quantity, deckCard.category]
        );
      }
    }

    const createdDeck = await this.getDeckById(deckId);
    return createdDeck!;
  }

  async updateDeck(deck: Deck): Promise<Deck> {
    await this.initialize();

    await this.db.runAsync(
      `UPDATE decks SET 
       user_id = ?, name = ?, colors = ?, commander_name = ?, commander_cmc = ?,
       average_mana_value = ?, bracket_level = ?, winrate = ?, total_games = ?,
       wins = ?, losses = ?, description = ?, last_played = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        deck.user_id,
        deck.name,
        JSON.stringify(deck.colors),
        deck.commander_name || null,
        deck.commander_cmc || null,
        deck.average_mana_value || null,
        deck.bracket_level || null,
        deck.winrate / 100, // Convert percentage to 0.0-1.0 for database
        deck.total_games,
        deck.wins,
        deck.losses,
        deck.description || null,
        deck.last_played?.toISOString() || null,
        deck.id
      ]
    );

    // Update cards (simple approach: delete and re-insert)
    await this.db.runAsync('DELETE FROM deck_cards WHERE deck_id = ?', [deck.id]);
    
    if (deck.cards) {
      for (const deckCard of deck.cards) {
        // Insert card into master cards table if it doesn't exist
        if (deckCard.card) {
          await this.db.runAsync(
            `INSERT OR IGNORE INTO cards (id, name, mana_cost, cmc, type_line, rarity, colors) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              deckCard.card.id,
              deckCard.card.name,
              deckCard.card.mana_cost || null,
              deckCard.card.cmc,
              deckCard.card.type_line,
              deckCard.card.rarity,
              JSON.stringify(deckCard.card.colors)
            ]
          );
        }

        // Link card to deck
        await this.db.runAsync(
          `INSERT INTO deck_cards (deck_id, card_id, quantity, category) 
           VALUES (?, ?, ?, ?)`,
          [deck.id, deckCard.card_id, deckCard.quantity, deckCard.category]
        );
      }
    }

    const updatedDeck = await this.getDeckById(deck.id);
    return updatedDeck!;
  }

  async deleteDeck(id: number): Promise<void> {
    await this.initialize();
    
    // Cards will be deleted automatically due to CASCADE
    await this.db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
  }

  // Utility method to reset database (useful for development)
  async resetDatabase(): Promise<void> {
    await this.db.execAsync(`
      DROP TABLE IF EXISTS deck_cards;
      DROP TABLE IF EXISTS cards;
      DROP TABLE IF EXISTS decks;
      DROP TABLE IF EXISTS mtg_users;
    `);
    this.initialized = false;
    await this.initialize();
  }

  // Additional methods for advanced features
  
  async createUser(name: string, email?: string): Promise<User> {
    await this.initialize();
    
    const result = await this.db.runAsync(
      'INSERT INTO mtg_users (name, email) VALUES (?, ?)',
      [name, email || null]
    );

    const user = await this.db.getFirstAsync(
      'SELECT * FROM mtg_users WHERE id = ?',
      [result.lastInsertRowId]
    ) as any;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async getAllUsers(): Promise<User[]> {
    await this.initialize();
    
    const users = await this.db.getAllAsync('SELECT * FROM mtg_users ORDER BY name') as any[];
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();