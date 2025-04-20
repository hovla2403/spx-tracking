const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

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
    try {
      // Construct the chaycodeso3.com API URL based on input
      let chaycodesoUrl = 'https://chaycodeso3.com/api?act=number&apik=480ff3b0a20e990c&appId=1002';
      if (prefix) {
        chaycodesoUrl += `&carrier=${carrier}&prefix=${prefix}`;
      } else if (phoneNumber) {
        chaycodesoUrl += `&carrier=${carrier}&number=${phoneNumber}`;
      } else {
        chaycodesoUrl += `&carrier=${carrier}`;
      }
      // Call chaycodeso3.com API to get phone number
      const chaycodesoResponse = await axios.get(chaycodesoUrl);
      let phoneData = chaycodesoResponse.data;

      // Check if phone number was returned
      if (!phoneData || !phoneData.Result) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy số điện thoại từ API chaycodeso3.',
        });
      }

      // Shopee API configuration
      const shopeeUrl = 'https://mall.shopee.vn/api/v4/account/basic/check_account_exist';
      const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Shopee-Http-Dns-Mode': '1',
        'X-Shopee-Client-Timezone': 'Asia/Ho_Chi_Minh',
        'Cache-Control': 'no-cache, no-store',
        'Client-Request-Id': '92710500-0410-40cb-baa5-ca1c1e01a4ba.249',
        'X-Csrftoken': 'mBdO9J4eBuU2Jf1qx0i6oFqbJUXQyL05',
        'User-Agent': 'okhttp/3.12.4 app_type=1 platform=native_android os_ver=30 appver=34426 Cronet/102.0.5005.61',
        'Cookie': (
          'userid=0; shopid=0; username=null; shopee_token=null; ' +
          'UA=Shopee%20Android%20Beeshop%20locale%2Fvi%20version%3D34426%20appver%3D34426; ' +
          'language=vi; shopee_app_version=34426; SPC_CLIENTID=A3Wh8X17yosAdY5jwamvchpsoyviupxi; ' +
          'SPC_DID=A3Wh8X17yosAdY5jaZIZZWOBQervhwz1UDU0e7FWKL4=; SPC_F=8e2ab92ab96043b8_unknown; ' +
          'SPC_AFTID=bcce123d-8709-46e5-b9c5-ba406a4d7fd2; SPC_U=-; SPC_EC=-; ' +
          'SPC_SI=sa8AaAAAAABvSW9OZlRINjOBCQAAAAAAYzh4bE5Pamg=; ' +
          'SPC_SEC_SI=v1-NXhCMGpaajA4VURwM3lvY2LGvWx0CRhNGnC+WYuGXl4iViXQwlSS3ejx7ZA2lXR···l85IwA1YGF75rLzhT6xMlcapOSGgAw3TePWq6F4pJxJ0=; ' +
          'SPC_R_T_IV=b3NiMzYzdDVkOFZCWWsxMg==; ' +
          'REC_T_ID=58236bbe-1c74-11f0-91cd-0eeab2acd882; ' +
          'SPC_R_T_ID=l+jAOWUR+BQw7xbdsRtMGJStI8gZDnqBBkuR9HRGJBlQgC6OklbgOAi+pzKT1IUwRazEpUUIj1s75OyEz5qIW9q9pHRA4ikXr6ML3D4q4wxwqEqw9TaboPxRwT40qbUBr1VkVFe2sS6/aayOD921p3OIDYy+t0rSFlw23ovN4Ek=; ' +
          'SPC_T_ID=l+jAOWUR+BQw7xbdsRtMGJStI8gZDnqBBkuR9HRGJBlQgC6OklbgOAi+pzKT1IUwRazEpUUIj1s75OyEz5qIW9q9pHRA4ikXr6ML3D4q4wxwqEqw9TaboPxRwT40qbUBr1VkVFe2sS6/aayOD921p3OIDYy+t0rSFlw23ovN4Ek=; ' +
          'SPC_T_IV=b3NiMzYzdDVkOFZCWWsxMg==; shopee_rn_version=1744974721; ' +
          'shopee_rn_bundle_version=6055005; SPC_RNBV=6055005; ' +
          'chat-access-token=016b15fc761d06ffd4d0a1a259722b4579584e5d7dceecb3339167c0689f4a2b9a; ' +
          'csrftoken=mBdO9J4eBuU2Jf1qx0i6oFqbJUXQyL05; csrftoken=X2PM1dgf1mfUcI37qJp41glN0NilhQyC; ' +
          '_gcl_au=1.1.1231238568.1745051911; _fbp=fb.1.1745051921243.167395647233423831'
        ),
        'X-Sap-Ri': '736103685e968617e536761e01ef14c422169b0a7efb8f2f3e17',
        'Af-Ac-Enc-Sz-Token': 'ZEWApdJl/HU+0SHec0fVlA==|5SFO2B4cXZeVFaKSnWkkpUHvV0RGAV4OMmthxKbjI9ER3Xod3PzHfh8rzVjEqphoJ8D//ykiMjzJ9Bcx0JJ+pwvc2/1cN82T+c1Ztw==|cGC/S/99oMei/Q37|08|1',
        'Referer': 'https://mall.shopee.vn/',
        'Accept-Encoding': 'gzip, deflate, br',
      };

      // Prepare Shopee API payload with phone number from chaycodeso3
      const shopeePayload = {
        phone: `84${phoneData.Result.Number}`,
        scenario: 3,
      };

      // Call Shopee API
      const shopeeResponse = await axios.post(shopeeUrl, shopeePayload, { headers });
      // Check if the phone number exists in Shopee
      if (shopeeResponse.data.data.exist === true) {
        // Mark the phone number as expired in chaycodeso3
        let chaycodesoexpired = `https://chaycodeso3.com/api?act=expired&apik=480ff3b0a20e990c&id=${phoneData.Result.Id}`;
        await axios.get(chaycodesoexpired);

        // Retry the process by calling tryFindNumber again
        if(!phoneNumber){
          return await tryFindNumber();
        }else{
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
            phone: phoneData.Result.Number,
          },
        });
      }
    } catch (error) {
      console.error('Error processing request:', error.message);
      let chaycodesoexpired = `https://chaycodeso3.com/api?act=expired&apik=480ff3b0a20e990c&id=${phoneData.Result.Id}`;
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

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
