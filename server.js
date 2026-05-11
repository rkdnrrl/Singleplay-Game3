const express = require('express');
const fs = require('fs');
const path = require('path');

const PLATFORM_API_URL = process.env.PLATFORM_API_URL || 'http://43.203.215.179:4000';
const PORT = process.env.PORT || 3005;

const app = express();

// config.js — API 한 줄 + 디스크 config.js 전체 (easy 모드는 config 플래그 AND ?easyEpic=1)
app.get('/config.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/javascript');
  const apiLine = `window.__ALP_PLATFORM_API__ = ${JSON.stringify(PLATFORM_API_URL)};\n`;
  let disk = '';
  try {
    disk = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
  } catch {
    disk = '';
  }
  res.send(apiLine + disk);
});

// 정적 파일 — 항상 서버에 재검증 (배포 즉시 반영)
app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.listen(PORT, () => {
  console.log(`Space-Fishing (Singleplay-Game3) on port ${PORT}`);
});
