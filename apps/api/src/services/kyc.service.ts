import axios from 'axios';
import FormData from 'form-data';

export async function ocrIdCard(imageBuffer: Buffer, side: 'front' | 'back') {
  const form = new FormData();
  form.append('image', imageBuffer, { filename: `id_${side}.jpg`, contentType: 'image/jpeg' });
  
  const response = await axios.post('https://api.fpt.ai/vision/idr/vnm', form, {
    headers: {
      ...form.getHeaders(),
      'api-key': process.env.API_KEY_FPT_AI,
    },
  });

  return response.data;
}

export async function checkLiveness(videoBuffer: Buffer, frontImageBuffer: Buffer) {
  const form = new FormData();
  form.append('video', videoBuffer, { filename: 'liveness.mp4', contentType: 'video/mp4' });
  form.append('cmnd', frontImageBuffer, { filename: 'cccd_front.jpg', contentType: 'image/jpeg' });
  
  const response = await axios.post('https://api.fpt.ai/dmp/liveness/v3', form, {
    headers: {
      ...form.getHeaders(),
      'api-key': process.env.API_KEY_FPT_AI,
    },
  });

  return response.data;
}

export async function checkBankOwner(bankCode: string, accountNumber: string) {
  const response = await axios.post('https://api.banklookup.net', {
    bank: bankCode,
    account: accountNumber
  }, {
    headers: {
      'x-api-key': process.env.API_KEY_BANKLOOKUP_KEY,
      'x-api-secret': process.env.API_KEY_BANKLOOKUP_SECRET,
    },
    validateStatus: () => true
  });

  return response.data;
}
