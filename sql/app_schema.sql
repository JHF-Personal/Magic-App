-- Core Reference Tables
Users (
  user_id        BIGINT PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
)

-- Formats
Formats (
  format_id      SMALLINT PRIMARY KEY,
  format_name    TEXT NOT NULL UNIQUE,   -- Commander, Pauper, Modern
  min_players    INT,
  max_players    INT,
  deck_size      INT,
  notes          TEXT
)

-- Deck Modeling
Decks (
  deck_id          BIGINT PRIMARY KEY,
  user_id          BIGINT REFERENCES Users(user_id),
  format_id        SMALLINT REFERENCES Formats(format_id),
  deck_name        TEXT NOT NULL,

  -- Commander-specific but harmless elsewhere
  color_identity   CHAR(5),      -- e.g. 'WUBRG', nullable
  is_singleton     BOOLEAN,

  -- Analytics enhancements
  total_cmc        INT,              -- sum of all card CMCs
  avg_cmc          DECIMAL(3,2),     -- average CMC
  commander_cmc    INT,              -- commander's CMC
  color_count      SMALLINT,         -- number of colors (1-5)
  primary_colors   CHAR(5),          -- most represented colors
  deck_archetype   TEXT,             -- aggro/midrange/control/combo
  power_bracket    SMALLINT,         -- 1-5 rating
  calculated_power_level DECIMAL(4,2), -- computed power level for matchup analysis
  meta_tier        SMALLINT,         -- current meta tier ranking (1-5)
  last_analyzed    TIMESTAMP,

  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
)

DeckCards (
  deck_id        BIGINT REFERENCES Decks(deck_id),
  card_id        TEXT NOT NULL,            -- external API ID
  quantity       INT NOT NULL,
  board_type     TEXT NOT NULL,            -- main / side / command_zone

  PRIMARY KEY (deck_id, card_id, board_type)
)

DeckCommanders (
  deck_id     BIGINT REFERENCES Decks(deck_id),
  card_id     TEXT NOT NULL,
  role        TEXT NOT NULL,   -- commander / partner / background

  PRIMARY KEY (deck_id, card_id)
)

-- Game Recording
Games (
  game_id        BIGINT PRIMARY KEY,
  format_id      SMALLINT REFERENCES Formats(format_id),
  played_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  table_size     INT
)

GamePlayers (
  game_id        BIGINT REFERENCES Games(game_id),
  user_id        BIGINT REFERENCES Users(user_id),
  deck_id        BIGINT REFERENCES Decks(deck_id),

  seat_number    INT NOT NULL,                     -- 1, 2, 3, 4 for turn order
  result         TEXT NOT NULL,                    -- win / loss / draw / rank
  
  -- Multiplayer Analytics
  elimination_order    SMALLINT,                   -- 1st out, 2nd out, etc. NULL for winner
  elimination_turn     INT,                        -- turn number when eliminated
  elimination_reason   TEXT,                       -- combat / combo / mill / concede / timeout
  eliminated_by_user   BIGINT REFERENCES Users(user_id), -- who eliminated this player
  final_life_total     INT,                        -- life when eliminated/game ended
  turns_survived       INT,                        -- number of turns player survived
  
  -- Optional snapshot for historical safety
  deck_snapshot  JSON,

  PRIMARY KEY (game_id, user_id)
)

-- Card Metadata for Analytics (Hybrid Approach)
CREATE TABLE Cards (
  card_id        TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  cmc            INT,            -- Essential for mana curve analysis
  color_identity TEXT,           -- Critical for color matchup tracking
  colors         TEXT,           -- For casting cost analysis
  type_line      TEXT,           -- Creature/Instant/Sorcery ratios for deck composition
  power          INT,            -- Combat math and threat assessment
  toughness      INT,
  rarity         TEXT,           -- Power level correlation analysis
  last_updated   TIMESTAMP,      -- Track when data was refreshed from API
  
  -- Cache commonly needed display data
  image_uri      TEXT            -- Primary image only, detailed data from API
  
  -- API provides: mana_cost, oracle_text, keywords[], rulings, multiple images
)

-- Multiplayer Pod Analytics
CREATE TABLE GamePods (
  game_id              BIGINT,
  pod_size             SMALLINT,                   -- 2, 3, 4, etc.
  winner_seat          SMALLINT,                   -- seat number of winner
  game_length_turns    INT,                        -- total turns in game
  first_elimination_turn INT,                      -- when first player was eliminated
  
  PRIMARY KEY (game_id),
  FOREIGN KEY (game_id) REFERENCES Games(game_id)
)

-- Pre-computed Deck Performance Statistics
CREATE TABLE DeckStats (
  deck_id              BIGINT PRIMARY KEY,
  games_played         INT DEFAULT 0,
  wins                 INT DEFAULT 0,
  losses               INT DEFAULT 0,
  draws                INT DEFAULT 0,
  winrate              DECIMAL(5,4),       -- 0.0000 to 1.0000
  
  -- Multiplayer specific stats
  avg_elimination_order DECIMAL(3,2),      -- average placement (lower is better)
  avg_turns_survived   DECIMAL(5,1),       -- average survival time
  first_eliminations   INT DEFAULT 0,      -- times eliminated first
  last_eliminations    INT DEFAULT 0,      -- times eliminated last (excluding wins)
  
  -- vs Color matchups (in multiplayer context)
  vs_white_wins        INT DEFAULT 0,
  vs_white_games       INT DEFAULT 0,
  vs_blue_wins         INT DEFAULT 0,
  vs_blue_games        INT DEFAULT 0,
  vs_black_wins        INT DEFAULT 0,
  vs_black_games       INT DEFAULT 0,
  vs_red_wins          INT DEFAULT 0,
  vs_red_games         INT DEFAULT 0,
  vs_green_wins        INT DEFAULT 0,
  vs_green_games       INT DEFAULT 0,
  
  -- vs CMC ranges
  vs_low_cmc_wins      INT DEFAULT 0,     -- CMC 0-3
  vs_low_cmc_games     INT DEFAULT 0,
  vs_mid_cmc_wins      INT DEFAULT 0,     -- CMC 4-6  
  vs_mid_cmc_games     INT DEFAULT 0,
  vs_high_cmc_wins     INT DEFAULT 0,     -- CMC 7+
  vs_high_cmc_games    INT DEFAULT 0,
  
  -- Pod size performance
  two_player_wins      INT DEFAULT 0,
  two_player_games     INT DEFAULT 0,
  three_player_wins    INT DEFAULT 0,
  three_player_games   INT DEFAULT 0,
  four_player_wins     INT DEFAULT 0,
  four_player_games    INT DEFAULT 0,
  
  -- Seat position analysis
  seat1_wins           INT DEFAULT 0,     -- going first
  seat1_games          INT DEFAULT 0,
  seat2_wins           INT DEFAULT 0,
  seat2_games          INT DEFAULT 0,
  seat3_wins           INT DEFAULT 0,
  seat3_games          INT DEFAULT 0,
  seat4_wins           INT DEFAULT 0,
  seat4_games          INT DEFAULT 0,
  
  last_updated         TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (deck_id) REFERENCES Decks(deck_id)
)

-- Direct Deck vs Deck Matchup Tracking
CREATE TABLE DeckMatchups (
  deck_a_id            BIGINT,
  deck_b_id            BIGINT,
  games_played         INT DEFAULT 0,
  deck_a_wins          INT DEFAULT 0,
  deck_b_wins          INT DEFAULT 0,
  draws                INT DEFAULT 0,
  head_to_head_winrate DECIMAL(5,4),     -- deck_a winrate vs deck_b
  
  -- Contextual factors
  avg_pod_size         DECIMAL(3,1),     -- average pod size when these decks faced off
  last_matchup         TIMESTAMP,
  
  PRIMARY KEY (deck_a_id, deck_b_id),
  FOREIGN KEY (deck_a_id) REFERENCES Decks(deck_id),
  FOREIGN KEY (deck_b_id) REFERENCES Decks(deck_id),
  CHECK (deck_a_id < deck_b_id)  -- ensure consistent ordering
)

-- Archetype vs Archetype Analysis
CREATE TABLE ArchetypeMatchups (
  archetype_a          TEXT,
  archetype_b          TEXT,
  format_id            SMALLINT,
  games_played         INT DEFAULT 0,
  archetype_a_wins     INT DEFAULT 0,
  archetype_b_wins     INT DEFAULT 0,
  draws                INT DEFAULT 0,
  winrate_a_vs_b       DECIMAL(5,4),
  
  -- Performance metrics
  avg_game_length      DECIMAL(5,1),     -- average turns
  avg_elimination_turn DECIMAL(5,1),     -- when losing archetype typically loses
  sample_size_confidence DECIMAL(3,2),   -- confidence level based on sample size
  
  PRIMARY KEY (archetype_a, archetype_b, format_id),
  FOREIGN KEY (format_id) REFERENCES Formats(format_id),
  CHECK (archetype_a <= archetype_b)  -- lexicographic ordering
)

-- Pod Composition Performance Tracking
CREATE TABLE PodCompositions (
  composition_id       BIGSERIAL PRIMARY KEY,
  pod_size             SMALLINT NOT NULL,
  format_id            SMALLINT,
  
  -- Composition identifiers
  archetype_hash       TEXT NOT NULL,    -- sorted hash of archetypes in pod
  color_hash           TEXT NOT NULL,    -- sorted hash of color identities
  power_range          TEXT,             -- e.g., '6-8', power level spread
  
  games_played         INT DEFAULT 0,
  
  -- Outcome distribution (JSON for flexibility)
  archetype_win_rates  JSON,            -- {"aggro": 0.25, "control": 0.40, ...}
  seat_win_rates       JSON,            -- {"1": 0.20, "2": 0.30, ...}
  power_level_outcomes JSON,            -- outcomes by power level bracket
  
  last_seen            TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (format_id) REFERENCES Formats(format_id)
)

-- Detailed Matchup Context (per game)
CREATE TABLE GameMatchupDetails (
  game_id              BIGINT,
  deck_id              BIGINT,
  
  -- Opponent context in this specific game
  opponents_json       JSON,            -- [{"deck_id": 123, "archetype": "aggro", "colors": "RG"}]
  pod_power_variance   DECIMAL(4,2),    -- standard deviation of power levels in pod
  meta_favorability    DECIMAL(3,2),    -- how favorable the meta was for this deck
  
  -- Performance in this context
  placement            SMALLINT,        -- 1st, 2nd, 3rd, 4th
  threat_assessment    SMALLINT,        -- how threatening opponents viewed this deck (1-5)
  early_pressure       BOOLEAN,         -- did this deck apply early pressure
  late_game_relevance  BOOLEAN,         -- was this deck relevant in late game
  
  PRIMARY KEY (game_id, deck_id),
  FOREIGN KEY (game_id) REFERENCES Games(game_id),
  FOREIGN KEY (deck_id) REFERENCES Decks(deck_id)
)

-- Meta Snapshots for Temporal Analysis
CREATE TABLE MetaSnapshots (
  snapshot_date        DATE,
  deck_id              BIGINT,
  format_id            SMALLINT,
  
  meta_share           DECIMAL(5,4),    -- percentage of meta this deck represents
  tier_ranking         SMALLINT,        -- 1 = tier 1, 2 = tier 2, etc.
  play_rate_trend      TEXT,            -- 'rising', 'stable', 'falling'
  winrate_trend        TEXT,            -- trend in winrate over time
  
  -- Contextual factors
  favorable_matchups   INT,             -- count of favorable matchups in current meta
  unfavorable_matchups INT,             -- count of unfavorable matchups
  meta_hostility       DECIMAL(3,2),    -- how hostile current meta is (0-1)
  
  PRIMARY KEY (snapshot_date, deck_id, format_id),
  FOREIGN KEY (deck_id) REFERENCES Decks(deck_id),
  FOREIGN KEY (format_id) REFERENCES Formats(format_id)
)

-- Power Level Calibration
CREATE TABLE PowerLevelCalibration (
  power_level          DECIMAL(4,2),
  format_id            SMALLINT,
  
  -- Reference decks at this power level
  reference_decks      JSON,            -- array of deck_ids that exemplify this power level
  
  -- Characteristics
  typical_winrate      DECIMAL(5,4),    -- expected winrate at this power level
  mana_curve_profile   JSON,            -- typical CMC distribution
  interaction_density  DECIMAL(3,2),    -- removal/counterspells per deck
  combo_potential      DECIMAL(3,2),    -- likelihood of combo wins
  
  PRIMARY KEY (power_level, format_id),
  FOREIGN KEY (format_id) REFERENCES Formats(format_id)
)

-- Format Meta Analysis
CREATE TABLE FormatStats (
  format_id            SMALLINT,
  period_start         DATE,
  period_end           DATE,
  
  -- Color popularity
  white_play_rate      DECIMAL(5,4),
  blue_play_rate       DECIMAL(5,4),
  black_play_rate      DECIMAL(5,4),
  red_play_rate        DECIMAL(5,4),
  green_play_rate      DECIMAL(5,4),
  
  -- CMC distribution
  avg_commander_cmc    DECIMAL(4,2),
  avg_deck_cmc         DECIMAL(4,2),
  
  total_games          BIGINT,
  
  PRIMARY KEY (format_id, period_start),
  FOREIGN KEY (format_id) REFERENCES Formats(format_id)
)

-- Performance Indexes
CREATE INDEX idx_decks_color_identity ON Decks(color_identity);
CREATE INDEX idx_decks_commander_cmc ON Decks(commander_cmc);
CREATE INDEX idx_decks_format ON Decks(format_id);
CREATE INDEX idx_decks_archetype ON Decks(deck_archetype);
CREATE INDEX idx_decks_power_level ON Decks(calculated_power_level);
CREATE INDEX idx_decks_meta_tier ON Decks(meta_tier);
CREATE INDEX idx_games_played_at ON Games(played_at);
CREATE INDEX idx_games_table_size ON Games(table_size);
CREATE INDEX idx_game_players_result ON GamePlayers(result);
CREATE INDEX idx_game_players_elimination ON GamePlayers(elimination_order);
CREATE INDEX idx_game_players_seat ON GamePlayers(seat_number);
CREATE INDEX idx_game_players_turns_survived ON GamePlayers(turns_survived);
CREATE INDEX idx_game_pods_size ON GamePods(pod_size);
CREATE INDEX idx_cards_cmc ON Cards(cmc);
CREATE INDEX idx_cards_colors ON Cards(color_identity);
CREATE INDEX idx_deckstats_winrate ON DeckStats(winrate);
CREATE INDEX idx_deckstats_elimination_order ON DeckStats(avg_elimination_order);

-- Matchup Analysis Indexes
CREATE INDEX idx_deck_matchups_winrate ON DeckMatchups(head_to_head_winrate);
CREATE INDEX idx_deck_matchups_games ON DeckMatchups(games_played);
CREATE INDEX idx_archetype_matchups_format ON ArchetypeMatchups(format_id);
CREATE INDEX idx_archetype_matchups_winrate ON ArchetypeMatchups(winrate_a_vs_b);
CREATE INDEX idx_pod_compositions_size ON PodCompositions(pod_size);
CREATE INDEX idx_pod_compositions_archetype_hash ON PodCompositions(archetype_hash);
CREATE INDEX idx_pod_compositions_power_range ON PodCompositions(power_range);
CREATE INDEX idx_game_matchup_details_power_variance ON GameMatchupDetails(pod_power_variance);
CREATE INDEX idx_meta_snapshots_date ON MetaSnapshots(snapshot_date);
CREATE INDEX idx_meta_snapshots_tier ON MetaSnapshots(tier_ranking);
CREATE INDEX idx_meta_snapshots_share ON MetaSnapshots(meta_share);
CREATE INDEX idx_power_calibration_level ON PowerLevelCalibration(power_level);

-- Analytics Views for Multiplayer
CREATE VIEW multiplayer_pod_analysis AS
SELECT 
  g.game_id,
  g.format_id,
  gp_pod.pod_size,
  gp_pod.game_length_turns,
  gp_pod.winner_seat,
  COUNT(*) as total_players,
  AVG(gp.turns_survived) as avg_turns_survived,
  STRING_AGG(DISTINCT d.color_identity, ',') as pod_colors
FROM Games g
JOIN GamePods gp_pod ON g.game_id = gp_pod.game_id
JOIN GamePlayers gp ON g.game_id = gp.game_id
JOIN Decks d ON gp.deck_id = d.deck_id
GROUP BY g.game_id, g.format_id, gp_pod.pod_size, gp_pod.game_length_turns, gp_pod.winner_seat;

CREATE VIEW deck_multiplayer_performance AS
SELECT 
  d.deck_id,
  d.deck_name,
  d.color_identity,
  d.commander_cmc,
  COUNT(*) as games_played,
  SUM(CASE WHEN gp.result = 'win' THEN 1 ELSE 0 END) as wins,
  ROUND(AVG(CASE WHEN gp.result = 'win' THEN 1.0 ELSE 0.0 END), 4) as winrate,
  ROUND(AVG(gp.elimination_order), 2) as avg_elimination_order,
  ROUND(AVG(gp.turns_survived), 1) as avg_turns_survived,
  SUM(CASE WHEN gp.elimination_order = 1 THEN 1 ELSE 0 END) as first_eliminations,
  ROUND(AVG(pod.pod_size), 1) as avg_pod_size
FROM Decks d
JOIN GamePlayers gp ON d.deck_id = gp.deck_id
JOIN GamePods pod ON gp.game_id = pod.game_id
GROUP BY d.deck_id, d.deck_name, d.color_identity, d.commander_cmc;

CREATE VIEW seat_position_analysis AS
SELECT 
  gp.seat_number,
  COUNT(*) as games_played,
  SUM(CASE WHEN gp.result = 'win' THEN 1 ELSE 0 END) as wins,
  ROUND(AVG(CASE WHEN gp.result = 'win' THEN 1.0 ELSE 0.0 END), 4) as winrate,
  ROUND(AVG(gp.turns_survived), 1) as avg_turns_survived,
  ROUND(AVG(CASE WHEN gp.elimination_order IS NOT NULL THEN gp.elimination_order ELSE pod.pod_size END), 2) as avg_placement
FROM GamePlayers gp
JOIN GamePods pod ON gp.game_id = pod.game_id
GROUP BY gp.seat_number
ORDER BY gp.seat_number;

CREATE VIEW elimination_reason_analysis AS
SELECT 
  gp.elimination_reason,
  COUNT(*) as occurrences,
  ROUND(AVG(gp.elimination_turn), 1) as avg_elimination_turn,
  ROUND(AVG(gp.turns_survived), 1) as avg_turns_survived
FROM GamePlayers gp
WHERE gp.elimination_reason IS NOT NULL
GROUP BY gp.elimination_reason
ORDER BY occurrences DESC;

CREATE VIEW pod_size_meta AS
SELECT 
  pod.pod_size,
  COUNT(*) as games_played,
  ROUND(AVG(pod.game_length_turns), 1) as avg_game_length,
  ROUND(AVG(pod.game_length_minutes), 1) as avg_game_minutes,
  ROUND(AVG(pod.first_elimination_turn), 1) as avg_first_elimination
FROM GamePods pod
GROUP BY pod.pod_size
ORDER BY pod.pod_size;

-- Advanced Matchup Analysis Views
CREATE VIEW deck_vs_deck_performance AS
SELECT 
  dm.deck_a_id,
  da.deck_name as deck_a_name,
  da.deck_archetype as deck_a_archetype,
  dm.deck_b_id,
  db.deck_name as deck_b_name,
  db.deck_archetype as deck_b_archetype,
  dm.games_played,
  dm.head_to_head_winrate,
  dm.avg_pod_size,
  ABS(da.calculated_power_level - db.calculated_power_level) as power_level_diff,
  CASE 
    WHEN dm.head_to_head_winrate > 0.6 THEN 'Favored'
    WHEN dm.head_to_head_winrate < 0.4 THEN 'Unfavored'
    ELSE 'Even'
  END as matchup_assessment
FROM DeckMatchups dm
JOIN Decks da ON dm.deck_a_id = da.deck_id
JOIN Decks db ON dm.deck_b_id = db.deck_id
WHERE dm.games_played >= 5;  -- Only show statistically relevant matchups

CREATE VIEW archetype_meta_strength AS
SELECT 
  am.archetype_a as archetype,
  am.format_id,
  COUNT(*) as total_matchups,
  ROUND(AVG(am.winrate_a_vs_b), 4) as avg_winrate_vs_field,
  SUM(CASE WHEN am.winrate_a_vs_b > 0.55 THEN 1 ELSE 0 END) as favorable_matchups,
  SUM(CASE WHEN am.winrate_a_vs_b < 0.45 THEN 1 ELSE 0 END) as unfavorable_matchups,
  ROUND(AVG(am.sample_size_confidence), 2) as avg_confidence
FROM ArchetypeMatchups am
WHERE am.games_played >= 10
GROUP BY am.archetype_a, am.format_id
ORDER BY avg_winrate_vs_field DESC;

CREATE VIEW pod_prediction_data AS
SELECT 
  pc.pod_size,
  pc.archetype_hash,
  pc.color_hash,
  pc.power_range,
  pc.games_played,
  pc.archetype_win_rates,
  pc.seat_win_rates,
  CASE 
    WHEN pc.games_played >= 20 THEN 'High Confidence'
    WHEN pc.games_played >= 10 THEN 'Medium Confidence'
    WHEN pc.games_played >= 5 THEN 'Low Confidence'
    ELSE 'Insufficient Data'
  END as prediction_confidence
FROM PodCompositions pc
ORDER BY pc.games_played DESC;

CREATE VIEW current_meta_landscape AS
SELECT 
  ms.format_id,
  d.deck_archetype,
  COUNT(*) as deck_count,
  ROUND(AVG(ms.meta_share), 4) as avg_meta_share,
  ROUND(AVG(ms.tier_ranking), 1) as avg_tier,
  ROUND(AVG(ms.meta_hostility), 2) as avg_hostility,
  ROUND(AVG(d.calculated_power_level), 2) as avg_power_level
FROM MetaSnapshots ms
JOIN Decks d ON ms.deck_id = d.deck_id
WHERE ms.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ms.format_id, d.deck_archetype
ORDER BY avg_meta_share DESC;

CREATE VIEW power_level_distribution AS
SELECT 
  plc.format_id,
  plc.power_level,
  plc.typical_winrate,
  COUNT(d.deck_id) as decks_at_level,
  ROUND(AVG(ds.winrate), 4) as actual_avg_winrate,
  plc.interaction_density,
  plc.combo_potential
FROM PowerLevelCalibration plc
LEFT JOIN Decks d ON ABS(d.calculated_power_level - plc.power_level) <= 0.25 
                   AND d.format_id = plc.format_id
LEFT JOIN DeckStats ds ON d.deck_id = ds.deck_id
GROUP BY plc.format_id, plc.power_level, plc.typical_winrate, 
         plc.interaction_density, plc.combo_potential
ORDER BY plc.format_id, plc.power_level;

-- =============================================================================
-- INDIVIDUAL GAME ACTION TRACKING (COMMENTED OUT - MAY BE USED LATER)
-- =============================================================================

-- -- Player vs Player Interactions in Multiplayer Context
-- CREATE TABLE PlayerInteractions (
--   game_id              BIGINT,
--   acting_player        BIGINT,                     -- player taking action
--   target_player        BIGINT,                     -- player being targeted
--   interaction_type     TEXT,                       -- damage / elimination / target / attack
--   turn_number          INT,                        -- when interaction occurred
--   damage_dealt         INT,                        -- if applicable
--   was_elimination      BOOLEAN DEFAULT FALSE,      -- if this interaction eliminated target
--   
--   FOREIGN KEY (game_id) REFERENCES Games(game_id),
--   FOREIGN KEY (acting_player) REFERENCES Users(user_id),
--   FOREIGN KEY (target_player) REFERENCES Users(user_id)
-- )

-- -- Indexes for PlayerInteractions
-- CREATE INDEX idx_player_interactions_type ON PlayerInteractions(interaction_type);
-- CREATE INDEX idx_player_interactions_turn ON PlayerInteractions(turn_number);