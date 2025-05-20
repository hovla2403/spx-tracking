const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { shopeeUrl, headers } = require('./shopeeConfig');

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

app.post('/api/find-number', async (req, res) => {
 const { carrier, prefix, phoneNumber } = req.body;

      const tryFindNumber = async () => {
            let phoneData = null;
            try {
                  // Construct the chaycodeso3.com API URL based on input
                  // let chaycodesoUrl = 'https://chaycodeso3.com/api?act=number&apik=480ff3b0a20e990c&appId=1002';
                  let chaycodesoUrl = 'https://funotp.com/api?action=number&service=shopee&apikey=8nbxrfxsd3houqekucrac1796pj4ak5w';
                  if (prefix) {
                        chaycodesoUrl += `&operator=${carrier}&prefix=${prefix}`;
                  } else if (phoneNumber) {
                        chaycodesoUrl += `&operator=${carrier}&number=${phoneNumber}`;
                  } else {
                        chaycodesoUrl += `&operator=${carrier}`;
                  }
                  // Call chaycodeso3.com API to get phone number
                  const chaycodesoResponse = await axios.get(chaycodesoUrl);
                  phoneData = chaycodesoResponse.data;
                  // Check if phone number was returned
                  if (!phoneData || !phoneData.Result) {
                        return res.status(400).json({
                              success: false,
                              message: 'Không tìm thấy số điện thoại từ API chaycodeso3.',
                        });
                  }

                  // Prepare Shopee API payload with phone number from chaycodeso3
                  const shopeePayload = {
                        phone: `${phoneData.Result.number}`,
                        scenario: 3,
                  };

                  // Call Shopee API
                  const shopeeResponse = await axios.post(shopeeUrl, shopeePayload, { headers });
                  // Check if the phone number exists in Shopee
                  if (shopeeResponse.data.data.exist === true) {
                        // Mark the phone number as expired in chaycodeso3
                        // let chaycodesoexpired = `https://chaycodeso3.com/api?act=expired&apik=480ff3b0a20e990c&id=${phoneData.Result.Id}`;
                        // await axios.get(chaycodesoexpired);
                        let chaycodesoexpired = `https://app.myclientsoft.cc/api?apikey=8nbxrfxsd3houqekucrac1796pj4ak5w&action=cancel-service&id=${phoneData.Result.id}`;

                        await axios.get(chaycodesoexpired);

                        // Retry the process by calling tryFindNumber again
                        if (!phoneNumber) {
                              return await tryFindNumber();
                        } else {
                              return res.status(500).json({
                                    success: false,
                                    message: 'Phone exist!',
                                    error: error.message,
                              });
                        }
                  } else {
                        // If the phone number does not exist, return success
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
                  // let chaycodesoexpired = `https://chaycodeso3.com/api?act=expired&apik=480ff3b0a20e990c&id=${phoneData.Result.Id}`;
                  // await axios.get(chaycodesoexpired);
                  let chaycodesoexpired = `https://app.myclientsoft.cc/api?apikey=8nbxrfxsd3houqekucrac1796pj4ak5w&action=cancel-service&id=${phoneData.Result.id}`;
                  await axios.get(chaycodesoexpired);
                  return res.status(500).json({
                        success: false,
                        message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
                        error: error.message,
                  });
            }
      };

      // Start the process
      await tryFindNumber();
});
app.post('/api/find-number-only', async (req, res) => {
  const { phoneNumber } = req.body;

 // Split the input into 9-digit chunks
  const numbersToCheck = [];
  const phoneNumberStr = phoneNumber.toString().replace(/\D/g, ''); // Remove non-digits (just to be safe)

  // If the input is exactly 9 digits, add it directly
  if (phoneNumberStr.length === 9) {
    numbersToCheck.push(phoneNumberStr);
  } else if (phoneNumberStr.length > 9) {
    // Split into 9-digit chunks
    for (let i = 0; i < phoneNumberStr.length; i += 9) {
      const chunk = phoneNumberStr.slice(i, i + 9);
      // Only add chunks that are exactly 9 digits (ignore leftovers)
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

  // Shopee API configuration
  
  const results = [];
  // Check each 9-digit number
  for (const number of numbersToCheck) {
    try {
      const shopeePayload = {
        phone: `84${number}`, // Add country code
        scenario: 3,
      };

      const shopeeResponse = await axios.post(shopeeUrl, shopeePayload, { headers });

      if (shopeeResponse.data.data && typeof shopeeResponse.data.data.exist === 'boolean') {
        results.push({
          phone: number,
          exists: shopeeResponse.data.data.exist,
          message: shopeeResponse.data.data.exist ? 'Số này đã tồn tại trên Shopee.' : 'Số này chưa tồn tại trên Shopee.',
        });
      } else {
        results.push({
          phone: number,
          exists: null,
          message: 'Không thể kiểm tra số này. Phản hồi từ Shopee không hợp lệ.',
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
  // Return the results
  return res.status(200).json({
    success: true,
    message: 'Kiểm tra số điện thoại hoàn tất.',
    data: results,
  });
});

app.post('/api/find-number-only', async (req, res) => {
  const { phoneNumber } = req.body;

 // Split the input into 9-digit chunks
  const numbersToCheck = [];
  const phoneNumberStr = phoneNumber.toString().replace(/\D/g, ''); // Remove non-digits (just to be safe)

  // If the input is exactly 9 digits, add it directly
  if (phoneNumberStr.length === 9) {
    numbersToCheck.push(phoneNumberStr);
  } else if (phoneNumberStr.length > 9) {
    // Split into 9-digit chunks
    for (let i = 0; i < phoneNumberStr.length; i += 9) {
      const chunk = phoneNumberStr.slice(i, i + 9);
      // Only add chunks that are exactly 9 digits (ignore leftovers)
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
  // Check each 9-digit number
  for (const number of numbersToCheck) {
    try {
      const shopeePayload = {
        phone: `84${number}`, // Add country code
        scenario: 3,
      };

      const shopeeResponse = await axios.post(shopeeUrl, shopeePayload, { headers });

      if (shopeeResponse.data.data && typeof shopeeResponse.data.data.exist === 'boolean') {
        results.push({
          phone: number,
          exists: shopeeResponse.data.data.exist,
          message: shopeeResponse.data.data.exist ? 'Số này đã tồn tại trên Shopee.' : 'Số này chưa tồn tại trên Shopee.',
        });
      } else {
        results.push({
          phone: number,
          exists: null,
          message: 'Không thể kiểm tra số này. Phản hồi từ Shopee không hợp lệ.',
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
  // Return the results
  return res.status(200).json({
    success: true,
    message: 'Kiểm tra số điện thoại hoàn tất.',
    data: results,
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// ===========================
// 📦 LOWDB SETUP
// ===========================
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ orders: [] }).write();

// ===========================
// 🤖 TELEGRAM BOT
// ===========================
const config = require('./config.json'); // Tạo file config.json chứa telegram_token
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.telegram_token, { polling: true });

// Nhận mã vận đơn từ Telegram
bot.onText(/\/d (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim();
  const [id, ...noteParts] = input.split(' ');
  const note = noteParts.join(' ').trim();

  if (!/^SPXVN.+$/i.test(id)) {
    return bot.sendMessage(chatId, '❌ Mã vận đơn phải bắt đầu bằng SPXVN.');
  }

  const exists = db.get('orders').find({ id, user_id: chatId }).value();
  if (exists) {
    return bot.sendMessage(chatId, `⚠️ Bạn đã theo dõi mã vận đơn này.`);
  }

  // Lấy trạng thái hiện tại của đơn
  const info = await getLatestTrackingInfo(id);
  const lastCode = info?.code;
  const description = info?.description || 'Không có mô tả trạng thái';
  const noteText = note ? `📝 ${note}\n` : '';

  // ✅ Xử lý theo từng loại trạng thái:
  if (lastCode === 'F980') {
    return bot.sendMessage(chatId, `✅ Đơn hàng ${id} đã giao trước đó!\n${noteText}📄 ${description}\n⏹️ Không cần theo dõi nữa.`);
  }

  if (lastCode === 'F585' || lastCode === 'F950') {
    return bot.sendMessage(chatId, `❌ Đơn hàng ${id} đã bị hủy!\n${noteText}📄 ${description}\n⏹️ Không cần theo dõi nữa.`);
  }

  if (lastCode === 'F001') {
    bot.sendMessage(chatId, `⚠️ Đơn hàng ${id} chưa lấy được!\n${noteText}📄 ${description}\n⏳ Sẽ kiểm tra lại sau 24h.`);
  }

  if (lastCode === 'F600') {
    bot.sendMessage(chatId, `🚚 Đơn hàng ${id} đang được giao:\n${noteText}📄 ${description}`);
  }

  // ✅ Thêm vào DB nếu không bị loại
  db.get('orders')
    .push({
      id,
      user_id: chatId,
      note,
      last_code: lastCode,
      nextCheck: Date.now() + (
        lastCode === 'F001' ? 24 * 60 * 60 * 1000 :
        lastCode === 'F600' ? 5 * 60 * 1000 :
        60 * 60 * 1000
      )
    })
    .write();

  bot.sendMessage(chatId, `✅ Đã thêm mã vận đơn: ${id} vào danh sách theo dõi.`);
});

bot.onText(/\/l/, (msg) => {
  const chatId = msg.chat.id;

  const orders = db.get('orders')
    .filter({ user_id: chatId })
    .value();

  if (orders.length === 0) {
    return bot.sendMessage(chatId, '📭 Bạn chưa theo dõi mã vận đơn nào.');
  }

  const list = orders.map((o, i) => 
    `${i + 1}. ${o.id}${o.note ? ` 📝 ${o.note}` : ''}`
  ).join('\n');

  bot.sendMessage(chatId, `📋 Danh sách mã bạn đang theo dõi:\n\n${list}`);
});

bot.onText(/\/x (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const idToDelete = match[1].trim();

  const exists = db.get('orders')
    .find({ id: idToDelete, user_id: chatId })
    .value();

  if (!exists) {
    return bot.sendMessage(chatId, `⚠️ Không tìm thấy mã ${idToDelete} trong danh sách của bạn.`);
  }

  db.get('orders')
    .remove({ id: idToDelete, user_id: chatId })
    .write();

  bot.sendMessage(chatId, `🗑️ Đã xóa mã vận đơn ${idToDelete} khỏi danh sách theo dõi.`);
});


// Lệnh /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const welcomeMsg = `
👋 Xin chào ${msg.from.first_name || 'bạn'}!

🤖 Tôi là bot theo dõi đơn hàng giao vận.

Bạn có thể chọn một hành động dưới đây 👇 hoặc dùng lệnh thủ công:
- /d SPXVNxxxxx Ghi chú
- /l
- /x SPXVNxxxxx
  `;

  // bot.sendMessage(chatId, welcomeMsg, {
  //   reply_markup: {
  //     keyboard: [
  //       ['➕ Thêm mã đơn hàng'],
  //       ['📋 Danh sách mã đang theo dõi'],
  //       ['🗑️ Xóa mã đơn hàng']
  //     ],
  //     resize_keyboard: true,
  //     one_time_keyboard: false
  //   }
  // });
});
// 📦 Hàm lấy trạng thái đơn
async function getLatestTrackingInfo(orderId) {
  try {
    const res = await axios.get(`https://spx-tracking.onrender.com/api/tracking?spx_tn=${orderId}`);
    const records = res.data?.data?.sls_tracking_info?.records;
    if (!records || !records.length) return null;

    const latest = records.sort((a, b) => b.actual_time - a.actual_time)[0];
    return {
      code: latest.tracking_code,
      description: latest.description,
      timestamp: latest.actual_time
    };
  } catch (e) {
    console.error(`❌ Lỗi API đơn ${orderId}:`, e.message);
    return null;
  }
}
// ✅ Kiểm tra đơn
async function checkOrder(order) {
  const info = await getLatestTrackingInfo(order.id);
  if (!info) return null;

  const { code, description } = info;
  const noteText = order.note ? `📝 ${order.note}\n` : '';

  const userId = order.user_id;

  switch (code) {
    case 'F980':
      bot.sendMessage(userId, `✅ Đơn hàng ${order.id} đã giao thành công!\n${noteText}📄 ${description}\n🗑️ Đã xóa khỏi danh sách.`);
      db.get('orders').remove({ id: order.id, user_id: userId }).write();
      break;

    case 'F585':
    case 'F950':
      bot.sendMessage(userId, `❌ Đơn hàng ${order.id} đã bị hủy!\n${noteText}📄 ${description}\n🗑️ Đã xóa khỏi danh sách.`);
      db.get('orders').remove({ id: order.id, user_id: userId }).write();
      break;

    case 'F001':
      // Thông báo nếu chưa báo hoặc có thay đổi
      if (order.last_code !== 'F001') {
        bot.sendMessage(userId, `⚠️ Không lấy được hàng cho đơn ${order.id}!\n${noteText}📄 ${description}`);
      }
      db.get('orders').find({ id: order.id, user_id: userId }).assign({ last_code: 'F001' }).write();
      return 24 * 60 * 60 * 1000; // 24 giờ


    case 'F600':
      // Chỉ thông báo nếu code thay đổi hoặc chưa từng thông báo
      if (order.last_code !== 'F600') {
        bot.sendMessage(userId, `🚚 Đơn hàng ${order.id} đang được giao:\n${noteText}📄 ${description}`);
      }
      db.get('orders').find({ id: order.id, user_id: userId }).assign({ last_code: 'F600' }).write();
      return 5 * 60 * 1000;

    default:
      db.get('orders').find({ id: order.id, user_id: userId }).assign({ last_code: code }).write();
      return 60 * 60 * 1000;
  }

  return null;
}

// 🔁 Lập lịch kiểm tra
function scheduleChecks() {
  setInterval(async () => {
    const now = Date.now();
    const orders = db.get('orders').value();

    for (const order of orders) {
      if (order.nextCheck && order.nextCheck > now + 500) continue;

      const delay = await checkOrder(order);
      if (delay) {
        db.get('orders').find({ id: order.id, user_id: order.user_id }).assign({ nextCheck: now + delay }).write();
      }
    }
  }, 60 * 1000); // Kiểm tra mỗi phút
}

scheduleChecks();

// ===========================
// 🌐 API thêm đơn qua Web
// ===========================
app.post('/api/add-tracking', (req, res) => {
  const { id, user_id, note = '' } = req.body;

if (!/^SPXVN.+$/i.test(id)) {
return bot.sendMessage(chatId, '❌ Mã vận đơn phải bắt đầu bằng SPXVN.');
}

  if (!user_id) {
    return res.status(400).json({ error: 'Thiếu user_id (Telegram chat_id)' });
  }

  const exists = db.get('orders')
    .find({ id, user_id })
    .value();

  if (exists) {
    return res.status(409).json({ error: '⚠️ Mã vận đơn đã tồn tại cho user này.' });
  }

   db.get('orders')
    .push({ id, user_id, status: 'dang_giao', note })
    .write();

  res.json({
    message: '✅ Đã thêm mã vận đơn thành công',
    id,
    user_id,
    note
  });
});


// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
