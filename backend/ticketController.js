import { db } from './db.js';
import QRCode from "qrcode";
import { nanoid } from 'nanoid';

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
    const ticket = req.body.data;
    //const ticket_id = ticket.ticket_id;
    const event_id = ticket.event_id;

    const ticket_id = `TKT-${nanoid(8)}`;

    await db.query(
      "INSERT INTO tickets (ticket_id, event_id) VALUES (?, ?)",
      [ticket_id, event_id]
    );

    const qr = await QRCode.toDataURL(ticket_id);
    
    return res.json({
      ticket_id,
      event_id,
      qr,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//==============================================================
export const verifyTicket = async (req, res) => { 
  try {
    const { ticket_id } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE ticket_id = ?",
      [ticket_id]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, message: "Ticket not found" });
    }

    const ticket = rows[0];

    if (ticket.status === "used") {
      return res.json({ valid: false, message: "Ticket already used" });
    }

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
