const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// data 폴더가 없으면 자동 생성
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'attendance.db'));

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    days TEXT NOT NULL
  )
`);

db.exec(`
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

module.exports = db;
