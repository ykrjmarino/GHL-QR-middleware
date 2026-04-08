import { db } from './db.js';
import dotenv from 'dotenv';
import QRCode from "qrcode";
import { nanoid } from 'nanoid';
import fs from "fs";
import path from "path";

dotenv.config();

const port = process.env.PORT || 3000;

//==============================================================
//GET 
export const dbTesting = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM tickets");
  console.log(rows);

  return res.json(rows);
}

//==============================================================
//POST
export const createTicket = async (req, res) => {
  console.log("Received ticket data");

  try {
    const { event_id } = req.body.data;

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

    const qr_url = `http://localhost:${port}/qr_codes/${ticket_id}.png`;

    //save to DB    
    await db.query(
      "INSERT INTO tickets (ticket_id, event_id, qr_url) VALUES (?, ?, ?)",
      [ticket_id, event_id, qr_url]
    );

    return res.json({
      ticket_id,
      event_id,
      qr_url,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


//==============================================================
export const verifyTicket = async (req, res) => { //takes ticket_id and event_id
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
