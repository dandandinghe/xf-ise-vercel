const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let audio = '';

  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => resolve(JSON.parse(data)));
      req.on('error', reject);
    });

    audio = body.audio;
    if (!audio) return res.status(400).json({ error: 'Missing audio' });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const APPID = '8597297a';
  const APISecret = 'MGY2YzU5OTE1MDA1OGMxYjg3ZjMxZjBh';
  const APIKey = '58c1ae01c147542a62bd97f7f0fd9889';

  const ts = Math.floor(Date.now() / 1000);
  const param = {
    engine_type: 'ise_general',
    aue: 'raw'
  };
  const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');

  const checksum = crypto
    .createHash('md5')
    .update(APIKey + ts + paramBase64)
    .digest('hex');

  try {
    const response = await axios.post(
      'https://ise-api.xfyun.cn/v2/open-ise',
      {
        audio,
        language: 'zh_cn',
        category: 'read_sentence',
        text: '这是一个测试句子。'
      },
      {
        headers: {
          'X-Appid': APPID,
          'X-CurTime': ts,
          'X-Param': paramBase64,
          'X-CheckSum': checksum,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'iFlytek API failed', detail: error.message });
  }
};
