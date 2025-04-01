CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT '../../assets/profile_pictures/rael.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library INTEGER[] DEFAULT '{}'
);
