// import {db} from '../../db.js';
// import bcrypt from 'bcryptjs';
// import { logAction } from '../../utils/logAction.js';
import QRCode from 'qrcode';

export const generateQR = async (req, res) => {
  console.log("Received ticket data");
  
  const ticket = req.body.data;
  const ticket_id = ticket.ticket_id;
  const event_id = ticket.envent_id;

  try {
    const { ticket_id, event_id } = req.body.data;

    // build QR content
    const qrContent = `event_id:${event_id}|ticket_id:${ticket_id}`;

    // generate QR as base64 image
    const qrImage = await QRCode.toDataURL(qrContent);

    // return QR
    res.json({ qr: qrImage });

  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }

  










/*  const actorId = req.user.userId
  const { userId } = req.params;
  let { first_name, last_name, middle_initial, school_id, password, role, email } = req.body;

  // capitalize first letter of first and last name
  first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1).toLowerCase();
  last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1).toLowerCase();
  middle_initial = middle_initial.toUpperCase();

  if (!school_id) return res.status(400).json({ error: 'Missing school ID' });

  try {
    const saltRounds = 5;
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    //check email if used or not
    const checkEmail = await db.query (`SELECT * FROM users WHERE email = $1`, [email]);

    //check school_id if used or not
    const checkSchoolId = await db.query (`SELECT * FROM users WHERE school_id = $1`, [school_id]);

    if (checkEmail.rows.length > 0) return res.status(400).json({error: 'Email is already used.'})

    if (checkSchoolId.rows.length > 0) return res.status(400).json({error: 'School ID already used.'})

    if (!strongPassword.test(password)) return res.status(400).json({error:"Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character."});

    const hash = await bcrypt.hash(password, saltRounds);
    
    await db.query(`
      INSERT INTO users (email, password, first_name, last_name, middle_initial, school_id, role ) VALUES ($1, $2, $3 ,$4 ,$5 ,$6, $7) RETURNING *
    `, [email, hash, first_name, last_name, middle_initial, school_id, role]); //changed password to hash (hashed password)

    const roleDescription =
      role === "student"
      ? "a Student Account"
      : role === "admin"
      ? "an Admin Account"
      : "a Co-Superadmin Account";

    await logAction(actorId, `Created ${roleDescription}`, school_id);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
  console.error("updateUser failed:", err.message);
  res.status(500).json({ error: err.message });
  }
*/
};