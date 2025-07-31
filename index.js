const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const upload = multer({ dest: '/tmp' });

app.post('/api/evaluate', upload.single('audio'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  // 读取并转为 Base64
  const audioData = fs.readFileSync(file.path);
  const audioBase64 = audioData.toString('base64');

  // 构建讯飞请求（你的 AppID 等配置）
  const APPID = '8597297a';
  const APISecret = 'MGY2YzU5OTE1MDA1OGMxYjg3ZjMxZjBh';
  const APIKey = '58c1ae01c147542a62bd97f7f0fd9889';

  const ts = Math.floor(Date.now() / 1000);
  const param = {
    engine_type: 'ise_general', // 或其他引擎
    aue: 'raw'
  };
  const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');

  const checksum = crypto
    .createHash('md5')
    .update(APIKey + ts + paramBase64)
    .digest('hex');

  try {
    const result = await axios.post(
      'https://ise-api.xfyun.cn/v2/open-ise',
      {
        audio: audioBase64,
        language: 'zh_cn',
        category: 'read_sentence',
        text: '这是一个测试句子。',
      },
      {
        headers: {
          'X-Appid': APPID,
          'X-CurTime': ts,
          'X-Param': paramBase64,
          'X-CheckSum': checksum,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to call iFlytek API', details: err.message });
  } finally {
    fs.unlink(file.path, () => {}); // 清理临时文件
  }
});

module.exports = app;
