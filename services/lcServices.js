const axios = require('axios');

const lcAPI = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {   
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Version: '2021-07-28',
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
  }
});   

export default lcAPI;