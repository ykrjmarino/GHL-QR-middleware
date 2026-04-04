import mysql from "mysql2/promise";
import dotenv from 'dotenv';

dotenv.config();
const DB_PASSWORD = process.env.DB_PASSWORD;

export const db = await mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: DB_PASSWORD,
  database: "tickets_db",
});

const [rows] = await db.query("SELECT 1");
console.log(rows);