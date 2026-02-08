const express = require('express');
const router = express.Router();
const { db } = require('../database');

const DAYS_MAP = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };

// 학생 목록 조회
router.get('/', async (req, res) => {
  let targetDay = null;

  if (req.query.date) {
    const d = new Date(req.query.date + 'T00:00:00');
    targetDay = DAYS_MAP[d.getDay()];
  } else if (req.query.today === 'true') {
    targetDay = DAYS_MAP[new Date().getDay()];
  }

  const result = await db.execute('SELECT * FROM students ORDER BY grade, name');
  const students = result.rows;

  if (targetDay) {
    const filtered = students.filter(s => s.days.split(',').includes(targetDay));
    return res.json(filtered);
  }

  res.json(students);
});

// 학생 등록
router.post('/', async (req, res) => {
  const { name, grade, days } = req.body;
  if (!name || !grade || !days) {
    return res.status(400).json({ error: '이름, 학년, 등원 요일을 모두 입력해주세요.' });
  }
  const result = await db.execute(
    'INSERT INTO students (name, grade, days) VALUES (?, ?, ?)',
    [name, grade, days]
  );
  res.json({ id: Number(result.lastInsertRowid), name, grade, days });
});

// 학생 수정
router.put('/:id', async (req, res) => {
  const { name, grade, days } = req.body;
  const { id } = req.params;
  await db.execute(
    'UPDATE students SET name = ?, grade = ?, days = ? WHERE id = ?',
    [name, grade, days, id]
  );
  res.json({ id, name, grade, days });
});

// 학생 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.execute('DELETE FROM attendance WHERE student_id = ?', [id]);
  await db.execute('DELETE FROM students WHERE id = ?', [id]);
  res.json({ message: '삭제 완료' });
});

module.exports = router;
