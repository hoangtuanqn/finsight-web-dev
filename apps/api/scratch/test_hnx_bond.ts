
import axios from 'axios';

async function testHnx() {
  const dates = ['29/04/2026', '28/04/2026', '27/04/2026'];
  
  for (const date of dates) {
    console.log(`Testing date: ${date}`);
    try {
      const response = await axios.post('https://www.hnx.vn/en-gb/trai-phieu/duong-cong-loi-suat.html?site=in', 
        `action=GetYieldCurveData&site=in&date=${date}`, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.hnx.vn/en-gb/trai-phieu/duong-cong-loi-suat.html?site=in'
          }
        }
      );
      
      if (response.data && response.data.Data && response.data.Data.length > 0) {
        console.log(`Success for ${date}!`);
        console.log(JSON.stringify(response.data, null, 2));
        return;
      } else {
        console.log(`No data for ${date}`);
      }
    } catch (error) {
      console.error(`Error for ${date}: ${error.message}`);
    }
  }
}

testHnx();
