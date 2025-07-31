const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const upload = multer({ dest: '/tmp' }); // 临时存储目录，Vercel 支持 /tmp

app.post('/api/evaluate', upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No audio file uploaded' });

  try {
    // 读取文件并转 base64
    const audioData = fs.readFileSync(file.path);
    const audioBase64 = audioData.toString('base64');

    // 讯飞参数
    const APPID = '8597297a';
    const APIKey = '58c1ae01c147542a62bd97f7f0fd9889';
    const ts = Math.floor(Date.now() / 1000);
    const param = { engine_type: 'ise_general', aue: 'raw' };
    const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');
    const checksum = crypto.createHash('md5').update(APIKey + ts + paramBase64).digest('hex');

    // 调用讯飞API
    const response = await axios.post('https://ise-api.xfyun.cn/v2/open-ise', {
      audio: audioBase64,
      language: 'zh_cn',
      category: 'read_sentence',
      text: '这是一个测试句子。',
    }, {
      headers: {
        'X-Appid': APPID,
        'X-CurTime': ts,
        'X-Param': paramBase64,
        'X-CheckSum': checksum,
        'Content-Type': 'application/json',
      },
    });

    // 返回结果
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: '讯飞API调用失败', details: err.message });
  } finally {
    // 删除临时文件
    fs.unlink(file.path, () => {});
  }
});

// 监听端口，Vercel 会自动提供端口号
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;

