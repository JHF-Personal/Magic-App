// Database Types for Magic App
// Generated from app_schema.sql for frontend-backend cohesion

// =====================================================================
// CORE REFERENCE TYPES
// =====================================================================

export interface User {
  user_id: number;
  username: string;
  created_at: string;
}

export interface Format {
  format_id: number;
  format_name: string;
  min_players?: number;
  max_players?: number;
  deck_size?: number;
  notes?: string;
}

// =====================================================================
// DECK MODELING TYPES
// =====================================================================

export interface Deck {
  deck_id: number;
  user_id: number;
  format_id: number;
  deck_name: string;

  // Commander-specific fields
  color_identity?: string; // 'WUBRG' format
  is_singleton?: boolean;

  // Analytics enhancements
  total_cmc?: number;
  avg_cmc?: number;
  commander_cmc?: number;
  color_count?: number;
  primary_colors?: string;
  deck_archetype?: string;
  power_bracket?: number;
  calculated_power_level?: number;
  meta_tier?: number;
  last_analyzed?: string;

  created_at: string;
}

export interface DeckCard {
  deck_id: number;
  card_id: string;
  quantity: number;
  board_type: "main" | "side" | "command_zone";
}

export interface DeckCommander {
  deck_id: number;
  card_id: string;
  role: "commander" | "partner" | "background";
}

// =====================================================================
// GAME RECORDING TYPES
// =====================================================================

export interface Game {
  game_id: number;
  format_id: number;
  played_at: string;
  table_size?: number;
}

export interface GamePlayer {
  game_id: number;
  user_id: number;
  deck_id: number;
  seat_number: number;
  result: "win" | "loss" | "draw" | "rank";

  // Multiplayer Analytics
  elimination_order?: number;
  elimination_turn?: number;
  elimination_reason?: string;
  eliminated_by_user?: number;
  final_life_total?: number;
  turns_survived?: number;

  // Deck snapshot for historical safety
  deck_snapshot?: any; // JSON type
}

export interface GamePod {
  game_id: number;
  pod_size: number;
  winner_seat?: number;
  game_length_turns?: number;
  first_elimination_turn?: number;
}

// =====================================================================
// CARD METADATA TYPES
// =====================================================================

export interface Card {
  card_id: string;
  name: string;
  cmc?: number;
  color_identity?: string;
  colors?: string;
  type_line?: string;
  power?: number;
  toughness?: number;
  rarity?: string;
  last_updated?: string;
  image_uri?: string;
}

// =====================================================================
// ANALYTICS & STATISTICS TYPES
// =====================================================================

export interface DeckStats {
  deck_id: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  winrate?: number;

  // Multiplayer specific stats
  avg_elimination_order?: number;
  avg_turns_survived?: number;
  first_eliminations: number;
  last_eliminations: number;

  // vs Color matchups
  vs_white_wins: number;
  vs_white_games: number;
  vs_blue_wins: number;
  vs_blue_games: number;
  vs_black_wins: number;
  vs_black_games: number;
  vs_red_wins: number;
  vs_red_games: number;
  vs_green_wins: number;
  vs_green_games: number;

  // vs CMC ranges
  vs_low_cmc_wins: number;
  vs_low_cmc_games: number;
  vs_mid_cmc_wins: number;
  vs_mid_cmc_games: number;
  vs_high_cmc_wins: number;
  vs_high_cmc_games: number;

  // Pod size performance
  two_player_wins: number;
  two_player_games: number;
  three_player_wins: number;
  three_player_games: number;
  four_player_wins: number;
  four_player_games: number;

  // Seat position analysis
  seat1_wins: number;
  seat1_games: number;
  seat2_wins: number;
  seat2_games: number;
  seat3_wins: number;
  seat3_games: number;
  seat4_wins: number;
  seat4_games: number;

  last_updated: string;
}

export interface DeckMatchup {
  deck_a_id: number;
  deck_b_id: number;
  games_played: number;
  deck_a_wins: number;
  deck_b_wins: number;
  draws: number;
  head_to_head_winrate?: number;
  avg_pod_size?: number;
  last_matchup?: string;
}

export interface ArchetypeMatchup {
  archetype_a: string;
  archetype_b: string;
  format_id: number;
  games_played: number;
  archetype_a_wins: number;
  archetype_b_wins: number;
  draws: number;
  winrate_a_vs_b?: number;
  avg_game_length?: number;
  avg_elimination_turn?: number;
  sample_size_confidence?: number;
}

export interface PodComposition {
  composition_id: number;
  pod_size: number;
  format_id?: number;
  archetype_hash: string;
  color_hash: string;
  power_range?: string;
  games_played: number;
  archetype_win_rates?: any; // JSON
  seat_win_rates?: any; // JSON
  power_level_outcomes?: any; // JSON
  last_seen: string;
}

export interface GameMatchupDetail {
  game_id: number;
  deck_id: number;
  opponents_json?: any; // JSON
  pod_power_variance?: number;
  meta_favorability?: number;
  placement?: number;
  threat_assessment?: number;
  early_pressure?: boolean;
  late_game_relevance?: boolean;
}

export interface MetaSnapshot {
  snapshot_date: string; // Date
  deck_id: number;
  format_id: number;
  meta_share?: number;
  tier_ranking?: number;
  play_rate_trend?: "rising" | "stable" | "falling";
  winrate_trend?: "rising" | "stable" | "falling";
  favorable_matchups?: number;
  unfavorable_matchups?: number;
  meta_hostility?: number;
}

export interface PowerLevelCalibration {
  power_level: number;
  format_id: number;
  reference_decks?: any; // JSON
  typical_winrate?: number;
  mana_curve_profile?: any; // JSON
  interaction_density?: number;
  combo_potential?: number;
}

export interface FormatStats {
  format_id: number;
  period_start: string; // Date
  period_end: string; // Date
  white_play_rate?: number;
  blue_play_rate?: number;
  black_play_rate?: number;
  red_play_rate?: number;
  green_play_rate?: number;
  avg_commander_cmc?: number;
  avg_deck_cmc?: number;
  total_games?: number;
}

// =====================================================================
// VIEW TYPES (For Analytics)
// =====================================================================

export interface MultiplayerPodAnalysis {
  game_id: number;
  format_id: number;
  pod_size: number;
  game_length_turns?: number;
  winner_seat?: number;
  total_players: number;
  avg_turns_survived?: number;
  pod_colors?: string;
}

export interface DeckMultiplayerPerformance {
  deck_id: number;
  deck_name: string;
  color_identity?: string;
  commander_cmc?: number;
  games_played: number;
  wins: number;
  winrate?: number;
  avg_elimination_order?: number;
  avg_turns_survived?: number;
  first_eliminations: number;
  avg_pod_size?: number;
}

export interface SeatPositionAnalysis {
  seat_number: number;
  games_played: number;
  wins: number;
  winrate?: number;
  avg_turns_survived?: number;
  avg_placement?: number;
}

export interface EliminationReasonAnalysis {
  elimination_reason: string;
  occurrences: number;
  avg_elimination_turn?: number;
  avg_turns_survived?: number;
}

export interface PodSizeMeta {
  pod_size: number;
  games_played: number;
  avg_game_length?: number;
  avg_game_minutes?: number;
  avg_first_elimination?: number;
}

export interface DeckVsDeckPerformance {
  deck_a_id: number;
  deck_a_name: string;
  deck_a_archetype?: string;
  deck_b_id: number;
  deck_b_name: string;
  deck_b_archetype?: string;
  games_played: number;
  head_to_head_winrate?: number;
  avg_pod_size?: number;
  power_level_diff?: number;
  matchup_assessment?: "Favored" | "Unfavored" | "Even";
}

export interface ArchetypeMetaStrength {
  archetype: string;
  format_id: number;
  total_matchups: number;
  avg_winrate_vs_field?: number;
  favorable_matchups: number;
  unfavorable_matchups: number;
  avg_confidence?: number;
}

export interface PodPredictionData {
  pod_size: number;
  archetype_hash: string;
  color_hash: string;
  power_range?: string;
  games_played: number;
  archetype_win_rates?: any; // JSON
  seat_win_rates?: any; // JSON
  prediction_confidence?:
    | "High Confidence"
    | "Medium Confidence"
    | "Low Confidence"
    | "Insufficient Data";
}

export interface CurrentMetaLandscape {
  format_id: number;
  deck_archetype?: string;
  deck_count: number;
  avg_meta_share?: number;
  avg_tier?: number;
  avg_hostility?: number;
  avg_power_level?: number;
}

export interface PowerLevelDistribution {
  format_id: number;
  power_level: number;
  typical_winrate?: number;
  decks_at_level: number;
  actual_avg_winrate?: number;
  interaction_density?: number;
  combo_potential?: number;
}

// =====================================================================
// UTILITY TYPES FOR API RESPONSES
// =====================================================================

export type GameResult = "win" | "loss" | "draw" | "rank";
export type BoardType = "main" | "side" | "command_zone";
export type CommanderRole = "commander" | "partner" | "background";
export type EliminationReason =
  | "combat"
  | "combo"
  | "mill"
  | "concede"
  | "timeout";
export type PlayRateTrend = "rising" | "stable" | "falling";
export type WinrateTrend = "rising" | "stable" | "falling";
export type MatchupAssessment = "Favored" | "Unfavored" | "Even";
export type PredictionConfidence =
  | "High Confidence"
  | "Medium Confidence"
  | "Low Confidence"
  | "Insufficient Data";

// =====================================================================
// INPUT TYPES FOR CREATING/UPDATING RECORDS
// =====================================================================

export interface CreateUserInput {
  user_id: number;
  username: string;
}

export interface CreateDeckInput {
  user_id: number;
  format_id: number;
  deck_name: string;
  color_identity?: string;
  is_singleton?: boolean;
  deck_archetype?: string;
  power_bracket?: number;
}

export interface CreateGameInput {
  format_id: number;
  table_size?: number;
}

export interface CreateGamePlayerInput {
  game_id: number;
  user_id: number;
  deck_id: number;
  seat_number: number;
  result: GameResult;
  elimination_order?: number;
  elimination_turn?: number;
  elimination_reason?: EliminationReason;
  eliminated_by_user?: number;
  final_life_total?: number;
  turns_survived?: number;
}

export interface AddDeckCardInput {
  deck_id: number;
  card_id: string;
  quantity: number;
  board_type: BoardType;
}

export interface AddDeckCommanderInput {
  deck_id: number;
  card_id: string;
  role: CommanderRole;
}

// =====================================================================
// RESPONSE TYPES FOR API CALLS
// =====================================================================

export interface DeckWithCards extends Deck {
  cards?: DeckCard[];
  commanders?: DeckCommander[];
  stats?: DeckStats;
}

export interface GameWithPlayers extends Game {
  players?: GamePlayer[];
  pod?: GamePod;
}

export interface DeckAnalytics {
  deck: Deck;
  stats: DeckStats;
  recent_games: GamePlayer[];
  matchups: DeckMatchup[];
  performance_trend: MetaSnapshot[];
}

export interface UserProfile {
  user: User;
  decks: Deck[];
  recent_games: GamePlayer[];
  overall_stats: {
    total_games: number;
    total_wins: number;
    winrate: number;
    favorite_format: string;
    most_played_archetype: string;
  };
}

// =====================================================================
// SEARCH & FILTER TYPES
// =====================================================================

export interface DeckSearchFilters {
  format_id?: number;
  color_identity?: string;
  deck_archetype?: string;
  power_level_min?: number;
  power_level_max?: number;
  meta_tier?: number;
  user_id?: number;
}

export interface GameSearchFilters {
  format_id?: number;
  date_from?: string;
  date_to?: string;
  table_size?: number;
  user_id?: number;
  deck_id?: number;
}

export interface AnalyticsDateRange {
  start_date: string;
  end_date: string;
}

// =====================================================================
// ERROR TYPES
// =====================================================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =====================================================================
// AGGREGATION & SUMMARY TYPES
// =====================================================================

export interface ColorStats {
  white: number;
  blue: number;
  black: number;
  red: number;
  green: number;
}

export interface CMCStats {
  low_cmc: number; // 0-3
  mid_cmc: number; // 4-6
  high_cmc: number; // 7+
}

export interface SeatStats {
  seat1: { wins: number; games: number; winrate: number };
  seat2: { wins: number; games: number; winrate: number };
  seat3: { wins: number; games: number; winrate: number };
  seat4: { wins: number; games: number; winrate: number };
}

export interface PodSizeStats {
  two_player: { wins: number; games: number; winrate: number };
  three_player: { wins: number; games: number; winrate: number };
  four_player: { wins: number; games: number; winrate: number };
}
