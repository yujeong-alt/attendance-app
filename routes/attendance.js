const express = require('express');
const router = express.Router();
const db = require('../database');

// 날짜별 출결 조회
router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: '날짜를 지정해주세요.' });
  }
  const records = db.prepare(`
    SELECT a.*, s.name, s.grade
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE a.date = ?
    ORDER BY s.grade, s.name
  `).all(date);
  res.json(records);
});

// 학생별 출결 조회
router.get('/student/:id', (req, res) => {
  const { id } = req.params;
  const records = db.prepare(`
    SELECT * FROM attendance
    WHERE student_id = ?
    ORDER BY date DESC
  `).all(id);

  const total = records.length;
  const present = records.filter(r => r.status === '출석').length;
  const absent = records.filter(r => r.status === '결석').length;

  res.json({ records, stats: { total, present, absent } });
});

// 출결 저장 (한 명씩)
router.post('/', (req, res) => {
  const { student_id, date, status, note } = req.body;
  const check_time = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  // 이미 기록이 있으면 업데이트, 없으면 새로 삽입
  const existing = db.prepare('SELECT id FROM attendance WHERE student_id = ? AND date = ?').get(student_id, date);

  if (existing) {
    db.prepare('UPDATE attendance SET status = ?, check_time = ?, note = ? WHERE id = ?')
      .run(status, check_time, note || '', existing.id);
  } else {
    db.prepare('INSERT INTO attendance (student_id, date, status, check_time, note) VALUES (?, ?, ?, ?, ?)')
      .run(student_id, date, status, check_time, note || '');
  }

  res.json({ message: '저장 완료', check_time });
});

module.exports = router;
