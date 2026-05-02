// Probe HNX endpoints more deeply
import https from 'node:https';

const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://www.hnx.vn';

function req(url: string, body?: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: body ? 'POST' : 'GET',
      agent,
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE}/vi-vn/trai-phieu/duong-cong-loi-suat.html?site=in`,
        ...(body
          ? {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(body).toString(),
            }
          : {}),
      },
    };

    const r = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, data: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    r.on('timeout', () => r.destroy(new Error('timeout')));
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function probe(label: string, url: string, body?: string) {
  process.stdout.write(`[${label}] ... `);
  try {
    const { status, data } = await req(url, body);
    const isJson = data.trim().startsWith('{') || data.trim().startsWith('[');
    const hasData =
      data.includes('3 tháng') ||
      data.includes('1 năm') ||
      data.includes('5 năm') ||
      data.includes('Par') ||
      data.match(/\d\.\d{2,}/);
    console.log(`HTTP ${status} | ${data.length} chars | JSON:${isJson} | HasData:${!!hasData}`);
    if (hasData || data.length < 2000) {
      console.log('  Sample:', data.slice(0, 500).replace(/\s+/g, ' '));
    }
  } catch (e: any) {
    console.log(`❌ ${e.message}`);
  }
}

const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
const dateStr = `${dd}/${mm}/${yyyy}`;

(async () => {
  console.log('Date:', dateStr);

  // Try the tbody data endpoint (the one that fills the table)
  // HNX often has a separate endpoint for the actual rows
  await probe(
    'GetYieldCurveData tbody',
    `${BASE}/ModuleReportBonds/Bond_YieldCurve/GetYieldCurveData`,
    `p_keysearch=${dateStr}|`,
  );

  await probe('GetYieldCurveData no body', `${BASE}/ModuleReportBonds/Bond_YieldCurve/GetYieldCurveData`);

  // Try with different param format
  await probe(
    'SearchData v2',
    `${BASE}/ModuleReportBonds/Bond_YieldCurve/SearchAndNextPageDuLieuTT_Indicator`,
    `p_keysearch=${dd}/${mm}/${yyyy}&pColOrder=&pOrderType=ASC&pCurrentPage=1&pRecordOnPage=100&pIsSearch=1`,
  );

  // GetData version with day as separate param
  await probe(
    'GetData date params',
    `${BASE}/ModuleReportBonds/Bond_YieldCurve/GetData?ngay=${dd}&thang=${mm}&nam=${yyyy}`,
  );

  // Searching via main search module
  await probe(
    'MainSearch DuongCong',
    `${BASE}/ModuleSearchALL/SearchDataHNX/GetDuongCongYieldCurve`,
    `ngay=${dateStr}`,
  );

  // Try the GetDataYC endpoint (common naming pattern)
  await probe('GetDataYC', `${BASE}/ModuleReportBonds/Bond_YieldCurve/GetDataYieldCurve`, `p_date=${dateStr}`);

  // Try export Excel endpoint to see the real data URL
  await probe(
    'ExportExcel',
    `${BASE}/ModuleReportBonds/Bond_YieldCurve/ExportFileDuLieuTT_Indicator`,
    `p_keysearch=${dateStr}|&pColOrder=&pOrderType=ASC`,
  );

  // Try ADB Asian Bonds Online - well known free source
  await probe(
    'ADB AsianBonds VN',
    `https://asianbondsonline.adb.org/vietnam/data.php?DataTypeCode=GovBondYield&Freq=D`,
  );

  // Try investing.com JSON API
  await probe(
    'Investing.com VN 10Y JSON',
    `https://api.investing.com/api/financial/historical/97?period=P1M&interval=PT1M&pointscount=60`,
  );

  // Try World Bank API for VN bond data
  await probe(
    'WorldBank FR.INR.RISK VN',
    `https://api.worldbank.org/v2/country/VN/indicator/FR.INR.RISK?format=json&per_page=5&mrv=5`,
  );

  console.log('\nDone.');
})();
