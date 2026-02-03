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

-- Card Metadata for Analytics
CREATE TABLE Cards (
  card_id         TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  mana_cost      TEXT,           -- {2}{W}{U}
  cmc            INT,            -- converted mana cost
  type_line      TEXT,           -- Legendary Creature — Human Wizard
  color_identity TEXT,           -- WUBRG format
  colors         TEXT,           -- actual casting cost colors
  power          INT,
  toughness      INT,
  rarity         TEXT,
  keywords       TEXT[],         -- array of keyword abilities
  oracle_text    TEXT,
  image_uris     JSON
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