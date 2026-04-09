// import mysql from "mysql2/promise";
// import dotenv from 'dotenv';

// dotenv.config();

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;


const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

module.exports = { db };