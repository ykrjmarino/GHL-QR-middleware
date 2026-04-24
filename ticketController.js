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
const axios = require('axios');
//const lcAPI = require("./services/lcServices");
const { nanoid } = require('nanoid');
const fs = require("fs");
const path = require("path");

dotenv.config();

const port = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
const FOLDER_URL = process.env.FOLDER_URL || "qr_codes";

const LOCATION_ID = process.env.LOCATION_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CUSTOMFIELD_QR_ID = process.env.CUSTOMFIELD_QR_ID;
const CUSTOMFIELD_QR_KEY = process.env.CUSTOMFIELD_QR_KEY;

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
    const contact = req.body

    const ntp_order_ref = contact.customData?.ntp_order_ref;
    const ntp_event_id = contact.customData?.ntp_event_id;
    const ntp_total_amount = contact.customData?.ntp_total_amount;
    const ntp_quantity = contact.customData?.ntp_quantity;
    //const ntp_user_id = contact.customData?.ntp_user_id;
    //const contact_id = contact.contact_id;

    if (!ntp_order_ref || !ntp_event_id || !ntp_total_amount || !ntp_quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO orders (order_ref, event_id, total_amount, quantity, payment_status)
       VALUES (?, ?, ?, ?, ?)`,
      [ntp_order_ref, ntp_event_id, ntp_total_amount, ntp_quantity, 'pending']
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
    const contact = req.body

    const ntp_order_ref = contact.customData?.ntp_order_ref;
    const ntp_amount = contact.customData?.ntp_amount;
    const ntp_transaction_ref = contact.customData?.ntp_transaction_ref;
    const ntp_provider = contact.customData?.ntp_provider || 'GHL';//use value if received, otherwise default to 'GHL'

    if (!ntp_order_ref || !ntp_amount || !ntp_transaction_ref || !ntp_provider) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [order] = await db.query(
      "SELECT id FROM orders WHERE order_ref = ?",
      [ntp_order_ref]
    );

    const [existingPayment] = await db.query(
      "SELECT id FROM payments WHERE transaction_ref = ?",
      [ntp_transaction_ref]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
      const order_id = order[0].id; 
        //existing orders table primary key(PK) (id) = order.id
        //will pass this to payments table as foreign key(FK)

    if (existingPayment.length > 0) {
      return res.status(200).json({ message: "Payment already recorded", order_id });
    }
    await db.query( //update
      "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
      [order_id]
    );

    await db.query( //creation
      `INSERT INTO payments (order_id, provider, amount, payment_status, transaction_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, ntp_provider, ntp_amount, 'paid', ntp_transaction_ref]
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
    // const { contact, custom_objects } = req.body.data;
    //this if you want to get sa tickets object i think? not sure rn
    // const ntp_quantity = custom_objects.tickets.ntp_quantity;
    // const ntp_event_id = custom_objects.tickets.ntp_event_id;
    // const ntp_order_id = custom_objects.tickets.ntp_order_id;

    //this one is if you want to get the data directly from webhook custom data
    const contact = req.body
    const ntp_event_id = contact.customData?.ntp_event_id;
    const ntp_order_id = contact.customData?.ntp_order_id;
    const contact_id = contact.contact_id;

    
    const ntp_triggered_tag = contact.customData?.triggered_tag || 'TicketingProDefault';
    
    //check if data passed from req.body.data is existing
    if (!ntp_event_id || !ntp_order_id) {
      return res.status(400).json({ message: "Missing ntp_event_id or ntp_order_id" });
    }

    const [order] = await db.query(
      "SELECT payment_status FROM orders WHERE id = ?",
      [ntp_order_id]
    );

    const [event] = await db.query(
      "SELECT id, event_name FROM events WHERE id = ?",  //add event_name here
      [ntp_event_id]
    );

    const [[existingTicket]] = await db.query(
      "SELECT id FROM tickets WHERE order_id = ?",
      [ntp_order_id]
    );

    //checking variables
    if (event.length === 0) return res.status(404).json({ message: "Event not found" });

    if (order.length === 0) return res.status(404).json({ message: "Order not found" });

    if (order[0].payment_status !== "paid") return res.status(400).json({ message: "Order not paid" });

    if (existingTicket) return res.status(400).json({ message: "Ticket already generated for this order" }); 

    const ticket_id = `TKT-${nanoid(8)}`;
    console.log("ticket_id:", ticket_id);

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

      //=================WILL NOW POST IN GHL OBJECT(TICKETS)=================//
    try {
      const createResponse = await axios.post(
        `https://services.leadconnectorhq.com/objects/custom_objects.tickets/records`,
        {
          locationId: LOCATION_ID,
          properties: {
            "ticket_id": String(ticket_id),
            "qr_code_url": String(qr_url),
            "order_id": String(ntp_order_id),
            "event_id": String(ntp_event_id),
            "event_name": String(event[0].event_name),
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Version: '2021-07-28',
            Authorization: `Bearer ${ACCESS_TOKEN}`
          }
        }
      );
      console.log("====================================================");
      console.log("GHL create record success:", createResponse.data);
    } catch (error) {
      console.error(
        "GHL create record failed:",
        error.response?.data || error.message
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

const batchGenerateTicket = async (req, res) => {
  try {
    // const { contact, custom_objects } = req.body.data;
    // const ntp_quantity = custom_objects.tickets.ntp_quantity;
    // const ntp_event_id = custom_objects.tickets.ntp_event_id;
    // const ntp_order_id = custom_objects.tickets.ntp_order_id;

    // const ntp_event_id = contact.ntp_event_id;
    // const ntp_order_id = contact.ntp_order_id;
    // const contact_id = contact.id;

    //this one working in webhook and custom datas
    const contact = req.body
    const ntp_event_id = contact.customData?.ntp_event_id;
    const ntp_order_id = contact.customData?.ntp_order_id;
    const contact_id = contact.contact_id;
    
    const ntp_triggered_tag = contact.customData?.triggered_tag || 'TicketingProDefault';

    //check if data passed from req.body.data is existing
    if (!ntp_event_id || !ntp_order_id) {
      return res.status(400).json({ message: "Missing ntp_event_id or ntp_order_id" });
    }

    const [order] = await db.query(
      "SELECT payment_status FROM orders WHERE id = ?",
      [ntp_order_id]
    );

    const [[ticketCount]] = await db.query( //DITO YUNG MALIIII,,,, ONE PAYMENT ALWAYS FROM PAYMENT SO IT CANNOT BE MORE.. WE SHOULD HAVE QUANTITY FIELD!! 
      "SELECT COUNT (*) as count FROM payments WHERE order_id = ? AND payment_status = 'paid'",
      [ntp_order_id]
    );

    const [[existingTickets]] = await db.query(
      "SELECT COUNT (*) as count FROM tickets WHERE order_id = ?",
      [ntp_order_id]
    );

    const [event] = await db.query(
      "SELECT id, event_name FROM events WHERE id = ?",  //add event_name here
      [ntp_event_id]
    );

    const remaining = ticketCount.count - existingTickets.count

    if (remaining <= 0) {
      return res.status(200).json({
        message: "No new tickets to generate",
        count: 0,
        tickets: []
      });
    }

    console.log({
      paymentCount: ticketCount.count,
      existingCount: existingTickets.count,
      remaining
    });

    //checking variables
    if (event.length === 0) return res.status(404).json({ message: "Event not found" });

    if (order.length === 0) return res.status(404).json({ message: "Order not found" });

    if (order[0].payment_status !== "paid") return res.status(400).json({ message: "Order not paid" });

    const generatedTickets = [];

    //loop the tickets
    for (let i=0; i<remaining; i++) {
      const ticket_id = `TKT-${nanoid(8)}`;
      console.log("ticket_id:", ticket_id);

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
            //=================INSERTED THE DATA IN DATABASE=================//




        //=================WILL NOW POST IN GHL OBJECT(TICKETS)=================//
      try {
        const createResponse = await axios.post(
          `https://services.leadconnectorhq.com/objects/custom_objects.tickets/records`,
          {
            locationId: LOCATION_ID,
            properties: {
              "ticket_id": String(ticket_id),
              "qr_code_url": String(qr_url),
              "order_id": String(ntp_order_id),
              "event_id": String(ntp_event_id),
              "event_name": String(event[0].event_name),
              //add buyer name
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Version: '2021-07-28',
              Authorization: `Bearer ${ACCESS_TOKEN}`
            }
          }
        );
        console.log("====================================================");
        console.log("GHL create record success:", createResponse.data);
      } catch (error) {
        console.error(
          "GHL create record failed:",
          error.response?.data || error.message
        );
      }

      generatedTickets.push({
        ticket_id,
        order_id: ntp_order_id,
        event_id: ntp_event_id,
        qr_url
      });
      
    }   

    return res.json({
      // ticket_id,
      // order_id: ntp_order_id,
      // event_id: ntp_event_id,
      // qr_url
      count: generatedTickets.length,
      tickets: generatedTickets
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