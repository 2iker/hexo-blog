const https = require('https');
const http = require('http');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchText(url, timeout) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeout || 10000, headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        resolve(data);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchJSON(url, timeout) {
  return JSON.parse(await fetchText(url, timeout));
}

module.exports = function (app, hexo) {
  const root = hexo.config.root || '/';
  const apiBase = root + 'hexopro/api/music';

  // Search songs via the official NetEase API (works without cookies).
  // Falls back to the old proxy if the official API is unreachable.
  app.use(apiBase + '/search', async function (req, res) {
    if (req.method !== 'GET') return;
    const keywords = req.query.keywords || (req.url.split('keywords=')[1] || '').split('&')[0];
    if (!keywords) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ code: 1, msg: 'keywords required' }));
    }
    const send = (obj) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    };
    try {
      let data;
      try {
        data = await fetchJSON('https://music.163.com/api/search/get/web?s=' + encodeURIComponent(keywords) + '&type=1&limit=20&offset=0', 10000);
      } catch (e) {
        // Official API blocked -> try the previous proxy as a fallback
        const proxy = 'https://api-enhanced-two-mu.vercel.app/cloudsearch?keywords=' + encodeURIComponent(keywords) + '&limit=20&type=1&offset=0';
        data = await fetchJSON(proxy, 10000);
      }
      const hits = (data && data.result && data.result.songs) || [];
      const songs = hits.map((s) => ({
        id: s.id,
        name: s.name,
        artist: (s.artists || s.ar || []).map((a) => a.name).join(', '),
        album: (s.album && s.album.name) || (s.al && s.al.name) || '',
        cover: '',
        duration: s.duration || s.dt || 0,
        url: ''
      }));
      // Batch-fetch album covers (one extra request, maps back by id)
      if (songs.length) {
        try {
          const ids = songs.map((x) => x.id);
          const detail = await fetchJSON('https://music.163.com/api/song/detail/?id=' + ids[0] + '&ids=' + encodeURIComponent('[' + ids.join(',') + ']'), 10000);
          const byId = {};
          for (const d of (detail && detail.songs) || []) {
            if (d && d.album && d.album.picUrl) byId[d.id] = d.album.picUrl;
          }
          for (const x of songs) if (byId[x.id]) x.cover = byId[x.id] + '?param=200y200';
        } catch (e) { /* cover is optional */ }
      }
      send({ code: 0, data: songs });
    } catch (e) {
      send({ code: 1, msg: e.message });
    }
  });

  // Get song URL - use direct Netease URL pattern
  app.use(apiBase + '/song-url', async function (req, res) {
    if (req.method !== 'GET') return;
    const id = req.query.id;
    if (!id) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ code: 1, msg: 'id required' }));
    }
    try {
      const url = 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3';
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: { url: url } }));
    } catch (e) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 1, msg: e.message }));
    }
  });

  console.log('[Music Netease API] Registered at ' + apiBase + '/search, /song-url');
};
