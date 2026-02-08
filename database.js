const path = require('path');
const fs = require('fs');

let db;

if (process.env.TURSO_URL) {
  // Render 환경: Turso 클라우드 DB 사용
  const { createClient } = require('@libsql/client/http');
  const turso = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  // better-sqlite3와 같은 인터페이스로 감싸기
  db = {
    execute: (sql, args) => turso.execute(args ? { sql, args } : sql),
    run: (sql, args) => turso.execute(args ? { sql, args } : sql),
  };
} else {
  // 로컬 환경: better-sqlite3 사용
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  const sqlite = new Database(path.join(dataDir, 'attendance.db'));
  sqlite.pragma('journal_mode = WAL');

  // Turso와 같은 인터페이스로 감싸기
  db = {
    execute: (sql, args) => {
      const stmt = sqlite.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return Promise.resolve({ rows: args ? stmt.all(...args) : stmt.all() });
      }
      const result = args ? stmt.run(...args) : stmt.run();
      return Promise.resolve({ rows: [], lastInsertRowid: result.lastInsertRowid });
    },
    run: (sql, args) => {
      const stmt = sqlite.prepare(sql);
      const result = args ? stmt.run(...args) : stmt.run();
      return Promise.resolve(result);
    },
  };
}

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      days TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      check_time TEXT NOT NULL,
      note TEXT DEFAULT '',
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);
}

module.exports = { db, initDB };
