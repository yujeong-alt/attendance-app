// 페이지 로드
document.addEventListener('DOMContentLoaded', () => {
  // 날짜 기본값: 오늘
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filter-date').value = today;

  // 학생 드롭다운 로드
  loadStudentSelect();

  // 오늘 날짜 기록 자동 조회
  searchByDate();
});

async function loadStudentSelect() {
  const res = await fetch('/api/students');
  const students = await res.json();

  const select = document.getElementById('filter-student');
  students.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = `${s.name} (${s.grade})`;
    select.appendChild(option);
  });
}

// 날짜별 조회
async function searchByDate() {
  const date = document.getElementById('filter-date').value;
  if (!date) {
    alert('날짜를 선택해주세요.');
    return;
  }

  const res = await fetch(`/api/attendance?date=${date}`);
  const records = await res.json();

  const table = document.getElementById('date-table');
  const stats = document.getElementById('date-stats');
  const empty = document.getElementById('date-empty');
  const tbody = document.getElementById('date-list');

  if (records.length === 0) {
    table.style.display = 'none';
    stats.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';
  stats.style.display = 'flex';

  // 통계
  const total = records.length;
  const present = records.filter(r => r.status === '출석').length;
  const absent = records.filter(r => r.status === '결석').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-present').textContent = present;
  document.getElementById('stat-absent').textContent = absent;

  // 테이블
  tbody.innerHTML = records.map(r => `
    <tr>
      <td><span class="grade-badge">${r.grade}</span></td>
      <td><strong>${r.name}</strong></td>
      <td>
        <span style="
          display:inline-block;
          padding:4px 12px;
          border-radius:12px;
          font-weight:600;
          font-size:13px;
          color:white;
          background:${r.status === '출석' ? '#27ae60' : '#e74c3c'};">
          ${r.status}
        </span>
      </td>
      <td>${r.check_time}</td>
      <td>${r.note || '-'}</td>
    </tr>
  `).join('');
}

// 학생별 조회
async function searchByStudent() {
  const studentId = document.getElementById('filter-student').value;
  if (!studentId) {
    alert('학생을 선택해주세요.');
    return;
  }

  const res = await fetch(`/api/attendance/student/${studentId}`);
  const data = await res.json();

  const table = document.getElementById('student-table');
  const stats = document.getElementById('student-stats');
  const empty = document.getElementById('student-empty');
  const tbody = document.getElementById('student-list');

  if (data.records.length === 0) {
    table.style.display = 'none';
    stats.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';
  stats.style.display = 'flex';

  // 통계
  document.getElementById('s-stat-total').textContent = data.stats.total;
  document.getElementById('s-stat-present').textContent = data.stats.present;
  document.getElementById('s-stat-absent').textContent = data.stats.absent;

  // 테이블
  tbody.innerHTML = data.records.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>
        <span style="
          display:inline-block;
          padding:4px 12px;
          border-radius:12px;
          font-weight:600;
          font-size:13px;
          color:white;
          background:${r.status === '출석' ? '#27ae60' : '#e74c3c'};">
          ${r.status}
        </span>
      </td>
      <td>${r.check_time}</td>
      <td>${r.note || '-'}</td>
    </tr>
  `).join('');
}
