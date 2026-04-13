const http = require('http');

const data = JSON.stringify({
  period_date: '2026-04-28'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payroll/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing Payroll Generation API...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('API Test Error:', error.message);
});

req.write(data);
req.end();
