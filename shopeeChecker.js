// shopeeChecker.js
const puppeteer = require('puppeteer');

let browser = null;
let isInitializing = false;

// Khởi tạo browser (singleton)
async function getBrowser() {
  if (browser) return browser;
  
  if (isInitializing) {
    // Đợi browser khởi tạo xong
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return browser;
  }
  
  isInitializing = true;
  
  try {
    console.log('🚀 Starting browser...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process' // Quan trọng cho Render free tier
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
                      puppeteer.executablePath()
    });
    
    console.log('✅ Browser started successfully');
    isInitializing = false;
    return browser;
    
  } catch (error) {
    console.error('❌ Failed to start browser:', error);
    isInitializing = false;
    throw error;
  }
}

// Kiểm tra số điện thoại Shopee
async function checkShopeePhone(phoneNumber) {
  let page = null;
  
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();
    
    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });
    
    console.log(`📞 Checking phone: ${phoneNumber}`);
    
    // Load Shopee
    await page.goto('https://shopee.vn/buyer/reset?scenario=7', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Execute API call trong context của Shopee
    const result = await page.evaluate(async (phone) => {
      try {
        const csrf = (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';
        
        const response = await fetch('/api/v4/account/basic/check_account_exist', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
            'x-api-source': 'pc',
            'x-csrftoken': csrf
          },
          body: JSON.stringify({ phone, scenario: 2 })
        });
        
        const data = await response.json();
        
        return {
          status: response.status,
          data: data
        };
        
      } catch (error) {
        return {
          error: true,
          message: error.message
        };
      }
    }, phoneNumber);
    
    console.log(`✅ Check completed for ${phoneNumber}:`, result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error checking phone:', error.message);
    throw error;
    
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Cleanup khi shutdown
async function closeBrowser() {
  if (browser) {
    console.log('🛑 Closing browser...');
    await browser.close();
    browser = null;
  }
}

module.exports = {
  checkShopeePhone,
  closeBrowser
};
