CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT '../../assets/profile_pictures/rael.png',
    bio TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_code TEXT DEFAULT '',
    two_factor_code_expiration TIMESTAMP,
    library TEXT DEFAULT '[]',
    attempting_friend_ids TEXT DEFAULT '[]',
    friends TEXT DEFAULT '[]',
    friend_requests TEXT DEFAULT '[]',
    blocked_users TEXT DEFAULT '[]',
    is_google_account BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author INTEGER NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS games 
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    user_ids TEXT DEFAULT '[]',
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS news
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_user_rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    win INTEGER NOT NULL,
    loss INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    user1_lives INTEGER NOT NULL,
    user2_lives INTEGER NOT NULL,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users (id),
    FOREIGN KEY (user2_id) REFERENCES users (id),
    FOREIGN KEY (game_id) REFERENCES games (id)
);


DROP TABLE IF EXISTS game_player;
CREATE TABLE IF NOT EXISTS game_player (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id      INTEGER NOT NULL,
    mode         INTEGER NOT NULL DEFAULT 0,
    players_ids  TEXT    NOT NULL DEFAULT '[]',
    UNIQUE(game_id, mode)
);