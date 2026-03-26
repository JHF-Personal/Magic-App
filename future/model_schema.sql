-- ============================================================================
-- MAGIC: THE GATHERING COMMANDER GAME PREDICTION DATABASE SCHEMA
-- ============================================================================
-- This schema supports ML model training for 4-player Commander pod outcomes
-- Based on pre-game information only (no in-game plays)
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
    card_types TEXT, -- e.g., "Legendary Creature"
    subtypes TEXT -- e.g., "Human Wizard"
);

-- Commander Archetypes: Classification for commanders
CREATE TABLE commander_archetypes (
    commander_id INTEGER,
    archetype TEXT CHECK (archetype IN ('aggro', 'control', 'midrange', 'combo', 'stax', 'tribal', 'spellslinger', 'ramp')),
    PRIMARY KEY (commander_id, archetype),
    FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
);

-- Commander Strategy Tags: Multi-hot encoding for strategies
CREATE TABLE commander_strategy_tags (
    commander_id INTEGER,
    strategy_tag TEXT CHECK (strategy_tag IN ('graveyard', 'artifacts', 'enchantments', 'tokens', 'counters', 'extra_turns', 'storm')),
    PRIMARY KEY (commander_id, strategy_tag),
    FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
);

-- Decks: Stores deck information
CREATE TABLE decks (
    deck_id INTEGER PRIMARY KEY AUTOINCREMENT,
    commander_id INTEGER NOT NULL,
    deck_name TEXT,
    owner TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
);

-- ============================================================================
-- PLAYER-LEVEL FEATURES
-- ============================================================================

-- Player Game Instance: Links players to games
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

-- A. Commander Features (stored with each instance)
CREATE TABLE player_commander_features (
    instance_id INTEGER PRIMARY KEY,
    commander_cmc REAL,
    commander_power REAL,
    commander_toughness REAL,
    is_white INTEGER CHECK (is_white IN (0, 1)),
    is_blue INTEGER CHECK (is_blue IN (0, 1)),
    is_black INTEGER CHECK (is_black IN (0, 1)),
    is_red INTEGER CHECK (is_red IN (0, 1)),
    is_green INTEGER CHECK (is_green IN (0, 1)),
    num_colors INTEGER,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- B. Deck Composition Features
CREATE TABLE player_deck_composition (
    instance_id INTEGER PRIMARY KEY,
    num_creatures INTEGER,
    num_instants INTEGER,
    num_sorceries INTEGER,
    num_artifacts INTEGER,
    num_enchantments INTEGER,
    num_planeswalkers INTEGER,
    num_lands INTEGER,
    creature_ratio REAL,
    interaction_ratio REAL,
    ramp_ratio REAL,
    draw_ratio REAL,
    land_ratio REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- C. Mana Curve Features
CREATE TABLE player_mana_curve (
    instance_id INTEGER PRIMARY KEY,
    avg_cmc REAL,
    median_cmc REAL,
    cmc_0_1_count INTEGER,
    cmc_2_count INTEGER,
    cmc_3_count INTEGER,
    cmc_4_count INTEGER,
    cmc_5_count INTEGER,
    cmc_6_plus_count INTEGER,
    curve_skewness REAL,
    curve_std REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- D. Ramp / Acceleration Features
CREATE TABLE player_ramp_features (
    instance_id INTEGER PRIMARY KEY,
    num_ramp_cards INTEGER,
    num_fast_mana INTEGER,
    num_land_ramp INTEGER,
    num_mana_dorks INTEGER,
    num_rocks INTEGER,
    avg_ramp_cmc REAL,
    ramp_early_game_ratio REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- E. Card Advantage Features
CREATE TABLE player_card_advantage (
    instance_id INTEGER PRIMARY KEY,
    num_card_draw INTEGER,
    num_repeatable_draw INTEGER,
    num_burst_draw INTEGER,
    num_tutors INTEGER,
    tutor_efficiency_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- F. Interaction Package Features
CREATE TABLE player_interaction (
    instance_id INTEGER PRIMARY KEY,
    num_single_target_removal INTEGER,
    num_board_wipes INTEGER,
    num_counterspells INTEGER,
    num_stack_interaction INTEGER,
    interaction_density REAL,
    instant_speed_interaction_ratio REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- G. Win Condition Features
CREATE TABLE player_wincon_features (
    instance_id INTEGER PRIMARY KEY,
    num_combo_pieces INTEGER,
    num_known_combos INTEGER,
    combo_density REAL,
    num_alternate_wincons INTEGER,
    num_big_finishers INTEGER,
    wincon_speed_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- H. Consistency / Stability Features
CREATE TABLE player_consistency (
    instance_id INTEGER PRIMARY KEY,
    mana_base_quality_score REAL,
    color_fixing_density REAL,
    redundancy_score REAL,
    deck_consistency_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- I. Synergy Features
CREATE TABLE player_synergy (
    instance_id INTEGER PRIMARY KEY,
    tribal_density REAL,
    artifact_synergy_score REAL,
    enchantment_synergy_score REAL,
    graveyard_synergy_score REAL,
    token_synergy_score REAL,
    overall_synergy_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- J. Control / Disruption Profile
CREATE TABLE player_disruption (
    instance_id INTEGER PRIMARY KEY,
    stax_piece_count INTEGER,
    tax_effect_count INTEGER,
    resource_denial_score REAL,
    opponent_disruption_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- K. Speed & Tempo Features
CREATE TABLE player_speed_tempo (
    instance_id INTEGER PRIMARY KEY,
    early_game_presence_score REAL,
    midgame_strength_score REAL,
    late_game_scaling_score REAL,
    goldfish_turn_estimate REAL,
    tempo_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- M. Deck Archetype
CREATE TABLE player_deck_archetype (
    instance_id INTEGER PRIMARY KEY,
    deck_archetype TEXT CHECK (deck_archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- ============================================================================
-- TABLE-LEVEL FEATURES (MULTIPLAYER DYNAMICS)
-- ============================================================================

-- Table-Level Features: One row per game
CREATE TABLE table_features (
    game_id INTEGER PRIMARY KEY,
    power_level_std REAL,
    speed_std REAL,
    interaction_std REAL,
    FOREIGN KEY (game_id) REFERENCES games(game_id)
);

-- A. Seat Position Features (captured in player_game_instances)
-- B. Relative Speed Features
CREATE TABLE player_relative_speed (
    instance_id INTEGER PRIMARY KEY,
    speed_rank_at_table INTEGER CHECK (speed_rank_at_table BETWEEN 1 AND 4),
    is_fastest_deck INTEGER CHECK (is_fastest_deck IN (0, 1)),
    is_slowest_deck INTEGER CHECK (is_slowest_deck IN (0, 1)),
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- C. Archetype Matchup Counts
CREATE TABLE player_archetype_matchups (
    instance_id INTEGER PRIMARY KEY,
    num_opponents_aggro INTEGER,
    num_opponents_control INTEGER,
    num_opponents_combo INTEGER,
    num_opponents_stax INTEGER,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- D. Interaction Pressure
CREATE TABLE player_interaction_pressure (
    instance_id INTEGER PRIMARY KEY,
    total_opponent_interaction INTEGER,
    avg_opponent_interaction REAL,
    is_most_targeted_archetype INTEGER CHECK (is_most_targeted_archetype IN (0, 1)),
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- E. Color Competition
CREATE TABLE player_color_competition (
    instance_id INTEGER PRIMARY KEY,
    shared_color_count_with_others INTEGER,
    num_players_sharing_colors INTEGER,
    color_conflict_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- F. Threat Assessment
CREATE TABLE player_threat_assessment (
    instance_id INTEGER PRIMARY KEY,
    relative_power_level_rank INTEGER CHECK (relative_power_level_rank BETWEEN 1 AND 4),
    is_highest_power_deck INTEGER CHECK (is_highest_power_deck IN (0, 1)),
    threat_score REAL,
    FOREIGN KEY (instance_id) REFERENCES player_game_instances(instance_id)
);

-- ============================================================================
-- PAIRWISE FEATURES
-- ============================================================================

-- Pairwise Features: Player vs Player comparisons
CREATE TABLE pairwise_features (
    pairwise_id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id_1 INTEGER NOT NULL,
    instance_id_2 INTEGER NOT NULL,
    matchup_advantage_score REAL,
    speed_difference REAL,
    interaction_difference REAL,
    combo_vs_control_flag INTEGER CHECK (combo_vs_control_flag IN (0, 1)),
    aggro_vs_combo_flag INTEGER CHECK (aggro_vs_combo_flag IN (0, 1)),
    UNIQUE (instance_id_1, instance_id_2),
    FOREIGN KEY (instance_id_1) REFERENCES player_game_instances(instance_id),
    FOREIGN KEY (instance_id_2) REFERENCES player_game_instances(instance_id)
);

-- ============================================================================
-- OPTIONAL ADVANCED FEATURES
-- ============================================================================

-- Commander Win Rate Priors (learned from historical data)
CREATE TABLE commander_meta_stats (
    commander_id INTEGER PRIMARY KEY,
    winrate_prior REAL,
    games_played INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
);

-- Archetype Win Rate Priors
CREATE TABLE archetype_meta_stats (
    archetype TEXT PRIMARY KEY CHECK (archetype IN ('aggro', 'control', 'combo', 'midrange', 'stax', 'hybrid')),
    winrate_prior REAL,
    games_played INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Color Combination Win Rate Priors
CREATE TABLE color_combination_stats (
    color_identity TEXT PRIMARY KEY,
    winrate_prior REAL,
    games_played INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_player_game_instances_game_id ON player_game_instances(game_id);
CREATE INDEX idx_player_game_instances_deck_id ON player_game_instances(deck_id);
CREATE INDEX idx_decks_commander_id ON decks(commander_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_commander_archetypes_commander_id ON commander_archetypes(commander_id);
CREATE INDEX idx_commander_strategy_tags_commander_id ON commander_strategy_tags(commander_id);

-- ============================================================================
-- VIEWS FOR EASY FEATURE EXTRACTION
-- ============================================================================

-- Flattened view of all player features for a game (useful for ML model input)
CREATE VIEW game_player_features AS
SELECT 
    pgi.game_id,
    pgi.seat_position,
    pgi.instance_id,
    pgi.deck_id,
    d.commander_id,
    c.name as commander_name,
    -- Commander features
    pcf.commander_cmc,
    pcf.commander_power,
    pcf.commander_toughness,
    pcf.is_white,
    pcf.is_blue,
    pcf.is_black,
    pcf.is_red,
    pcf.is_green,
    pcf.num_colors,
    -- Deck composition
    pdc.num_creatures,
    pdc.num_instants,
    pdc.num_sorceries,
    pdc.num_artifacts,
    pdc.num_enchantments,
    pdc.num_planeswalkers,
    pdc.num_lands,
    pdc.creature_ratio,
    pdc.interaction_ratio,
    pdc.ramp_ratio,
    pdc.draw_ratio,
    pdc.land_ratio,
    -- Mana curve
    pmc.avg_cmc,
    pmc.median_cmc,
    pmc.cmc_0_1_count,
    pmc.cmc_2_count,
    pmc.cmc_3_count,
    pmc.cmc_4_count,
    pmc.cmc_5_count,
    pmc.cmc_6_plus_count,
    pmc.curve_skewness,
    pmc.curve_std,
    -- Ramp
    prf.num_ramp_cards,
    prf.num_fast_mana,
    prf.num_land_ramp,
    prf.num_mana_dorks,
    prf.num_rocks,
    prf.avg_ramp_cmc,
    prf.ramp_early_game_ratio,
    -- Card advantage
    pca.num_card_draw,
    pca.num_repeatable_draw,
    pca.num_burst_draw,
    pca.num_tutors,
    pca.tutor_efficiency_score,
    -- Interaction
    pi.num_single_target_removal,
    pi.num_board_wipes,
    pi.num_counterspells,
    pi.num_stack_interaction,
    pi.interaction_density,
    pi.instant_speed_interaction_ratio,
    -- Win conditions
    pwf.num_combo_pieces,
    pwf.num_known_combos,
    pwf.combo_density,
    pwf.num_alternate_wincons,
    pwf.num_big_finishers,
    pwf.wincon_speed_score,
    -- Consistency
    pcon.mana_base_quality_score,
    pcon.color_fixing_density,
    pcon.redundancy_score,
    pcon.deck_consistency_score,
    -- Synergy
    ps.tribal_density,
    ps.artifact_synergy_score,
    ps.enchantment_synergy_score,
    ps.graveyard_synergy_score,
    ps.token_synergy_score,
    ps.overall_synergy_score,
    -- Disruption
    pd.stax_piece_count,
    pd.tax_effect_count,
    pd.resource_denial_score,
    pd.opponent_disruption_score,
    -- Speed & tempo
    pst.early_game_presence_score,
    pst.midgame_strength_score,
    pst.late_game_scaling_score,
    pst.goldfish_turn_estimate,
    pst.tempo_score,
    -- Archetype
    pda.deck_archetype,
    -- Relative speed
    prs.speed_rank_at_table,
    prs.is_fastest_deck,
    prs.is_slowest_deck,
    -- Archetype matchups
    pam.num_opponents_aggro,
    pam.num_opponents_control,
    pam.num_opponents_combo,
    pam.num_opponents_stax,
    -- Interaction pressure
    pip.total_opponent_interaction,
    pip.avg_opponent_interaction,
    pip.is_most_targeted_archetype,
    -- Color competition
    pcc.shared_color_count_with_others,
    pcc.num_players_sharing_colors,
    pcc.color_conflict_score,
    -- Threat assessment
    pta.relative_power_level_rank,
    pta.is_highest_power_deck,
    pta.threat_score
FROM player_game_instances pgi
JOIN decks d ON pgi.deck_id = d.deck_id
JOIN commanders c ON d.commander_id = c.commander_id
LEFT JOIN player_commander_features pcf ON pgi.instance_id = pcf.instance_id
LEFT JOIN player_deck_composition pdc ON pgi.instance_id = pdc.instance_id
LEFT JOIN player_mana_curve pmc ON pgi.instance_id = pmc.instance_id
LEFT JOIN player_ramp_features prf ON pgi.instance_id = prf.instance_id
LEFT JOIN player_card_advantage pca ON pgi.instance_id = pca.instance_id
LEFT JOIN player_interaction pi ON pgi.instance_id = pi.instance_id
LEFT JOIN player_wincon_features pwf ON pgi.instance_id = pwf.instance_id
LEFT JOIN player_consistency pcon ON pgi.instance_id = pcon.instance_id
LEFT JOIN player_synergy ps ON pgi.instance_id = ps.instance_id
LEFT JOIN player_disruption pd ON pgi.instance_id = pd.instance_id
LEFT JOIN player_speed_tempo pst ON pgi.instance_id = pst.instance_id
LEFT JOIN player_deck_archetype pda ON pgi.instance_id = pda.instance_id
LEFT JOIN player_relative_speed prs ON pgi.instance_id = prs.instance_id
LEFT JOIN player_archetype_matchups pam ON pgi.instance_id = pam.instance_id
LEFT JOIN player_interaction_pressure pip ON pgi.instance_id = pip.instance_id
LEFT JOIN player_color_competition pcc ON pgi.instance_id = pcc.instance_id
LEFT JOIN player_threat_assessment pta ON pgi.instance_id = pta.instance_id;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
