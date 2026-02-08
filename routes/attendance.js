const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 날짜별 출결 조회
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: '날짜를 지정해주세요.' });
  }
  const result = await db.execute(
    `SELECT a.*, s.name, s.grade
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     WHERE a.date = ?
     ORDER BY s.grade, s.name`,
    [date]
  );
  res.json(result.rows);
});

// 학생별 출결 조회
router.get('/student/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.execute(
    'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC',
    [id]
  );

  const records = result.rows;
  const total = records.length;
  const present = records.filter(r => r.status === '출석').length;
  const absent = records.filter(r => r.status === '결석').length;

  res.json({ records, stats: { total, present, absent } });
});

// 출결 저장
router.post('/', async (req, res) => {
  const { student_id, date, status, note } = req.body;
  const check_time = new Date().toTimeString().split(' ')[0];

  const existing = await db.execute(
    'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
    [student_id, date]
  );

  if (existing.rows.length > 0) {
    await db.execute(
      'UPDATE attendance SET status = ?, check_time = ?, note = ? WHERE id = ?',
      [status, check_time, note || '', existing.rows[0].id]
    );
  } else {
    await db.execute(
      'INSERT INTO attendance (student_id, date, status, check_time, note) VALUES (?, ?, ?, ?, ?)',
      [student_id, date, status, check_time, note || '']
    );
  }

  res.json({ message: '저장 완료', check_time });
});

module.exports = router;
