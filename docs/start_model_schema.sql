-- ============================================================================
-- PRACTICAL START: MAGIC COMMANDER GAME PREDICTION SCHEMA
-- ============================================================================
-- Lean but powerful schema for ML model training
-- Focuses on: Mana curve, Ramp, Interaction, Wincon speed, Archetype,
--             Color identity, and Table matchup features
-- ============================================================================

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Games: Each row represents one 4-player Commander game
CREATE TABLE games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    winner_position INTEGER CHECK (winner_position BETWEEN 0 AND 3),
    game_duration_minutes INTEGER,
    notes TEXT
);

-- Commanders: Catalog of all commanders
CREATE TABLE commanders (
    commander_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color_identity TEXT, -- e.g., "WU", "BGR"
    cmc REAL,
    power REAL,
    toughness REAL,
    card_types TEXT,
    subtypes TEXT
);

-- Decks: Stores deck information and links to commanders
CREATE TABLE decks (
    deck_id INTEGER PRIMARY KEY AUTOINCREMENT,
    commander_id INTEGER NOT NULL,
    deck_name TEXT,
    owner TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
);

-- ============================================================================
-- PLAYER GAME INSTANCES
-- ============================================================================

-- Links players/decks to games with seat position
CREATE TABLE player_game_instances (
    instance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    deck_id INTEGER NOT NULL,
    seat_position INTEGER NOT NULL CHECK (seat_position BETWEEN 0 AND 3),
    finished_position INTEGER CHECK (finished_position BETWEEN 1 AND 4),
    UNIQUE (game_id, seat_position),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- TRIVIAL DECK COMPOSITION (Calculable from decklist)
-- ============================================================================

-- Basic card type counts - easily calculated from any decklist
CREATE TABLE deck_card_counts (
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

-- ============================================================================
-- FEATURE 1: COLOR IDENTITY
-- ============================================================================

-- Color identity features for each deck
CREATE TABLE deck_color_identity (
    deck_id INTEGER PRIMARY KEY,
    is_white INTEGER CHECK (is_white IN (0, 1)) DEFAULT 0,
    is_blue INTEGER CHECK (is_blue IN (0, 1)) DEFAULT 0,
    is_black INTEGER CHECK (is_black IN (0, 1)) DEFAULT 0,
    is_red INTEGER CHECK (is_red IN (0, 1)) DEFAULT 0,
    is_green INTEGER CHECK (is_green IN (0, 1)) DEFAULT 0,
    num_colors INTEGER CHECK (num_colors BETWEEN 1 AND 5),
    color_identity TEXT, -- e.g., "WUG", "BR"
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- FEATURE 2: MANA CURVE
-- ============================================================================

-- Mana curve distribution and statistics
CREATE TABLE deck_mana_curve (
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

-- ============================================================================
-- FEATURE 3: RAMP
-- ============================================================================

-- Ramp and acceleration features
CREATE TABLE deck_ramp (
    deck_id INTEGER PRIMARY KEY,
    num_ramp_cards INTEGER DEFAULT 0,
    num_fast_mana INTEGER DEFAULT 0, -- Sol Ring, Mana Crypt, Mana Vault, etc.
    num_land_ramp INTEGER DEFAULT 0, -- Cultivate, Rampant Growth, etc.
    num_mana_dorks INTEGER DEFAULT 0, -- Llanowar Elves, Birds of Paradise, etc.
    num_rocks INTEGER DEFAULT 0, -- Signets, Talismans, etc.
    avg_ramp_cmc REAL,
    ramp_early_game_ratio REAL, -- Percentage of ramp with CMC <= 2
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- FEATURE 4: INTERACTION
-- ============================================================================

-- Interaction package features
CREATE TABLE deck_interaction (
    deck_id INTEGER PRIMARY KEY,
    num_single_target_removal INTEGER DEFAULT 0, -- Path to Exile, Swords, etc.
    num_board_wipes INTEGER DEFAULT 0, -- Wrath of God, Cyclonic Rift, etc.
    num_counterspells INTEGER DEFAULT 0,
    num_stack_interaction INTEGER DEFAULT 0, -- Total instant-speed interaction
    interaction_density REAL, -- Interaction cards / total nonland cards
    instant_speed_interaction_ratio REAL,
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- FEATURE 5: WINCON SPEED
-- ============================================================================

-- Win condition speed and power features
CREATE TABLE deck_wincon_speed (
    deck_id INTEGER PRIMARY KEY,
    num_combo_pieces INTEGER DEFAULT 0,
    num_known_combos INTEGER DEFAULT 0, -- Identified infinite combos
    num_finishers INTEGER DEFAULT 0, -- Cards that can close out the game
    goldfish_turn_estimate REAL, -- Estimated turn to win without interaction
    wincon_speed_score REAL, -- Composite score (1-10)
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- FEATURE 6: ARCHETYPE
-- ============================================================================

-- Primary deck archetype classification
CREATE TABLE deck_archetype (
    deck_id INTEGER PRIMARY KEY,
    primary_archetype TEXT CHECK (primary_archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
    secondary_archetype TEXT CHECK (secondary_archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
    archetype_confidence REAL, -- Confidence score (0-1)
    FOREIGN KEY (deck_id) REFERENCES decks(deck_id)
);

-- ============================================================================
-- FEATURE 7: TABLE MATCHUP FEATURES (Per Instance)
-- ============================================================================

-- Relative positioning and speed at table
CREATE TABLE instance_relative_metrics (
    instance_id INTEGER PRIMARY KEY,
    speed_rank_at_table INTEGER CHECK (speed_rank_at_table BETWEEN 1 AND 4),
    is_fastest_deck INTEGER CHECK (is_fastest_deck IN (0, 1)) DEFAULT 0,
    is_slowest_deck INTEGER CHECK (is_slowest_deck IN (0, 1)) DEFAULT 0,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- Archetype matchup at the table
CREATE TABLE instance_archetype_matchup (
    instance_id INTEGER PRIMARY KEY,
    num_opponents_aggro INTEGER DEFAULT 0,
    num_opponents_control INTEGER DEFAULT 0,
    num_opponents_combo INTEGER DEFAULT 0,
    num_opponents_stax INTEGER DEFAULT 0,
    num_opponents_midrange INTEGER DEFAULT 0,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- Color competition at the table
CREATE TABLE instance_color_competition (
    instance_id INTEGER PRIMARY KEY,
    shared_color_count_with_others INTEGER DEFAULT 0,
    num_players_sharing_colors INTEGER DEFAULT 0,
    color_conflict_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- Threat assessment relative to table
CREATE TABLE instance_threat_level (
    instance_id INTEGER PRIMARY KEY,
    relative_power_level_rank INTEGER CHECK (relative_power_level_rank BETWEEN 1 AND 4),
    is_highest_power_deck INTEGER CHECK (is_highest_power_deck IN (0, 1)) DEFAULT 0,
    threat_score REAL, -- Composite threat score
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- Interaction pressure (how much interaction opponents have)
CREATE TABLE instance_interaction_pressure (
    instance_id INTEGER PRIMARY KEY,
    total_opponent_interaction INTEGER DEFAULT 0,
    avg_opponent_interaction REAL,
    is_likely_target INTEGER CHECK (is_likely_target IN (0, 1)) DEFAULT 0, -- Based on archetype
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- ============================================================================
-- TABLE-LEVEL AGGREGATE FEATURES
-- ============================================================================

-- Game-wide metrics capturing table balance
CREATE TABLE game_table_metrics (
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_player_instances_game ON player_game_instances(game_id);
CREATE INDEX idx_player_instances_deck ON player_game_instances(deck_id);
CREATE INDEX idx_decks_commander ON decks(commander_id);
CREATE INDEX idx_games_date ON games(game_date);

-- ============================================================================
-- USEFUL VIEWS FOR ML TRAINING
-- ============================================================================

-- Flattened view combining all features for a player instance
CREATE VIEW training_features AS
SELECT 
    -- Game and instance identifiers
    pgi.game_id,
    pgi.instance_id,
    pgi.seat_position,
    pgi.finished_position,
    pgi.deck_id,
    
    -- Commander info
    c.name as commander_name,
    c.cmc as commander_cmc,
    c.power as commander_power,
    c.toughness as commander_toughness,
    
    -- Basic deck composition (trivial from decklist)
    dcc.num_creatures,
    dcc.num_instants,
    dcc.num_sorceries,
    dcc.num_artifacts,
    dcc.num_enchantments,
    dcc.num_planeswalkers,
    dcc.num_lands,
    
    -- Feature 1: Color identity
    dci.is_white,
    dci.is_blue,
    dci.is_black,
    dci.is_red,
    dci.is_green,
    dci.num_colors,
    dci.color_identity,
    
    -- Feature 2: Mana curve
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
    
    -- Feature 3: Ramp
    dr.num_ramp_cards,
    dr.num_fast_mana,
    dr.num_land_ramp,
    dr.num_mana_dorks,
    dr.num_rocks,
    dr.avg_ramp_cmc,
    dr.ramp_early_game_ratio,
    
    -- Feature 4: Interaction
    di.num_single_target_removal,
    di.num_board_wipes,
    di.num_counterspells,
    di.num_stack_interaction,
    di.interaction_density,
    di.instant_speed_interaction_ratio,
    
    -- Feature 5: Wincon speed
    dws.num_combo_pieces,
    dws.num_known_combos,
    dws.num_finishers,
    dws.goldfish_turn_estimate,
    dws.wincon_speed_score,
    
    -- Feature 6: Archetype
    da.primary_archetype,
    da.secondary_archetype,
    da.archetype_confidence,
    
    -- Feature 7: Table matchup features
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
    
    -- Table-level features
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

-- View to see all 4 players' key features for a single game (wide format)
CREATE VIEW game_overview AS
SELECT
    g.game_id,
    g.game_date,
    g.winner_position,
    g.game_duration_minutes,
    
    -- Player 0
    p0.commander_name as p0_commander,
    p0.primary_archetype as p0_archetype,
    p0.num_colors as p0_colors,
    p0.wincon_speed_score as p0_speed,
    
    -- Player 1
    p1.commander_name as p1_commander,
    p1.primary_archetype as p1_archetype,
    p1.num_colors as p1_colors,
    p1.wincon_speed_score as p1_speed,
    
    -- Player 2
    p2.commander_name as p2_commander,
    p2.primary_archetype as p2_archetype,
    p2.num_colors as p2_colors,
    p2.wincon_speed_score as p2_speed,
    
    -- Player 3
    p3.commander_name as p3_commander,
    p3.primary_archetype as p3_archetype,
    p3.num_colors as p3_colors,
    p3.wincon_speed_score as p3_speed,
    
    -- Table metrics
    gtm.avg_deck_speed,
    gtm.power_level_spread

FROM games g
LEFT JOIN training_features p0 ON g.game_id = p0.game_id AND p0.seat_position = 0
LEFT JOIN training_features p1 ON g.game_id = p1.game_id AND p1.seat_position = 1
LEFT JOIN training_features p2 ON g.game_id = p2.game_id AND p2.seat_position = 2
LEFT JOIN training_features p3 ON g.game_id = p3.game_id AND p3.seat_position = 3
LEFT JOIN game_table_metrics gtm ON g.game_id = gtm.game_id;

-- ============================================================================
-- NOTES ON FEATURE CALCULATION
-- ============================================================================

-- TRIVIAL FEATURES (easily calculated from decklist):
-- - deck_card_counts: Count cards by type from decklist
-- - deck_color_identity: Parse mana costs and color indicators
-- - deck_mana_curve: Aggregate CMC distribution from decklist
--
-- MODERATE FEATURES (require card tagging):
-- - deck_ramp: Identify ramp cards by effect (e.g., searches for lands)
-- - deck_interaction: Identify removal, wipes, counters by effect
-- - deck_wincon_speed: Identify combo pieces and finishers
--
-- DERIVED FEATURES (calculated after individual decks):
-- - All instance_* tables: Compare deck metrics against opponents
-- - game_table_metrics: Aggregate all 4 decks' features
--
-- MANUAL FEATURES (require human judgment):
-- - deck_archetype: Best classified by deck analysis or manual tagging

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================