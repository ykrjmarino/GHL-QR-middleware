const express = require('express');
const dotenv = require('dotenv');
const { dbTesting, verifyTicket, dbNameTesting, generateTicket, createOrder, paymentRecord } = require('./ticketController');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get('/dbtest', dbTesting);
app.get('/dbnametest', dbNameTesting); 

app.post('/order/create', createOrder); //create order and record payment details... happens when user clicks checkout
app.post('/payment/record', paymentRecord); //record payment details... happens when payment is successful, then you can update order status to 'paid'
app.post('/ticket/generate', generateTicket); //create ticket and generate QR code... happens after payment is successful, you can generate ticket(s) linked to the order and event
app.post('/ticket/verify', verifyTicket); //verify if valid and used... happens when QR code is scanned at the event entrance, you can check if the ticket is valid and mark it as used

app.get("/", (req, res) => res.send("Backend is running QR proj"));

app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port} (ykrjm2026)`);
});