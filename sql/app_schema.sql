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
  deck_name             TEXT NOT NULL,

  -- Commander-specific but harmless elsewhere
  color_identity   CHAR(5),      -- e.g. 'WUBRG', nullable
  is_singleton     BOOLEAN,

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