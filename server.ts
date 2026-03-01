import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lunch_attendance.db");
const upload = multer({ storage: multer.memoryStorage() });

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT,
    note TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'excused', 'absent')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date),
    FOREIGN KEY(student_id) REFERENCES students(id)
  );
`);

// Migration for existing databases
try {
  const columns = db.prepare("PRAGMA table_info(students)").all() as any[];
  const hasNote = columns.some(col => col.name === 'note');
  if (!hasNote) {
    db.prepare("ALTER TABLE students ADD COLUMN note TEXT").run();
  }
} catch (error) {
  console.error("Migration error:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get all students
  app.get("/api/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE status = 'active'").all();
    res.json(students);
  });

  // Add a student
  app.post("/api/students", (req, res) => {
    const { name, student_code, class_name, note } = req.body;
    try {
      const info = db.prepare("INSERT INTO students (name, student_code, class_name, note) VALUES (?, ?, ?, ?)").run(name, student_code, class_name, note || "");
      res.json({ id: info.lastInsertRowid, name, student_code, class_name, note });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a student (soft delete)
  app.delete("/api/students/:id", (req, res) => {
    db.prepare("UPDATE students SET status = 'inactive' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Download Excel Template
  app.get("/api/students/template", (req, res) => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["Mã học sinh", "Họ và tên", "Lớp", "Ghi chú"], // Headers
        ["HS001", "Nguyễn Văn A", "10A1", "Ghi chú mẫu"],   // Example row
        ["HS002", "Trần Thị B", "10A2", ""]      // Example row
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 30 }];
      
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Disposition", 'attachment; filename="Mau_Danh_Sach_Hoc_Sinh.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import Students from Excel
  app.post("/api/students/import", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    try {
      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Skip header row (index 0)
      const rows = data.slice(1);
      let successCount = 0;
      let errorCount = 0;

      const insertStmt = db.prepare("INSERT INTO students (student_code, name, class_name, note) VALUES (?, ?, ?, ?)");
      const checkStmt = db.prepare("SELECT id FROM students WHERE student_code = ?");
      const updateStmt = db.prepare("UPDATE students SET name = ?, class_name = ?, note = ?, status = 'active' WHERE student_code = ?");

      const transaction = db.transaction((rows) => {
        for (const row of rows) {
          // Expecting: [Code, Name, Class, Note] based on template
          const student_code = row[0]?.toString().trim();
          const name = row[1]?.toString().trim();
          const class_name = row[2]?.toString().trim();
          const note = row[3]?.toString().trim() || "";

          if (!student_code || !name) {
            continue; // Skip invalid rows
          }

          const existing = checkStmt.get(student_code);
          if (existing) {
            updateStmt.run(name, class_name || "", note, student_code);
          } else {
            insertStmt.run(student_code, name, class_name || "", note);
          }
          successCount++;
        }
      });

      transaction(rows);

      res.json({ success: true, count: successCount });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  // Mark attendance (Upsert)
  app.post("/api/attendance", (req, res) => {
    const { student_id, date, status } = req.body; // status: 'present' | 'excused'
    try {
      db.prepare(`
        INSERT INTO attendance (student_id, date, status) 
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
      `).run(student_id, date, status || 'present');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove attendance
  app.delete("/api/attendance", (req, res) => {
    const { student_id, date } = req.body;
    db.prepare("DELETE FROM attendance WHERE student_id = ? AND date = ?").run(student_id, date);
    res.json({ success: true });
  });

  // Get attendance for a specific date
  app.get("/api/attendance/:date", (req, res) => {
    const attendance = db.prepare(`
      SELECT a.*, s.name, s.student_code, s.class_name 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = ?
    `).all(req.params.date);
    res.json(attendance);
  });

  // Get reports for a date range
  app.get("/api/reports", (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates are required." });
    }

    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'active'").get() as any;
    
    const attendanceData = db.prepare(`
      SELECT date, status, COUNT(*) as count
      FROM attendance
      WHERE date BETWEEN ? AND ?
      GROUP BY date, status
      ORDER BY date ASC
    `).all(start, end) as any[];

    // Process data to group by date
    const groupedData = new Map();
    
    attendanceData.forEach(row => {
      if (!groupedData.has(row.date)) {
        groupedData.set(row.date, { date: row.date, present: 0, excused: 0, total: totalStudents.count });
      }
      const entry = groupedData.get(row.date);
      if (row.status === 'present') entry.present = row.count;
      if (row.status === 'excused') entry.excused = row.count;
    });

    res.json(Array.from(groupedData.values()));
  });

  // Get stats
  app.get("/api/stats", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'active'").get() as any;
    const stats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      WHERE date = ? 
      GROUP BY status
    `).all(today) as any[];
    
    let presentToday = 0;
    let excusedToday = 0;

    stats.forEach(s => {
      if (s.status === 'present') presentToday = s.count;
      if (s.status === 'excused') excusedToday = s.count;
    });
    
    res.json({
      totalStudents: totalStudents.count,
      presentToday,
      excusedToday,
      absentToday: totalStudents.count - presentToday - excusedToday
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
