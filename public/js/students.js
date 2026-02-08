// 페이지 로드
document.addEventListener('DOMContentLoaded', loadStudents);

async function loadStudents() {
  const res = await fetch('/api/students');
  const students = await res.json();

  const tbody = document.getElementById('student-list');
  const emptyMsg = document.getElementById('empty-msg');

  if (students.length === 0) {
    tbody.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  tbody.innerHTML = students.map(s => `
    <tr>
      <td><span class="grade-badge">${s.grade}</span></td>
      <td>${s.name}</td>
      <td>${s.days}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEdit(${s.id}, '${s.name}', '${s.grade}', '${s.days}')">수정</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id}, '${s.name}')">삭제</button>
      </td>
    </tr>
  `).join('');
}

// 학생 등록
async function addStudent() {
  const name = document.getElementById('input-name').value.trim();
  const grade = document.getElementById('input-grade').value;
  const checkboxes = document.querySelectorAll('#input-days input[type=checkbox]:checked');
  const days = Array.from(checkboxes).map(cb => cb.value).join(',');

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (!days) {
    alert('등원 요일을 선택해주세요.');
    return;
  }

  await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, grade, days })
  });

  // 입력값 초기화
  document.getElementById('input-name').value = '';
  document.querySelectorAll('#input-days input[type=checkbox]').forEach(cb => cb.checked = false);

  loadStudents();
}

// 학생 삭제
async function deleteStudent(id, name) {
  if (!confirm(`"${name}" 학생을 삭제하시겠습니까?\n출결 기록도 함께 삭제됩니다.`)) return;

  await fetch(`/api/students/${id}`, { method: 'DELETE' });
  loadStudents();
}

// 수정 모달 열기
function openEdit(id, name, grade, days) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = name;
  document.getElementById('edit-grade').value = grade;

  const daysArr = days.split(',');
  document.querySelectorAll('#edit-days input[type=checkbox]').forEach(cb => {
    cb.checked = daysArr.includes(cb.value);
  });

  document.getElementById('edit-modal').classList.add('show');
}

// 모달 닫기
function closeModal() {
  document.getElementById('edit-modal').classList.remove('show');
}

// 수정 저장
async function saveEdit() {
  const id = document.getElementById('edit-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const grade = document.getElementById('edit-grade').value;
  const checkboxes = document.querySelectorAll('#edit-days input[type=checkbox]:checked');
  const days = Array.from(checkboxes).map(cb => cb.value).join(',');

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (!days) {
    alert('등원 요일을 선택해주세요.');
    return;
  }

  await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, grade, days })
  });

  closeModal();
  loadStudents();
}
