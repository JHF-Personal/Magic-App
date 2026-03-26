// ============================================================================
// Database Service - Abstraction Layer
// Handles routing between Live Service (primary) and SQLite (fallback)
// ============================================================================

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
import sqlLiteService from "./sqlLiteService";

// ============================================================================
// DATABASE PROVIDER INTERFACE
// ============================================================================

/**
 * Interface that all database providers must implement
 * This ensures consistency between Live Service and SQLite Service
 */
export interface IDatabaseProvider {
  // Initialization
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Games
  createGame(game: GameInsert): Promise<number>;
  getGame(gameId: number): Promise<Game | null>;
  getAllGames(): Promise<Game[]>;
  updateGame(game: GameUpdate): Promise<void>;
  deleteGame(gameId: number): Promise<void>;

  // Commanders
  createCommander(commander: CommanderInsert): Promise<number>;
  getCommander(commanderId: number): Promise<Commander | null>;
  getCommanderByName(name: string): Promise<Commander | null>;
  getAllCommanders(): Promise<Commander[]>;
  updateCommander(commander: CommanderUpdate): Promise<void>;
  deleteCommander(commanderId: number): Promise<void>;

  // Decks
  createDeck(deck: DeckInsert): Promise<number>;
  getDeck(deckId: number): Promise<Deck | null>;
  getAllDecks(): Promise<Deck[]>;
  getDecksByCommander(commanderId: number): Promise<Deck[]>;
  getDecksByOwner(owner: string): Promise<Deck[]>;
  updateDeck(deck: DeckUpdate): Promise<void>;
  deleteDeck(deckId: number): Promise<void>;
  getDeckProfile(deckId: number): Promise<DeckProfile | null>;

  // Player Game Instances
  createPlayerGameInstance(instance: PlayerGameInstanceInsert): Promise<number>;
  getPlayerGameInstance(instanceId: number): Promise<PlayerGameInstance | null>;
  getInstancesByGame(gameId: number): Promise<PlayerGameInstance[]>;
  getInstancesByDeck(deckId: number): Promise<PlayerGameInstance[]>;
  updatePlayerGameInstance(instance: PlayerGameInstanceUpdate): Promise<void>;
  deletePlayerGameInstance(instanceId: number): Promise<void>;

  // Deck Features
  upsertDeckCardCounts(counts: DeckCardCountsInsert): Promise<void>;
  getDeckCardCounts(deckId: number): Promise<DeckCardCounts | null>;
  upsertDeckColorIdentity(colorId: DeckColorIdentityInsert): Promise<void>;
  getDeckColorIdentity(deckId: number): Promise<DeckColorIdentity | null>;
  upsertDeckManaCurve(curve: DeckManaCurveInsert): Promise<void>;
  getDeckManaCurve(deckId: number): Promise<DeckManaCurve | null>;
  upsertDeckRamp(ramp: DeckRampInsert): Promise<void>;
  getDeckRamp(deckId: number): Promise<DeckRamp | null>;
  upsertDeckInteraction(interaction: DeckInteractionInsert): Promise<void>;
  getDeckInteraction(deckId: number): Promise<DeckInteraction | null>;
  upsertDeckWinconSpeed(wincon: DeckWinconSpeedInsert): Promise<void>;
  getDeckWinconSpeed(deckId: number): Promise<DeckWinconSpeed | null>;
  upsertDeckArchetype(archetype: DeckArchetypeInsert): Promise<void>;
  getDeckArchetype(deckId: number): Promise<DeckArchetype | null>;

  // Instance Features
  upsertInstanceRelativeMetrics(
    metrics: InstanceRelativeMetricsInsert,
  ): Promise<void>;
  getInstanceRelativeMetrics(
    instanceId: number,
  ): Promise<InstanceRelativeMetrics | null>;
  upsertInstanceArchetypeMatchup(
    matchup: InstanceArchetypeMatchupInsert,
  ): Promise<void>;
  getInstanceArchetypeMatchup(
    instanceId: number,
  ): Promise<InstanceArchetypeMatchup | null>;
  upsertInstanceColorCompetition(
    competition: InstanceColorCompetitionInsert,
  ): Promise<void>;
  getInstanceColorCompetition(
    instanceId: number,
  ): Promise<InstanceColorCompetition | null>;
  upsertInstanceThreatLevel(threat: InstanceThreatLevelInsert): Promise<void>;
  getInstanceThreatLevel(
    instanceId: number,
  ): Promise<InstanceThreatLevel | null>;
  upsertInstanceInteractionPressure(
    pressure: InstanceInteractionPressureInsert,
  ): Promise<void>;
  getInstanceInteractionPressure(
    instanceId: number,
  ): Promise<InstanceInteractionPressure | null>;

  // Game Table Metrics
  upsertGameTableMetrics(metrics: GameTableMetricsInsert): Promise<void>;
  getGameTableMetrics(gameId: number): Promise<GameTableMetrics | null>;

  // ML Training Views
  getAllTrainingFeatures(): Promise<TrainingFeatures[]>;
  getTrainingFeaturesByGame(gameId: number): Promise<TrainingFeatures[]>;
  getTrainingFeaturesByDeck(deckId: number): Promise<TrainingFeatures[]>;
  getGameOverview(gameId: number): Promise<GameOverview | null>;
  getAllGameOverviews(): Promise<GameOverview[]>;

  // Composite Operations
  getGameRecord(gameId: number): Promise<GameRecord | null>;
  getInstanceProfile(instanceId: number): Promise<InstanceProfile | null>;
  createCompleteGame(
    game: GameInsert,
    instances: PlayerGameInstanceInsert[],
  ): Promise<number>;

  // Utility
  getStats(): Promise<{
    games: number;
    commanders: number;
    decks: number;
    instances: number;
  }>;
}

// ============================================================================
// LIVE SERVICE (FUTURE IMPLEMENTATION)
// ============================================================================

/**
 * Live Service for cloud/server-based database operations
 * This is a stub that will be implemented when the backend is ready
 */
class LiveService implements IDatabaseProvider {
  private baseUrl: string;
  private apiKey: string;
  private isConnected: boolean = false;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    // TODO: Implement connection to live service
    // Try to connect to the API and verify authentication
    try {
      // const response = await fetch(`${this.baseUrl}/health`, {
      //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
      // });
      // this.isConnected = response.ok;

      // For now, always fail to force fallback to SQLite
      throw new Error("Live service not yet implemented");
    } catch (error) {
      console.log("Live service unavailable, will use local database");
      this.isConnected = false;
      throw error;
    }
  }

  async close(): Promise<void> {
    this.isConnected = false;
  }

  // Stub implementations - these will be implemented when backend is ready
  async createGame(game: GameInsert): Promise<number> {
    throw new Error("Live service not implemented");
  }

  async getGame(gameId: number): Promise<Game | null> {
    throw new Error("Live service not implemented");
  }

  async getAllGames(): Promise<Game[]> {
    throw new Error("Live service not implemented");
  }

  async updateGame(game: GameUpdate): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async deleteGame(gameId: number): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async createCommander(commander: CommanderInsert): Promise<number> {
    throw new Error("Live service not implemented");
  }

  async getCommander(commanderId: number): Promise<Commander | null> {
    throw new Error("Live service not implemented");
  }

  async getCommanderByName(name: string): Promise<Commander | null> {
    throw new Error("Live service not implemented");
  }

  async getAllCommanders(): Promise<Commander[]> {
    throw new Error("Live service not implemented");
  }

  async updateCommander(commander: CommanderUpdate): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async deleteCommander(commanderId: number): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async createDeck(deck: DeckInsert): Promise<number> {
    throw new Error("Live service not implemented");
  }

  async getDeck(deckId: number): Promise<Deck | null> {
    throw new Error("Live service not implemented");
  }

  async getAllDecks(): Promise<Deck[]> {
    throw new Error("Live service not implemented");
  }

  async getDecksByCommander(commanderId: number): Promise<Deck[]> {
    throw new Error("Live service not implemented");
  }

  async getDecksByOwner(owner: string): Promise<Deck[]> {
    throw new Error("Live service not implemented");
  }

  async updateDeck(deck: DeckUpdate): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async deleteDeck(deckId: number): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckProfile(deckId: number): Promise<DeckProfile | null> {
    throw new Error("Live service not implemented");
  }

  async createPlayerGameInstance(
    instance: PlayerGameInstanceInsert,
  ): Promise<number> {
    throw new Error("Live service not implemented");
  }

  async getPlayerGameInstance(
    instanceId: number,
  ): Promise<PlayerGameInstance | null> {
    throw new Error("Live service not implemented");
  }

  async getInstancesByGame(gameId: number): Promise<PlayerGameInstance[]> {
    throw new Error("Live service not implemented");
  }

  async getInstancesByDeck(deckId: number): Promise<PlayerGameInstance[]> {
    throw new Error("Live service not implemented");
  }

  async updatePlayerGameInstance(
    instance: PlayerGameInstanceUpdate,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async deletePlayerGameInstance(instanceId: number): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckCardCounts(counts: DeckCardCountsInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckCardCounts(deckId: number): Promise<DeckCardCounts | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckColorIdentity(
    colorId: DeckColorIdentityInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckColorIdentity(
    deckId: number,
  ): Promise<DeckColorIdentity | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckManaCurve(curve: DeckManaCurveInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckManaCurve(deckId: number): Promise<DeckManaCurve | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckRamp(ramp: DeckRampInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckRamp(deckId: number): Promise<DeckRamp | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckInteraction(
    interaction: DeckInteractionInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckInteraction(deckId: number): Promise<DeckInteraction | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckWinconSpeed(wincon: DeckWinconSpeedInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckWinconSpeed(deckId: number): Promise<DeckWinconSpeed | null> {
    throw new Error("Live service not implemented");
  }

  async upsertDeckArchetype(archetype: DeckArchetypeInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getDeckArchetype(deckId: number): Promise<DeckArchetype | null> {
    throw new Error("Live service not implemented");
  }

  async upsertInstanceRelativeMetrics(
    metrics: InstanceRelativeMetricsInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getInstanceRelativeMetrics(
    instanceId: number,
  ): Promise<InstanceRelativeMetrics | null> {
    throw new Error("Live service not implemented");
  }

  async upsertInstanceArchetypeMatchup(
    matchup: InstanceArchetypeMatchupInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getInstanceArchetypeMatchup(
    instanceId: number,
  ): Promise<InstanceArchetypeMatchup | null> {
    throw new Error("Live service not implemented");
  }

  async upsertInstanceColorCompetition(
    competition: InstanceColorCompetitionInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getInstanceColorCompetition(
    instanceId: number,
  ): Promise<InstanceColorCompetition | null> {
    throw new Error("Live service not implemented");
  }

  async upsertInstanceThreatLevel(
    threat: InstanceThreatLevelInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getInstanceThreatLevel(
    instanceId: number,
  ): Promise<InstanceThreatLevel | null> {
    throw new Error("Live service not implemented");
  }

  async upsertInstanceInteractionPressure(
    pressure: InstanceInteractionPressureInsert,
  ): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getInstanceInteractionPressure(
    instanceId: number,
  ): Promise<InstanceInteractionPressure | null> {
    throw new Error("Live service not implemented");
  }

  async upsertGameTableMetrics(metrics: GameTableMetricsInsert): Promise<void> {
    throw new Error("Live service not implemented");
  }

  async getGameTableMetrics(gameId: number): Promise<GameTableMetrics | null> {
    throw new Error("Live service not implemented");
  }

  async getAllTrainingFeatures(): Promise<TrainingFeatures[]> {
    throw new Error("Live service not implemented");
  }

  async getTrainingFeaturesByGame(gameId: number): Promise<TrainingFeatures[]> {
    throw new Error("Live service not implemented");
  }

  async getTrainingFeaturesByDeck(deckId: number): Promise<TrainingFeatures[]> {
    throw new Error("Live service not implemented");
  }

  async getGameOverview(gameId: number): Promise<GameOverview | null> {
    throw new Error("Live service not implemented");
  }

  async getAllGameOverviews(): Promise<GameOverview[]> {
    throw new Error("Live service not implemented");
  }

  async getGameRecord(gameId: number): Promise<GameRecord | null> {
    throw new Error("Live service not implemented");
  }

  async getInstanceProfile(
    instanceId: number,
  ): Promise<InstanceProfile | null> {
    throw new Error("Live service not implemented");
  }

  async createCompleteGame(
    game: GameInsert,
    instances: PlayerGameInstanceInsert[],
  ): Promise<number> {
    throw new Error("Live service not implemented");
  }

  async getStats(): Promise<{
    games: number;
    commanders: number;
    decks: number;
    instances: number;
  }> {
    throw new Error("Live service not implemented");
  }
}

// ============================================================================
// DATABASE SERVICE - MAIN ORCHESTRATOR
// ============================================================================

/**
 * Configuration for the database service
 */
export interface DatabaseConfig {
  useLiveService?: boolean;
  liveServiceUrl?: string;
  liveServiceApiKey?: string;
  autoFallback?: boolean; // Automatically fallback to SQLite if live service fails
  syncMode?: "live-only" | "local-only" | "sync-both"; // Future: bidirectional sync
}

/**
 * Main Database Service
 * Orchestrates between Live Service (primary) and SQLite (fallback)
 */
class DatabaseService implements IDatabaseProvider {
  private config: DatabaseConfig;
  private primaryProvider: IDatabaseProvider;
  private fallbackProvider: IDatabaseProvider;
  private currentProvider: IDatabaseProvider;
  private isInitialized: boolean = false;

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      useLiveService: false, // Default to local-only for now
      autoFallback: true,
      syncMode: "local-only",
      ...config,
    };

    // Set up providers based on configuration
    this.fallbackProvider = sqlLiteService;

    if (
      this.config.useLiveService &&
      this.config.liveServiceUrl &&
      this.config.liveServiceApiKey
    ) {
      this.primaryProvider = new LiveService(
        this.config.liveServiceUrl,
        this.config.liveServiceApiKey,
      );
    } else {
      this.primaryProvider = this.fallbackProvider;
    }

    // Start with primary provider
    this.currentProvider = this.primaryProvider;
  }

  /**
   * Initialize the database service
   * Attempts to connect to live service, falls back to SQLite if needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Database service already initialized");
      return;
    }

    try {
      // Try to initialize primary provider
      await this.currentProvider.initialize();
      console.log("Database service initialized with primary provider");
      this.isInitialized = true;
    } catch (error) {
      console.warn("Primary provider initialization failed:", error);

      // Fallback to SQLite if auto-fallback is enabled
      if (
        this.config.autoFallback &&
        this.currentProvider !== this.fallbackProvider
      ) {
        console.log("Falling back to local SQLite database");
        this.currentProvider = this.fallbackProvider;
        await this.currentProvider.initialize();
        console.log(
          "Database service initialized with fallback provider (SQLite)",
        );
        this.isInitialized = true;
      } else {
        throw new Error("Failed to initialize database service");
      }
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.currentProvider.close();
      this.isInitialized = false;
    }
  }

  /**
   * Check if currently using live service
   */
  isUsingLiveService(): boolean {
    return this.currentProvider !== this.fallbackProvider;
  }

  /**
   * Get the current provider name
   */
  getCurrentProvider(): string {
    return this.isUsingLiveService() ? "LiveService" : "SQLite";
  }

  /**
   * Switch to a different provider manually
   */
  async switchProvider(useLive: boolean): Promise<void> {
    const targetProvider = useLive
      ? this.primaryProvider
      : this.fallbackProvider;

    if (targetProvider === this.currentProvider) {
      console.log("Already using requested provider");
      return;
    }

    try {
      await targetProvider.initialize();
      await this.currentProvider.close();
      this.currentProvider = targetProvider;
      console.log(`Switched to ${useLive ? "live" : "local"} provider`);
    } catch (error) {
      console.error("Failed to switch provider:", error);
      throw error;
    }
  }

  /**
   * Execute operation with automatic fallback on failure
   */
  private async executeWithFallback<T>(
    operation: (provider: IDatabaseProvider) => Promise<T>,
  ): Promise<T> {
    try {
      return await operation(this.currentProvider);
    } catch (error) {
      // If we're using live service and auto-fallback is enabled, try fallback
      if (
        this.config.autoFallback &&
        this.currentProvider !== this.fallbackProvider
      ) {
        console.warn(
          "Operation failed on live service, falling back to local:",
          error,
        );
        this.currentProvider = this.fallbackProvider;
        await this.currentProvider.initialize();
        return await operation(this.currentProvider);
      }
      throw error;
    }
  }

  // ============================================================================
  // GAMES - Delegate all methods to current provider
  // ============================================================================

  async createGame(game: GameInsert): Promise<number> {
    return this.executeWithFallback((p) => p.createGame(game));
  }

  async getGame(gameId: number): Promise<Game | null> {
    return this.executeWithFallback((p) => p.getGame(gameId));
  }

  async getAllGames(): Promise<Game[]> {
    return this.executeWithFallback((p) => p.getAllGames());
  }

  async updateGame(game: GameUpdate): Promise<void> {
    return this.executeWithFallback((p) => p.updateGame(game));
  }

  async deleteGame(gameId: number): Promise<void> {
    return this.executeWithFallback((p) => p.deleteGame(gameId));
  }

  // ============================================================================
  // COMMANDERS
  // ============================================================================

  async createCommander(commander: CommanderInsert): Promise<number> {
    return this.executeWithFallback((p) => p.createCommander(commander));
  }

  async getCommander(commanderId: number): Promise<Commander | null> {
    return this.executeWithFallback((p) => p.getCommander(commanderId));
  }

  async getCommanderByName(name: string): Promise<Commander | null> {
    return this.executeWithFallback((p) => p.getCommanderByName(name));
  }

  async getAllCommanders(): Promise<Commander[]> {
    return this.executeWithFallback((p) => p.getAllCommanders());
  }

  async updateCommander(commander: CommanderUpdate): Promise<void> {
    return this.executeWithFallback((p) => p.updateCommander(commander));
  }

  async deleteCommander(commanderId: number): Promise<void> {
    return this.executeWithFallback((p) => p.deleteCommander(commanderId));
  }

  // ============================================================================
  // DECKS
  // ============================================================================

  async createDeck(deck: DeckInsert): Promise<number> {
    return this.executeWithFallback((p) => p.createDeck(deck));
  }

  async getDeck(deckId: number): Promise<Deck | null> {
    return this.executeWithFallback((p) => p.getDeck(deckId));
  }

  async getAllDecks(): Promise<Deck[]> {
    return this.executeWithFallback((p) => p.getAllDecks());
  }

  async getDecksByCommander(commanderId: number): Promise<Deck[]> {
    return this.executeWithFallback((p) => p.getDecksByCommander(commanderId));
  }

  async getDecksByOwner(owner: string): Promise<Deck[]> {
    return this.executeWithFallback((p) => p.getDecksByOwner(owner));
  }

  async updateDeck(deck: DeckUpdate): Promise<void> {
    return this.executeWithFallback((p) => p.updateDeck(deck));
  }

  async deleteDeck(deckId: number): Promise<void> {
    return this.executeWithFallback((p) => p.deleteDeck(deckId));
  }

  async getDeckProfile(deckId: number): Promise<DeckProfile | null> {
    return this.executeWithFallback((p) => p.getDeckProfile(deckId));
  }

  // ============================================================================
  // PLAYER GAME INSTANCES
  // ============================================================================

  async createPlayerGameInstance(
    instance: PlayerGameInstanceInsert,
  ): Promise<number> {
    return this.executeWithFallback((p) =>
      p.createPlayerGameInstance(instance),
    );
  }

  async getPlayerGameInstance(
    instanceId: number,
  ): Promise<PlayerGameInstance | null> {
    return this.executeWithFallback((p) => p.getPlayerGameInstance(instanceId));
  }

  async getInstancesByGame(gameId: number): Promise<PlayerGameInstance[]> {
    return this.executeWithFallback((p) => p.getInstancesByGame(gameId));
  }

  async getInstancesByDeck(deckId: number): Promise<PlayerGameInstance[]> {
    return this.executeWithFallback((p) => p.getInstancesByDeck(deckId));
  }

  async updatePlayerGameInstance(
    instance: PlayerGameInstanceUpdate,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.updatePlayerGameInstance(instance),
    );
  }

  async deletePlayerGameInstance(instanceId: number): Promise<void> {
    return this.executeWithFallback((p) =>
      p.deletePlayerGameInstance(instanceId),
    );
  }

  // ============================================================================
  // DECK FEATURES
  // ============================================================================

  async upsertDeckCardCounts(counts: DeckCardCountsInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckCardCounts(counts));
  }

  async getDeckCardCounts(deckId: number): Promise<DeckCardCounts | null> {
    return this.executeWithFallback((p) => p.getDeckCardCounts(deckId));
  }

  async upsertDeckColorIdentity(
    colorId: DeckColorIdentityInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckColorIdentity(colorId));
  }

  async getDeckColorIdentity(
    deckId: number,
  ): Promise<DeckColorIdentity | null> {
    return this.executeWithFallback((p) => p.getDeckColorIdentity(deckId));
  }

  async upsertDeckManaCurve(curve: DeckManaCurveInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckManaCurve(curve));
  }

  async getDeckManaCurve(deckId: number): Promise<DeckManaCurve | null> {
    return this.executeWithFallback((p) => p.getDeckManaCurve(deckId));
  }

  async upsertDeckRamp(ramp: DeckRampInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckRamp(ramp));
  }

  async getDeckRamp(deckId: number): Promise<DeckRamp | null> {
    return this.executeWithFallback((p) => p.getDeckRamp(deckId));
  }

  async upsertDeckInteraction(
    interaction: DeckInteractionInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.upsertDeckInteraction(interaction),
    );
  }

  async getDeckInteraction(deckId: number): Promise<DeckInteraction | null> {
    return this.executeWithFallback((p) => p.getDeckInteraction(deckId));
  }

  async upsertDeckWinconSpeed(wincon: DeckWinconSpeedInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckWinconSpeed(wincon));
  }

  async getDeckWinconSpeed(deckId: number): Promise<DeckWinconSpeed | null> {
    return this.executeWithFallback((p) => p.getDeckWinconSpeed(deckId));
  }

  async upsertDeckArchetype(archetype: DeckArchetypeInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertDeckArchetype(archetype));
  }

  async getDeckArchetype(deckId: number): Promise<DeckArchetype | null> {
    return this.executeWithFallback((p) => p.getDeckArchetype(deckId));
  }

  // ============================================================================
  // INSTANCE FEATURES
  // ============================================================================

  async upsertInstanceRelativeMetrics(
    metrics: InstanceRelativeMetricsInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.upsertInstanceRelativeMetrics(metrics),
    );
  }

  async getInstanceRelativeMetrics(
    instanceId: number,
  ): Promise<InstanceRelativeMetrics | null> {
    return this.executeWithFallback((p) =>
      p.getInstanceRelativeMetrics(instanceId),
    );
  }

  async upsertInstanceArchetypeMatchup(
    matchup: InstanceArchetypeMatchupInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.upsertInstanceArchetypeMatchup(matchup),
    );
  }

  async getInstanceArchetypeMatchup(
    instanceId: number,
  ): Promise<InstanceArchetypeMatchup | null> {
    return this.executeWithFallback((p) =>
      p.getInstanceArchetypeMatchup(instanceId),
    );
  }

  async upsertInstanceColorCompetition(
    competition: InstanceColorCompetitionInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.upsertInstanceColorCompetition(competition),
    );
  }

  async getInstanceColorCompetition(
    instanceId: number,
  ): Promise<InstanceColorCompetition | null> {
    return this.executeWithFallback((p) =>
      p.getInstanceColorCompetition(instanceId),
    );
  }

  async upsertInstanceThreatLevel(
    threat: InstanceThreatLevelInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) => p.upsertInstanceThreatLevel(threat));
  }

  async getInstanceThreatLevel(
    instanceId: number,
  ): Promise<InstanceThreatLevel | null> {
    return this.executeWithFallback((p) =>
      p.getInstanceThreatLevel(instanceId),
    );
  }

  async upsertInstanceInteractionPressure(
    pressure: InstanceInteractionPressureInsert,
  ): Promise<void> {
    return this.executeWithFallback((p) =>
      p.upsertInstanceInteractionPressure(pressure),
    );
  }

  async getInstanceInteractionPressure(
    instanceId: number,
  ): Promise<InstanceInteractionPressure | null> {
    return this.executeWithFallback((p) =>
      p.getInstanceInteractionPressure(instanceId),
    );
  }

  // ============================================================================
  // GAME TABLE METRICS
  // ============================================================================

  async upsertGameTableMetrics(metrics: GameTableMetricsInsert): Promise<void> {
    return this.executeWithFallback((p) => p.upsertGameTableMetrics(metrics));
  }

  async getGameTableMetrics(gameId: number): Promise<GameTableMetrics | null> {
    return this.executeWithFallback((p) => p.getGameTableMetrics(gameId));
  }

  // ============================================================================
  // ML TRAINING VIEWS
  // ============================================================================

  async getAllTrainingFeatures(): Promise<TrainingFeatures[]> {
    return this.executeWithFallback((p) => p.getAllTrainingFeatures());
  }

  async getTrainingFeaturesByGame(gameId: number): Promise<TrainingFeatures[]> {
    return this.executeWithFallback((p) => p.getTrainingFeaturesByGame(gameId));
  }

  async getTrainingFeaturesByDeck(deckId: number): Promise<TrainingFeatures[]> {
    return this.executeWithFallback((p) => p.getTrainingFeaturesByDeck(deckId));
  }

  async getGameOverview(gameId: number): Promise<GameOverview | null> {
    return this.executeWithFallback((p) => p.getGameOverview(gameId));
  }

  async getAllGameOverviews(): Promise<GameOverview[]> {
    return this.executeWithFallback((p) => p.getAllGameOverviews());
  }

  // ============================================================================
  // COMPOSITE OPERATIONS
  // ============================================================================

  async getGameRecord(gameId: number): Promise<GameRecord | null> {
    return this.executeWithFallback((p) => p.getGameRecord(gameId));
  }

  async getInstanceProfile(
    instanceId: number,
  ): Promise<InstanceProfile | null> {
    return this.executeWithFallback((p) => p.getInstanceProfile(instanceId));
  }

  async createCompleteGame(
    game: GameInsert,
    instances: PlayerGameInstanceInsert[],
  ): Promise<number> {
    return this.executeWithFallback((p) =>
      p.createCompleteGame(game, instances),
    );
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  async getStats(): Promise<{
    games: number;
    commanders: number;
    decks: number;
    instances: number;
  }> {
    return this.executeWithFallback((p) => p.getStats());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Create and export singleton instance (starts with SQLite by default)
const databaseService = new DatabaseService({
  useLiveService: false,
  autoFallback: true,
  syncMode: "local-only",
});

export default databaseService;

// Export the class for custom configurations
export { DatabaseService, LiveService };

