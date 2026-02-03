// Core database entity interfaces matching the schema

export interface User {
  id: number;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: number;
  user_id: number;
  name: string;
  
  // Deck composition and metadata
  colors: string[]; // Converted from JSON in service layer
  commander_name?: string;
  commander_cmc?: number;
  average_mana_value?: number;
  bracket_level?: number; // 1-5 power level
  
  // Game statistics
  winrate: number; // Percentage 0-100 (converted from 0.0-1.0 in service layer)
  total_games: number;
  wins: number;
  losses: number;
  
  // Metadata
  description?: string;
  last_played?: Date; // Converted from ISO string in service layer
  created_at: string;
  updated_at: string;
  
  // Optional related data (loaded separately)
  cards?: DeckCard[];
  owner?: User;
}

export interface Card {
  id: string; // Scryfall ID or similar
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  colors: string[]; // Converted from JSON
  created_at: string;
}

export interface DeckCard {
  id: number;
  deck_id: number;
  card_id: string;
  quantity: number;
  category: 'main' | 'sideboard' | 'maybeboard';
  
  // Related data
  card?: Card;
}

export interface Game {
  id: number;
  game_length?: number; // Number of turns
  game_date: string;
  number_of_players: number;
  format: string;
  notes?: string;
  created_at: string;
  
  // Related data
  participants?: GameParticipant[];
}

export interface GameParticipant {
  id: number;
  game_id: number;
  deck_id: number;
  user_id: number;
  placement: number; // 1st, 2nd, 3rd, etc.
  win_condition?: 'combo' | 'combat_damage' | 'commander_damage' | 'mill' | 'alternate_win' | 'concession';
  loss_reason?: 'combo' | 'combat_damage' | 'commander_damage' | 'mill' | 'alternate_loss' | 'concession' | 'time';
  
  // Related data
  deck?: Deck;
  user?: User;
  game?: Game;
}

// Analytics and advanced features interfaces

export interface DeckMatchup {
  id: number;
  deck_id: number;
  opponent_deck_id: number;
  game_id: number;
  result: 'win' | 'loss';
  opponent_colors: string[];
  turn_order: number;
  created_at: string;
  
  // Related data
  deck?: Deck;
  opponent_deck?: Deck;
  game?: Game;
}

export interface DeckPowerMetrics {
  id: number;
  deck_id: number;
  
  // Mana base analysis
  average_cmc: number;
  land_count: number;
  mana_rock_count: number;
  
  // Deck archetype indicators
  tutor_count: number;
  ramp_count: number;
  removal_count: number;
  counterspell_count: number;
  draw_engine_count: number;
  board_wipe_count: number;
  
  // Performance metrics
  average_game_length: number;
  average_turn_win: number;
  mulligans_per_game: number;
  
  // Consistency metrics
  turn_one_play_percentage: number;
  curve_efficiency_score: number;
  
  calculated_at: string;
  updated_at: string;
}

// Analytics view interfaces (matching database views)

export interface ColorMatchupStats {
  deck_colors: string[];
  primary_deck_color: string;
  opponent_colors: string[];
  primary_opponent_color: string;
  total_matchups: number;
  wins: number;
  losses: number;
  winrate: number;
  confidence_level: 'high_confidence' | 'medium_confidence' | 'low_confidence' | 'insufficient_data';
  avg_winning_position?: number;
  first_matchup: string;
  latest_matchup: string;
}

export interface DeckPerformanceAnalysis {
  deck_id: number;
  deck_name: string;
  deck_colors: string[];
  owner_name: string;
  total_games: number;
  wins: number;
  losses: number;
  stored_winrate: number;
  recorded_matchups: number;
  matchup_wins: number;
  matchup_losses: number;
  matchup_winrate: number;
  winrate_vs_white?: number;
  winrate_vs_blue?: number;
  winrate_vs_black?: number;
  winrate_vs_red?: number;
  winrate_vs_green?: number;
  recent_winrate_last_10_matchups?: number;
  last_played?: string;
  days_since_last_game: number;
}

export interface DeckPowerRanking {
  deck_id: number;
  deck_name: string;
  deck_colors: string[];
  owner_name: string;
  total_games: number;
  winrate: number;
  avg_mana_cost: number;
  consistency_tools: number;
  interaction_density: number;
  power_score: number;
  winrate_rank: number;
  activity_rank: number;
  recent_30_day_winrate?: number;
  last_played?: string;
  days_inactive: number;
}

// Prediction and ML interfaces

export interface PredictionModel {
  id: number;
  model_name: string;
  model_version: string;
  feature_weights: Record<string, number>; // JSON parsed
  accuracy_metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
  };
  training_sample_size: number;
  training_date_range_start: string;
  training_date_range_end: string;
  created_at: string;
  last_updated: string;
  is_active: boolean;
}

export interface GamePrediction {
  id: number;
  deck_ids: number[]; // JSON parsed
  player_count: number;
  predicted_winner_deck_id: number;
  win_probabilities: Record<number, number>; // {deck_id: probability}
  confidence_score: number;
  prediction_method: 'elo_based' | 'ml_model' | 'historical_matchup';
  model_version?: string;
  actual_winner_deck_id?: number;
  prediction_accuracy?: number;
  created_at: string;
}

export interface DeckPredictionFeatures {
  deck_id: number;
  deck_name: string;
  colors: string[];
  historical_winrate: number;
  experience_level: number;
  days_since_last_game: number;
  avg_mana_cost: number;
  consistency_score: number;
  interaction_density: number;
  acceleration_tools: number;
  card_advantage_engines: number;
  manabase_consistency: number;
  speed_rating: number;
  recent_form: number;
  strength_vs_white: number;
  strength_vs_blue: number;
  strength_vs_black: number;
  strength_vs_red: number;
  strength_vs_green: number;
}

// Context and API interfaces

export interface DeckContextType {
  decks: Deck[];
  selectedDeck: Deck | null;
  selectDeck: (deckId: number) => Promise<void>;
  clearSelection: () => void;
  isLoading: boolean;
  error: string | null;
  refreshDecks: () => Promise<void>;
  createDeck: (deck: Omit<Deck, 'id' | 'created_at' | 'updated_at' | 'wins' | 'losses' | 'total_games'>) => Promise<Deck>;
  updateDeck: (deck: Deck) => Promise<Deck>;
  deleteDeck: (id: number) => Promise<void>;
}

// Utility types for forms and API requests

export type CreateDeckRequest = Omit<Deck, 'id' | 'created_at' | 'updated_at' | 'wins' | 'losses' | 'total_games'>;
export type UpdateDeckRequest = Partial<Omit<Deck, 'id' | 'created_at' | 'updated_at'>>;

export interface GameCreateRequest {
  participants: Array<{
    deck_id: number;
    user_id: number;
    placement: number;
    win_condition?: GameParticipant['win_condition'];
    loss_reason?: GameParticipant['loss_reason'];
  }>;
  game_length?: number;
  game_date?: string;
  format?: string;
  notes?: string;
}