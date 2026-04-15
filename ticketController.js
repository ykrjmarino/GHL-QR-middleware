// import { db } from './db.js';
// import dotenv from 'dotenv';
// import QRCode from "qrcode";
// import { nanoid } from 'nanoid';
// import fs from "fs";
// import path from "path";

// dotenv.config();

const { db } = require('./db');
const dotenv = require('dotenv');
const QRCode = require("qrcode");
const { nanoid } = require('nanoid');
const fs = require("fs");
const path = require("path");

dotenv.config();

const port = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
const FOLDER_URL = process.env.FOLDER_URL || "qr_codes";

//==============================================================
//GET 
const dbTesting= async (req, res) => {
  const connection = await db;
  const [rows] = await connection.query("SELECT * FROM tickets");

  console.log(rows);
  return res.json(rows);
}

const dbNameTesting = async (req, res) => {
  try {
    const connection = await db;

    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_NAME:", process.env.DB_NAME);

    const [rows] = await connection.query("SELECT * FROM tickets");

    console.log("Query success:", rows);
    return res.json(rows);

  } catch (error) {
    console.error("DB ERROR:", error);
    return res.status(500).json({
      message: "DB error",
      error: error.message
    });
  }
};

//==============================================================
//POST

const createOrder = async (req, res) => {
  try {
    const { ntp_order_ref, ntp_user_id, ntp_total_amount } = req.body.data;

    const [result] = await db.query(
      `INSERT INTO orders (order_ref, user_id, total_amount, payment_status)
       VALUES (?, ?, ?, 'pending')`,
      [ntp_order_ref, ntp_user_id, ntp_total_amount]
    );

    return res.json({
      message: "Order created",
      order_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const paymentRecord  = async (req, res) => { // payment = success ===>>> order paid
  try {
    const { ntp_order_ref, ntp_amount, ntp_transaction_ref } = req.body.data; //or 'user info' {{contact.id??}} ghl side
    const { ntp_provider = 'GHL' } = req.body.data; //use value if received, otherwise default to 'GHL'

    const [order] = await db.query(
      "SELECT id FROM orders WHERE order_ref = ?",
      [ntp_order_ref]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order_id = order[0].id; 
          //existing orders table primary key(PK) (id) = order.id
          //will pass this to payments table as foreign key(FK)

    await db.query(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
      [order_id]
    );

    await db.query(
      `INSERT INTO payments (order_id, provider, amount, payment_status, transaction_ref)
       VALUES (?, ?, ?, 'paid', ?)`,
      [order_id, ntp_provider, ntp_amount, ntp_transaction_ref]
    );

    return res.json({
      message: "Payment recorded",
      order_id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const generateTicket = async (req, res) => {
  try {
    const { ntp_event_id, ntp_order_id } = req.body.data;

    //check if data passed from req.body.data is existing
    if (!ntp_event_id || !ntp_order_id) {
      return res.status(400).json({ message: "Missing ntp_event_id or ntp_order_id" });
    }

    const [order] = await db.query(
      "SELECT payment_status FROM orders WHERE id = ?",
      [ntp_order_id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order[0].payment_status !== "paid") {
      return res.status(400).json({ message: "Order not paid" });
    }

    const [event] = await db.query("SELECT id FROM events WHERE id = ?", [ntp_event_id]);
    if (event.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ticket_id = `TKT-${nanoid(8)}`;

    //THIS IS THE BASE64... we will convert this to image file and save locally for now
    const qr = await QRCode.toDataURL(ticket_id);
    //removes the prefix from the QR code string, cuz we dont need allat
    const base64Data = qr.replace(/^data:image\/png;base64,/, "");

    const dir = path.join("public", "qr_codes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join("public", "qr_codes", `${ticket_id}.png`);
    fs.writeFileSync(filePath, base64Data, "base64"); //decode this base64 string into binary (real image) before saving

    const qr_url = `${BASE_URL}/${FOLDER_URL}/${ticket_id}.png`;

    //save to DB    
    await db.query(
      "INSERT INTO tickets (ticket_id, order_id, event_id, qr_url) VALUES (?, ?, ?, ?)",
      [ticket_id, ntp_order_id, ntp_event_id, qr_url]
    );

    return res.json({
      ticket_id,
      order_id: ntp_order_id,
      event_id: ntp_event_id,
      qr_url
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const batchGenerateTicket = async (req, res) => {
  try {
    const { ntp_event_id, ntp_order_id } = req.body.data;
    const { ntp_quantity } = req.body.data; // kahit di na siguro

    //check if data passed from req.body.data is existing
    if (!ntp_event_id || !ntp_order_id) {
      return res.status(400).json({ message: "Missing ntp_event_id or ntp_order_id" });
    }

    const [order] = await db.query(
      "SELECT payment_status FROM orders WHERE id = ?",
      [ntp_order_id]
    );

    const [[ ticketCount ]] = await db.query(
      "SELECT COUNT (*) as count FROM payments WHERE order_id = ?",
      [ntp_order_id]
    );

    const [[ existing ]] = await db.query(
      "SELECT COUNT (*) as count FROM payments WHERE order_id = ?",
      [ntp_order_id]
    );

    const remaining = ticketCount.count - existing.count


    const [event] = await db.query("SELECT id FROM events WHERE id = ?", [ntp_event_id]);
    if (event.length === 0) return res.status(404).json({ message: "Event not found" });

    if (order.length === 0) return res.status(404).json({ message: "Order not found" });

    if (order[0].payment_status !== "paid") return res.status(400).json({ message: "Order not paid" });

    for (let i=0; i<remaining; i++) {
      const ticket_id = `TKT-${nanoid(8)}`;

      //THIS IS THE BASE64... we will convert this to image file and save locally for now
      const qr = await QRCode.toDataURL(ticket_id);
      //removes the prefix from the QR code string, cuz we dont need allat
      const base64Data = qr.replace(/^data:image\/png;base64,/, "");

      const dir = path.join("public", "qr_codes");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join("public", "qr_codes", `${ticket_id}.png`);
      fs.writeFileSync(filePath, base64Data, "base64"); //decode this base64 string into binary (real image) before saving

      const qr_url = `${BASE_URL}/${FOLDER_URL}/${ticket_id}.png`;

      //save to DB    
      await db.query(
        "INSERT INTO tickets (ticket_id, order_id, event_id, qr_url) VALUES (?, ?, ?, ?)",
        [ticket_id, ntp_order_id, ntp_event_id, qr_url]
      );
    }   

    return res.json({
      ticket_id,
      order_id: ntp_order_id,
      event_id: ntp_event_id,
      qr_url
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//==============================================================
const verifyTicket= async (req, res) => { //takes ticket_id and event_id
  try {
    const { ticket_id, event_id } = req.body.data;

    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE ticket_id = ?",
      [ticket_id]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, message: "Ticket not found" });
    }

    const ticket = rows[0];
    const now = new Date();

    if (ticket.expires_at && new Date(ticket.expires_at) < now) return res.json({ valid: false, message: "Ticket expired" });

    if (ticket.event_id !== Number(event_id)) return res.json({ valid: false, message: "Wrong event" });

    if (ticket.status === "used") return res.json({ valid: false, message: "Ticket already used" });

    // mark as used
    await db.query(
      "UPDATE tickets SET status = 'used' WHERE ticket_id = ?",
      [ticket_id]
    );

    return res.json({ valid: true, message: "Ticket valid" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  dbTesting, dbNameTesting,
  createOrder, 
  paymentRecord,
  generateTicket,
  batchGenerateTicket,
  verifyTicket
};