const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { shopeeUrl, headers } = require('./shopeeConfig');
const { checkShopeePhone, closeBrowser } = require('./shopeeChecker'); // ✅ Import module mới

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API proxy endpoint
app.get('/api/tracking', async (req, res) => {
  try {
    const trackingNumber = req.query.spx_tn;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }
    
    const response = await axios.get(`https://spx.vn/shipment/order/open/order/get_order_info?spx_tn=${trackingNumber}&language_code=vi`);
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
});

// ✅ API MỚI: Kiểm tra số điện thoại bằng Puppeteer
app.post('/api/check-phone-puppeteer', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Số điện thoại là bắt buộc' 
    });
  }
  
  try {
    const result = await checkShopeePhone(phone);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra số điện thoại',
        error: result.message
      });
    }
    
    const exists = result.data?.data?.exist || false;
    
    return res.json({
      success: true,
      data: {
        phone: phone,
        exists: exists,
        message: exists ? 'Số điện thoại đã tồn tại trên Shopee' : 'Số điện thoại chưa đăng ký Shopee'
      }
    });
    
  } catch (error) {
    console.error('Error in check-phone-puppeteer:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra',
      error: error.message
    });
  }
});

// ✅ CẬP NHẬT: API find-number với Puppeteer
app.post('/api/find-number', async (req, res) => {
  const { carrier, prefix, phoneNumber } = req.body;

  const tryFindNumber = async () => {
    let phoneData = null;
    try {
      // Lấy số điện thoại từ API
      let chaycodesoUrl = 'https://funotp.com/api?action=number&service=shopee&apikey=8nbxrfxsd3houqekucrac1796pj4ak5w';
      if (prefix) {
        chaycodesoUrl += `&operator=${carrier}&prefix=${prefix}`;
      } else if (phoneNumber) {
        chaycodesoUrl += `&operator=${carrier}&number=${phoneNumber}`;
      } else {
        chaycodesoUrl += `&operator=${carrier}`;
      }

      const chaycodesoResponse = await axios.get(chaycodesoUrl);
      phoneData = chaycodesoResponse.data;

      if (!phoneData || !phoneData.Result) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy số điện thoại từ API.',
        });
      }

      const fullPhone = `84${phoneData.Result.number}`;
      
      // ✅ SỬ DỤNG PUPPETEER thay vì gọi API trực tiếp
      console.log(`🔍 Checking ${fullPhone} with Puppeteer...`);
      
      const shopeeResult = await checkShopeePhone(fullPhone);
      
      if (shopeeResult.error) {
        throw new Error(shopeeResult.message);
      }
      
      const exists = shopeeResult.data?.data?.exist || false;

      // Nếu số đã tồn tại trên Shopee
      if (exists) {
        // Hủy số
        let chaycodesoexpired = `https://app.myclientsoft.cc/api?apikey=8nbxrfxsd3houqekucrac1796pj4ak5w&action=cancel-service&id=${phoneData.Result.id}`;
        await axios.get(chaycodesoexpired);

        // Retry nếu không chỉ định số cụ thể
        if (!phoneNumber) {
          console.log('⚠️ Phone exists, retrying...');
          return await tryFindNumber();
        } else {
          return res.status(500).json({
            success: false,
            message: 'Số điện thoại này đã tồn tại trên Shopee!',
          });
        }
      } else {
        // Số chưa tồn tại - thành công
        return res.status(200).json({
          success: true,
          message: 'Tìm kiếm thành công!',
          data: {
            phone: phoneData.Result.number,
          },
        });
      }
    } catch (error) {
      console.error('Error processing request:', error.message);
      
      if (phoneData && phoneData.Result) {
        let chaycodesoexpired = `https://app.myclientsoft.cc/api?apikey=8nbxrfxsd3houqekucrac1796pj4ak5w&action=cancel-service&id=${phoneData.Result.id}`;
        await axios.get(chaycodesoexpired);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        error: error.message,
      });
    }
  };

  await tryFindNumber();
});

// ✅ CẬP NHẬT: find-number-only với Puppeteer
app.post('/api/find-number-only', async (req, res) => {
  const { phoneNumber } = req.body;

  const numbersToCheck = [];
  const phoneNumberStr = phoneNumber.toString().replace(/\D/g, '');

  if (phoneNumberStr.length === 9) {
    numbersToCheck.push(phoneNumberStr);
  } else if (phoneNumberStr.length > 9) {
    for (let i = 0; i < phoneNumberStr.length; i += 9) {
      const chunk = phoneNumberStr.slice(i, i + 9);
      if (chunk.length === 9) {
        numbersToCheck.push(chunk);
      }
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại phải có ít nhất 9 chữ số.',
    });
  }

  if (numbersToCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Không có số điện thoại hợp lệ để kiểm tra.',
    });
  }

  const results = [];
  
  // ✅ Kiểm tra từng số bằng Puppeteer
  for (const number of numbersToCheck) {
    try {
      const fullPhone = `84${number}`;
      console.log(`🔍 Checking ${fullPhone} with Puppeteer...`);
      
      const shopeeResult = await checkShopeePhone(fullPhone);
      
      if (shopeeResult.error) {
        results.push({
          phone: number,
          exists: null,
          message: 'Đã có lỗi xảy ra khi kiểm tra số này.',
        });
      } else {
        const exists = shopeeResult.data?.data?.exist || false;
        results.push({
          phone: number,
          exists: exists,
          message: exists ? 'Số này đã tồn tại trên Shopee.' : 'Số này chưa tồn tại trên Shopee.',
        });
      }
      
    } catch (error) {
      console.error(`Error checking number ${number}:`, error.message);
      results.push({
        phone: number,
        exists: null,
        message: 'Đã có lỗi xảy ra khi kiểm tra số này.',
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Kiểm tra số điện thoại hoàn tất.',
    data: results,
  });
});

// find-number-option2 cũng tương tự...
app.post('/api/find-number-option2', async (req, res) => {
  const { carrier, prefix, phoneNumber } = req.body;

  const tryFindNumber = async () => {
    let phoneData = null;
    try {
      let apiUrl = 'https://ironsim.com/api/phone/new-session?token=2q7gezke8644i9ebh6ns5uyj0kfwaex8&service=422';
      if (prefix) {
        apiUrl += `&network=${carrier}&prefix=${prefix}`;
      } else if (phoneNumber) {
        apiUrl += `&network=${carrier}&number=${phoneNumber}`;
      } else {
        apiUrl += `&network=${carrier}`;
      }
      
      const apiResponse = await axios.get(apiUrl);
      phoneData = apiResponse.data;
      
      if (!phoneData || !phoneData.data) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy số điện thoại từ API.',
        });
      }

      const fullPhone = `84${phoneData.data.phone_number}`;
      
      // ✅ Dùng Puppeteer
      const shopeeResult = await checkShopeePhone(fullPhone);

      
      if (shopeeResult.error) {
        throw new Error(shopeeResult.message);
      }
      
      const exists = shopeeResult.data?.data?.exist || false;
      
      if (exists) {
        let expiredUrl = `https://ironsim.com/api/session/cancel?token=2q7gezke8644i9ebh6ns5uyj0kfwaex8&session=${phoneData.data.session}`;
        await axios.get(expiredUrl);

        if (!phoneNumber) {
          return await tryFindNumber();
        } else {
          return res.status(500).json({
            success: false,
            message: 'Số điện thoại này đã tồn tại!',
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          message: 'Tìm kiếm thành công!',
          data: {
            phone: phoneData.data.phone_number,
          },
        });
      }
    } catch (error) {
      console.error('Error processing request:', error.message);
      if (phoneData && phoneData.data) {
        let expiredUrl = `https://ironsim.com/api/session/cancel?token=2q7gezke8644i9ebh6ns5uyj0kfwaex8&session=${phoneData.data.session}`;
        await axios.get(expiredUrl);
      }
      return res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        error: error.message,
      });
    }
  };

  await tryFindNumber();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/uptime', (req, res) => {
  res.json({ "status": "ok" });
});

// ✅ Graceful shutdown - đóng browser khi server tắt
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await closeBrowser();
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down...');
  await closeBrowser();
  process.exit();
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
