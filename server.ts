import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Turso (LibSQL) client
const dbUrl = process.env.TURSO_DATABASE_URL || "file:lunch_attendance.db";
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

const upload = multer({ storage: multer.memoryStorage() });

async function initDb() {
  try {
    await db.executeMultiple(`
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
        status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date),
        FOREIGN KEY(student_id) REFERENCES students(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        total_meals INTEGER DEFAULT 0,
        meal_price REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        paid INTEGER DEFAULT 0,
        paid_date TEXT,
        note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, month),
        FOREIGN KEY(student_id) REFERENCES students(id)
      );
    `);

    const rs = await db.execute("PRAGMA table_info(students)");
    const columns = rs.rows;
    const hasNote = columns.some(col => col.name === 'note');
    if (!hasNote) {
      await db.execute("ALTER TABLE students ADD COLUMN note TEXT");
    }
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Migration/Init error:", error);
  }
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = process.env.PORT || 3005;

  app.use(express.json());

  // API Routes

  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const rs = await db.execute("SELECT * FROM students WHERE status = 'active'");
      res.json(rs.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a student
  app.post("/api/students", async (req, res) => {
    const { name, student_code, class_name, note } = req.body;
    try {
      const rs = await db.execute({
        sql: "INSERT INTO students (name, student_code, class_name, note) VALUES (?, ?, ?, ?) RETURNING id",
        args: [name, student_code, class_name, note || ""]
      });
      // LibSQL doesn't return lastInsertRowid natively through driver like SQLite3, 
      // but returning clause helps.
      const id = rs.rows[0]?.id;
      res.json({ id, name, student_code, class_name, note });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a student (soft delete)
  app.delete("/api/students/:id", async (req, res) => {
    try {
      await db.execute({
        sql: "UPDATE students SET status = 'inactive' WHERE id = ?",
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download Excel Template
  app.get("/api/students/template", (req, res) => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["Mã học sinh", "Họ và tên", "Lớp", "Ghi chú"],
        ["HS001", "Nguyễn Văn A", "10A1", "Ghi chú mẫu"],
        ["HS002", "Trần Thị B", "10A2", ""]
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
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
  app.post("/api/students/import", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    try {
      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const rows = data.slice(1);
      let successCount = 0;

      const statements = [];

      for (const row of rows) {
        const student_code = row[0]?.toString().trim();
        const name = row[1]?.toString().trim();
        const class_name = row[2]?.toString().trim();
        const note = row[3]?.toString().trim() || "";

        if (!student_code || !name) continue;

        statements.push({
          sql: `INSERT INTO students (student_code, name, class_name, note, status) 
                VALUES (?, ?, ?, ?, 'active')
                ON CONFLICT(student_code) DO UPDATE SET name=excluded.name, class_name=excluded.class_name, note=excluded.note, status='active'`,
          args: [student_code, name, class_name || "", note]
        });
        successCount++;
      }

      if (statements.length > 0) {
        await db.batch(statements, "write");
      }

      res.json({ success: true, count: successCount });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  // Mark attendance (Upsert)
  app.post("/api/attendance", async (req, res) => {
    const { student_id, date, status } = req.body;
    try {
      await db.execute({
        sql: `INSERT INTO attendance (student_id, date, status) 
              VALUES (?, ?, ?)
              ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`,
        args: [student_id, date, status || 'present']
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch mark attendance
  app.post("/api/attendance/batch", async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Thieu hoac sai dinh dang items." });
    }

    try {
      const statements = items.map((item: any) => ({
        sql: `INSERT INTO attendance (student_id, date, status) 
              VALUES (?, ?, ?)
              ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`,
        args: [item.student_id, item.date, item.status || 'present']
      }));

      await db.batch(statements, "write");
      res.json({ success: true, count: statements.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch remove attendance
  app.post("/api/attendance/batch-delete", async (req, res) => {
    const { studentIds, date } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !date) {
      return res.status(400).json({ error: "Thieu thong tin." });
    }

    try {
      const statements = studentIds.map((id: number) => ({
        sql: "DELETE FROM attendance WHERE student_id = ? AND date = ?",
        args: [id, date]
      }));

      await db.batch(statements, "write");
      res.json({ success: true, count: statements.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove attendance
  app.delete("/api/attendance", async (req, res) => {
    const { student_id, date } = req.body;
    try {
      await db.execute({
        sql: "DELETE FROM attendance WHERE student_id = ? AND date = ?",
        args: [student_id, date]
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get attendance for a specific date
  app.get("/api/attendance/:date", async (req, res) => {
    try {
      const rs = await db.execute({
        sql: `SELECT a.*, s.name, s.student_code, s.class_name 
              FROM attendance a
              JOIN students s ON a.student_id = s.id
              WHERE a.date = ?`,
        args: [req.params.date]
      });
      res.json(rs.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get reports for a date range
  app.get("/api/reports", async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: "Start and end dates are required." });

    try {
      // For a date range, the class consists of active students + any deleted student who was present/absent in this range
      const rsStudents = await db.execute({
        sql: `SELECT COUNT(*) as count FROM students 
              WHERE status = 'active' 
                 OR id IN (SELECT student_id FROM attendance WHERE date BETWEEN ? AND ?)`,
        args: [start as string, end as string]
      });
      const totalStudents = Number(rsStudents.rows[0].count);

      const rsData = await db.execute({
        sql: `SELECT date, status, COUNT(*) as count
              FROM attendance
              WHERE date BETWEEN ? AND ?
              GROUP BY date, status
              ORDER BY date ASC`,
        args: [start as string, end as string]
      });

      const groupedData = new Map();

      rsData.rows.forEach(row => {
        const rowDate = row.date as string;
        if (!groupedData.has(rowDate)) {
          groupedData.set(rowDate, { date: rowDate, present: 0, total: totalStudents });
        }
        const entry = groupedData.get(rowDate);
        if (row.status === 'present') entry.present = Number(row.count);

      });

      res.json(Array.from(groupedData.values()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get detailed attendance per student for Excel export
  app.get("/api/reports/detail", async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: "Start and end dates are required." });

    try {
      // Get all active students + any deleted student who was present/absent in this date range
      const rsStudents = await db.execute({
        sql: `SELECT id, name, student_code, class_name FROM students 
              WHERE status = 'active' 
                 OR id IN (SELECT student_id FROM attendance WHERE date BETWEEN ? AND ?)
              ORDER BY id`,
        args: [start as string, end as string]
      });

      // Get attendance records in date range
      const rsAttendance = await db.execute({
        sql: `SELECT student_id, date, status FROM attendance WHERE date BETWEEN ? AND ? ORDER BY date, student_id`,
        args: [start as string, end as string]
      });

      // Get unique dates
      const dates = [...new Set(rsAttendance.rows.map(r => r.date as string))].sort();

      // Build detailed data
      const detail: Array<{
        student_id: number;
        name: string;
        student_code: string;
        class_name: string;
        date: string;
        status: string;
      }> = [];

      for (const date of dates) {
        for (const student of rsStudents.rows) {
          const record = rsAttendance.rows.find(
            r => r.student_id === student.id && r.date === date
          );
          detail.push({
            student_id: Number(student.id),
            name: student.name as string,
            student_code: student.student_code as string,
            class_name: student.class_name as string,
            date,
            status: record ? (record.status as string) : 'absent'
          });
        }
      }

      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rsTotal = await db.execute("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
      const totalStudents = Number(rsTotal.rows[0].count);

      const rsStats = await db.execute({
        sql: `SELECT a.status, COUNT(*) as count 
              FROM attendance a
              JOIN students s ON a.student_id = s.id AND s.status = 'active'
              WHERE a.date = ? 
              GROUP BY a.status`,
        args: [today]
      });

      let presentToday = 0;

      rsStats.rows.forEach(s => {
        if (s.status === 'present') presentToday = Number(s.count);
      });

      res.json({
        totalStudents,
        presentToday,
        absentToday: totalStudents - presentToday
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── PAYMENTS (Thu phí) ──────────────────────────────────

  // Generate payments for a month
  app.post("/api/payments/generate", async (req, res) => {
    const { month, meal_price } = req.body;
    if (!month || !meal_price) return res.status(400).json({ error: "month and meal_price are required." });

    try {
      const [year, mon] = month.split('-');
      const startDate = `${year}-${mon}-01`;
      const lastDay = new Date(Number(year), Number(mon), 0).getDate();
      const endDate = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

      const rsStudents = await db.execute({
        sql: `SELECT id, name, student_code, class_name FROM students 
              WHERE status = 'active' 
                 OR id IN (SELECT student_id FROM attendance WHERE date BETWEEN ? AND ?)
              ORDER BY id`,
        args: [startDate, endDate]
      });

      const rsMeals = await db.execute({
        sql: `SELECT student_id, COUNT(*) as meals FROM attendance 
              WHERE date BETWEEN ? AND ? AND status = 'present' 
              GROUP BY student_id`,
        args: [startDate, endDate]
      });

      const mealsMap = new Map<number, number>();
      rsMeals.rows.forEach(r => mealsMap.set(Number(r.student_id), Number(r.meals)));

      await db.execute({ sql: "DELETE FROM payments WHERE month = ?", args: [month] });

      const statements = rsStudents.rows.map(s => {
        const meals = mealsMap.get(Number(s.id)) || 0;
        const amount = meals * Number(meal_price);
        return {
          sql: `INSERT INTO payments (student_id, month, total_meals, meal_price, amount, paid, note) 
                VALUES (?, ?, ?, ?, ?, 0, '')`,
          args: [Number(s.id), month, meals, Number(meal_price), amount]
        };
      });

      if (statements.length > 0) {
        await db.batch(statements, "write");
      }

      res.json({ success: true, count: statements.length });
    } catch (error: any) {
      console.error("Generate payments error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get payments for a month
  app.get("/api/payments", async (req, res) => {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: "month is required." });

    try {
      const rs = await db.execute({
        sql: `SELECT p.*, s.name, s.student_code, s.class_name 
              FROM payments p 
              JOIN students s ON p.student_id = s.id 
              WHERE p.month = ? 
              ORDER BY s.name`,
        args: [month as string]
      });
      res.json(rs.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle payment status
  app.patch("/api/payments/:id/toggle", async (req, res) => {
    try {
      const rs = await db.execute({ sql: "SELECT paid FROM payments WHERE id = ?", args: [req.params.id] });
      if (rs.rows.length === 0) return res.status(404).json({ error: "Payment not found." });

      const currentPaid = Number(rs.rows[0].paid);
      const newPaid = currentPaid === 1 ? 0 : 1;
      const paidDate = newPaid === 1 ? new Date().toISOString().split('T')[0] : null;

      await db.execute({
        sql: "UPDATE payments SET paid = ?, paid_date = ? WHERE id = ?",
        args: [newPaid, paidDate, req.params.id]
      });

      res.json({ success: true, paid: newPaid, paid_date: paidDate });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get payment stats for a month
  app.get("/api/payments/stats", async (req, res) => {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: "month is required." });

    try {
      const rs = await db.execute({
        sql: `SELECT 
                COUNT(*) as total_students,
                SUM(amount) as total_amount,
                SUM(CASE WHEN paid = 1 THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN paid = 1 THEN amount ELSE 0 END) as paid_amount,
                SUM(CASE WHEN paid = 0 THEN 1 ELSE 0 END) as unpaid_count,
                SUM(CASE WHEN paid = 0 THEN amount ELSE 0 END) as unpaid_amount
              FROM payments WHERE month = ?`,
        args: [month as string]
      });
      res.json(rs.rows[0] || { total_students: 0, total_amount: 0, paid_count: 0, paid_amount: 0, unpaid_count: 0, unpaid_amount: 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
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
