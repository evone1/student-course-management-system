CREATE DATABASE IF NOT EXISTS 選課系統;
USE 選課系統;

CREATE TABLE Department (
    科系代碼 CHAR(4) PRIMARY KEY,
    科系名稱 VARCHAR(50),
    系主任 VARCHAR(20)
);

CREATE TABLE Teacher (
    老師編號 CHAR(5) PRIMARY KEY,
    老師姓名 VARCHAR(20)
);

CREATE TABLE Course (
    課程代號 CHAR(5) PRIMARY KEY,
    課程名稱 VARCHAR(50),
    學分數 INT,
    老師編號 CHAR(5),
    FOREIGN KEY (老師編號) REFERENCES Teacher(老師編號)
);

CREATE TABLE Student (
    學號 CHAR(5) PRIMARY KEY,
    姓名 VARCHAR(20),
    年級 VARCHAR(10),
    科系代碼 CHAR(4),
    FOREIGN KEY (科系代碼) REFERENCES Department(科系代碼)
);

CREATE TABLE Enrollment (
    學號 CHAR(5),
    課程代號 CHAR(5),
    成績 INT,
    PRIMARY KEY (學號, 課程代號),
    FOREIGN KEY (學號) REFERENCES Student(學號),
    FOREIGN KEY (課程代號) REFERENCES Course(課程代號)
);

INSERT INTO Department VALUES
('D001', '資訊工程學系', '張主任'),
('D002', '電機工程學系', '林主任'),
('D003', '工業工程與管理學系', '王主任'),
('D004', '應用數學系', '陳主任'),
('D005', '統計學系', '李主任');

INSERT INTO Teacher VALUES
('T001', '陳老師'),
('T002', '李老師'),
('T003', '黃老師'),
('T004', '王老師'),
('T005', '林老師');

INSERT INTO Course VALUES
('C001', '資料庫系統', 3, 'T001'),
('C002', '機率與統計', 2, 'T002'),
('C003', '作業研究', 3, 'T003'),
('C004', '計算機組織', 3, 'T004'),
('C005', '演算法分析', 3, 'T005'),
('C006', '軟體工程', 3, 'T001'),
('C007', '網路安全', 3, 'T002'),
('C008', '人工智慧', 3, 'T003'),
('C009', '數位電路', 2, 'T004'),
('C010', '嵌入式系統', 3, 'T005');

INSERT INTO Student VALUES
('S0011', '陳曉明', '碩班一甲', 'D001'),
('S0012', '柯志雄', '碩班一乙', 'D002'),
('S0013', '趙英雄', '碩班一丙', 'D003'),
('S0014', '林美麗', '碩班一丁', 'D004'),
('S0015', '張大偉', '碩班一戊', 'D005');

INSERT INTO Enrollment VALUES
('S0011', 'C001', 85),
('S0012', 'C002', 90),
('S0013', 'C003', 92),
('S0014', 'C004', 88),
('S0015', 'C005', 95),
('S0011', 'C002', 80),
('S0012', 'C003', 75),
('S0013', 'C004', 78),
('S0014', 'C005', 82),
('S0015', 'C001', 89),
('S0011', 'C006', 91),
('S0012', 'C007', 87),
('S0013', 'C008', 93),
('S0014', 'C009', 85),
('S0015', 'C010', 88),
('S0011', 'C007', 84),
('S0012', 'C008', 79),
('S0013', 'C009', 81),
('S0014', 'C010', 86),
('S0015', 'C006', 90);
