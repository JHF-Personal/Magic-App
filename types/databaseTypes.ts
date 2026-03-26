// ============================================================================
// TypeScript Types for Magic Commander Game Prediction Database
// Generated from start_model_schema.sql
// ============================================================================

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type Archetype =
  | "aggro"
  | "control"
  | "combo"
  | "midrange"
  | "stax"
  | "hybrid";

export type SeatPosition = 0 | 1 | 2 | 3;

export type FinishedPosition = 1 | 2 | 3 | 4;

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Game {
  game_id: number;
  game_date: string; // ISO 8601 timestamp
  winner_position: SeatPosition;
  game_duration_minutes: number | null;
  notes: string | null;
}

export interface GameInsert {
  game_date?: string;
  winner_position: SeatPosition;
  game_duration_minutes?: number | null;
  notes?: string | null;
}

export interface Commander {
  commander_id: number;
  name: string;
  color_identity: string | null;
  cmc: number | null;
  power: number | null;
  toughness: number | null;
  card_types: string | null;
  subtypes: string | null;
}

export interface CommanderInsert {
  name: string;
  color_identity?: string | null;
  cmc?: number | null;
  power?: number | null;
  toughness?: number | null;
  card_types?: string | null;
  subtypes?: string | null;
}

export interface Deck {
  deck_id: number;
  commander_id: number;
  deck_name: string | null;
  owner: string | null;
  created_date: string; // ISO 8601 timestamp
}

export interface DeckInsert {
  commander_id: number;
  deck_name?: string | null;
  owner?: string | null;
  created_date?: string;
}

// ============================================================================
// PLAYER GAME INSTANCES
// ============================================================================

export interface PlayerGameInstance {
  instance_id: number;
  game_id: number;
  deck_id: number;
  seat_position: SeatPosition;
  finished_position: FinishedPosition | null;
}

export interface PlayerGameInstanceInsert {
  game_id: number;
  deck_id: number;
  seat_position: SeatPosition;
  finished_position?: FinishedPosition | null;
}

// ============================================================================
// DECK COMPOSITION (Trivial Features)
// ============================================================================

export interface DeckCardCounts {
  deck_id: number;
  num_creatures: number;
  num_instants: number;
  num_sorceries: number;
  num_artifacts: number;
  num_enchantments: number;
  num_planeswalkers: number;
  num_lands: number;
  total_cards: number;
}

export interface DeckCardCountsInsert {
  deck_id: number;
  num_creatures?: number;
  num_instants?: number;
  num_sorceries?: number;
  num_artifacts?: number;
  num_enchantments?: number;
  num_planeswalkers?: number;
  num_lands?: number;
  total_cards?: number;
}

// ============================================================================
// FEATURE 1: COLOR IDENTITY
// ============================================================================

export interface DeckColorIdentity {
  deck_id: number;
  is_white: 0 | 1;
  is_blue: 0 | 1;
  is_black: 0 | 1;
  is_red: 0 | 1;
  is_green: 0 | 1;
  num_colors: 1 | 2 | 3 | 4 | 5;
  color_identity: string | null;
}

export interface DeckColorIdentityInsert {
  deck_id: number;
  is_white?: 0 | 1;
  is_blue?: 0 | 1;
  is_black?: 0 | 1;
  is_red?: 0 | 1;
  is_green?: 0 | 1;
  num_colors: 1 | 2 | 3 | 4 | 5;
  color_identity?: string | null;
}

// ============================================================================
// FEATURE 2: MANA CURVE
// ============================================================================

export interface DeckManaCurve {
  deck_id: number;
  avg_cmc: number | null;
  median_cmc: number | null;
  cmc_0_1_count: number;
  cmc_2_count: number;
  cmc_3_count: number;
  cmc_4_count: number;
  cmc_5_count: number;
  cmc_6_plus_count: number;
  curve_skewness: number | null;
  curve_std: number | null;
}

export interface DeckManaCurveInsert {
  deck_id: number;
  avg_cmc?: number | null;
  median_cmc?: number | null;
  cmc_0_1_count?: number;
  cmc_2_count?: number;
  cmc_3_count?: number;
  cmc_4_count?: number;
  cmc_5_count?: number;
  cmc_6_plus_count?: number;
  curve_skewness?: number | null;
  curve_std?: number | null;
}

// ============================================================================
// FEATURE 3: RAMP
// ============================================================================

export interface DeckRamp {
  deck_id: number;
  num_ramp_cards: number;
  num_fast_mana: number;
  num_land_ramp: number;
  num_mana_dorks: number;
  num_rocks: number;
  avg_ramp_cmc: number | null;
  ramp_early_game_ratio: number | null;
}

export interface DeckRampInsert {
  deck_id: number;
  num_ramp_cards?: number;
  num_fast_mana?: number;
  num_land_ramp?: number;
  num_mana_dorks?: number;
  num_rocks?: number;
  avg_ramp_cmc?: number | null;
  ramp_early_game_ratio?: number | null;
}

// ============================================================================
// FEATURE 4: INTERACTION
// ============================================================================

export interface DeckInteraction {
  deck_id: number;
  num_single_target_removal: number;
  num_board_wipes: number;
  num_counterspells: number;
  num_stack_interaction: number;
  interaction_density: number | null;
  instant_speed_interaction_ratio: number | null;
}

export interface DeckInteractionInsert {
  deck_id: number;
  num_single_target_removal?: number;
  num_board_wipes?: number;
  num_counterspells?: number;
  num_stack_interaction?: number;
  interaction_density?: number | null;
  instant_speed_interaction_ratio?: number | null;
}

// ============================================================================
// FEATURE 5: WINCON SPEED
// ============================================================================

export interface DeckWinconSpeed {
  deck_id: number;
  num_combo_pieces: number;
  num_known_combos: number;
  num_finishers: number;
  goldfish_turn_estimate: number | null;
  wincon_speed_score: number | null;
}

export interface DeckWinconSpeedInsert {
  deck_id: number;
  num_combo_pieces?: number;
  num_known_combos?: number;
  num_finishers?: number;
  goldfish_turn_estimate?: number | null;
  wincon_speed_score?: number | null;
}

// ============================================================================
// FEATURE 6: ARCHETYPE
// ============================================================================

export interface DeckArchetype {
  deck_id: number;
  primary_archetype: Archetype | null;
  secondary_archetype: Archetype | null;
  archetype_confidence: number | null;
}

export interface DeckArchetypeInsert {
  deck_id: number;
  primary_archetype?: Archetype | null;
  secondary_archetype?: Archetype | null;
  archetype_confidence?: number | null;
}

// ============================================================================
// FEATURE 7: TABLE MATCHUP FEATURES (Per Instance)
// ============================================================================

export interface InstanceRelativeMetrics {
  instance_id: number;
  speed_rank_at_table: 1 | 2 | 3 | 4 | null;
  is_fastest_deck: 0 | 1;
  is_slowest_deck: 0 | 1;
}

export interface InstanceRelativeMetricsInsert {
  instance_id: number;
  speed_rank_at_table?: 1 | 2 | 3 | 4 | null;
  is_fastest_deck?: 0 | 1;
  is_slowest_deck?: 0 | 1;
}

export interface InstanceArchetypeMatchup {
  instance_id: number;
  num_opponents_aggro: number;
  num_opponents_control: number;
  num_opponents_combo: number;
  num_opponents_stax: number;
  num_opponents_midrange: number;
}

export interface InstanceArchetypeMatchupInsert {
  instance_id: number;
  num_opponents_aggro?: number;
  num_opponents_control?: number;
  num_opponents_combo?: number;
  num_opponents_stax?: number;
  num_opponents_midrange?: number;
}

export interface InstanceColorCompetition {
  instance_id: number;
  shared_color_count_with_others: number;
  num_players_sharing_colors: number;
  color_conflict_score: number | null;
}

export interface InstanceColorCompetitionInsert {
  instance_id: number;
  shared_color_count_with_others?: number;
  num_players_sharing_colors?: number;
  color_conflict_score?: number | null;
}

export interface InstanceThreatLevel {
  instance_id: number;
  relative_power_level_rank: 1 | 2 | 3 | 4 | null;
  is_highest_power_deck: 0 | 1;
  threat_score: number | null;
}

export interface InstanceThreatLevelInsert {
  instance_id: number;
  relative_power_level_rank?: 1 | 2 | 3 | 4 | null;
  is_highest_power_deck?: 0 | 1;
  threat_score?: number | null;
}

export interface InstanceInteractionPressure {
  instance_id: number;
  total_opponent_interaction: number;
  avg_opponent_interaction: number | null;
  is_likely_target: 0 | 1;
}

export interface InstanceInteractionPressureInsert {
  instance_id: number;
  total_opponent_interaction?: number;
  avg_opponent_interaction?: number | null;
  is_likely_target?: 0 | 1;
}

// ============================================================================
// TABLE-LEVEL AGGREGATE FEATURES
// ============================================================================

export interface GameTableMetrics {
  game_id: number;
  avg_deck_speed: number | null;
  speed_variance: number | null;
  avg_interaction_level: number | null;
  interaction_variance: number | null;
  power_level_spread: number | null;
  num_combo_decks: number | null;
  num_control_decks: number | null;
  num_aggro_decks: number | null;
}

export interface GameTableMetricsInsert {
  game_id: number;
  avg_deck_speed?: number | null;
  speed_variance?: number | null;
  avg_interaction_level?: number | null;
  interaction_variance?: number | null;
  power_level_spread?: number | null;
  num_combo_decks?: number | null;
  num_control_decks?: number | null;
  num_aggro_decks?: number | null;
}

// ============================================================================
// VIEWS FOR ML TRAINING
// ============================================================================

export interface TrainingFeatures {
  // Game and instance identifiers
  game_id: number;
  instance_id: number;
  seat_position: SeatPosition;
  finished_position: FinishedPosition | null;
  deck_id: number;

  // Commander info
  commander_name: string;
  commander_cmc: number | null;
  commander_power: number | null;
  commander_toughness: number | null;

  // Basic deck composition
  num_creatures: number | null;
  num_instants: number | null;
  num_sorceries: number | null;
  num_artifacts: number | null;
  num_enchantments: number | null;
  num_planeswalkers: number | null;
  num_lands: number | null;

  // Feature 1: Color identity
  is_white: 0 | 1 | null;
  is_blue: 0 | 1 | null;
  is_black: 0 | 1 | null;
  is_red: 0 | 1 | null;
  is_green: 0 | 1 | null;
  num_colors: 1 | 2 | 3 | 4 | 5 | null;
  color_identity: string | null;

  // Feature 2: Mana curve
  avg_cmc: number | null;
  median_cmc: number | null;
  cmc_0_1_count: number | null;
  cmc_2_count: number | null;
  cmc_3_count: number | null;
  cmc_4_count: number | null;
  cmc_5_count: number | null;
  cmc_6_plus_count: number | null;
  curve_skewness: number | null;
  curve_std: number | null;

  // Feature 3: Ramp
  num_ramp_cards: number | null;
  num_fast_mana: number | null;
  num_land_ramp: number | null;
  num_mana_dorks: number | null;
  num_rocks: number | null;
  avg_ramp_cmc: number | null;
  ramp_early_game_ratio: number | null;

  // Feature 4: Interaction
  num_single_target_removal: number | null;
  num_board_wipes: number | null;
  num_counterspells: number | null;
  num_stack_interaction: number | null;
  interaction_density: number | null;
  instant_speed_interaction_ratio: number | null;

  // Feature 5: Wincon speed
  num_combo_pieces: number | null;
  num_known_combos: number | null;
  num_finishers: number | null;
  goldfish_turn_estimate: number | null;
  wincon_speed_score: number | null;

  // Feature 6: Archetype
  primary_archetype: Archetype | null;
  secondary_archetype: Archetype | null;
  archetype_confidence: number | null;

  // Feature 7: Table matchup features
  speed_rank_at_table: 1 | 2 | 3 | 4 | null;
  is_fastest_deck: 0 | 1 | null;
  is_slowest_deck: 0 | 1 | null;
  num_opponents_aggro: number | null;
  num_opponents_control: number | null;
  num_opponents_combo: number | null;
  num_opponents_stax: number | null;
  num_opponents_midrange: number | null;
  shared_color_count_with_others: number | null;
  num_players_sharing_colors: number | null;
  color_conflict_score: number | null;
  relative_power_level_rank: 1 | 2 | 3 | 4 | null;
  is_highest_power_deck: 0 | 1 | null;
  threat_score: number | null;
  total_opponent_interaction: number | null;
  avg_opponent_interaction: number | null;
  is_likely_target: 0 | 1 | null;

  // Table-level features
  avg_deck_speed: number | null;
  speed_variance: number | null;
  avg_interaction_level: number | null;
  interaction_variance: number | null;
  power_level_spread: number | null;
  num_combo_decks: number | null;
  num_control_decks: number | null;
  num_aggro_decks: number | null;
}

export interface GameOverview {
  game_id: number;
  game_date: string;
  winner_position: SeatPosition | null;
  game_duration_minutes: number | null;

  // Player 0
  p0_commander: string | null;
  p0_archetype: Archetype | null;
  p0_colors: 1 | 2 | 3 | 4 | 5 | null;
  p0_speed: number | null;

  // Player 1
  p1_commander: string | null;
  p1_archetype: Archetype | null;
  p1_colors: 1 | 2 | 3 | 4 | 5 | null;
  p1_speed: number | null;

  // Player 2
  p2_commander: string | null;
  p2_archetype: Archetype | null;
  p2_colors: 1 | 2 | 3 | 4 | 5 | null;
  p2_speed: number | null;

  // Player 3
  p3_commander: string | null;
  p3_archetype: Archetype | null;
  p3_colors: 1 | 2 | 3 | 4 | 5 | null;
  p3_speed: number | null;

  // Table metrics
  avg_deck_speed: number | null;
  power_level_spread: number | null;
}

// ============================================================================
// UTILITY TYPES FOR DATABASE OPERATIONS
// ============================================================================

// Update types (for PATCH/UPDATE operations - all fields optional except ID)
export type GameUpdate = Partial<Omit<Game, "game_id">> & { game_id: number };
export type CommanderUpdate = Partial<Omit<Commander, "commander_id">> & {
  commander_id: number;
};
export type DeckUpdate = Partial<Omit<Deck, "deck_id">> & { deck_id: number };
export type PlayerGameInstanceUpdate = Partial<
  Omit<PlayerGameInstance, "instance_id">
> & { instance_id: number };

// Complete deck profile (deck with all feature tables)
export interface DeckProfile {
  deck: Deck;
  commander: Commander;
  card_counts?: DeckCardCounts;
  color_identity?: DeckColorIdentity;
  mana_curve?: DeckManaCurve;
  ramp?: DeckRamp;
  interaction?: DeckInteraction;
  wincon_speed?: DeckWinconSpeed;
  archetype?: DeckArchetype;
}

// Complete instance profile (instance with all feature tables)
export interface InstanceProfile {
  instance: PlayerGameInstance;
  deck_profile: DeckProfile;
  relative_metrics?: InstanceRelativeMetrics;
  archetype_matchup?: InstanceArchetypeMatchup;
  color_competition?: InstanceColorCompetition;
  threat_level?: InstanceThreatLevel;
  interaction_pressure?: InstanceInteractionPressure;
}

// Complete game record
export interface GameRecord {
  game: Game;
  instances: InstanceProfile[];
  table_metrics?: GameTableMetrics;
}
