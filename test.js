const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Pool browser instances để tái sử dụng
let browserPool = [];
const POOL_SIZE = 3;

async function initBrowserPool() {
  console.log('🚀 Initializing browser pool...');
  
  for (let i = 0; i < POOL_SIZE; i++) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Bypass detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    // Load Shopee để khởi tạo SDK
    await page.goto('https://shopee.vn/buyer/reset?scenario=7', {
      waitUntil: 'networkidle2'
    });
    
    browserPool.push({ browser, page, busy: false });
    console.log(`✅ Browser ${i + 1} ready`);
  }
}

async function getBrowser() {
  // Tìm browser không bận
  let instance = browserPool.find(b => !b.busy);
  
  if (!instance) {
    // Nếu tất cả bận, đợi 1s rồi thử lại
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getBrowser();
  }
  
  instance.busy = true;
  return instance;
}

function releaseBrowser(instance) {
  instance.busy = false;
}

// API endpoint
app.post('/api/check-shopee-account', async (req, res) => {
  const { phone } = req.body;
  let browserInstance = null;
  
  try {
    console.log(`📞 Checking phone: ${phone}`);
    
    browserInstance = await getBrowser();
    const { page } = browserInstance;
    
    // Execute fetch trong context của Shopee
    const result = await page.evaluate(async (phoneNumber) => {
      try {
        // Lấy CSRF token từ cookie
        const csrf = (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';
        
        // SDK của Shopee sẽ tự động tạo x-sap-ri và x-sap-sec
        const response = await fetch('/api/v4/account/basic/check_account_exist', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
            'x-api-source': 'pc',
            'x-csrftoken': csrf
          },
          body: JSON.stringify({ phone: phoneNumber, scenario: 2 })
        });
        
        return {
          status: response.status,
          data: await response.json()
        };
        
      } catch (error) {
        return {
          error: true,
          message: error.message
        };
      }
    }, phone);
    
    console.log(`✅ Success:`, result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
    
  } finally {
    if (browserInstance) {
      releaseBrowser(browserInstance);
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  const availableBrowsers = browserPool.filter(b => !b.busy).length;
  res.json({ 
    status: 'OK', 
    availableBrowsers,
    totalBrowsers: POOL_SIZE
  });
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('🛑 Closing browsers...');
  for (const instance of browserPool) {
    await instance.browser.close();
  }
  process.exit();
});

// Start server
const PORT = 3001;
initBrowserPool().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎯 Server running on http://localhost:${PORT}`);
    console.log(`📝 Health: http://localhost:${PORT}/health`);
    console.log(`🔥 API: POST http://localhost:${PORT}/api/check-shopee-account\n`);
  });
});
