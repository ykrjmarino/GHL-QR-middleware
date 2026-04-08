// import mysql from "mysql2/promise";
// import dotenv from 'dotenv';

// dotenv.config();

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const DB_PASSWORD = process.env.DB_PASSWORD;

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: DB_PASSWORD,
  database: "tickets_db",
});

(async () => {
  const connection = await db;
  const [rows] = await connection.query("SELECT 1");
  console.log(rows);
})();

module.exports = { db };