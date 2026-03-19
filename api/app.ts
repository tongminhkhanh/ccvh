// Core logic for both local dev and production
import express from "express";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import * as XLSX from "xlsx";
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Turso (LibSQL) client
const dbUrl = process.env.TURSO_DATABASE_URL || "file:lunch_attendance.db";
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

// DB initialization logs removed for security
if (!dbUrl) console.warn("TURSO_DATABASE_URL is not defined, using local file DB.");

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
        month TEXT,
        start_date TEXT,
        end_date TEXT,
        total_meals INTEGER DEFAULT 0,
        meal_price REAL DEFAULT 0,
        cooking_fee REAL DEFAULT 0,
        supervision_fee REAL DEFAULT 0,
        applied_credit REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        paid INTEGER DEFAULT 0,
        paid_date TEXT,
        note TEXT DEFAULT '',
        range_mode INTEGER DEFAULT 1,
        last_reminded_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, start_date, end_date),
        FOREIGN KEY(student_id) REFERENCES students(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payment_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        action_type TEXT NOT NULL, -- 'check_in', 'deduction', 'payment'
        amount REAL DEFAULT 0,
        balance_before REAL DEFAULT 0,
        balance_after REAL DEFAULT 0,
        month TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id)
      );
    `);

    const rs = await db.execute("PRAGMA table_info(students)");
    const columns = rs.rows;

    // Add note column if missing
    if (!columns.some(col => col.name === 'note')) {
      await db.execute("ALTER TABLE students ADD COLUMN note TEXT");
    }

    // Add balance column if missing
    if (!columns.some(col => col.name === 'balance')) {
      await db.execute("ALTER TABLE students ADD COLUMN balance REAL DEFAULT 0");
    }

    const payRs = await db.execute("PRAGMA table_info(payments)");
    const payCols = payRs.rows;

    // Migration v3: Recreate payments table to change UNIQUE constraint from (student_id, month) to (student_id, start_date, end_date)
    // We use cooking_fee as a proxy to check if we've already done SOME updates, but we'll use a specific condition now.
    // If start_date exists but we haven't renamed to payments_v3 yet, we force it.
    const hasStartDate = payCols.some(col => col.name === 'start_date');
    const isMigratedV3 = payCols.some(col => col.name === 'cooking_fee'); // This was already there, let's use a better check

    // Check if the table actually has the UNIQUE constraint we want.
    // Since it's hard to check via PRAGMA in a cross-platform way, we'll use a simple flag: 
    // if it HAS start_date but NO 'note' column (wait, note exists).
    // Let's just check if start_date exists. If it does, we assume it's the old version IF we haven't added a new marker.
    // Actually, I'll just look for a missing column I'll add NOW: 'meal_price' (wait, that existed too).

    // Let's be explicit: If it doesn't have 'start_date', it's v1.
    // If it HAS 'start_date' but we are getting UNIQUE errors, it's because the constraint is old.
    // I will force recreation if 'cooking_fee' exists but we haven't performed THIS specific recreation.

    // BETTER: Check if 'payments_old_v2' NOT exists, then do it.
    let needsMigration = false;
    try {
      if (payCols.length > 0 && hasStartDate) {
        // Double check if the unique constraint is the old one. 
        // We'll just try to insert a dummy and see? No.
        // Let's just use the column check.
        if (!payCols.some(col => col.name === 'applied_credit')) {
          needsMigration = true;
        } else {
          // If applied_credit exists, maybe it's already v2. 
          // I'll add a new column 'range_mode' as a marker.
          if (!payCols.some(col => col.name === 'range_mode')) {
            needsMigration = true;
          }
        }
      } else if (payCols.length > 0 && !hasStartDate) {
        needsMigration = true;
      }
    } catch (e) { }

    if (needsMigration) {
      console.log("Migrating payments table to v3 (Range-based UNIQUE constraint)...");
      try {
        await db.execute("ALTER TABLE payments RENAME TO payments_old_v3");
      } catch (e) {
        // Might already exist or table doesn't exist
      }

      await db.execute(`
        CREATE TABLE payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          month TEXT,
          start_date TEXT,
          end_date TEXT,
          total_meals INTEGER DEFAULT 0,
          meal_price REAL DEFAULT 0,
          cooking_fee REAL DEFAULT 0,
          supervision_fee REAL DEFAULT 0,
          applied_credit REAL DEFAULT 0,
          amount REAL DEFAULT 0,
          paid INTEGER DEFAULT 0,
          paid_date TEXT,
          note TEXT DEFAULT '',
          range_mode INTEGER DEFAULT 1, -- Marker for v3
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, start_date, end_date),
          FOREIGN KEY(student_id) REFERENCES students(id)
        )
      `);

      // Try to recover data from ANY old table
      try {
        const oldTable = payCols.length > 0 ? "payments_old_v3" : null;
        if (oldTable) {
          await db.execute(`
            INSERT INTO payments (
              student_id, month, total_meals, meal_price, cooking_fee, 
              supervision_fee, applied_credit, amount, paid, paid_date, note, created_at,
              start_date, end_date
            )
            SELECT 
              student_id, month, total_meals, meal_price, 0, 
              0, 0, amount, paid, paid_date, note, created_at,
              month || '-01', month || '-28'
            FROM ${oldTable}
          `);
        }
      } catch (e) {
        console.log("Data recovery skipped or failed:", e);
      }
      console.log("Migration v3 complete.");
    }

    // Last reminded column for debt reminders
    const payRsFinal = await db.execute("PRAGMA table_info(payments)");
    const payColsFinal = payRsFinal.rows;
    if (!payColsFinal.some(col => col.name === 'last_reminded_at')) {
      await db.execute("ALTER TABLE payments ADD COLUMN last_reminded_at TEXT");
    }

    // Initialize default settings if not exists
    const settingsCheck = await db.execute("SELECT COUNT(*) as count FROM settings");
    if (Number(settingsCheck.rows[0].count) === 0) {
      await db.executeMultiple(`
        INSERT INTO settings (id, value) VALUES ('mealPrice', '35000');
        INSERT INTO settings (id, value) VALUES ('supervisionFee', '2000');
        INSERT INTO settings (id, value) VALUES ('cookingFee', '60000');
      `);
    }
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Migration/Init error:", error);
  }
}

const app = express();
app.use(express.json());

// Ensure DB is initialized
initDb().then(() => {
  console.log("DB readiness check completed.");
}).catch(err => {
  console.error("[CRITICAL] Initial DB check failed:", err);
});

// Middleware for logging only
app.use((req, _res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});


// ─── API Routes ──────────────────────────────────────

// ─── BACKUP SYSTEM ───────────────────────────────────────
app.get("/api/backup/trigger", async (req, res) => {
  // Authorization check for Vercel Cron
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized backup attempt ignored.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting automated backup process...");

    // 1. Fetch data from all core tables
    const tables = ['students', 'attendance', 'payments', 'payment_logs', 'settings'];
    const backupData: any = {};

    for (const table of tables) {
      const result = await db.execute(`SELECT * FROM ${table}`);
      backupData[table] = result.rows;
    }

    // 2. Prepare Email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const receivers = (process.env.BACKUP_RECEIVERS || '').split(',').map(e => e.trim()).filter(Boolean);

    if (receivers.length === 0) {
      throw new Error("No backup receivers configured.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lunchpop_backup_${timestamp}.json`;
    const content = JSON.stringify(backupData, null, 2);

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LunchPop Backup <onboarding@resend.dev>', // Resend default for unverified domains
      to: receivers,
      subject: `[LunchPop] Database Backup - ${new Date().toLocaleDateString('vi-VN')}`,
      html: `<p>Chào anh Khánh,</p>
             <p>Đây là bản backup dữ liệu hệ thống LunchPop định kỳ hàng tuần.</p>
             <ul>
               <li><b>Ngày thực hiện:</b> ${new Date().toLocaleString('vi-VN')}</li>
               <li><b>Tổng số bảng:</b> ${tables.length}</li>
             </ul>
             <p>Vui lòng lưu giữ file đính kèm cẩn thận.</p>
             <p>Trân trọng,<br/>Antigravity AI</p>`,
      attachments: [
        {
          filename: filename,
          content: content,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Backup email sent successfully:", data?.id);
    res.json({ success: true, message: "Backup sent successfully", id: data?.id });
  } catch (error: any) {
    console.error("Backup failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history for a student
app.get("/api/tx-history/:id", async (req, res) => {
  console.log(`[DEBUG] GET /api/tx-history/${req.params.id} hit`);
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM payment_logs WHERE student_id = ? ORDER BY created_at DESC",
      args: [req.params.id]
    });
    console.log(`[DEBUG] Found ${rs.rows.length} transactions`);
    res.json(rs.rows);
  } catch (error: any) {
    console.error(`[ERROR] GET /api/tx-history/${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Void/Delete a transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    // 1. Get transaction details
    const tx = await db.execute({
      sql: "SELECT * FROM payment_logs WHERE id = ?",
      args: [req.params.id]
    });
    if (tx.rows.length === 0) return res.status(404).json({ error: "Giao dịch không tồn tại." });

    const { student_id, amount, action_type } = tx.rows[0];

    // 2. Get student balance
    const student = await db.execute({
      sql: "SELECT balance FROM students WHERE id = ?",
      args: [student_id]
    });
    const currentBalance = Number(student.rows[0].balance) || 0;

    // 3. Calculate new balance (reverse the action)
    let newBalance = currentBalance;
    if (action_type === 'advance_payment' || action_type === 'payment') {
      newBalance = currentBalance - Number(amount);
    } else if (action_type === 'apply_credit' || action_type === 'deduction') {
      newBalance = currentBalance + Number(amount);
    }

    // 4. Update student and delete log
    await db.batch([
      {
        sql: "UPDATE students SET balance = ? WHERE id = ?",
        args: [newBalance, student_id]
      },
      {
        sql: "DELETE FROM payment_logs WHERE id = ?",
        args: [req.params.id]
      }
    ], "write");

    res.json({ success: true, newBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a transaction (edit amount or note)
app.patch("/api/transactions/:id", async (req, res) => {
  const { amount, note } = req.body;
  try {
    const tx = await db.execute({
      sql: "SELECT * FROM payment_logs WHERE id = ?",
      args: [req.params.id]
    });
    if (tx.rows.length === 0) return res.status(404).json({ error: "Giao dịch không tồn tại." });

    const oldTx = tx.rows[0];
    const student_id = oldTx.student_id;
    const oldAmount = Number(oldTx.amount);
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;

    if (oldTx.action_type !== 'advance_payment') {
      return res.status(400).json({ error: "Chỉ có thể sửa giao dịch nạp tiền trực tiếp." });
    }

    const diff = newAmount - oldAmount;
    const student = await db.execute({
      sql: "SELECT balance FROM students WHERE id = ?",
      args: [student_id]
    });
    const currentBalance = Number(student.rows[0].balance) || 0;
    const newBalance = currentBalance + diff;

    await db.batch([
      {
        sql: "UPDATE students SET balance = ? WHERE id = ?",
        args: [newBalance, student_id]
      },
      {
        sql: "UPDATE payment_logs SET amount = ?, balance_after = balance_before + ?, note = ? WHERE id = ?",
        args: [newAmount, newAmount, note || oldTx.note, req.params.id]
      }
    ], "write");

    res.json({ success: true, newBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const rs = await db.execute("SELECT * FROM students WHERE status = 'active'");
    res.json(rs.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recharge student balance
app.post("/api/students/:id/recharge", async (req, res) => {
  const { id } = req.params;
  const { amount, note } = req.body;

  if (!amount || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Số tiền không hợp lệ." });
  }

  try {
    const student = await db.execute({
      sql: "SELECT balance FROM students WHERE id = ?",
      args: [id]
    });

    if (student.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy học sinh." });
    }

    const currentBalance = Number(student.rows[0].balance) || 0;
    const rechargeAmount = Number(amount);
    const newBalance = currentBalance + rechargeAmount;

    await db.batch([
      {
        sql: "UPDATE students SET balance = ? WHERE id = ?",
        args: [newBalance, id]
      },
      {
        sql: `INSERT INTO payment_logs (student_id, action_type, amount, balance_before, balance_after, note)
                VALUES (?, 'advance_payment', ?, ?, ?, ?)`,
        args: [id, rechargeAmount, currentBalance, newBalance, note || "Phụ huynh nộp trước"]
      }
    ], "write");

    res.json({ success: true, newBalance });
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

// Batch delete students (soft delete)
app.post("/api/students/batch-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No student IDs provided" });
    }
    const placeholders = ids.map(() => '?').join(',');
    await db.execute({
      sql: `UPDATE students SET status = 'inactive' WHERE id IN (${placeholders})`,
      args: ids
    });
    res.json({ success: true, deleted: ids.length });
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

// Helper to get current fees
const getFees = async () => {
  const rs = await db.execute("SELECT id, value FROM settings");
  const settings = rs.rows.reduce((acc: any, row: any) => {
    acc[row.id] = Number(row.value);
    return acc;
  }, {});
  return {
    mealPrice: settings.mealPrice || 35000,
    supervisionFee: settings.supervisionFee || 2000,
    cookingFee: settings.cookingFee || 60000
  };
};

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

// Mark attendance using the normalized model:
// present = row exists, absent = row does not exist
app.post("/api/attendance", async (req, res) => {
  const { student_id, date, status } = req.body;
  try {
    const prev = await db.execute({
      sql: "SELECT status FROM attendance WHERE student_id = ? AND date = ?",
      args: [student_id, date]
    });
    const prevStatus = prev.rows[0]?.status || 'absent';
    const newStatus = status === 'present' ? 'present' : 'absent';

    if (prevStatus === newStatus) {
      return res.json({ success: true, message: "No change" });
    }

    if (newStatus === 'present') {
      await db.execute({
        sql: `INSERT INTO attendance (student_id, date, status) 
                VALUES (?, ?, 'present')
                ON CONFLICT(student_id, date) DO UPDATE SET status = 'present'`,
        args: [student_id, date]
      });
    } else {
      await db.execute({
        sql: "DELETE FROM attendance WHERE student_id = ? AND date = ?",
        args: [student_id, date]
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch attendance updates with the normalized model:
// present = upsert, absent = delete
app.post("/api/attendance/batch", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Thieu hoac sai dinh dang items." });
  }

  try {
    const allStatements: any[] = [];

    for (const item of items) {
      if (item.status === 'present') {
        allStatements.push({
          sql: `INSERT INTO attendance (student_id, date, status) 
                    VALUES (?, ?, 'present')
                    ON CONFLICT(student_id, date) DO UPDATE SET status = 'present'`,
          args: [item.student_id, item.date]
        });
      } else {
        allStatements.push({
          sql: "DELETE FROM attendance WHERE student_id = ? AND date = ?",
          args: [item.student_id, item.date]
        });
      }
    }

    if (allStatements.length > 0) {
      await db.batch(allStatements, "write");
    }
    res.json({ success: true, count: items.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch remove attendance (considered marking absent)
app.post("/api/attendance/batch-delete", async (req, res) => {
  const { studentIds, date } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0 || !date) {
    return res.status(400).json({ error: "Thieu thong tin." });
  }

  try {
    const allStatements: any[] = [];

    for (const id of studentIds) {
      allStatements.push({ sql: "DELETE FROM attendance WHERE student_id = ? AND date = ?", args: [id, date] });
    }

    if (allStatements.length > 0) {
      await db.batch(allStatements, "write");
    }
    res.json({ success: true, count: studentIds.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove attendance (equivalent to marking absent in the normalized model)
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
              WHERE a.date = ? AND a.status = 'present'`,
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
      sql: `SELECT date, COUNT(*) as count
              FROM attendance
              WHERE date BETWEEN ? AND ? AND status = 'present'
              GROUP BY date
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
      entry.present = Number(row.count);
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
      sql: `SELECT student_id, date FROM attendance WHERE date BETWEEN ? AND ? AND status = 'present' ORDER BY date, student_id`,
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
          status: record ? 'present' : 'absent'
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
    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    const rsTotal = await db.execute("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const totalStudents = Number(rsTotal.rows[0].count);

    const rsStats = await db.execute({
      sql: `SELECT COUNT(*) as count 
              FROM attendance a
              JOIN students s ON a.student_id = s.id AND s.status = 'active'
              WHERE a.date = ? AND a.status = 'present'`,
      args: [targetDate]
    });

    const presentToday = Number(rsStats.rows[0]?.count) || 0;

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

// Helper to count work days (Mon-Fri)
const getWorkDays = (year: number, month: number) => {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
};

// Generate payments for a month (Projected)
app.post("/api/payments/generate", async (req, res) => {
  const { startDate, endDate } = req.body;

  let start = startDate;
  let end = endDate;
  let monthLabel = startDate ? `${startDate.substring(0, 7)}` : 'unk';

  if (req.body.month && !startDate) {
    const [y, m] = req.body.month.split('-');
    monthLabel = req.body.month;
    start = `${req.body.month}-01`;
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    end = `${req.body.month}-${lastDay.toString().padStart(2, '0')}`;
  }

  if (!start || !end) return res.status(400).json({ error: "startDate and endDate are required." });

  try {
    const fees = await getFees();
    const rsStudents = await db.execute("SELECT id, name, balance FROM students WHERE status = 'active'");

    // 1. Bulk get existing payments to calculate prevApplied
    const existingPaymentsRs = await db.execute({
      sql: "SELECT student_id, applied_credit FROM payments WHERE start_date = ? AND end_date = ?",
      args: [start, end]
    });
    const prevAppliedMap = new Map();
    existingPaymentsRs.rows.forEach(p => prevAppliedMap.set(Number(p.student_id), Number(p.applied_credit)));

    // 2. Bulk get attendance counts
    const attendanceRs = await db.execute({
      sql: `SELECT student_id, COUNT(*) as count 
            FROM attendance 
            WHERE date >= ? AND date <= ? AND status = 'present'
            GROUP BY student_id`,
      args: [start, end]
    });
    const attendMap = new Map();
    attendanceRs.rows.forEach(a => attendMap.set(Number(a.student_id), Number(a.count)));

    const batchStatements: any[] = [];

    for (const student of rsStudents.rows) {
      const studentId = Number(student.id);
      const prevApplied = prevAppliedMap.get(studentId) || 0;
      const currentBalance = Number(student.balance) || 0;
      const totalAvailable = currentBalance + prevApplied;
      const presentCount = attendMap.get(studentId) || 0;

      const mealCost = presentCount * fees.mealPrice;
      const supervisionCost = presentCount * fees.supervisionFee;
      const totalDue = fees.cookingFee + mealCost + supervisionCost;

      const appliedCredit = Math.min(totalAvailable, totalDue);
      const finalAmount = totalDue - appliedCredit;
      const newBalance = totalAvailable - appliedCredit;

      // Update student balance
      batchStatements.push({
        sql: "UPDATE students SET balance = ? WHERE id = ?",
        args: [newBalance, studentId]
      });

      // DELETE overlapping unpaid payments to prevent duplicates
      batchStatements.push({
        sql: "DELETE FROM payments WHERE student_id = ? AND paid = 0 AND (start_date <= ? AND end_date >= ?)",
        args: [studentId, end, start]
      });

      batchStatements.push({
        sql: `INSERT INTO payments (
                  student_id, month, start_date, end_date, total_meals, meal_price, 
                  cooking_fee, supervision_fee, applied_credit, amount, 
                  paid, note, range_mode
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)`,
        args: [
          studentId, monthLabel, start, end, presentCount, fees.mealPrice,
          fees.cookingFee, fees.supervisionFee, appliedCredit, finalAmount,
          `Thu phi tu ${start} den ${end} (${presentCount} buoi). ${appliedCredit > 0 ? `Da tru ${appliedCredit.toLocaleString('vi-VN')}đ tu so du.` : ''}`
        ]
      });

      if (appliedCredit !== prevApplied) {
        batchStatements.push({
          sql: `INSERT INTO payment_logs (student_id, action_type, amount, balance_before, balance_after, month, note)
                VALUES (?, 'apply_credit', ?, ?, ?, ?, ?)`,
          args: [studentId, appliedCredit, totalAvailable, newBalance, monthLabel,
            `Chot phi tu ${start} den ${end} (Du cu: ${prevApplied.toLocaleString('vi-VN')}đ, Du moi: ${appliedCredit.toLocaleString('vi-VN')}đ)`]
        });
      }
    }

    if (batchStatements.length > 0) {
      // Execute in chunks to avoid large batch limits if any
      const chunkSize = 50;
      for (let i = 0; i < batchStatements.length; i += chunkSize) {
        await db.batch(batchStatements.slice(i, i + chunkSize), "write");
      }
    }

    res.json({ success: true, count: rsStudents.rows.length });
  } catch (error: any) {
    console.error("Generate payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a month
app.get("/api/payments", async (req, res) => {
  const { month, startDate, endDate } = req.query;

  try {
    let sql = `SELECT p.*, s.name, s.student_code, s.class_name
               FROM payments p
               JOIN students s ON p.student_id = s.id`;
    let args: any[] = [];

    if (startDate && endDate) {
      // Find payments that overlap with the selected range
      sql += ` WHERE (p.start_date <= ? AND p.end_date >= ?)`;
      args = [endDate, startDate];
    } else if (month) {
      sql += " WHERE p.month = ?";
      args = [month];
    }

    sql += " ORDER BY s.name";
    const rs = await db.execute({ sql, args });
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
  const { month, startDate, endDate } = req.query;
  try {
    let baseSql = "FROM payments";
    let args: any[] = [];
    if (startDate && endDate) {
      baseSql += " WHERE (start_date <= ? AND end_date >= ?)";
      args = [endDate, startDate];
    } else if (month) {
      baseSql += " WHERE month = ?";
      args = [month];
    }

    const result = await db.execute({
      sql: `SELECT 
        COUNT(*) as total_students,
        SUM(amount) as total_amount,
        SUM(CASE WHEN paid = 1 THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN paid = 0 THEN amount ELSE 0 END) as unpaid_amount,
        SUM(CASE WHEN paid = 1 THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN paid = 0 THEN 1 ELSE 0 END) as unpaid_count
        ${baseSql}`,
      args
    });
    res.json(result.rows[0] || { total_students: 0, total_amount: 0, paid_count: 0, paid_amount: 0, unpaid_count: 0, unpaid_amount: 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/financial", async (req, res) => {
  try {
    // 1. Get stats grouped by month/period for the last 6 months
    const historyRs = await db.execute(`
      SELECT 
        month,
        SUM(amount) as projected,
        SUM(CASE WHEN paid = 1 THEN amount ELSE 0 END) as actual,
        SUM(CASE WHEN paid = 0 THEN amount ELSE 0 END) as debt
      FROM payments
      GROUP BY month
      ORDER BY MIN(start_date) DESC
      LIMIT 6
    `);

    // 2. Forecast: Calculate expected revenue for NEXT month
    const feesRs = await db.execute("SELECT * FROM settings LIMIT 1");
    const fees = feesRs.rows[0] ? {
      cookingFee: Number(feesRs.rows[0].cooking_fee),
      mealPrice: Number(feesRs.rows[0].meal_price),
      supervisionFee: Number(feesRs.rows[0].supervision_fee)
    } : { cookingFee: 200000, mealPrice: 28000, supervisionFee: 10000 };

    const studentsRs = await db.execute("SELECT COUNT(*) as active_count FROM students WHERE status = 'active'");
    const activeCount = Number(studentsRs.rows[0].active_count);

    const WORK_DAYS = 22;
    const estimatedPerStudent = fees.cookingFee + (fees.mealPrice * WORK_DAYS) + (fees.supervisionFee * WORK_DAYS);
    const forecastNextMonth = activeCount * estimatedPerStudent;

    res.json({
      history: historyRs.rows.reverse(),
      forecast: {
        nextMonth: forecastNextMonth,
        activeStudents: activeCount,
        avgPerStudent: estimatedPerStudent
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments/:id/remind", async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await db.execute({
      sql: "UPDATE payments SET last_reminded_at = ? WHERE id = ?",
      args: [now, id]
    });
    res.json({ success: true, last_reminded_at: now });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// ─── SETTINGS ───────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  try {
    const rs = await db.execute("SELECT id, value FROM settings");
    const settings = rs.rows.reduce((acc: any, row: any) => {
      acc[row.id] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/settings", async (req, res) => {
  const { mealPrice, supervisionFee, cookingFee } = req.body;
  try {
    const statements = [];
    if (mealPrice !== undefined) {
      statements.push({ sql: "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'mealPrice'", args: [mealPrice.toString()] });
    }
    if (supervisionFee !== undefined) {
      statements.push({ sql: "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'supervisionFee'", args: [supervisionFee.toString()] });
    }
    if (cookingFee !== undefined) {
      statements.push({ sql: "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'cookingFee'", args: [cookingFee.toString()] });
    }

    if (statements.length > 0) {
      await db.batch(statements, "write");
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BACKUP SYSTEM ───────────────────────────────────────
app.get("/api/backup/trigger", async (req, res) => {
  // Authorization check for Vercel Cron
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized backup attempt ignored.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting automated backup process...");

    // 1. Fetch data from all core tables
    const tables = ['students', 'attendance', 'payments', 'payment_logs', 'settings'];
    const backupData: any = {};

    for (const table of tables) {
      const result = await db.execute(`SELECT * FROM ${table}`);
      backupData[table] = result.rows;
    }

    // 2. Prepare Email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const receivers = (process.env.BACKUP_RECEIVERS || '').split(',').map(e => e.trim()).filter(Boolean);

    if (receivers.length === 0) {
      throw new Error("No backup receivers configured.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lunchpop_backup_${timestamp}.json`;
    const content = JSON.stringify(backupData, null, 2);

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LunchPop Backup <onboarding@resend.dev>', // Resend default for unverified domains
      to: receivers,
      subject: `[LunchPop] Database Backup - ${new Date().toLocaleDateString('vi-VN')}`,
      html: `<p>Chào anh Khánh,</p>
             <p>Đây là bản backup dữ liệu hệ thống LunchPop định kỳ hàng tuần.</p>
             <ul>
               <li><b>Ngày thực hiện:</b> ${new Date().toLocaleString('vi-VN')}</li>
               <li><b>Tổng số bảng:</b> ${tables.length}</li>
             </ul>
             <p>Vui lòng lưu giữ file đính kèm cẩn thận.</p>
             <p>Trân trọng,<br/>Antigravity AI</p>`,
      attachments: [
        {
          filename: filename,
          content: content,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Backup email sent successfully:", data?.id);
    res.json({ success: true, message: "Backup sent successfully", id: data?.id });
  } catch (error: any) {
    console.error("Backup failed:", error);
    res.status(500).json({ error: error.message });
  }
});

const setupApp = async (viteInstance?: any) => {
  if (viteInstance) {
    app.use(viteInstance.middlewares);
  } else if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "vercel") {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }
};

export { app, setupApp };
export default app;
