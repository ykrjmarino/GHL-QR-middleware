import { db } from './db.js';
import QRCode from "qrcode";
import { nanoid } from 'nanoid';
import { bucket } from './firebase.js';

//==============================================================
//GET 
export const dbTesting = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM tickets");
  console.log(rows);

  return res.json(rows);
}

export const testFirebase = async (req, res) => {
  const [files] = await bucket.getFiles();
  console.log(files);
  res.send("Firebase connected");
};

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

export const uploadQR = async (buffer, fileName) => {
  const file = bucket.file(`qr/${fileName}.png`);

  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
    },
  });

  // make it public
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/qr/${fileName}.png`;

  return publicUrl;
};