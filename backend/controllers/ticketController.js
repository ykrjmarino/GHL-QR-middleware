import { db } from '../db.js';
import QRCode from "qrcode";

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
    const ticket_id = ticket.ticket_id;
    const event_id = ticket.event_id;

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
