
const options = { 
  timeZone: 'Asia/Jakarta', 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit', 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit', 
  hour12: false 
};

const dateNow = new Date();
const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(dateNow);
const jakartaTime = new Intl.DateTimeFormat('en-GB', { 
  timeZone: 'Asia/Jakarta', 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit', 
  hour12: false 
}).format(dateNow);

console.log('UTC Time:', dateNow.toISOString());
console.log('Jakarta Date (YYYY-MM-DD):', jakartaDate);
console.log('Jakarta Time (HH:MM:SS):', jakartaTime);

// Test threshold
const threshold = '17:03:00';
console.log(`Is ${jakartaTime} < ${threshold}?`, jakartaTime < threshold);
