import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'livetrack.db')
let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('lecturer','student')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS lectures (
      id TEXT PRIMARY KEY,
      join_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '새 강의',
      status TEXT NOT NULL DEFAULT 'preparing' CHECK(status IN ('preparing','live','ended')),
      total_slides INTEGER NOT NULL DEFAULT 0,
      current_slide INTEGER NOT NULL DEFAULT 1,
      current_chapter_id TEXT NOT NULL DEFAULT '',
      current_slide_image TEXT,
      started_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      lecture_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slide_start INTEGER NOT NULL,
      slide_end INTEGER NOT NULL,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','completed')),
      order_idx INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      lecture_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL DEFAULT '',
      student_name TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      answered INTEGER NOT NULL DEFAULT 0,
      answer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `)
  // lecture_slides: stores all rendered slide images per lecture
  db.exec(`
    CREATE TABLE IF NOT EXISTS lecture_slides (
      lecture_id TEXT NOT NULL,
      slide_index INTEGER NOT NULL,
      image TEXT NOT NULL,
      ratio REAL NOT NULL DEFAULT 1.7778,
      PRIMARY KEY (lecture_id, slide_index),
      FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
    );
  `)
  // Migrations
  try { db.exec('ALTER TABLE lectures ADD COLUMN current_strokes TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE lectures ADD COLUMN ended_at TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE lectures ADD COLUMN peak_students INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE lectures ADD COLUMN screen_sharing INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lectures_code ON lectures(join_code);
    CREATE INDEX IF NOT EXISTS idx_lectures_creator ON lectures(created_by);
    CREATE INDEX IF NOT EXISTS idx_chapters_lecture ON chapters(lecture_id);
    CREATE INDEX IF NOT EXISTS idx_questions_lecture ON questions(lecture_id);
  `)
}
