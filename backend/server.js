import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { generateQR } from './QR.js';

dotenv.config(); 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/ticket/generate', generateQR);


app.get("/", (req, res) => res.send("Backend is running QR proj"));

app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port} (ykrjm2026)`);
});