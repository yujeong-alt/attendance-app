const express = require('express');
const router = express.Router();
const db = require('../database');

const DAYS_MAP = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };

// 학생 목록 조회
// ?date=YYYY-MM-DD → 해당 날짜 요일에 등원하는 학생만
// ?today=true → 오늘 요일에 등원하는 학생만
// 파라미터 없음 → 전체 목록
router.get('/', (req, res) => {
  let targetDay = null;

  if (req.query.date) {
    const d = new Date(req.query.date + 'T00:00:00');
    targetDay = DAYS_MAP[d.getDay()];
  } else if (req.query.today === 'true') {
    targetDay = DAYS_MAP[new Date().getDay()];
  }

  const students = db.prepare('SELECT * FROM students ORDER BY grade, name').all();

  if (targetDay) {
    const filtered = students.filter(s => s.days.split(',').includes(targetDay));
    return res.json(filtered);
  }

  res.json(students);
});

// 학생 등록
router.post('/', (req, res) => {
  const { name, grade, days } = req.body;
  if (!name || !grade || !days) {
    return res.status(400).json({ error: '이름, 학년, 등원 요일을 모두 입력해주세요.' });
  }
  const result = db.prepare('INSERT INTO students (name, grade, days) VALUES (?, ?, ?)').run(name, grade, days);
  res.json({ id: result.lastInsertRowid, name, grade, days });
});

// 학생 수정
router.put('/:id', (req, res) => {
  const { name, grade, days } = req.body;
  const { id } = req.params;
  db.prepare('UPDATE students SET name = ?, grade = ?, days = ? WHERE id = ?').run(name, grade, days, id);
  res.json({ id, name, grade, days });
});

// 학생 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM attendance WHERE student_id = ?').run(id);
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  res.json({ message: '삭제 완료' });
});

module.exports = router;
