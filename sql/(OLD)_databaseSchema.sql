-- MTG Deck Tracker Database Schema
-- SQLite compatible schema with proper syntax and best practices

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS mtg_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Decks table
CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    
    -- Deck composition and stats
    colors TEXT NOT NULL, -- JSON string array: '["white", "blue", "red"]'
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

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_length INTEGER CHECK (game_length > 0), -- Number of turns
    game_date TEXT NOT NULL, -- ISO date string
    number_of_players INTEGER NOT NULL CHECK (number_of_players BETWEEN 2 AND 4),
    format TEXT DEFAULT 'commander', -- Game format
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Game participants table (junction table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    deck_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    placement INTEGER NOT NULL CHECK (placement > 0), -- 1st, 2nd, 3rd, etc.
    win_condition TEXT CHECK (win_condition IN ('combo', 'combat_damage', 'commander_damage', 'mill', 'alternate_win', 'concession')),
    loss_reason TEXT CHECK (loss_reason IN ('combo', 'combat_damage', 'commander_damage', 'mill', 'alternate_loss', 'concession', 'time')),
    
    -- Constraints
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES mtg_users(id) ON DELETE CASCADE,
    UNIQUE (game_id, deck_id), -- Each deck can only participate once per game
    UNIQUE (game_id, placement) -- Each placement is unique per game
);

-- Cards table (optional - for detailed deck composition tracking)
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY, -- Card ID (e.g., from Scryfall API)
    name TEXT NOT NULL,
    mana_cost TEXT,
    cmc INTEGER,
    type_line TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'mythic')),
    colors TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Deck cards table (junction table for deck composition)
CREATE TABLE IF NOT EXISTS deck_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    category TEXT DEFAULT 'main', -- 'main', 'sideboard', 'maybeboard'
    
    -- Constraints
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    UNIQUE (deck_id, card_id, category) -- Prevent duplicate cards in same category
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_last_played ON decks(last_played);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_deck_id ON game_participants(deck_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards(card_id);

-- Views for common queries
CREATE VIEW IF NOT EXISTS deck_stats AS
SELECT 
    d.id,
    d.name,
    d.user_id,
    d.colors,
    d.total_games,
    d.wins,
    d.losses,
    CASE 
        WHEN d.total_games > 0 THEN CAST(d.wins AS REAL) / d.total_games 
        ELSE 0.0 
    END as calculated_winrate,
    d.last_played,
    COUNT(dc.card_id) as total_cards
FROM decks d
LEFT JOIN deck_cards dc ON d.id = dc.deck_id AND dc.category = 'main'
GROUP BY d.id, d.name, d.user_id, d.colors, d.total_games, d.wins, d.losses, d.last_played;

-- Triggers to maintain data consistency
CREATE TRIGGER IF NOT EXISTS update_deck_timestamp 
    AFTER UPDATE ON decks
BEGIN
    UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_deck_stats_after_game
    AFTER INSERT ON game_participants
BEGIN
    UPDATE decks 
    SET 
        total_games = total_games + 1,
        wins = CASE WHEN NEW.placement = 1 THEN wins + 1 ELSE wins END,
        losses = CASE WHEN NEW.placement > 1 THEN losses + 1 ELSE losses END,
        winrate = CASE 
            WHEN total_games + 1 > 0 THEN 
                CAST((CASE WHEN NEW.placement = 1 THEN wins + 1 ELSE wins END) AS REAL) / (total_games + 1)
            ELSE 0.0 
        END,
        last_played = (SELECT game_date FROM games WHERE id = NEW.game_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.deck_id;
END;

-- ========================================
-- PHASE 1: Enhanced Data Collection Tables
-- ========================================

-- Matchup tracking table for advanced analytics
CREATE TABLE IF NOT EXISTS deck_matchups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    opponent_deck_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
    
    -- Additional matchup context
    opponent_colors TEXT, -- Cached for faster queries
    turn_order INTEGER, -- 1st, 2nd, 3rd, 4th player to act
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (opponent_deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    
    -- Prevent duplicate matchups in same game
    UNIQUE (deck_id, opponent_deck_id, game_id)
);

-- Power metrics table for deck analysis and prediction
CREATE TABLE IF NOT EXISTS deck_power_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL UNIQUE,
    
    -- Mana base analysis
    average_cmc REAL DEFAULT 0.0,
    land_count INTEGER DEFAULT 0,
    mana_rock_count INTEGER DEFAULT 0,
    
    -- Deck archetype indicators
    tutor_count INTEGER DEFAULT 0,
    ramp_count INTEGER DEFAULT 0,
    removal_count INTEGER DEFAULT 0,
    counterspell_count INTEGER DEFAULT 0,
    draw_engine_count INTEGER DEFAULT 0,
    board_wipe_count INTEGER DEFAULT 0,
    
    -- Performance metrics (calculated from game data)
    average_game_length REAL DEFAULT 0.0,
    average_turn_win REAL DEFAULT 0.0, -- What turn games typically end when this deck wins
    mulligans_per_game REAL DEFAULT 0.0,
    
    -- Consistency metrics
    turn_one_play_percentage REAL DEFAULT 0.0,
    curve_efficiency_score REAL DEFAULT 0.0,
    
    -- Last calculation timestamp
    calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Performance indexes for matchup queries
CREATE INDEX IF NOT EXISTS idx_matchups_deck_id ON deck_matchups(deck_id);
CREATE INDEX IF NOT EXISTS idx_matchups_opponent_deck_id ON deck_matchups(opponent_deck_id);
CREATE INDEX IF NOT EXISTS idx_matchups_game_id ON deck_matchups(game_id);
CREATE INDEX IF NOT EXISTS idx_matchups_opponent_colors ON deck_matchups(opponent_colors);
CREATE INDEX IF NOT EXISTS idx_power_metrics_deck_id ON deck_power_metrics(deck_id);

-- ========================================
-- PHASE 1: Automatic Matchup Tracking Trigger
-- ========================================

-- Trigger to automatically create matchup records when games are recorded
CREATE TRIGGER IF NOT EXISTS create_matchup_records
    AFTER INSERT ON game_participants
BEGIN
    -- Create matchup records for this participant against all other participants in the same game
    INSERT INTO deck_matchups (deck_id, opponent_deck_id, game_id, result, opponent_colors, turn_order)
    SELECT 
        NEW.deck_id,                    -- This deck
        other_gp.deck_id,              -- Opponent deck
        NEW.game_id,                   -- Game they played in
        CASE 
            WHEN NEW.placement = 1 THEN 'win' 
            ELSE 'loss' 
        END as result,                 -- Win if 1st place, loss otherwise
        opponent_deck.colors,          -- Cache opponent colors for fast queries
        NEW.placement as turn_order    -- Use placement as proxy for turn order
    FROM game_participants other_gp
    JOIN decks opponent_deck ON other_gp.deck_id = opponent_deck.id
    WHERE other_gp.game_id = NEW.game_id 
    AND other_gp.deck_id != NEW.deck_id;  -- Don't create matchup against self
END;

-- ========================================
-- PHASE 2: Analytics Views for Complex Statistics
-- ========================================

-- View 1: Color Matchup Analysis
-- Answers: "How do red decks perform against blue decks?"
CREATE VIEW IF NOT EXISTS color_matchup_stats AS
SELECT 
    -- Deck color information
    d1.colors as deck_colors,
    JSON_EXTRACT(d1.colors, '$[0]') as primary_deck_color,
    
    -- Opponent color information  
    dm.opponent_colors,
    JSON_EXTRACT(dm.opponent_colors, '$[0]') as primary_opponent_color,
    
    -- Statistical analysis
    COUNT(*) as total_matchups,
    SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN dm.result = 'loss' THEN 1 ELSE 0 END) as losses,
    
    -- Win rate calculation with confidence indicator
    CAST(SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as winrate,
    
    -- Statistical significance indicator
    CASE 
        WHEN COUNT(*) >= 20 THEN 'high_confidence'
        WHEN COUNT(*) >= 10 THEN 'medium_confidence' 
        WHEN COUNT(*) >= 5 THEN 'low_confidence'
        ELSE 'insufficient_data'
    END as confidence_level,
    
    -- Additional insights
    AVG(CASE WHEN dm.result = 'win' THEN dm.turn_order ELSE NULL END) as avg_winning_position,
    MIN(dm.created_at) as first_matchup,
    MAX(dm.created_at) as latest_matchup
    
FROM deck_matchups dm
JOIN decks d1 ON dm.deck_id = d1.id
GROUP BY d1.colors, dm.opponent_colors
HAVING COUNT(*) >= 3; -- Minimum 3 games for meaningful stats

-- View 2: Individual Deck Performance Analysis  
-- Answers: "How does my specific deck perform against different archetypes?"
CREATE VIEW IF NOT EXISTS deck_performance_analysis AS
SELECT 
    -- Deck identification
    d.id as deck_id,
    d.name as deck_name,
    d.colors as deck_colors,
    u.name as owner_name,
    
    -- Overall performance metrics
    d.total_games,
    d.wins,
    d.losses,
    d.winrate as stored_winrate,
    
    -- Matchup-based performance (more detailed)
    COUNT(dm.id) as recorded_matchups,
    SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) as matchup_wins,
    SUM(CASE WHEN dm.result = 'loss' THEN 1 ELSE 0 END) as matchup_losses,
    CAST(SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) AS REAL) / COUNT(dm.id) as matchup_winrate,
    
    -- Performance against color combinations
    CAST(SUM(CASE WHEN dm.result = 'win' AND dm.opponent_colors LIKE '%white%' THEN 1 ELSE 0 END) AS REAL) / 
         NULLIF(SUM(CASE WHEN dm.opponent_colors LIKE '%white%' THEN 1 ELSE 0 END), 0) as winrate_vs_white,
    
    CAST(SUM(CASE WHEN dm.result = 'win' AND dm.opponent_colors LIKE '%blue%' THEN 1 ELSE 0 END) AS REAL) / 
         NULLIF(SUM(CASE WHEN dm.opponent_colors LIKE '%blue%' THEN 1 ELSE 0 END), 0) as winrate_vs_blue,
    
    CAST(SUM(CASE WHEN dm.result = 'win' AND dm.opponent_colors LIKE '%black%' THEN 1 ELSE 0 END) AS REAL) / 
         NULLIF(SUM(CASE WHEN dm.opponent_colors LIKE '%black%' THEN 1 ELSE 0 END), 0) as winrate_vs_black,
    
    CAST(SUM(CASE WHEN dm.result = 'win' AND dm.opponent_colors LIKE '%red%' THEN 1 ELSE 0 END) AS REAL) / 
         NULLIF(SUM(CASE WHEN dm.opponent_colors LIKE '%red%' THEN 1 ELSE 0 END), 0) as winrate_vs_red,
    
    CAST(SUM(CASE WHEN dm.result = 'win' AND dm.opponent_colors LIKE '%green%' THEN 1 ELSE 0 END) AS REAL) / 
         NULLIF(SUM(CASE WHEN dm.opponent_colors LIKE '%green%' THEN 1 ELSE 0 END), 0) as winrate_vs_green,
    
    -- Recent performance trend (last 10 games)
    (SELECT CAST(SUM(CASE WHEN dm2.result = 'win' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
     FROM deck_matchups dm2 
     WHERE dm2.deck_id = d.id 
     ORDER BY dm2.created_at DESC 
     LIMIT 30) as recent_winrate_last_10_matchups,
     
    -- Activity metrics
    d.last_played,
    CAST((julianday('now') - julianday(d.last_played)) AS INTEGER) as days_since_last_game
    
FROM decks d
JOIN mtg_users u ON d.user_id = u.id
LEFT JOIN deck_matchups dm ON d.id = dm.deck_id
GROUP BY d.id, d.name, d.colors, u.name, d.total_games, d.wins, d.losses, d.winrate, d.last_played;

-- View 3: Win/Loss Condition Analysis
-- Answers: "How do I usually win/lose with this deck?"
CREATE VIEW IF NOT EXISTS win_loss_condition_stats AS
SELECT 
    -- Deck information
    d.id as deck_id,
    d.name as deck_name,
    d.colors as deck_colors,
    
    -- Win condition analysis
    gp_wins.win_condition,
    COUNT(gp_wins.id) as times_won_this_way,
    CAST(COUNT(gp_wins.id) AS REAL) / (
        SELECT COUNT(*) 
        FROM game_participants gp_total_wins 
        WHERE gp_total_wins.deck_id = d.id AND gp_total_wins.placement = 1
    ) as win_condition_percentage,
    
    -- Loss reason analysis  
    gp_losses.loss_reason,
    COUNT(gp_losses.id) as times_lost_this_way,
    CAST(COUNT(gp_losses.id) AS REAL) / (
        SELECT COUNT(*) 
        FROM game_participants gp_total_losses 
        WHERE gp_total_losses.deck_id = d.id AND gp_total_losses.placement > 1
    ) as loss_reason_percentage,
    
    -- Context information
    AVG(g_wins.game_length) as avg_game_length_when_winning_this_way,
    AVG(g_losses.game_length) as avg_game_length_when_losing_this_way
    
FROM decks d
LEFT JOIN game_participants gp_wins ON d.id = gp_wins.deck_id AND gp_wins.placement = 1
LEFT JOIN games g_wins ON gp_wins.game_id = g_wins.id
LEFT JOIN game_participants gp_losses ON d.id = gp_losses.deck_id AND gp_losses.placement > 1  
LEFT JOIN games g_losses ON gp_losses.game_id = g_losses.id
WHERE gp_wins.win_condition IS NOT NULL OR gp_losses.loss_reason IS NOT NULL
GROUP BY d.id, d.name, d.colors, gp_wins.win_condition, gp_losses.loss_reason;

-- View 4: Meta Game Analysis
-- Answers: "What's the current meta in our playgroup?"
CREATE VIEW IF NOT EXISTS meta_analysis AS
SELECT 
    -- Time periods for trend analysis
    CASE 
        WHEN julianday('now') - julianday(g.game_date) <= 30 THEN 'last_30_days'
        WHEN julianday('now') - julianday(g.game_date) <= 90 THEN 'last_90_days'  
        ELSE 'older'
    END as time_period,
    
    -- Deck archetype analysis (based on colors)
    CASE 
        WHEN JSON_ARRAY_LENGTH(d.colors) = 1 THEN 'mono_color'
        WHEN JSON_ARRAY_LENGTH(d.colors) = 2 THEN 'two_color'
        WHEN JSON_ARRAY_LENGTH(d.colors) = 3 THEN 'three_color'
        WHEN JSON_ARRAY_LENGTH(d.colors) >= 4 THEN 'four_plus_color'
        ELSE 'colorless'
    END as color_identity_type,
    
    -- Primary colors in meta
    JSON_EXTRACT(d.colors, '$[0]') as primary_color,
    
    -- Performance metrics
    COUNT(DISTINCT gp.deck_id) as unique_decks_played,
    COUNT(gp.id) as total_games_played,
    AVG(g.game_length) as avg_game_length,
    AVG(g.number_of_players) as avg_players_per_game,
    
    -- Win distribution
    COUNT(CASE WHEN gp.placement = 1 THEN 1 END) as total_wins,
    CAST(COUNT(CASE WHEN gp.placement = 1 THEN 1 END) AS REAL) / COUNT(DISTINCT gp.deck_id) as wins_per_deck,
    
    -- Most common win/loss conditions
    (SELECT gp2.win_condition 
     FROM game_participants gp2 
     JOIN games g2 ON gp2.game_id = g2.id
     JOIN decks d2 ON gp2.deck_id = d2.id
     WHERE gp2.placement = 1 
     AND JSON_EXTRACT(d2.colors, '$[0]') = JSON_EXTRACT(d.colors, '$[0]')
     AND CASE 
         WHEN julianday('now') - julianday(g2.game_date) <= 30 THEN 'last_30_days'
         WHEN julianday('now') - julianday(g2.game_date) <= 90 THEN 'last_90_days'  
         ELSE 'older'
     END = time_period
     GROUP BY gp2.win_condition 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) as most_common_win_condition
     
FROM games g
JOIN game_participants gp ON g.id = gp.game_id
JOIN decks d ON gp.deck_id = d.id
GROUP BY time_period, color_identity_type, primary_color
HAVING COUNT(gp.id) >= 5; -- Minimum games for meaningful analysis

-- View 5: Deck Power Ranking
-- Answers: "Which decks are the strongest in our meta?"
CREATE VIEW IF NOT EXISTS deck_power_ranking AS
SELECT 
    -- Deck identification
    d.id as deck_id,
    d.name as deck_name,
    d.colors as deck_colors,
    u.name as owner_name,
    
    -- Core performance metrics
    d.total_games,
    d.winrate,
    
    -- Advanced performance indicators
    COALESCE(dpm.average_cmc, 0) as avg_mana_cost,
    COALESCE(dpm.tutor_count, 0) as consistency_tools,
    COALESCE(dpm.removal_count + dpm.counterspell_count, 0) as interaction_density,
    
    -- Calculated power score (0-100 scale)
    CAST(
        (d.winrate * 40) +  -- 40% weight on win rate
        (CASE 
            WHEN d.total_games >= 20 THEN 20
            WHEN d.total_games >= 10 THEN 15  
            WHEN d.total_games >= 5 THEN 10
            ELSE 5
        END) + -- 20% weight on sample size
        (COALESCE(dpm.tutor_count, 0) * 2) + -- Consistency bonus
        (COALESCE(dpm.removal_count + dpm.counterspell_count, 0) * 1.5) + -- Interaction bonus
        (CASE WHEN COALESCE(dpm.average_cmc, 4) <= 2.5 THEN 10 ELSE 0 END) + -- Speed bonus
        (CASE 
            WHEN julianday('now') - julianday(d.last_played) <= 30 THEN 10
            WHEN julianday('now') - julianday(d.last_played) <= 90 THEN 5
            ELSE 0
        END) -- Activity bonus
    AS INTEGER) as power_score,
    
    -- Ranking information
    ROW_NUMBER() OVER (ORDER BY d.winrate DESC) as winrate_rank,
    ROW_NUMBER() OVER (ORDER BY d.total_games DESC) as activity_rank,
    
    -- Recent performance trend
    (SELECT CAST(SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
     FROM deck_matchups dm 
     WHERE dm.deck_id = d.id 
     AND julianday('now') - julianday(dm.created_at) <= 30
    ) as recent_30_day_winrate,
    
    d.last_played,
    CAST((julianday('now') - julianday(d.last_played)) AS INTEGER) as days_inactive
    
FROM decks d
JOIN mtg_users u ON d.user_id = u.id
LEFT JOIN deck_power_metrics dpm ON d.id = dpm.deck_id
WHERE d.total_games >= 3 -- Only rank decks with meaningful data
ORDER BY power_score DESC;

-- ========================================  
-- PHASE 2: Performance Indexes for Views
-- ========================================

-- Indexes to speed up complex view queries
CREATE INDEX IF NOT EXISTS idx_game_participants_placement ON game_participants(placement);
CREATE INDEX IF NOT EXISTS idx_game_participants_win_condition ON game_participants(win_condition);
CREATE INDEX IF NOT EXISTS idx_game_participants_loss_reason ON game_participants(loss_reason);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_deck_matchups_created_at ON deck_matchups(created_at);
CREATE INDEX IF NOT EXISTS idx_deck_matchups_result ON deck_matchups(result);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_matchups_deck_result ON deck_matchups(deck_id, result);
CREATE INDEX IF NOT EXISTS idx_matchups_colors_result ON deck_matchups(opponent_colors, result);
CREATE INDEX IF NOT EXISTS idx_game_participants_deck_placement ON game_participants(deck_id, placement);

-- ========================================
-- PHASE 3: Predictive Analytics Infrastructure
-- ========================================

-- Table to store calculated prediction models and weights
CREATE TABLE IF NOT EXISTS prediction_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL UNIQUE,
    model_version TEXT NOT NULL,
    
    -- Model parameters (JSON stored)
    feature_weights TEXT NOT NULL, -- JSON object with feature importance
    accuracy_metrics TEXT, -- JSON with accuracy, precision, recall stats
    
    -- Training data info
    training_sample_size INTEGER DEFAULT 0,
    training_date_range_start TEXT,
    training_date_range_end TEXT,
    
    -- Model metadata
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Table to store deck similarity calculations
CREATE TABLE IF NOT EXISTS deck_similarity_matrix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_a_id INTEGER NOT NULL,
    deck_b_id INTEGER NOT NULL,
    
    -- Similarity scores (0.0 to 1.0)
    color_similarity REAL DEFAULT 0.0,
    cmc_similarity REAL DEFAULT 0.0,
    archetype_similarity REAL DEFAULT 0.0,
    card_overlap_similarity REAL DEFAULT 0.0,
    
    -- Overall weighted similarity
    overall_similarity REAL DEFAULT 0.0,
    
    -- Calculation metadata
    calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (deck_a_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_b_id) REFERENCES decks(id) ON DELETE CASCADE,
    UNIQUE (deck_a_id, deck_b_id),
    CHECK (deck_a_id != deck_b_id)
);

-- Table to cache prediction results for performance
CREATE TABLE IF NOT EXISTS game_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Game setup being predicted
    deck_ids TEXT NOT NULL, -- JSON array of participating deck IDs
    player_count INTEGER NOT NULL,
    
    -- Prediction results
    predicted_winner_deck_id INTEGER NOT NULL,
    win_probabilities TEXT NOT NULL, -- JSON object: {deck_id: probability}
    
    -- Prediction confidence and methodology
    confidence_score REAL NOT NULL, -- 0.0 to 1.0
    prediction_method TEXT NOT NULL, -- 'elo_based', 'ml_model', 'historical_matchup'
    model_version TEXT,
    
    -- Validation (if game actually happened)
    actual_winner_deck_id INTEGER,
    prediction_accuracy REAL, -- 1.0 if correct, 0.0 if wrong
    
    -- Metadata
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (predicted_winner_deck_id) REFERENCES decks(id),
    FOREIGN KEY (actual_winner_deck_id) REFERENCES decks(id)
);

-- View for deck prediction features (ML input data)
CREATE VIEW IF NOT EXISTS deck_prediction_features AS
SELECT 
    d.id as deck_id,
    d.name as deck_name,
    d.colors,
    
    -- Basic performance metrics
    d.winrate as historical_winrate,
    d.total_games as experience_level,
    CAST((julianday('now') - julianday(d.last_played)) AS INTEGER) as days_since_last_game,
    
    -- Power level indicators
    COALESCE(dpm.average_cmc, 3.5) as avg_mana_cost,
    COALESCE(dpm.tutor_count, 0) as consistency_score,
    COALESCE(dpm.removal_count + dpm.counterspell_count, 0) as interaction_density,
    COALESCE(dpm.ramp_count, 0) as acceleration_tools,
    COALESCE(dpm.draw_engine_count, 0) as card_advantage_engines,
    
    -- Calculated derived features
    CASE 
        WHEN JSON_ARRAY_LENGTH(d.colors) = 1 THEN 1.0
        WHEN JSON_ARRAY_LENGTH(d.colors) = 2 THEN 0.8  
        WHEN JSON_ARRAY_LENGTH(d.colors) = 3 THEN 0.6
        ELSE 0.4
    END as manabase_consistency,
    
    -- Speed indicators
    CASE 
        WHEN COALESCE(dpm.average_cmc, 3.5) <= 2.0 THEN 1.0
        WHEN COALESCE(dpm.average_cmc, 3.5) <= 2.5 THEN 0.8
        WHEN COALESCE(dpm.average_cmc, 3.5) <= 3.0 THEN 0.6
        WHEN COALESCE(dpm.average_cmc, 3.5) <= 3.5 THEN 0.4
        ELSE 0.2
    END as speed_rating,
    
    -- Recent performance trend  
    COALESCE((
        SELECT CAST(SUM(CASE WHEN dm.result = 'win' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
        FROM deck_matchups dm 
        WHERE dm.deck_id = d.id 
        AND julianday('now') - julianday(dm.created_at) <= 30
        AND COUNT(*) >= 3
    ), d.winrate) as recent_form,
    
    -- Color-specific matchup strengths (vs each color)
    COALESCE((
        SELECT AVG(CASE WHEN dm.result = 'win' THEN 1.0 ELSE 0.0 END)
        FROM deck_matchups dm
        WHERE dm.deck_id = d.id AND dm.opponent_colors LIKE '%white%'
    ), 0.5) as strength_vs_white,
    
    COALESCE((
        SELECT AVG(CASE WHEN dm.result = 'win' THEN 1.0 ELSE 0.0 END)
        FROM deck_matchups dm
        WHERE dm.deck_id = d.id AND dm.opponent_colors LIKE '%blue%'
    ), 0.5) as strength_vs_blue,
    
    COALESCE((
        SELECT AVG(CASE WHEN dm.result = 'win' THEN 1.0 ELSE 0.0 END)
        FROM deck_matchups dm
        Where dm.deck_id = d.id AND dm.opponent_colors LIKE '%black%'
    ), 0.5) as strength_vs_black,
    
    COALESCE((
        SELECT AVG(CASE WHEN dm.result = 'win' THEN 1.0 ELSE 0.0 END)
        FROM deck_matchups dm
        WHERE dm.deck_id = d.id AND dm.opponent_colors LIKE '%red%'
    ), 0.5) as strength_vs_red,
    
    COALESCE((
        SELECT AVG(CASE WHEN dm.result = 'win' THEN 1.0 ELSE 0.0 END)
        FROM deck_matchups dm
        WHERE dm.deck_id = d.id AND dm.opponent_colors LIKE '%green%'
    ), 0.5) as strength_vs_green

FROM decks d
LEFT JOIN deck_power_metrics dpm ON d.id = dpm.deck_id
WHERE d.total_games >= 1; -- Only include decks with some game history

-- View for ELO-style rating calculations
CREATE VIEW IF NOT EXISTS deck_elo_ratings AS
WITH RECURSIVE elo_calculation AS (
    -- Base case: initial ELO ratings
    SELECT 
        d.id as deck_id,
        1500.0 as elo_rating, -- Standard starting ELO
        0 as games_processed,
        d.created_at as calculation_date
    FROM decks d
    
    UNION ALL
    
    -- Recursive case: update ELO based on game results
    SELECT 
        ec.deck_id,
        -- ELO update formula: new_elo = old_elo + K * (actual_score - expected_score)
        ec.elo_rating + (32.0 * (
            CASE WHEN gp.placement = 1 THEN 1.0 ELSE 0.0 END - 
            (1.0 / (1.0 + POWER(10, (opponent_avg_elo - ec.elo_rating) / 400.0)))
        )) as elo_rating,
        ec.games_processed + 1,
        g.game_date
    FROM elo_calculation ec
    JOIN game_participants gp ON ec.deck_id = gp.deck_id
    JOIN games g ON gp.game_id = g.id
    JOIN (
        -- Calculate average opponent ELO for this game
        SELECT 
            gp_inner.game_id,
            gp_inner.deck_id,
            AVG(ec_opponent.elo_rating) as opponent_avg_elo
        FROM game_participants gp_inner
        JOIN elo_calculation ec_opponent ON gp_inner.deck_id = ec_opponent.deck_id
        WHERE ec_opponent.games_processed = (
            SELECT COUNT(*) FROM game_participants gp_count 
            WHERE gp_count.deck_id = gp_inner.deck_id 
            AND gp_count.id < gp_inner.id
        )
        GROUP BY gp_inner.game_id, gp_inner.deck_id
    ) opponent_elos ON gp.game_id = opponent_elos.game_id AND gp.deck_id = opponent_elos.deck_id
    WHERE ec.games_processed < (
        SELECT COUNT(*) FROM game_participants gp_count WHERE gp_count.deck_id = ec.deck_id
    )
)
SELECT 
    deck_id,
    elo_rating,
    games_processed as total_rated_games,
    -- ELO-based win probability vs average opponent
    1.0 / (1.0 + POWER(10, (1500 - elo_rating) / 400.0)) as expected_winrate_vs_avg
FROM elo_calculation
WHERE games_processed = (
    SELECT MAX(games_processed) FROM elo_calculation ec2 WHERE ec2.deck_id = elo_calculation.deck_id
);

-- Indexes for prediction performance
CREATE INDEX IF NOT EXISTS idx_deck_similarity_deck_a ON deck_similarity_matrix(deck_a_id);
CREATE INDEX IF NOT EXISTS idx_deck_similarity_deck_b ON deck_similarity_matrix(deck_b_id);
CREATE INDEX IF NOT EXISTS idx_deck_similarity_overall ON deck_similarity_matrix(overall_similarity);
CREATE INDEX IF NOT EXISTS idx_game_predictions_deck_ids ON game_predictions(deck_ids);
CREATE INDEX IF NOT EXISTS idx_game_predictions_created_at ON game_predictions(created_at);

-- ========================================
-- PHASE 3: Prediction Algorithm Functions
-- ========================================

-- Trigger to update deck similarity when decks are modified
CREATE TRIGGER IF NOT EXISTS update_deck_similarity_on_deck_change
    AFTER UPDATE ON decks
BEGIN
    -- Mark similarity calculations as outdated
    DELETE FROM deck_similarity_matrix 
    WHERE deck_a_id = NEW.id OR deck_b_id = NEW.id;
END;

-- Trigger to cache power metrics when deck cards change
CREATE TRIGGER IF NOT EXISTS update_power_metrics_on_card_change
    AFTER INSERT ON deck_cards
BEGIN
    -- Recalculate power metrics for this deck
    INSERT OR REPLACE INTO deck_power_metrics (deck_id, calculated_at, updated_at)
    VALUES (NEW.deck_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END;