$(document).ready(function() {
    loadStudents();
    loadCourses();
    loadGrades();
    loadGradeFilters();

    // 學生科系篩選
    $('#deptFilter').change(function() {
        loadStudents();
    });
    $('#courseTeacherFilter').change(function() {
        loadCourses();
    });
});

function showSection(section) {
    // 1. 先隱藏所有內容區塊
    $('.content-section').hide();

    // 2. ★★★ 新增：如果是切換到「課程管理」，強制重置狀態 ★★★
    if (section === 'course') {
        // (A) 確保詳細名單被隱藏 (以防你原本卡在詳細頁面)
        $('#course-detail-section').hide();
        
        // (B) 清空搜尋框 & 重置老師選單
        $('#courseSearch').val('');
        $('#courseTeacherFilter').val(''); // 切換回 "全部老師"
        
        // (C) 重新載入完整的課程列表
        loadCourses();
    }

    // 3. 顯示目標區塊
    $('#' + section + '-section').show();
    $('.nav-bar button').removeClass('active');
    $('#nav-' + section).addClass('active');
}
// ==========================================
// --- 學生功能 ---
// ==========================================
function loadStudents() {
    $.post('api.php', {
        action: 'get_students',
        department: $('#deptFilter').val()
    }, function(data) {
        // ★ 這裡加了防護罩！如果 PHP 回傳錯誤，直接彈窗告知
        if (data.status === 'error') {
            alert("讀取失敗：\n" + data.message);
            return;
        }

        let html = '';
        data.forEach(s => {
            html += `<tr>
                <td>${s.student_id}</td>
                <td>${s.name}</td>
                <td>${s.grade_year}</td>
                <td>${s.department}</td>
                <td>
                    <button class="btn-link" onclick="editStudent('${s.student_id}', '${s.name}', '${s.grade_year}', '${s.department}')">編輯</button> | 
                    <button class="btn-link" onclick="deleteStudent('${s.student_id}')">刪除</button>
                </td>
            </tr>`;
        });
        $('#studentTableBody').html(html);
    }, 'json');
}

function openStudentModal() {
    let form = `
        <div class="form-group"><label>學號</label><input type="text" id="addSid"></div>
        <div class="form-group"><label>姓名</label><input type="text" id="addName"></div>
        <div class="form-group"><label>年級</label><input type="text" id="addGrade"></div>
        <div class="form-group"><label>科系</label>
            <select id="addDept">
                <option value="資訊工程學系">資訊工程學系</option>
                <option value="電機工程學系">電機工程學系</option>
                <option value="工業工程與管理學系">工業工程與管理學系</option>
                <option value="應用數學系">應用數學系</option>
                <option value="統計學系">統計學系</option>
            </select>
        </div>
        <button class="btn-blue" onclick="submitStudent()">新增</button>
    `;
    $('#modalTitle').text('新增學生');
    $('#modalContent').html(form);
    $('#modalOverlay').show();
}

function submitStudent() {
    $.post('api.php', {
        action: 'add_student',
        sid: $('#addSid').val(),
        name: $('#addName').val(),
        grade: $('#addGrade').val(),
        dept: $('#addDept').val()
    }, function(res) {
        if(res.status === 'error') {
            alert("新增失敗：" + res.message);
        } else {
            closeModal();
            loadStudents();
        }
    }, 'json');
}

// ★補上缺失的刪除學生功能
function deleteStudent(sid) {
    if(!confirm('確定刪除此學生？(該學生的成績也會一併刪除)')) return;
    $.post('api.php', { action: 'delete_student', sid: sid }, function(res) {
        loadStudents();
        // 如果成績列表有開啟，順便更新一下，因為成績也會被刪掉
        loadGrades(); 
    }, 'json');
}


function editStudent(sid, name, grade, dept) {
    // 產生跟截圖一樣的 HTML
    let form = `
        <div class="form-group">
            <label style="font-weight:bold;">學號：${sid}</label>
            <input type="hidden" id="editSid" value="${sid}">
        </div>
        
        <div class="form-group">
            <label>姓名：</label>
            <input type="text" id="editName" value="${name}" class="form-control">
        </div>
        
        <div class="form-group">
            <label>年級：</label>
            <input type="text" id="editGrade" value="${grade}" class="form-control">
        </div>
        
        <div class="form-group">
            <label>科系：</label>
            <select id="editDept" class="form-control">
                <option value="資訊工程學系" ${dept === '資訊工程學系' ? 'selected' : ''}>資訊工程學系</option>
                <option value="電機工程學系" ${dept === '電機工程學系' ? 'selected' : ''}>電機工程學系</option>
                <option value="工業工程與管理學系" ${dept === '工業工程與管理學系' ? 'selected' : ''}>工業工程與管理學系</option>
                <option value="應用數學系" ${dept === '應用數學系' ? 'selected' : ''}>應用數學系</option>
                <option value="統計學系" ${dept === '統計學系' ? 'selected' : ''}>統計學系</option>
            </select>
        </div>
        
        <div style="margin-top: 20px;">
            <button class="btn-blue" onclick="submitEditStudent()">更新學生資料</button>
            <button class="btn-grey" onclick="closeModal()" style="background:#6c757d; color:white; border:none; padding:5px 10px; cursor:pointer;">返回學生列表</button>
        </div>
    `;
    
    $('#modalTitle').text('編輯學生資料'); // 設定標題
    $('#modalContent').html(form);
    $('#modalOverlay').show();
}
function submitEditStudent() {
    $.post('api.php', {
        action: 'update_student',
        sid: $('#editSid').val(),
        name: $('#editName').val(),
        grade: $('#editGrade').val(),
        dept: $('#editDept').val()
    }, function(res) {
        if(res.status === 'error') {
            alert("更新失敗：" + res.message);
        } else {
            alert("更新成功！");
            closeModal();
            loadStudents(); // 重新整理列表
        }
    }, 'json');
}

// ==========================================
// --- 課程功能 ---
// ==========================================
// ==========================================
// --- 課程功能 (更新版) ---
// ==========================================

// ==========================================
// --- 課程功能 (更新版) ---
// ==========================================

// ==========================================
// --- 課程功能 (包含編輯與刪除) ---
// ==========================================

function loadCourses() {
    $.post('api.php', {
        action: 'get_courses',
        search: $('#courseSearch').val(),
        teacher: $('#courseTeacherFilter').val()
    }, function(data) {
        if(data.status === 'error') { alert(data.message); return; }
        let html = '';
        data.forEach(c => {
            let avg = c.avg_score ? parseFloat(c.avg_score).toFixed(1) : '-';
            
            // ★修改重點：編輯按鈕現在會呼叫 editCourse，並把資料傳進去
            html += `<tr>
                <td>${c.course_code}</td>
                <td>${c.course_name}</td>
                <td>${c.credits}</td>
                <td>${c.teacher}</td>
                <td><button class="count-link" onclick="showCourseStudents('${c.course_code}', '${c.course_name}', '${c.teacher}')">${c.enrolled_count}</button></td>
                <td>${avg}</td>
                <td>
                    <button class="btn-link" onclick="editCourse('${c.course_code}', '${c.course_name}', '${c.credits}', '${c.teacher}')">編輯</button> | 
                    <button class="btn-link" onclick="deleteCourse('${c.course_code}')">刪除</button>
                </td>
            </tr>`;
        });
        $('#courseTableBody').html(html);
    }, 'json');
}

// ★★★ 新增：編輯課程視窗 (仿照編輯學生介面) ★★★
function editCourse(cid, cname, credits, teacher) {
    let form = `
        <div class="form-group">
            <label style="font-weight:bold;">課程代號：${cid}</label>
            <input type="hidden" id="editCid" value="${cid}">
        </div>
        
        <div class="form-group">
            <label>課程名稱：</label>
            <input type="text" id="editCname" value="${cname}" class="form-control">
        </div>
        
        <div class="form-group">
            <label>學分數：</label>
            <input type="number" id="editCredits" value="${credits}" class="form-control">
        </div>
        
        <div class="form-group">
            <label>授課老師：</label>
            <input type="text" id="editTeacher" value="${teacher}" class="form-control" placeholder="請輸入老師姓名">
        </div>
        
        <div style="margin-top: 20px;">
            <button class="btn-blue" onclick="submitEditCourse()">更新課程資料</button>
            <button class="btn-grey" onclick="closeModal()" style="background:#6c757d; color:white; border:none; padding:5px 10px; cursor:pointer;">返回課程列表</button>
        </div>
    `;
    
    $('#modalTitle').text('編輯課程資料');
    $('#modalContent').html(form);
    $('#modalOverlay').show();
}

// ★★★ 新增：送出課程修改 ★★★
function submitEditCourse() {
    $.post('api.php', {
        action: 'update_course',
        cid: $('#editCid').val(),
        cname: $('#editCname').val(),
        credits: $('#editCredits').val(),
        teacher: $('#editTeacher').val()
    }, function(res) {
        if(res.status === 'error') {
            alert("更新失敗：" + res.message);
        } else {
            alert("更新成功！");
            closeModal();
            loadCourses(); // 重整列表
        }
    }, 'json');
}

// 刪除課程功能 (你原本就有，這裡保留著以免誤刪)
function deleteCourse(cid) {
    if(!confirm('確定刪除此課程？\n注意：若有學生選修此課程，將無法刪除！')) return;
    $.post('api.php', { action: 'delete_course', cid: cid }, function(res) {
        if(res.status === 'error') {
            alert(res.message); // 這裡會顯示 "此課程有學生選修，無法刪除" (圖 1-12)
        } else {
            alert("刪除成功！");
            loadCourses();
        }
    }, 'json');
}

// ★★★ 全新功能：顯示修課學生詳情 (切換畫面) ★★★
function showCourseStudents(cid, cname, teacher) {
    // 1. 設定標題
    $('#detailCourseTitle').text(`「${cname}」修課學生`);
    $('#detailTeacherName').text(`授課老師：${teacher}`);

    // 2. 清空並載入中...
    $('#detailTableBody').html('<tr><td colspan="3">載入中...</td></tr>');

    // 3. 切換顯示區塊 (隱藏課程列表，顯示詳細名單)
    $('#course-section').hide();
    $('#course-detail-section').show();

    // 4. 跟後端要資料
    $.post('api.php', { action: 'get_course_students', cid: cid }, function(data) {
        let html = '';
        if (data.length === 0) {
            html = '<tr><td colspan="3" style="text-align:center;">目前沒有學生選修此課程</td></tr>';
        } else {
            data.forEach(s => {
                html += `<tr>
                    <td>${s.student_id}</td>
                    <td>${s.name}</td>
                    <td>${s.score}</td>
                </tr>`;
            });
        }
        $('#detailTableBody').html(html);
    }, 'json');
}

// ★★★ 返回課程列表按鈕的功能 ★★★
function backToCourseList() {
    $('#course-detail-section').hide(); // 隱藏詳細頁
    $('#course-section').show();        // 顯示列表頁
}
// ★補上缺失的新增課程視窗
function openCourseModal() {
    let form = `
        <div class="form-group"><label>課程代號</label><input type="text" id="addCid"></div>
        <div class="form-group"><label>課程名稱</label><input type="text" id="addCname"></div>
        <div class="form-group"><label>學分數</label><input type="number" id="addCredits"></div>
        <div class="form-group"><label>授課老師</label><input type="text" id="addTeacher" placeholder="請輸入老師姓名"></div>
        <button class="btn-blue" onclick="submitCourse()">新增</button>
    `;
    $('#modalTitle').text('新增課程');
    $('#modalContent').html(form);
    $('#modalOverlay').show();
}

function submitCourse() {
    $.post('api.php', {
        action: 'add_course',
        cid: $('#addCid').val(),
        cname: $('#addCname').val(),
        credits: $('#addCredits').val(),
        teacher: $('#addTeacher').val()
    }, function(res) {
        if(res.status === 'error') alert(res.message);
        else { closeModal(); loadCourses(); }
    }, 'json');
}

// ==========================================
// --- 成績功能 ---
// ==========================================
function loadGradeFilters() {
    $.post('api.php', { action: 'get_courses' }, function(courses) {
        const teachers = [...new Set(courses.map(course => course.teacher).filter(Boolean))];
        const teacherOptions = ['<option value="">全部老師</option>']
            .concat(teachers.map(teacher => `<option value="${teacher}">${teacher}</option>`));
        const courseOptions = ['<option value="">全部課程</option>']
            .concat(courses.map(course => `<option value="${course.course_name}">${course.course_name}</option>`));

        $('#gradeTeacherFilter').html(teacherOptions.join(''));
        $('#gradeCourseFilter').html(courseOptions.join(''));
    }, 'json');
}

function loadGrades() {
    $.post('api.php', {
        action: 'get_grades',
        sname: $('#gradeSName').val(),
        teacher: $('#gradeTeacherFilter').val(),
        cname: $('#gradeCourseFilter').val()
    }, function(data) {
        if(data.status === 'error') { alert(data.message); return; }
        let html = '';
        data.forEach(g => {
            // ★修正重點：這裡的 g.id (例如 S001_C001) 是字串，必須加單引號 '${g.id}'
            html += `<tr>
                <td>${g.student_id}</td>
                <td>${g.sname}</td>
                <td>${g.course_code}</td>
                <td>${g.course_name}</td>
                <td>${g.teacher}</td>
                <td>${g.score}</td>
                <td>
                    <button class="btn-link" onclick="editGrade('${g.id}', ${g.score})">編輯</button> | 
                    <button class="btn-link" onclick="deleteGrade('${g.id}')">刪除</button>
                </td>
            </tr>`;
        });
        $('#gradeTableBody').html(html);
    }, 'json');
}

// ★補上缺失的新增成績視窗
// ★★★ 修改版：新增成績視窗 (改用下拉選單) ★★★
function openGradeModal() {
    // 1. 先取得學生列表
    $.post('api.php', { action: 'get_students' }, function(students) {
        
        // 2. 再取得課程列表
        $.post('api.php', { action: 'get_courses' }, function(courses) {
            
            // 3. 製作學生下拉選單選項
            let studentOptions = '<option value="">請選擇學生</option>';
            students.forEach(s => {
                studentOptions += `<option value="${s.student_id}">${s.student_id} ${s.name}</option>`;
            });

            // 4. 製作課程下拉選單選項
            let courseOptions = '<option value="">請選擇課程</option>';
            courses.forEach(c => {
                courseOptions += `<option value="${c.course_code}">${c.course_code} ${c.course_name}</option>`;
            });

            // 5. 組合 HTML 表單
            let form = `
                <div class="form-group">
                    <label>學生：</label>
                    <select id="addGSid" class="form-control">
                        ${studentOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>課程：</label>
                    <select id="addGCid" class="form-control">
                        ${courseOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>成績：</label>
                    <input type="number" id="addGScore" class="form-control" placeholder="請輸入成績">
                </div>
                
            `;
            
            $('#modalTitle').text('新增選修課程成績');
            $('#modalContent').html(form);
                $('#modalActions').html('<button class="btn-primary" onclick="submitGrade()">新增成績</button><button class="btn-quiet" onclick="closeModal()">關閉</button>');
            $('#modalOverlay').show();

        }, 'json'); // 這是 get_courses 的結尾
    }, 'json'); // 這是 get_students 的結尾
}

function submitGrade() {
    $.post('api.php', {
        action: 'add_grade',
        sid: $('#addGSid').val(),
        cid: $('#addGCid').val(),
        score: $('#addGScore').val()
    }, function(res) {
        if(res.status === 'error') alert(res.message);
        else { closeModal(); loadGrades(); }
    }, 'json');
}

function editGrade(id, oldScore) {
    let score = prompt("請輸入新成績", oldScore);
    if(score !== null) {
        $.post('api.php', { action: 'update_grade', id: id, score: score }, function(res) {
            if(res.status === 'error') alert("錯誤：" + res.message);
            else loadGrades();
        }, 'json');
    }
}

function deleteGrade(id) {
    if(!confirm('確定刪除此成績？')) return;
    $.post('api.php', { action: 'delete_grade', id: id }, function(res) {
        if(res.status === 'error') alert("錯誤：" + res.message);
        else loadGrades();
    }, 'json');
}

function closeModal() {
    $('#modalOverlay').hide();
    $('#modalActions').html('<button class="btn-quiet" onclick="closeModal()">關閉</button>');
}