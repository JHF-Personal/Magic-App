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
  power_level      SMALLINT,         -- 1-10 rating
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

  seat_number    INT NOT NULL,
  result         TEXT NOT NULL,   -- win / loss / draw / rank

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

-- Matchup Tracking for Advanced Analytics
CREATE TABLE GameMatchups (
  game_id              BIGINT,
  player_user_id       BIGINT,
  opponent_user_id     BIGINT,
  player_deck_id       BIGINT,
  opponent_deck_id     BIGINT,
  player_colors        CHAR(5),
  opponent_colors      CHAR(5),
  player_commander_cmc INT,
  opponent_commander_cmc INT,
  result               TEXT,              -- win/loss/draw
  
  PRIMARY KEY (game_id, player_user_id, opponent_user_id),
  FOREIGN KEY (game_id) REFERENCES Games(game_id),
  FOREIGN KEY (player_user_id) REFERENCES Users(user_id),
  FOREIGN KEY (opponent_user_id) REFERENCES Users(user_id),
  FOREIGN KEY (player_deck_id) REFERENCES Decks(deck_id),
  FOREIGN KEY (opponent_deck_id) REFERENCES Decks(deck_id)
)

-- Pre-computed Deck Performance Statistics
CREATE TABLE DeckStats (
  deck_id              BIGINT PRIMARY KEY,
  games_played         INT DEFAULT 0,
  wins                 INT DEFAULT 0,
  losses               INT DEFAULT 0,
  draws                INT DEFAULT 0,
  winrate             DECIMAL(5,4),       -- 0.0000 to 1.0000
  
  -- vs Color matchups
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
CREATE INDEX idx_game_players_result ON GamePlayers(result);
CREATE INDEX idx_matchups_colors ON GameMatchups(player_colors, opponent_colors);
CREATE INDEX idx_matchups_cmc ON GameMatchups(player_commander_cmc, opponent_commander_cmc);
CREATE INDEX idx_cards_cmc ON Cards(cmc);
CREATE INDEX idx_cards_colors ON Cards(color_identity);
CREATE INDEX idx_deckstats_winrate ON DeckStats(winrate);

-- Analytics Views
CREATE VIEW deck_color_matchup_stats AS
SELECT 
  d.deck_id,
  d.deck_name,
  d.color_identity as deck_colors,
  m.opponent_colors,
  COUNT(*) as games_played,
  SUM(CASE WHEN m.result = 'win' THEN 1 ELSE 0 END) as wins,
  ROUND(AVG(CASE WHEN m.result = 'win' THEN 1.0 ELSE 0.0 END), 4) as winrate
FROM Decks d
JOIN GameMatchups m ON d.deck_id = m.player_deck_id
GROUP BY d.deck_id, d.deck_name, d.color_identity, m.opponent_colors;

CREATE VIEW commander_cmc_performance AS
SELECT 
  d.commander_cmc,
  COUNT(DISTINCT d.deck_id) as deck_count,
  COUNT(*) as total_games,
  AVG(CASE WHEN gp.result = 'win' THEN 1.0 ELSE 0.0 END) as avg_winrate
FROM Decks d
JOIN GamePlayers gp ON d.deck_id = gp.deck_id
WHERE d.commander_cmc IS NOT NULL
GROUP BY d.commander_cmc
ORDER BY d.commander_cmc;

CREATE VIEW deck_performance_summary AS
SELECT 
  d.deck_id,
  d.deck_name,
  d.color_identity,
  d.commander_cmc,
  d.deck_archetype,
  ds.games_played,
  ds.winrate,
  ds.vs_white_games,
  CASE WHEN ds.vs_white_games > 0 THEN ROUND(ds.vs_white_wins::DECIMAL / ds.vs_white_games, 4) ELSE NULL END as vs_white_winrate,
  ds.vs_blue_games,
  CASE WHEN ds.vs_blue_games > 0 THEN ROUND(ds.vs_blue_wins::DECIMAL / ds.vs_blue_games, 4) ELSE NULL END as vs_blue_winrate,
  ds.vs_black_games,
  CASE WHEN ds.vs_black_games > 0 THEN ROUND(ds.vs_black_wins::DECIMAL / ds.vs_black_games, 4) ELSE NULL END as vs_black_winrate,
  ds.vs_red_games,
  CASE WHEN ds.vs_red_games > 0 THEN ROUND(ds.vs_red_wins::DECIMAL / ds.vs_red_games, 4) ELSE NULL END as vs_red_winrate,
  ds.vs_green_games,
  CASE WHEN ds.vs_green_games > 0 THEN ROUND(ds.vs_green_wins::DECIMAL / ds.vs_green_games, 4) ELSE NULL END as vs_green_winrate
FROM Decks d
LEFT JOIN DeckStats ds ON d.deck_id = ds.deck_id;