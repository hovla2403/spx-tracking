const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Cho phép CORS từ frontend của bạn
app.use(cors({
  origin: 'http://localhost:3000',  // URL frontend của bạn
  credentials: true
}));

app.use(express.json());

app.post('/api/check-shopee-account', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const response = await axios.post(
      'https://shopee.vn/api/v4/account/basic/check_account_exist',
      { phone, scenario: 2 },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-api-source': 'pc',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://shopee.vn/buyer/reset?scenario=7'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
});
