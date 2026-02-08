const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getSelectedDate() {
  return document.getElementById('select-date').value;
}

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return DAYS[d.getDay()];
}

// 현재 목록에 표시된 학생 배열
let displayedStudents = [];
// 전체 학생 (임시 추가 드롭다운용)
let allStudents = [];

// 페이지 로드
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('select-date').value = getToday();
  loadStudents();
});

async function loadStudents() {
  const date = getSelectedDate();
  if (!date) return;

  const dayName = getDayName(date);
  document.getElementById('card-title').textContent = `${date} (${dayName}) 등원 학생`;

  // 해당 날짜 요일의 정규 학생
  const schedRes = await fetch(`/api/students?date=${date}`);
  const scheduledStudents = await schedRes.json();

  // 해당 날짜에 이미 저장된 출결 기록 (임시 등원 포함)
  const attRes = await fetch(`/api/attendance?date=${date}`);
  const records = await attRes.json();

  // 전체 학생 목록
  const allRes = await fetch('/api/students');
  allStudents = await allRes.json();

  // 정규 학생 id 세트
  const scheduledIds = new Set(scheduledStudents.map(s => s.id));

  // 기록이 있지만 정규가 아닌 학생 = 임시 등원한 학생
  const tempStudentIds = records
    .filter(r => !scheduledIds.has(r.student_id))
    .map(r => r.student_id);

  const tempStudents = allStudents.filter(s => tempStudentIds.includes(s.id));

  // 표시할 학생 = 정규 + 임시
  displayedStudents = [...scheduledStudents, ...tempStudents];

  // 기록 매핑
  const recordMap = {};
  records.forEach(r => { recordMap[r.student_id] = r; });

  renderTable(recordMap);
  renderTempDropdown();
}

function renderTable(recordMap) {
  const tbody = document.getElementById('student-list');
  const emptyMsg = document.getElementById('empty-msg');
  const saveAllArea = document.getElementById('save-all-area');

  if (displayedStudents.length === 0) {
    tbody.innerHTML = '';
    emptyMsg.style.display = 'block';
    saveAllArea.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  saveAllArea.style.display = 'block';

  tbody.innerHTML = displayedStudents.map(s => {
    const record = recordMap[s.id];
    const presentSel = record && record.status === '출석' ? 'selected' : '';
    const absentSel = record && record.status === '결석' ? 'selected' : '';
    const note = record ? record.note : '';
    const saved = record ? true : false;
    const isTemp = !s._isScheduled && record && !presentSel && !absentSel ? false : true;

    return `
      <tr id="row-${s.id}">
        <td><span class="grade-badge">${s.grade}</span></td>
        <td><strong>${s.name}</strong></td>
        <td>
          <div class="status-btns">
            <button class="btn-present ${presentSel}" onclick="setStatus(${s.id}, this)">출석</button>
            <button class="btn-absent ${absentSel}" onclick="setStatus(${s.id}, this)">결석</button>
          </div>
        </td>
        <td><input class="note-input" id="note-${s.id}" value="${note}" placeholder="특이사항 입력"></td>
        <td>
          <span class="save-check" id="check-${s.id}" style="color:#27ae60; font-weight:600; font-size:18px;">
            ${saved ? '&#10003;' : ''}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// 임시 등원 드롭다운 갱신
function renderTempDropdown() {
  const select = document.getElementById('temp-student-select');
  const displayedIds = new Set(displayedStudents.map(s => s.id));
  const available = allStudents.filter(s => !displayedIds.has(s.id));

  select.innerHTML = '<option value="">+ 임시 등원 추가</option>';
  available.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.name} (${s.grade})</option>`;
  });
}

// 임시 학생 추가
function addTempStudent() {
  const select = document.getElementById('temp-student-select');
  const studentId = Number(select.value);
  if (!studentId) return;

  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  // 이미 있는지 확인
  if (displayedStudents.some(s => s.id === studentId)) return;

  displayedStudents.push(student);

  // 테이블에 행 추가
  const tbody = document.getElementById('student-list');
  document.getElementById('empty-msg').style.display = 'none';
  document.getElementById('save-all-area').style.display = 'block';

  tbody.innerHTML += `
    <tr id="row-${student.id}">
      <td><span class="grade-badge">${student.grade}</span></td>
      <td><strong>${student.name}</strong></td>
      <td>
        <div class="status-btns">
          <button class="btn-present" onclick="setStatus(${student.id}, this)">출석</button>
          <button class="btn-absent" onclick="setStatus(${student.id}, this)">결석</button>
        </div>
      </td>
      <td><input class="note-input" id="note-${student.id}" value="" placeholder="특이사항 입력"></td>
      <td>
        <span class="save-check" id="check-${student.id}" style="color:#27ae60; font-weight:600; font-size:18px;"></span>
      </td>
    </tr>
  `;

  // 드롭다운 갱신
  renderTempDropdown();
}

// 출석/결석 버튼 토글
function setStatus(studentId, btn) {
  const row = document.getElementById(`row-${studentId}`);
  const btns = row.querySelectorAll('.status-btns button');
  btns.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// 전체 저장
async function saveAll() {
  const date = getSelectedDate();
  let savedCount = 0;
  let skippedCount = 0;

  for (const s of displayedStudents) {
    const row = document.getElementById(`row-${s.id}`);
    const selectedBtn = row.querySelector('.status-btns .selected');

    if (!selectedBtn) {
      skippedCount++;
      continue;
    }

    const status = selectedBtn.textContent;
    const note = document.getElementById(`note-${s.id}`).value;

    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: s.id, date, status, note })
    });

    document.getElementById(`check-${s.id}`).innerHTML = '&#10003;';
    savedCount++;
  }

  const msgAll = document.getElementById('msg-all');

  if (skippedCount > 0) {
    msgAll.textContent = `${savedCount}명 저장 (${skippedCount}명 미선택)`;
  } else {
    msgAll.textContent = '전체 저장 완료!';
  }

  msgAll.classList.add('show');
  setTimeout(() => msgAll.classList.remove('show'), 3000);
}
