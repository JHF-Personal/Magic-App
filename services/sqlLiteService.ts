// ============================================================================
// SQLite Database Service for Magic Commander Game Prediction
// ============================================================================

import * as SQLite from "expo-sqlite";
import type {
  Commander,
  CommanderInsert,
  CommanderUpdate,
  Deck,
  DeckArchetype,
  DeckArchetypeInsert,
  // Feature Tables
  DeckCardCounts,
  DeckCardCountsInsert,
  DeckColorIdentity,
  DeckColorIdentityInsert,
  DeckInsert,
  DeckInteraction,
  DeckInteractionInsert,
  DeckManaCurve,
  DeckManaCurveInsert,
  // Composite Types
  DeckProfile,
  DeckRamp,
  DeckRampInsert,
  DeckUpdate,
  DeckWinconSpeed,
  DeckWinconSpeedInsert,
  // Core Entities
  Game,
  GameInsert,
  GameOverview,
  GameRecord,
  // Aggregates and Views
  GameTableMetrics,
  GameTableMetricsInsert,
  GameUpdate,
  InstanceArchetypeMatchup,
  InstanceArchetypeMatchupInsert,
  InstanceColorCompetition,
  InstanceColorCompetitionInsert,
  InstanceInteractionPressure,
  InstanceInteractionPressureInsert,
  InstanceProfile,
  // Instance Features
  InstanceRelativeMetrics,
  InstanceRelativeMetricsInsert,
  InstanceThreatLevel,
  InstanceThreatLevelInsert,
  PlayerGameInstance,
  PlayerGameInstanceInsert,
  PlayerGameInstanceUpdate,
  TrainingFeatures,
} from "../types/databaseTypes";

const DB_NAME = "magic_commander.db";

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize the database connection and create schema if needed
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createSchema();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Create all tables and views from the schema
   */
  private async createSchema(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Read the schema file and execute it
    // For now, we'll define the schema inline for reliability
    const schemaSQL = `
      -- Core Tables
      CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        winner_position INTEGER CHECK (winner_position BETWEEN 0 AND 3),
        game_duration_minutes INTEGER,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS commanders (
        commander_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color_identity TEXT,
        cmc REAL,
        power REAL,
        toughness REAL,
        card_types TEXT,
        subtypes TEXT
      );

      CREATE TABLE IF NOT EXISTS decks (
        deck_id INTEGER PRIMARY KEY AUTOINCREMENT,
        commander_id INTEGER NOT NULL,
        deck_name TEXT,
        owner TEXT,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
      );

      CREATE TABLE IF NOT EXISTS player_game_instances (
        instance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        deck_id INTEGER NOT NULL,
        seat_position INTEGER NOT NULL CHECK (seat_position BETWEEN 0 AND 3),
        finished_position INTEGER CHECK (finished_position BETWEEN 1 AND 4),
        UNIQUE (game_id, seat_position),
        FOREIGN KEY (game_id) REFERENCES games(game_id),
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      -- Feature Tables
      CREATE TABLE IF NOT EXISTS deck_card_counts (
        deck_id INTEGER PRIMARY KEY,
        num_creatures INTEGER DEFAULT 0,
        num_instants INTEGER DEFAULT 0,
        num_sorceries INTEGER DEFAULT 0,
        num_artifacts INTEGER DEFAULT 0,
        num_enchantments INTEGER DEFAULT 0,
        num_planeswalkers INTEGER DEFAULT 0,
        num_lands INTEGER DEFAULT 0,
        total_cards INTEGER DEFAULT 100,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_color_identity (
        deck_id INTEGER PRIMARY KEY,
        is_white INTEGER CHECK (is_white IN (0, 1)) DEFAULT 0,
        is_blue INTEGER CHECK (is_blue IN (0, 1)) DEFAULT 0,
        is_black INTEGER CHECK (is_black IN (0, 1)) DEFAULT 0,
        is_red INTEGER CHECK (is_red IN (0, 1)) DEFAULT 0,
        is_green INTEGER CHECK (is_green IN (0, 1)) DEFAULT 0,
        num_colors INTEGER CHECK (num_colors BETWEEN 1 AND 5),
        color_identity TEXT,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_mana_curve (
        deck_id INTEGER PRIMARY KEY,
        avg_cmc REAL,
        median_cmc REAL,
        cmc_0_1_count INTEGER DEFAULT 0,
        cmc_2_count INTEGER DEFAULT 0,
        cmc_3_count INTEGER DEFAULT 0,
        cmc_4_count INTEGER DEFAULT 0,
        cmc_5_count INTEGER DEFAULT 0,
        cmc_6_plus_count INTEGER DEFAULT 0,
        curve_skewness REAL,
        curve_std REAL,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_ramp (
        deck_id INTEGER PRIMARY KEY,
        num_ramp_cards INTEGER DEFAULT 0,
        num_fast_mana INTEGER DEFAULT 0,
        num_land_ramp INTEGER DEFAULT 0,
        num_mana_dorks INTEGER DEFAULT 0,
        num_rocks INTEGER DEFAULT 0,
        avg_ramp_cmc REAL,
        ramp_early_game_ratio REAL,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_interaction (
        deck_id INTEGER PRIMARY KEY,
        num_single_target_removal INTEGER DEFAULT 0,
        num_board_wipes INTEGER DEFAULT 0,
        num_counterspells INTEGER DEFAULT 0,
        num_stack_interaction INTEGER DEFAULT 0,
        interaction_density REAL,
        instant_speed_interaction_ratio REAL,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_wincon_speed (
        deck_id INTEGER PRIMARY KEY,
        num_combo_pieces INTEGER DEFAULT 0,
        num_known_combos INTEGER DEFAULT 0,
        num_finishers INTEGER DEFAULT 0,
        goldfish_turn_estimate REAL,
        wincon_speed_score REAL,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      CREATE TABLE IF NOT EXISTS deck_archetype (
        deck_id INTEGER PRIMARY KEY,
        primary_archetype TEXT CHECK (primary_archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
        secondary_archetype TEXT CHECK (secondary_archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
        archetype_confidence REAL,
        FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
      );

      -- Instance Feature Tables
      CREATE TABLE IF NOT EXISTS instance_relative_metrics (
        instance_id INTEGER PRIMARY KEY,
        speed_rank_at_table INTEGER CHECK (speed_rank_at_table BETWEEN 1 AND 4),
        is_fastest_deck INTEGER CHECK (is_fastest_deck IN (0, 1)) DEFAULT 0,
        is_slowest_deck INTEGER CHECK (is_slowest_deck IN (0, 1)) DEFAULT 0,
        FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
      );

      CREATE TABLE IF NOT EXISTS instance_archetype_matchup (
        instance_id INTEGER PRIMARY KEY,
        num_opponents_aggro INTEGER DEFAULT 0,
        num_opponents_control INTEGER DEFAULT 0,
        num_opponents_combo INTEGER DEFAULT 0,
        num_opponents_stax INTEGER DEFAULT 0,
        num_opponents_midrange INTEGER DEFAULT 0,
        FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
      );

      CREATE TABLE IF NOT EXISTS instance_color_competition (
        instance_id INTEGER PRIMARY KEY,
        shared_color_count_with_others INTEGER DEFAULT 0,
        num_players_sharing_colors INTEGER DEFAULT 0,
        color_conflict_score REAL,
        FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
      );

      CREATE TABLE IF NOT EXISTS instance_threat_level (
        instance_id INTEGER PRIMARY KEY,
        relative_power_level_rank INTEGER CHECK (relative_power_level_rank BETWEEN 1 AND 4),
        is_highest_power_deck INTEGER CHECK (is_highest_power_deck IN (0, 1)) DEFAULT 0,
        threat_score REAL,
        FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
      );

      CREATE TABLE IF NOT EXISTS instance_interaction_pressure (
        instance_id INTEGER PRIMARY KEY,
        total_opponent_interaction INTEGER DEFAULT 0,
        avg_opponent_interaction REAL,
        is_likely_target INTEGER CHECK (is_likely_target IN (0, 1)) DEFAULT 0,
        FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
      );

      -- Table-level Aggregate Features
      CREATE TABLE IF NOT EXISTS game_table_metrics (
        game_id INTEGER PRIMARY KEY,
        avg_deck_speed REAL,
        speed_variance REAL,
        avg_interaction_level REAL,
        interaction_variance REAL,
        power_level_spread REAL,
        num_combo_decks INTEGER,
        num_control_decks INTEGER,
        num_aggro_decks INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(game_id)
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_player_instances_game ON player_game_instances(game_id);
      CREATE INDEX IF NOT EXISTS idx_player_instances_deck ON player_game_instances(deck_id);
      CREATE INDEX IF NOT EXISTS idx_decks_commander ON decks(commander_id);
      CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
    `;

    // Execute schema in transaction
    await this.db.execAsync(schemaSQL);

    // Create views (must be done separately as they reference tables)
    await this.createViews();
  }

  /**
   * Create the database views for training and overview
   */
  private async createViews(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const viewsSQL = `
      DROP VIEW IF EXISTS training_features;
      CREATE VIEW training_features AS
      SELECT 
        pgi.game_id,
        pgi.instance_id,
        pgi.seat_position,
        pgi.finished_position,
        pgi.deck_id,
        c.name as commander_name,
        c.cmc as commander_cmc,
        c.power as commander_power,
        c.toughness as commander_toughness,
        dcc.num_creatures,
        dcc.num_instants,
        dcc.num_sorceries,
        dcc.num_artifacts,
        dcc.num_enchantments,
        dcc.num_planeswalkers,
        dcc.num_lands,
        dci.is_white,
        dci.is_blue,
        dci.is_black,
        dci.is_red,
        dci.is_green,
        dci.num_colors,
        dci.color_identity,
        dmc.avg_cmc,
        dmc.median_cmc,
        dmc.cmc_0_1_count,
        dmc.cmc_2_count,
        dmc.cmc_3_count,
        dmc.cmc_4_count,
        dmc.cmc_5_count,
        dmc.cmc_6_plus_count,
        dmc.curve_skewness,
        dmc.curve_std,
        dr.num_ramp_cards,
        dr.num_fast_mana,
        dr.num_land_ramp,
        dr.num_mana_dorks,
        dr.num_rocks,
        dr.avg_ramp_cmc,
        dr.ramp_early_game_ratio,
        di.num_single_target_removal,
        di.num_board_wipes,
        di.num_counterspells,
        di.num_stack_interaction,
        di.interaction_density,
        di.instant_speed_interaction_ratio,
        dws.num_combo_pieces,
        dws.num_known_combos,
        dws.num_finishers,
        dws.goldfish_turn_estimate,
        dws.wincon_speed_score,
        da.primary_archetype,
        da.secondary_archetype,
        da.archetype_confidence,
        irm.speed_rank_at_table,
        irm.is_fastest_deck,
        irm.is_slowest_deck,
        iam.num_opponents_aggro,
        iam.num_opponents_control,
        iam.num_opponents_combo,
        iam.num_opponents_stax,
        iam.num_opponents_midrange,
        icc.shared_color_count_with_others,
        icc.num_players_sharing_colors,
        icc.color_conflict_score,
        itl.relative_power_level_rank,
        itl.is_highest_power_deck,
        itl.threat_score,
        iip.total_opponent_interaction,
        iip.avg_opponent_interaction,
        iip.is_likely_target,
        gtm.avg_deck_speed,
        gtm.speed_variance,
        gtm.avg_interaction_level,
        gtm.interaction_variance,
        gtm.power_level_spread,
        gtm.num_combo_decks,
        gtm.num_control_decks,
        gtm.num_aggro_decks
      FROM player_game_instances pgi
      JOIN decks d ON pgi.deck_id = d.deck_id
      JOIN commanders c ON d.commander_id = c.commander_id
      LEFT JOIN deck_card_counts dcc ON d.deck_id = dcc.deck_id
      LEFT JOIN deck_color_identity dci ON d.deck_id = dci.deck_id
      LEFT JOIN deck_mana_curve dmc ON d.deck_id = dmc.deck_id
      LEFT JOIN deck_ramp dr ON d.deck_id = dr.deck_id
      LEFT JOIN deck_interaction di ON d.deck_id = di.deck_id
      LEFT JOIN deck_wincon_speed dws ON d.deck_id = dws.deck_id
      LEFT JOIN deck_archetype da ON d.deck_id = da.deck_id
      LEFT JOIN instance_relative_metrics irm ON pgi.instance_id = irm.instance_id
      LEFT JOIN instance_archetype_matchup iam ON pgi.instance_id = iam.instance_id
      LEFT JOIN instance_color_competition icc ON pgi.instance_id = icc.instance_id
      LEFT JOIN instance_threat_level itl ON pgi.instance_id = itl.instance_id
      LEFT JOIN instance_interaction_pressure iip ON pgi.instance_id = iip.instance_id
      LEFT JOIN game_table_metrics gtm ON pgi.game_id = gtm.game_id;

      DROP VIEW IF EXISTS game_overview;
      CREATE VIEW game_overview AS
      SELECT
        g.game_id,
        g.game_date,
        g.winner_position,
        g.game_duration_minutes,
        p0.commander_name as p0_commander,
        p0.primary_archetype as p0_archetype,
        p0.num_colors as p0_colors,
        p0.wincon_speed_score as p0_speed,
        p1.commander_name as p1_commander,
        p1.primary_archetype as p1_archetype,
        p1.num_colors as p1_colors,
        p1.wincon_speed_score as p1_speed,
        p2.commander_name as p2_commander,
        p2.primary_archetype as p2_archetype,
        p2.num_colors as p2_colors,
        p2.wincon_speed_score as p2_speed,
        p3.commander_name as p3_commander,
        p3.primary_archetype as p3_archetype,
        p3.num_colors as p3_colors,
        p3.wincon_speed_score as p3_speed,
        gtm.avg_deck_speed,
        gtm.power_level_spread
      FROM games g
      LEFT JOIN training_features p0 ON g.game_id = p0.game_id AND p0.seat_position = 0
      LEFT JOIN training_features p1 ON g.game_id = p1.game_id AND p1.seat_position = 1
      LEFT JOIN training_features p2 ON g.game_id = p2.game_id AND p2.seat_position = 2
      LEFT JOIN training_features p3 ON g.game_id = p3.game_id AND p3.seat_position = 3
      LEFT JOIN game_table_metrics gtm ON g.game_id = gtm.game_id;
    `;

    await this.db.execAsync(viewsSQL);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  /**
   * Drop all tables and recreate schema (useful for testing)
   */
  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      DROP VIEW IF EXISTS game_overview;
      DROP VIEW IF EXISTS training_features;
      DROP TABLE IF EXISTS game_table_metrics;
      DROP TABLE IF EXISTS instance_interaction_pressure;
      DROP TABLE IF EXISTS instance_threat_level;
      DROP TABLE IF EXISTS instance_color_competition;
      DROP TABLE IF EXISTS instance_archetype_matchup;
      DROP TABLE IF EXISTS instance_relative_metrics;
      DROP TABLE IF EXISTS deck_archetype;
      DROP TABLE IF EXISTS deck_wincon_speed;
      DROP TABLE IF EXISTS deck_interaction;
      DROP TABLE IF EXISTS deck_ramp;
      DROP TABLE IF EXISTS deck_mana_curve;
      DROP TABLE IF EXISTS deck_color_identity;
      DROP TABLE IF EXISTS deck_card_counts;
      DROP TABLE IF EXISTS player_game_instances;
      DROP TABLE IF EXISTS decks;
      DROP TABLE IF EXISTS commanders;
      DROP TABLE IF EXISTS games;
    `);

    await this.createSchema();
  }

  // ============================================================================
  // GAMES
  // ============================================================================

  async createGame(game: GameInsert): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      `INSERT INTO games (game_date, winner_position, game_duration_minutes, notes)
       VALUES (?, ?, ?, ?)`,
      game.game_date || new Date().toISOString(),
      game.winner_position,
      game.game_duration_minutes ?? null,
      game.notes ?? null,
    );

    return result.lastInsertRowId;
  }

  async getGame(gameId: number): Promise<Game | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<Game>(
      "SELECT * FROM games WHERE game_id = ?",
      gameId,
    );

    return result || null;
  }

  async getAllGames(): Promise<Game[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<Game>(
      "SELECT * FROM games ORDER BY game_date DESC",
    );
  }

  async updateGame(game: GameUpdate): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const fields = Object.keys(game).filter((k) => k !== "game_id");
    const values = fields.map((k) => {
      const value = game[k as keyof GameUpdate];
      return value === undefined ? null : value;
    });
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    await this.db.runAsync(
      `UPDATE games SET ${setClause} WHERE game_id = ?`,
      ...values,
      game.game_id,
    );
  }

  async deleteGame(gameId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Delete in correct order due to foreign keys
    await this.db.runAsync(
      "DELETE FROM game_table_metrics WHERE game_id = ?",
      gameId,
    );

    // Get all instances for this game
    const instances = await this.db.getAllAsync<{ instance_id: number }>(
      "SELECT instance_id FROM player_game_instances WHERE game_id = ?",
      gameId,
    );

    // Delete instance features
    for (const inst of instances) {
      await this.deleteInstanceFeatures(inst.instance_id);
    }

    // Delete instances and game
    await this.db.runAsync(
      "DELETE FROM player_game_instances WHERE game_id = ?",
      gameId,
    );
    await this.db.runAsync("DELETE FROM games WHERE game_id = ?", gameId);
  }

  // ============================================================================
  // COMMANDERS
  // ============================================================================

  async createCommander(commander: CommanderInsert): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      `INSERT INTO commanders (name, color_identity, cmc, power, toughness, card_types, subtypes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      commander.name,
      commander.color_identity ?? null,
      commander.cmc ?? null,
      commander.power ?? null,
      commander.toughness ?? null,
      commander.card_types ?? null,
      commander.subtypes ?? null,
    );

    return result.lastInsertRowId;
  }

  async getCommander(commanderId: number): Promise<Commander | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<Commander>(
      "SELECT * FROM commanders WHERE commander_id = ?",
      commanderId,
    );

    return result || null;
  }

  async getCommanderByName(name: string): Promise<Commander | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<Commander>(
      "SELECT * FROM commanders WHERE name = ?",
      name,
    );

    return result || null;
  }

  async getAllCommanders(): Promise<Commander[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<Commander>(
      "SELECT * FROM commanders ORDER BY name",
    );
  }

  async updateCommander(commander: CommanderUpdate): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const fields = Object.keys(commander).filter((k) => k !== "commander_id");
    const values = fields.map((k) => {
      const value = commander[k as keyof CommanderUpdate];
      return value === undefined ? null : value;
    });
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    await this.db.runAsync(
      `UPDATE commanders SET ${setClause} WHERE commander_id = ?`,
      ...values,
      commander.commander_id,
    );
  }

  async deleteCommander(commanderId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Note: This will fail if decks reference this commander
    await this.db.runAsync(
      "DELETE FROM commanders WHERE commander_id = ?",
      commanderId,
    );
  }

  // ============================================================================
  // DECKS
  // ============================================================================

  async createDeck(deck: DeckInsert): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      `INSERT INTO decks (commander_id, deck_name, owner, created_date)
       VALUES (?, ?, ?, ?)`,
      deck.commander_id,
      deck.deck_name ?? null,
      deck.owner ?? null,
      deck.created_date || new Date().toISOString(),
    );

    return result.lastInsertRowId;
  }

  async getDeck(deckId: number): Promise<Deck | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<Deck>(
      "SELECT * FROM decks WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  async getAllDecks(): Promise<Deck[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<Deck>(
      "SELECT * FROM decks ORDER BY created_date DESC",
    );
  }

  async getDecksByCommander(commanderId: number): Promise<Deck[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<Deck>(
      "SELECT * FROM decks WHERE commander_id = ? ORDER BY created_date DESC",
      commanderId,
    );
  }

  async getDecksByOwner(owner: string): Promise<Deck[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<Deck>(
      "SELECT * FROM decks WHERE owner = ? ORDER BY created_date DESC",
      owner,
    );
  }

  async updateDeck(deck: DeckUpdate): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const fields = Object.keys(deck).filter((k) => k !== "deck_id");
    const values = fields.map((k) => {
      const value = deck[k as keyof DeckUpdate];
      return value === undefined ? null : value;
    });
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    await this.db.runAsync(
      `UPDATE decks SET ${setClause} WHERE deck_id = ?`,
      ...values,
      deck.deck_id,
    );
  }

  async deleteDeck(deckId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Delete all feature tables for this deck
    await this.db.runAsync(
      "DELETE FROM deck_card_counts WHERE deck_id = ?",
      deckId,
    );
    await this.db.runAsync(
      "DELETE FROM deck_color_identity WHERE deck_id = ?",
      deckId,
    );
    await this.db.runAsync(
      "DELETE FROM deck_mana_curve WHERE deck_id = ?",
      deckId,
    );
    await this.db.runAsync("DELETE FROM deck_ramp WHERE deck_id = ?", deckId);
    await this.db.runAsync(
      "DELETE FROM deck_interaction WHERE deck_id = ?",
      deckId,
    );
    await this.db.runAsync(
      "DELETE FROM deck_wincon_speed WHERE deck_id = ?",
      deckId,
    );
    await this.db.runAsync(
      "DELETE FROM deck_archetype WHERE deck_id = ?",
      deckId,
    );

    // Note: This will fail if instances reference this deck
    await this.db.runAsync("DELETE FROM decks WHERE deck_id = ?", deckId);
  }

  /**
   * Get complete deck profile with all features
   */
  async getDeckProfile(deckId: number): Promise<DeckProfile | null> {
    if (!this.db) throw new Error("Database not initialized");

    const deck = await this.getDeck(deckId);
    if (!deck) return null;

    const commander = await this.getCommander(deck.commander_id);
    if (!commander) return null;

    const [
      cardCounts,
      colorIdentity,
      manaCurve,
      ramp,
      interaction,
      winconSpeed,
      archetype,
    ] = await Promise.all([
      this.getDeckCardCounts(deckId),
      this.getDeckColorIdentity(deckId),
      this.getDeckManaCurve(deckId),
      this.getDeckRamp(deckId),
      this.getDeckInteraction(deckId),
      this.getDeckWinconSpeed(deckId),
      this.getDeckArchetype(deckId),
    ]);

    return {
      deck,
      commander,
      card_counts: cardCounts || undefined,
      color_identity: colorIdentity || undefined,
      mana_curve: manaCurve || undefined,
      ramp: ramp || undefined,
      interaction: interaction || undefined,
      wincon_speed: winconSpeed || undefined,
      archetype: archetype || undefined,
    };
  }

  // ============================================================================
  // PLAYER GAME INSTANCES
  // ============================================================================

  async createPlayerGameInstance(
    instance: PlayerGameInstanceInsert,
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      `INSERT INTO player_game_instances (game_id, deck_id, seat_position, finished_position)
       VALUES (?, ?, ?, ?)`,
      instance.game_id,
      instance.deck_id,
      instance.seat_position,
      instance.finished_position ?? null,
    );

    return result.lastInsertRowId;
  }

  async getPlayerGameInstance(
    instanceId: number,
  ): Promise<PlayerGameInstance | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<PlayerGameInstance>(
      "SELECT * FROM player_game_instances WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  async getInstancesByGame(gameId: number): Promise<PlayerGameInstance[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<PlayerGameInstance>(
      "SELECT * FROM player_game_instances WHERE game_id = ? ORDER BY seat_position",
      gameId,
    );
  }

  async getInstancesByDeck(deckId: number): Promise<PlayerGameInstance[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<PlayerGameInstance>(
      "SELECT * FROM player_game_instances WHERE deck_id = ? ORDER BY instance_id DESC",
      deckId,
    );
  }

  async updatePlayerGameInstance(
    instance: PlayerGameInstanceUpdate,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const fields = Object.keys(instance).filter((k) => k !== "instance_id");
    const values = fields.map((k) => {
      const value = instance[k as keyof PlayerGameInstanceUpdate];
      return value === undefined ? null : value;
    });
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    await this.db.runAsync(
      `UPDATE player_game_instances SET ${setClause} WHERE instance_id = ?`,
      ...values,
      instance.instance_id,
    );
  }

  async deletePlayerGameInstance(instanceId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.deleteInstanceFeatures(instanceId);
    await this.db.runAsync(
      "DELETE FROM player_game_instances WHERE instance_id = ?",
      instanceId,
    );
  }

  /**
   * Helper to delete all instance features
   */
  private async deleteInstanceFeatures(instanceId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      "DELETE FROM instance_relative_metrics WHERE instance_id = ?",
      instanceId,
    );
    await this.db.runAsync(
      "DELETE FROM instance_archetype_matchup WHERE instance_id = ?",
      instanceId,
    );
    await this.db.runAsync(
      "DELETE FROM instance_color_competition WHERE instance_id = ?",
      instanceId,
    );
    await this.db.runAsync(
      "DELETE FROM instance_threat_level WHERE instance_id = ?",
      instanceId,
    );
    await this.db.runAsync(
      "DELETE FROM instance_interaction_pressure WHERE instance_id = ?",
      instanceId,
    );
  }

  // ============================================================================
  // DECK FEATURE TABLES
  // ============================================================================

  // Card Counts
  async upsertDeckCardCounts(counts: DeckCardCountsInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_card_counts (
        deck_id, num_creatures, num_instants, num_sorceries, num_artifacts,
        num_enchantments, num_planeswalkers, num_lands, total_cards
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        num_creatures = excluded.num_creatures,
        num_instants = excluded.num_instants,
        num_sorceries = excluded.num_sorceries,
        num_artifacts = excluded.num_artifacts,
        num_enchantments = excluded.num_enchantments,
        num_planeswalkers = excluded.num_planeswalkers,
        num_lands = excluded.num_lands,
        total_cards = excluded.total_cards`,
      counts.deck_id,
      counts.num_creatures ?? 0,
      counts.num_instants ?? 0,
      counts.num_sorceries ?? 0,
      counts.num_artifacts ?? 0,
      counts.num_enchantments ?? 0,
      counts.num_planeswalkers ?? 0,
      counts.num_lands ?? 0,
      counts.total_cards ?? 100,
    );
  }

  async getDeckCardCounts(deckId: number): Promise<DeckCardCounts | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckCardCounts>(
      "SELECT * FROM deck_card_counts WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Color Identity
  async upsertDeckColorIdentity(
    colorId: DeckColorIdentityInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_color_identity (
        deck_id, is_white, is_blue, is_black, is_red, is_green, num_colors, color_identity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        is_white = excluded.is_white,
        is_blue = excluded.is_blue,
        is_black = excluded.is_black,
        is_red = excluded.is_red,
        is_green = excluded.is_green,
        num_colors = excluded.num_colors,
        color_identity = excluded.color_identity`,
      colorId.deck_id,
      colorId.is_white ?? 0,
      colorId.is_blue ?? 0,
      colorId.is_black ?? 0,
      colorId.is_red ?? 0,
      colorId.is_green ?? 0,
      colorId.num_colors,
      colorId.color_identity ?? null,
    );
  }

  async getDeckColorIdentity(
    deckId: number,
  ): Promise<DeckColorIdentity | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckColorIdentity>(
      "SELECT * FROM deck_color_identity WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Mana Curve
  async upsertDeckManaCurve(curve: DeckManaCurveInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_mana_curve (
        deck_id, avg_cmc, median_cmc, cmc_0_1_count, cmc_2_count, cmc_3_count,
        cmc_4_count, cmc_5_count, cmc_6_plus_count, curve_skewness, curve_std
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        avg_cmc = excluded.avg_cmc,
        median_cmc = excluded.median_cmc,
        cmc_0_1_count = excluded.cmc_0_1_count,
        cmc_2_count = excluded.cmc_2_count,
        cmc_3_count = excluded.cmc_3_count,
        cmc_4_count = excluded.cmc_4_count,
        cmc_5_count = excluded.cmc_5_count,
        cmc_6_plus_count = excluded.cmc_6_plus_count,
        curve_skewness = excluded.curve_skewness,
        curve_std = excluded.curve_std`,
      curve.deck_id,
      curve.avg_cmc ?? null,
      curve.median_cmc ?? null,
      curve.cmc_0_1_count ?? 0,
      curve.cmc_2_count ?? 0,
      curve.cmc_3_count ?? 0,
      curve.cmc_4_count ?? 0,
      curve.cmc_5_count ?? 0,
      curve.cmc_6_plus_count ?? 0,
      curve.curve_skewness ?? null,
      curve.curve_std ?? null,
    );
  }

  async getDeckManaCurve(deckId: number): Promise<DeckManaCurve | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckManaCurve>(
      "SELECT * FROM deck_mana_curve WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Ramp
  async upsertDeckRamp(ramp: DeckRampInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_ramp (
        deck_id, num_ramp_cards, num_fast_mana, num_land_ramp, num_mana_dorks,
        num_rocks, avg_ramp_cmc, ramp_early_game_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        num_ramp_cards = excluded.num_ramp_cards,
        num_fast_mana = excluded.num_fast_mana,
        num_land_ramp = excluded.num_land_ramp,
        num_mana_dorks = excluded.num_mana_dorks,
        num_rocks = excluded.num_rocks,
        avg_ramp_cmc = excluded.avg_ramp_cmc,
        ramp_early_game_ratio = excluded.ramp_early_game_ratio`,
      ramp.deck_id,
      ramp.num_ramp_cards ?? 0,
      ramp.num_fast_mana ?? 0,
      ramp.num_land_ramp ?? 0,
      ramp.num_mana_dorks ?? 0,
      ramp.num_rocks ?? 0,
      ramp.avg_ramp_cmc ?? null,
      ramp.ramp_early_game_ratio ?? null,
    );
  }

  async getDeckRamp(deckId: number): Promise<DeckRamp | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckRamp>(
      "SELECT * FROM deck_ramp WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Interaction
  async upsertDeckInteraction(
    interaction: DeckInteractionInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_interaction (
        deck_id, num_single_target_removal, num_board_wipes, num_counterspells,
        num_stack_interaction, interaction_density, instant_speed_interaction_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        num_single_target_removal = excluded.num_single_target_removal,
        num_board_wipes = excluded.num_board_wipes,
        num_counterspells = excluded.num_counterspells,
        num_stack_interaction = excluded.num_stack_interaction,
        interaction_density = excluded.interaction_density,
        instant_speed_interaction_ratio = excluded.instant_speed_interaction_ratio`,
      interaction.deck_id,
      interaction.num_single_target_removal ?? 0,
      interaction.num_board_wipes ?? 0,
      interaction.num_counterspells ?? 0,
      interaction.num_stack_interaction ?? 0,
      interaction.interaction_density ?? null,
      interaction.instant_speed_interaction_ratio ?? null,
    );
  }

  async getDeckInteraction(deckId: number): Promise<DeckInteraction | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckInteraction>(
      "SELECT * FROM deck_interaction WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Wincon Speed
  async upsertDeckWinconSpeed(wincon: DeckWinconSpeedInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_wincon_speed (
        deck_id, num_combo_pieces, num_known_combos, num_finishers,
        goldfish_turn_estimate, wincon_speed_score
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        num_combo_pieces = excluded.num_combo_pieces,
        num_known_combos = excluded.num_known_combos,
        num_finishers = excluded.num_finishers,
        goldfish_turn_estimate = excluded.goldfish_turn_estimate,
        wincon_speed_score = excluded.wincon_speed_score`,
      wincon.deck_id,
      wincon.num_combo_pieces ?? 0,
      wincon.num_known_combos ?? 0,
      wincon.num_finishers ?? 0,
      wincon.goldfish_turn_estimate ?? null,
      wincon.wincon_speed_score ?? null,
    );
  }

  async getDeckWinconSpeed(deckId: number): Promise<DeckWinconSpeed | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckWinconSpeed>(
      "SELECT * FROM deck_wincon_speed WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // Archetype
  async upsertDeckArchetype(archetype: DeckArchetypeInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO deck_archetype (
        deck_id, primary_archetype, secondary_archetype, archetype_confidence
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(deck_id) DO UPDATE SET
        primary_archetype = excluded.primary_archetype,
        secondary_archetype = excluded.secondary_archetype,
        archetype_confidence = excluded.archetype_confidence`,
      archetype.deck_id,
      archetype.primary_archetype ?? null,
      archetype.secondary_archetype ?? null,
      archetype.archetype_confidence ?? null,
    );
  }

  async getDeckArchetype(deckId: number): Promise<DeckArchetype | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<DeckArchetype>(
      "SELECT * FROM deck_archetype WHERE deck_id = ?",
      deckId,
    );

    return result || null;
  }

  // ============================================================================
  // INSTANCE FEATURE TABLES
  // ============================================================================

  // Relative Metrics
  async upsertInstanceRelativeMetrics(
    metrics: InstanceRelativeMetricsInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO instance_relative_metrics (
        instance_id, speed_rank_at_table, is_fastest_deck, is_slowest_deck
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(instance_id) DO UPDATE SET
        speed_rank_at_table = excluded.speed_rank_at_table,
        is_fastest_deck = excluded.is_fastest_deck,
        is_slowest_deck = excluded.is_slowest_deck`,
      metrics.instance_id,
      metrics.speed_rank_at_table ?? null,
      metrics.is_fastest_deck ?? 0,
      metrics.is_slowest_deck ?? 0,
    );
  }

  async getInstanceRelativeMetrics(
    instanceId: number,
  ): Promise<InstanceRelativeMetrics | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<InstanceRelativeMetrics>(
      "SELECT * FROM instance_relative_metrics WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  // Archetype Matchup
  async upsertInstanceArchetypeMatchup(
    matchup: InstanceArchetypeMatchupInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO instance_archetype_matchup (
        instance_id, num_opponents_aggro, num_opponents_control, num_opponents_combo,
        num_opponents_stax, num_opponents_midrange
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(instance_id) DO UPDATE SET
        num_opponents_aggro = excluded.num_opponents_aggro,
        num_opponents_control = excluded.num_opponents_control,
        num_opponents_combo = excluded.num_opponents_combo,
        num_opponents_stax = excluded.num_opponents_stax,
        num_opponents_midrange = excluded.num_opponents_midrange`,
      matchup.instance_id,
      matchup.num_opponents_aggro ?? 0,
      matchup.num_opponents_control ?? 0,
      matchup.num_opponents_combo ?? 0,
      matchup.num_opponents_stax ?? 0,
      matchup.num_opponents_midrange ?? 0,
    );
  }

  async getInstanceArchetypeMatchup(
    instanceId: number,
  ): Promise<InstanceArchetypeMatchup | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<InstanceArchetypeMatchup>(
      "SELECT * FROM instance_archetype_matchup WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  // Color Competition
  async upsertInstanceColorCompetition(
    competition: InstanceColorCompetitionInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO instance_color_competition (
        instance_id, shared_color_count_with_others, num_players_sharing_colors, color_conflict_score
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(instance_id) DO UPDATE SET
        shared_color_count_with_others = excluded.shared_color_count_with_others,
        num_players_sharing_colors = excluded.num_players_sharing_colors,
        color_conflict_score = excluded.color_conflict_score`,
      competition.instance_id,
      competition.shared_color_count_with_others ?? 0,
      competition.num_players_sharing_colors ?? 0,
      competition.color_conflict_score ?? null,
    );
  }

  async getInstanceColorCompetition(
    instanceId: number,
  ): Promise<InstanceColorCompetition | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<InstanceColorCompetition>(
      "SELECT * FROM instance_color_competition WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  // Threat Level
  async upsertInstanceThreatLevel(
    threat: InstanceThreatLevelInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO instance_threat_level (
        instance_id, relative_power_level_rank, is_highest_power_deck, threat_score
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(instance_id) DO UPDATE SET
        relative_power_level_rank = excluded.relative_power_level_rank,
        is_highest_power_deck = excluded.is_highest_power_deck,
        threat_score = excluded.threat_score`,
      threat.instance_id,
      threat.relative_power_level_rank ?? null,
      threat.is_highest_power_deck ?? 0,
      threat.threat_score ?? null,
    );
  }

  async getInstanceThreatLevel(
    instanceId: number,
  ): Promise<InstanceThreatLevel | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<InstanceThreatLevel>(
      "SELECT * FROM instance_threat_level WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  // Interaction Pressure
  async upsertInstanceInteractionPressure(
    pressure: InstanceInteractionPressureInsert,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO instance_interaction_pressure (
        instance_id, total_opponent_interaction, avg_opponent_interaction, is_likely_target
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(instance_id) DO UPDATE SET
        total_opponent_interaction = excluded.total_opponent_interaction,
        avg_opponent_interaction = excluded.avg_opponent_interaction,
        is_likely_target = excluded.is_likely_target`,
      pressure.instance_id,
      pressure.total_opponent_interaction ?? 0,
      pressure.avg_opponent_interaction ?? null,
      pressure.is_likely_target ?? 0,
    );
  }

  async getInstanceInteractionPressure(
    instanceId: number,
  ): Promise<InstanceInteractionPressure | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<InstanceInteractionPressure>(
      "SELECT * FROM instance_interaction_pressure WHERE instance_id = ?",
      instanceId,
    );

    return result || null;
  }

  // ============================================================================
  // GAME TABLE METRICS
  // ============================================================================

  async upsertGameTableMetrics(metrics: GameTableMetricsInsert): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT INTO game_table_metrics (
        game_id, avg_deck_speed, speed_variance, avg_interaction_level,
        interaction_variance, power_level_spread, num_combo_decks,
        num_control_decks, num_aggro_decks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(game_id) DO UPDATE SET
        avg_deck_speed = excluded.avg_deck_speed,
        speed_variance = excluded.speed_variance,
        avg_interaction_level = excluded.avg_interaction_level,
        interaction_variance = excluded.interaction_variance,
        power_level_spread = excluded.power_level_spread,
        num_combo_decks = excluded.num_combo_decks,
        num_control_decks = excluded.num_control_decks,
        num_aggro_decks = excluded.num_aggro_decks`,
      metrics.game_id,
      metrics.avg_deck_speed ?? null,
      metrics.speed_variance ?? null,
      metrics.avg_interaction_level ?? null,
      metrics.interaction_variance ?? null,
      metrics.power_level_spread ?? null,
      metrics.num_combo_decks ?? null,
      metrics.num_control_decks ?? null,
      metrics.num_aggro_decks ?? null,
    );
  }

  async getGameTableMetrics(gameId: number): Promise<GameTableMetrics | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<GameTableMetrics>(
      "SELECT * FROM game_table_metrics WHERE game_id = ?",
      gameId,
    );

    return result || null;
  }

  // ============================================================================
  // ML TRAINING VIEWS
  // ============================================================================

  /**
   * Get all training features for ML model
   */
  async getAllTrainingFeatures(): Promise<TrainingFeatures[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<TrainingFeatures>(
      "SELECT * FROM training_features",
    );
  }

  /**
   * Get training features for a specific game
   */
  async getTrainingFeaturesByGame(gameId: number): Promise<TrainingFeatures[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<TrainingFeatures>(
      "SELECT * FROM training_features WHERE game_id = ? ORDER BY seat_position",
      gameId,
    );
  }

  /**
   * Get training features for a specific deck across all games
   */
  async getTrainingFeaturesByDeck(deckId: number): Promise<TrainingFeatures[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<TrainingFeatures>(
      "SELECT * FROM training_features WHERE deck_id = ? ORDER BY game_id DESC",
      deckId,
    );
  }

  /**
   * Get game overview (wide format with all 4 players)
   */
  async getGameOverview(gameId: number): Promise<GameOverview | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<GameOverview>(
      "SELECT * FROM game_overview WHERE game_id = ?",
      gameId,
    );

    return result || null;
  }

  /**
   * Get all game overviews
   */
  async getAllGameOverviews(): Promise<GameOverview[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<GameOverview>(
      "SELECT * FROM game_overview ORDER BY game_date DESC",
    );
  }

  // ============================================================================
  // COMPOSITE OPERATIONS
  // ============================================================================

  /**
   * Get complete game record with all instances and features
   */
  async getGameRecord(gameId: number): Promise<GameRecord | null> {
    if (!this.db) throw new Error("Database not initialized");

    const game = await this.getGame(gameId);
    if (!game) return null;

    const instances = await this.getInstancesByGame(gameId);
    const instanceProfiles = await Promise.all(
      instances.map((inst) => this.getInstanceProfile(inst.instance_id)),
    );

    const tableMetrics = await this.getGameTableMetrics(gameId);

    return {
      game,
      instances: instanceProfiles.filter(
        (p): p is InstanceProfile => p !== null,
      ),
      table_metrics: tableMetrics || undefined,
    };
  }

  /**
   * Get complete instance profile with deck and all features
   */
  async getInstanceProfile(
    instanceId: number,
  ): Promise<InstanceProfile | null> {
    if (!this.db) throw new Error("Database not initialized");

    const instance = await this.getPlayerGameInstance(instanceId);
    if (!instance) return null;

    const deckProfile = await this.getDeckProfile(instance.deck_id);
    if (!deckProfile) return null;

    const [
      relativeMetrics,
      archetypeMatchup,
      colorCompetition,
      threatLevel,
      interactionPressure,
    ] = await Promise.all([
      this.getInstanceRelativeMetrics(instanceId),
      this.getInstanceArchetypeMatchup(instanceId),
      this.getInstanceColorCompetition(instanceId),
      this.getInstanceThreatLevel(instanceId),
      this.getInstanceInteractionPressure(instanceId),
    ]);

    return {
      instance,
      deck_profile: deckProfile,
      relative_metrics: relativeMetrics || undefined,
      archetype_matchup: archetypeMatchup || undefined,
      color_competition: colorCompetition || undefined,
      threat_level: threatLevel || undefined,
      interaction_pressure: interactionPressure || undefined,
    };
  }

  /**
   * Create a complete game with all 4 player instances
   */
  async createCompleteGame(
    game: GameInsert,
    instances: PlayerGameInstanceInsert[],
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    if (instances.length !== 4) {
      throw new Error("Must provide exactly 4 player instances");
    }

    // Create game
    const gameId = await this.createGame(game);

    // Create all instances
    for (const instance of instances) {
      await this.createPlayerGameInstance({
        ...instance,
        game_id: gameId,
      });
    }

    return gameId;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeRaw<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAllAsync<T>(sql, ...params);
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    games: number;
    commanders: number;
    decks: number;
    instances: number;
  }> {
    if (!this.db) throw new Error("Database not initialized");

    const [games, commanders, decks, instances] = await Promise.all([
      this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM games",
      ),
      this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM commanders",
      ),
      this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM decks",
      ),
      this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM player_game_instances",
      ),
    ]);

    return {
      games: games?.count ?? 0,
      commanders: commanders?.count ?? 0,
      decks: decks?.count ?? 0,
      instances: instances?.count ?? 0,
    };
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
