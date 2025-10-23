// shopeeChecker.js
const puppeteer = require('puppeteer');

let browser = null;
let isInitializing = false;

async function getBrowser() {
  if (browser) return browser;
  
  if (isInitializing) {
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
      executablePath: '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
        '--disable-features=VizDisplayCompositor' // ✅ Thêm để giảm RAM
      ]
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

async function checkShopeePhone(phoneNumber) {
  let page = null;
  
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();
    
    // ✅ Set timeout dài hơn cho page
    page.setDefaultNavigationTimeout(60000); // 60 giây thay vì 30s
    page.setDefaultTimeout(60000);
    
    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });
    
    console.log(`📞 Checking phone: ${phoneNumber}`);
    
    // ✅ Đổi sang 'domcontentloaded' - nhanh hơn networkidle2
    await page.goto('https://shopee.vn/buyer/reset?scenario=7', {
      waitUntil: 'domcontentloaded', // Thay vì 'networkidle2'
      timeout: 60000
    });
    
    // ✅ Đợi thêm 2s để trang load xong
    await page.waitForTimeout(2000);
    
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
    
    console.log(`✅ Check completed for ${phoneNumber}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error checking phone:', error.message);
    
    // ✅ Retry logic với load event
    if (error.message.includes('timeout') || error.message.includes('Navigation')) {
      console.log('⚠️ Timeout, retrying with "load" event...');
      
      try {
        await page.goto('https://shopee.vn/buyer/reset?scenario=7', {
          waitUntil: 'load',
          timeout: 60000
        });
        
        await page.waitForTimeout(2000);
        
        const result = await page.evaluate(async (phone) => {
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
          
          return {
            status: response.status,
            data: await response.json()
          };
        }, phoneNumber);
        
        console.log(`✅ Retry successful for ${phoneNumber}`);
        return result;
        
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
        throw retryError;
      }
    }
    
    throw error;
    
  } finally {
    if (page) {
      await page.close();
    }
  }
}

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
