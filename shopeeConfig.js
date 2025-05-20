// shopeeConfig.js
const shopeeUrl = 'https://mall.shopee.vn/api/v4/account/basic/check_account_exist';

const headers = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Shopee-Http-Dns-Mode': '1',
  'X-Shopee-Client-Timezone': 'Asia/Ho_Chi_Minh',
  'Cache-Control': 'no-cache, no-store',
  'Client-Request-Id': '92710500-0410-40cb-baa5-ca1c1e01a4ba.249',
  'X-Csrftoken': 'mBdO9J4eBuU2Jf1qx0i6oFqbJUXQyL05',
  'User-Agent': 'okhttp/3.12.4 app_type=1 platform=native_android os_ver=30 appver=34426 Cronet/102.0.5005.61',
  'Cookie': 'userid=0; shopid=0; username=null; shopee_token=null; language=vi; ...',
  'X-Sap-Ri': '736103685e968617e536761e01ef14c422169b0a7efb8f2f3e17',
  'Af-Ac-Enc-Sz-Token': 'ZEWApdJl/...',
  'Referer': 'https://mall.shopee.vn/',
  'Accept-Encoding': 'gzip, deflate, br',
};

module.exports = { shopeeUrl, headers };
