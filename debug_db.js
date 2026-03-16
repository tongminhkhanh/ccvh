import { createClient } from "@libsql/client";

const db = createClient({
  url: "file:lunch_attendance.db",
});

async function debug() {
  console.log("--- Students ---");
  const students = await db.execute("SELECT id, name, student_code, balance FROM students WHERE name LIKE '%Linh Anh%'");
  console.log(JSON.stringify(students.rows, null, 2));

  console.log("--- Payment Logs ---");
  const logs = await db.execute("SELECT * FROM payment_logs LIMIT 10");
  console.log(JSON.stringify(logs.rows, null, 2));
}

debug();
