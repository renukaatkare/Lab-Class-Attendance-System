// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // body-parser ऐवजी modern syntax

// ✅ MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "attendancesystem",
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err.message);
    process.exit(1); // error असेल तर server थांबव
  }
  console.log("✅ MySQL Connected!");
});

// ========================
// 📌 API Routes
// ========================
// 👉 User Registration
app.post("/register", (req, res) => {
  console.log("[REGISTER] Request body:", req.body);
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).send({ success: false, message: "Missing fields" });
  }
  db.query(
    "INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)",
    [name, email, username, password],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send({ success: false, message: "Username or email already exists" });
        }
        console.error("❌ Registration Error:", err.message);
        return res.status(500).send({ success: false, message: "DB error" });
      }
      res.send({ success: true, message: "Registration successful" });
    }
  );
});

// 🏠 Root Route Handler (FIX for "Cannot GET /")
app.get("/", (req, res) => {
  res.send(
    "<h1>Attendance System Backend</h1><p>Server is running and connected to MySQL. Use /login or /attendance endpoints.</p>"
  );
});

// 👉 User Login
app.post("/login", (req, res) => {
  console.log("[LOGIN] Request body:", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ success: false, message: "Missing fields" });
  }

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) {
        console.error("❌ Query Error:", err.message);
        return res.status(500).send({ error: "DB error" });
      }
      if (result.length > 0) {
        res.send({ success: true, user: result[0] });
      } else {
        res.send({ success: false, message: "Invalid credentials" });
      }
    }
  );
});

// 👉 Mark Attendance
app.post("/attendance", (req, res) => {
  console.log("[ATTENDANCE] Request body:", req.body);
  const { student_id, status } = req.body;
  const date = new Date().toISOString().split("T")[0];

  if (!student_id || !status) {
    return res.status(400).send({ success: false, message: "Missing fields" });
  }

  db.query(
    "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)",
    [student_id, date, status],
    (err, result) => {
      if (err) {
        console.error("❌ Query Error:", err.message);
        return res.status(500).send({ error: "DB error" });
      }
      res.send({ success: true, message: "Attendance marked" });
    }
  );
});

// 👉 Get Attendance Report
app.get("/attendance/:student_id", (req, res) => {
  const { student_id } = req.params;

  db.query(
    "SELECT * FROM attendance WHERE student_id = ?",
    [student_id],
    (err, result) => {
      if (err) {
        console.error("❌ Query Error:", err.message);
        return res.status(500).send({ error: "DB error" });
      }
      res.send(result);
    }
  );
});

// ========================
// 📌 Start Server
// ========================
const PORT = 8080;
app.listen(PORT, () => {console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// --- MySQL users table setup ---
// Run this SQL in your MySQL client if you get DB errors:
/*
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL
);
*/

// --- Debugging ---
// If you get 'Server error' in the frontend, check your backend terminal for MySQL errors or CORS issues.
// Make sure the backend is running and the table exists.
