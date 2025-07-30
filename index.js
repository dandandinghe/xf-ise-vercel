const WebSocket = require('ws');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

const APPID = process.env.APPID;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const HOST = "ise-api.xfyun.cn";
const PATH = "/v2/open-ise";

function getAuthUrl() {
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`;
    const signatureSha = crypto.createHmac('sha256', API_SECRET)
        .update(signatureOrigin)
        .digest('base64');

    const authorizationOrigin = `api_key=\"${API_KEY}\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"${signatureSha}\"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    const url = `wss://${HOST}${PATH}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${HOST}`;
    return url;
}

app.post('/eval', async (req, res) => {
    const audioBase64 = req.body.audio;
    if (!audioBase64) return res.status(400).json({ error: "Missing audio field" });

    const url = getAuthUrl();
    const ws = new WebSocket(url);
    let resultText = "";

    ws.on('open', () => {
        const frame = {
            common: { app_id: APPID },
            business: {
                category: "read_sentence",
                sub: "ise",
                ent: "en_us",
                aus: 1,
                cmd: "ssb",
                lan: "en_us"
            },
            data: {
                status: 2,
                encoding: "raw",
                audio: audioBase64
            }
        };
        ws.send(JSON.stringify(frame));
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.code !== 0) {
            return res.status(500).json({ error: msg.message });
        }
        if (msg.data && msg.data.read_sentence && msg.data.read_sentence.rec_paper) {
            resultText = msg.data.read_sentence.rec_paper;
        }
    });

    ws.on('close', () => {
        res.json({ result: resultText });
    });

    ws.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });
});

app.get('/', (req, res) => {
    res.send('讯飞语音评测中转服务运行中');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`服务已启动，监听端口 ${port}`);
});