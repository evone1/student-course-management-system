<?php
require 'db.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

try {
    switch ($action) {
        // ==========================================
        // --- 學生管理 (Student) ---
        // ==========================================
        case 'get_students':
            $dept = $_POST['department'] ?? '';
            // 技巧：用 AS 把中文欄位取別名成英文，讓前端 script.js 讀得懂
            $sql = "SELECT s.學號 as student_id, s.姓名 as name, s.年級 as grade_year, d.科系名稱 as department 
                    FROM Student s
                    LEFT JOIN Department d ON s.科系代碼 = d.科系代碼";
            if ($dept) {
                // 前端傳來的是"資訊工程學系"，我們比對科系名稱
                $sql .= " WHERE d.科系名稱 = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$dept]);
            } else {
                $stmt = $pdo->query($sql);
            }
            echo json_encode($stmt->fetchAll());
            break;
        case 'add_student':
            // 1. 先查出科系代碼 (例如傳入 "資訊工程學系" -> 查出 "D001")
            $stmt = $pdo->prepare("SELECT 科系代碼 FROM Department WHERE 科系名稱 = ?");
            $stmt->execute([$_POST['dept']]);
            $deptCode = $stmt->fetchColumn();
            if (!$deptCode) throw new Exception("找不到該科系代碼");

            // 2. 插入學生資料
            $sql = "INSERT INTO Student (學號, 姓名, 年級, 科系代碼) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['sid'], $_POST['name'], $_POST['grade'], $deptCode]);
            echo json_encode(['status' => 'success']);
            break;

        case 'update_student':
            // 1. 先查出科系代碼
            $stmt = $pdo->prepare("SELECT 科系代碼 FROM Department WHERE 科系名稱 = ?");
            $stmt->execute([$_POST['dept']]);
            $deptCode = $stmt->fetchColumn();
            if (!$deptCode) {
                // 如果查不到，回傳錯誤給前端
                echo json_encode(['status' => 'error', 'message' => '找不到該科系代碼']);
                exit; 
            }

            // 2. 執行更新
            // 注意：這裡是中文欄位 (姓名, 年級, 科系代碼, 學號)
            $sql = "UPDATE Student SET 姓名=?, 年級=?, 科系代碼=? WHERE 學號=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['name'], $_POST['grade'], $deptCode, $_POST['sid']]);
            
            echo json_encode(['status' => 'success']);
            break;
        
        case 'delete_student':
            // 執行刪除指令
            // 對應你的資料庫：表格是 Student，欄位是 學號
            $stmt = $pdo->prepare("DELETE FROM Student WHERE 學號 = ?");
            $stmt->execute([$_POST['sid']]);
            echo json_encode(['status' => 'success']);
            break;

        // ==========================================
        // --- 課程管理 (Course) ---
        // ==========================================
       case 'get_courses':
            $search = $_POST['search'] ?? '';
            $teacher = $_POST['teacher'] ?? ''; // ★新增：接收老師參數
            
            // 關聯 Teacher 取得老師姓名，關聯 Enrollment 取得人數與平均
            $sql = "SELECT c.課程代號 as course_code, c.課程名稱 as course_name, c.學分數 as credits, 
                           t.老師姓名 as teacher, 
                           COUNT(e.學號) as enrolled_count, 
                           AVG(e.成績) as avg_score 
                    FROM Course c 
                    LEFT JOIN Teacher t ON c.老師編號 = t.老師編號
                    LEFT JOIN Enrollment e ON c.課程代號 = e.課程代號 
                    WHERE 1=1";
            
            $params = [];
            
            // ★新增：如果有選老師，就加入 SQL 篩選條件
            if ($teacher) {
                $sql .= " AND t.老師姓名 = ?";
                $params[] = $teacher;
            }

            if ($search) {
                $sql .= " AND (c.課程名稱 LIKE ? OR c.課程代號 LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $sql .= " GROUP BY c.課程代號";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll();
            
            // 處理數字格式
            foreach($result as &$row) {
                 $row['avg_score'] = $row['avg_score'] ? number_format($row['avg_score'], 1) : '-';
            }
            echo json_encode($result);
            break;

        case 'add_course':
             // 1. 查老師編號
             // 假設前端傳來的是老師姓名，若前端直接傳代號可省略此步
             // 為了保險，這裡假設前端可能傳姓名，我們先不做轉換直接存 (若你的下拉選單 value 是 T001 最好)
             // 觀察你的 SQL，這裡直接存入 $_POST['teacher'] 假設前端 value="T001"
             // 如果前端 value="陳老師"，則需要先查 Teacher 表
             
             // 修正策略：簡單起見，嘗試直接查老師編號，查不到就當作傳入的是編號
             $tName = $_POST['teacher'];
             $stmt = $pdo->prepare("SELECT 老師編號 FROM Teacher WHERE 老師姓名 = ?");
             $stmt->execute([$tName]);
             $tid = $stmt->fetchColumn();
             if(!$tid) $tid = $tName; // 查不到就假設傳入的已經是代號

            $sql = "INSERT INTO Course (課程代號, 課程名稱, 學分數, 老師編號) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['cid'], $_POST['cname'], $_POST['credits'], $tid]);
            echo json_encode(['status' => 'success']);
            break;

        // ... (接在 add_course 之後) ...

        case 'update_course':
            // 1. 處理老師姓名轉編號 (跟新增課程一樣的邏輯)
            $tName = $_POST['teacher'];
            $stmt = $pdo->prepare("SELECT 老師編號 FROM Teacher WHERE 老師姓名 = ?");
            $stmt->execute([$tName]);
            $tid = $stmt->fetchColumn();
            if(!$tid) $tid = $tName; // 查不到就假設傳入的已經是代號

            // 2. 執行更新指令
            // 對應資料庫欄位：課程名稱, 學分數, 老師編號, (WHERE) 課程代號
            $sql = "UPDATE Course SET 課程名稱=?, 學分數=?, 老師編號=? WHERE 課程代號=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['cname'], $_POST['credits'], $tid, $_POST['cid']]);
            
            echo json_encode(['status' => 'success']);
            break;

        // ... (下面接 delete_course) ...
        case 'delete_course':
            // 檢查是否有學生修課 (查 Enrollment 表)
            $check = $pdo->prepare("SELECT COUNT(*) FROM Enrollment WHERE 課程代號 = ?");
            $check->execute([$_POST['cid']]);
            if ($check->fetchColumn() > 0) {
                echo json_encode(['status' => 'error', 'message' => '此課程有學生選修，無法刪除']);
            } else {
                $stmt = $pdo->prepare("DELETE FROM Course WHERE 課程代號 = ?");
                $stmt->execute([$_POST['cid']]);
                echo json_encode(['status' => 'success']);
            }
            break;

        case 'get_course_students':
            $sql = "SELECT s.學號 as student_id, s.姓名 as name, e.成績 as score 
                    FROM Enrollment e 
                    JOIN Student s ON e.學號 = s.學號 
                    WHERE e.課程代號 = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['cid']]);
            echo json_encode($stmt->fetchAll());
            break;

        // ==========================================
        // --- 成績管理 (Enrollment) ---
        // ==========================================
        case 'get_grades':
            $sname = $_POST['sname'] ?? '';
            $teacher = $_POST['teacher'] ?? '';
            $cname = $_POST['cname'] ?? '';

            // ★關鍵修改：因為 Enrollment 沒有 id，我們用 CONCAT 把 學號和課程代號 拼起來當作 id
            // 例如 S001_C001，這樣前端 script.js 才有東西可以傳給 delete/update
            $sql = "SELECT CONCAT(e.學號, '_', e.課程代號) as id, 
                           s.學號 as student_id, s.姓名 as sname, 
                           c.課程代號 as course_code, c.課程名稱 as course_name, 
                           t.老師姓名 as teacher, e.成績 as score 
                    FROM Enrollment e
                    JOIN Student s ON e.學號 = s.學號
                    JOIN Course c ON e.課程代號 = c.課程代號
                    LEFT JOIN Teacher t ON c.老師編號 = t.老師編號
                    WHERE 1=1";
            
            $params = [];
            if ($sname) {
                $sql .= " AND s.姓名 LIKE ?";
                $params[] = "%$sname%";
            }
            if ($teacher) {
                $sql .= " AND t.老師姓名 = ?";
                $params[] = $teacher;
            }
            if ($cname) {
                $sql .= " AND c.課程名稱 = ?";
                $params[] = $cname;
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode($stmt->fetchAll());
            break;

        case 'add_grade':
            $sql = "INSERT INTO Enrollment (學號, 課程代號, 成績) VALUES (?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['sid'], $_POST['cid'], $_POST['score']]);
            echo json_encode(['status' => 'success']);
            break;

        case 'update_grade':
            // 解析 id (格式為 S0011_C001)
            $parts = explode('_', $_POST['id']);
            if(count($parts) < 2) throw new Exception("ID 格式錯誤");
            $sid = $parts[0];
            $cid = $parts[1];

            $sql = "UPDATE Enrollment SET 成績=? WHERE 學號=? AND 課程代號=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['score'], $sid, $cid]);
            echo json_encode(['status' => 'success']);
            break;
        case 'delete_grade':
            // 解析 id
            $parts = explode('_', $_POST['id']);
            if(count($parts) < 2) throw new Exception("ID 格式錯誤");
            $sid = $parts[0];
            $cid = $parts[1];

            $stmt = $pdo->prepare("DELETE FROM Enrollment WHERE 學號=? AND 課程代號=?");
            $stmt->execute([$sid, $cid]);
            echo json_encode(['status' => 'success']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500); // 回傳 500 錯誤代碼
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>