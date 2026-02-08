const express = require('express');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 라우트
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));

// DB 초기화 후 서버 시작
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
});
