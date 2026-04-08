const express = require('express');
const dotenv = require('dotenv');
const { dbTesting, createTicket, verifyTicket } = require('./ticketController');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get('/dbtest', dbTesting);

app.post('/ticket/generate', createTicket); //create ticket and generate QR code
app.post('/ticket/verify', verifyTicket); //verify if valid and used


app.get("/", (req, res) => res.send("Backend is running QR proj"));

app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port} (ykrjm2026)`);
});