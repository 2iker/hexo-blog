const https = require('https');
const http = require('http');

const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

module.exports = function (app, hexo) {
  const root = hexo.config.root || '/';
  const apiBase = root + 'hexopro/api/music';

  // Search songs
  app.use(apiBase + '/search', async function (req, res) {
    if (req.method !== 'GET') return;
    const keywords = req.query.keywords || req.url.split('keywords=')[1];
    if (!keywords) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ code: 1, msg: 'keywords required' }));
    }
    try {
      const data = await fetchJSON(API_BASE + '/cloudsearch?keywords=' + encodeURIComponent(keywords) + '&limit=20&type=1&offset=0');
      const songs = (data.result && data.result.songs || []).map(s => ({
        id: s.id,
        name: s.name,
        artist: s.artists.map(a => a.name).join(', '),
        album: s.album && s.album.name || '',
        cover: s.album && s.album.artist && s.album.artist.picUrl ? s.album.artist.picUrl + '?param=200y200' : '',
        duration: s.duration,
        url: ''
      }));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: songs }));
    } catch (e) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 1, msg: e.message }));
    }
  });

  // Get song URL
  app.use(apiBase + '/song-url', async function (req, res) {
    if (req.method !== 'GET') return;
    const id = req.query.id;
    if (!id) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ code: 1, msg: 'id required' }));
    }
    try {
      const data = await fetchJSON(API_BASE + '/song/url?id=' + id + '&br=320000');
      const url = data.data && data.data[0] && data.data[0].url || '';
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: { url: url } }));
    } catch (e) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 1, msg: e.message }));
    }
  });

  console.log('[Music Netease API] Registered at ' + apiBase + '/search, /song-url');
};
