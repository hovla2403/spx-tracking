async function checkShopeeAccount(phone) {
  try {
    const response = await fetch('http://localhost:3001/api/check-shopee-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });
    
    const data = await response.json();
    console.log('Result:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Sử dụng
checkShopeeAccount('84327392107');
