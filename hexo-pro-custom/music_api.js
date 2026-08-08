const path = require('path');
const fs = require('fs');
const multer = require('multer');

const MUSIC_DATA_FILE = 'music_data.json';
const MUSIC_DIR = 'source/music';
const COVER_DIR = 'source/music/covers';

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function getMusicDataPath(hexo) { return path.join(hexo.base_dir, MUSIC_DATA_FILE); }

function loadMusicData(hexo) {
  const filePath = getMusicDataPath(hexo);
  if (fs.existsSync(filePath)) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
  }
  return { songs: [] };
}

function saveMusicData(hexo, data) {
  fs.writeFileSync(getMusicDataPath(hexo), JSON.stringify(data, null, 2), 'utf8');
}

// Parse tracks metadata from source/js/sidebar-music.js
function parseSidebarTracks(hexo) {
  const tracksFile = path.join(hexo.base_dir, 'source', 'js', 'sidebar-music.js');
  if (!fs.existsSync(tracksFile)) return [];
  const content = fs.readFileSync(tracksFile, 'utf8');
  const tracks = [];
  // Match: { name: 'xxx', artist: 'xxx', url: root + 'music/xxx.mp3', cover: root + 'music/covers/xxx.jpg' }
  const regex = /\{\s*name:\s*['"](.+?)['"]\s*,\s*artist:\s*['"](.+?)['"]\s*,\s*url:\s*root\s*\+\s*['"](.+?)['"]\s*,\s*cover:\s*root\s*\+\s*['"](.+?)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const urlPath = m[3]; // e.g. /music/bg-music.mp3
    const filename = path.basename(urlPath);
    const coverPath = m[4].startsWith('/') ? m[4] : '/' + m[4];
    tracks.push({ name: m[1], artist: m[2], filename: filename, cover: coverPath });
  }
  return tracks;
}

// Scan source/music for MP3 files, merge with sidebar metadata
function scanExistingFiles(hexo) {
  const musicDir = path.join(hexo.base_dir, MUSIC_DIR);
  const coverDir = path.join(hexo.base_dir, COVER_DIR);
  const data = loadMusicData(hexo);
  const existingFilenames = new Set(data.songs.map(s => s.filename));

  // Get metadata from sidebar-music.js
  const sidebarTracks = parseSidebarTracks(hexo);
  const sidebarMeta = {};
  for (const t of sidebarTracks) {
    sidebarMeta[t.filename] = t;
  }

  if (!fs.existsSync(musicDir)) return data;

  const mp3Files = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3') || f.endsWith('.MP3'));
  let changed = false;

  for (const file of mp3Files) {
    if (existingFilenames.has(file)) continue;
    const baseName = path.basename(file, path.extname(file));
    let cover = '';
    if (fs.existsSync(coverDir)) {
      const covers = fs.readdirSync(coverDir);
      const match = covers.find(c => c.startsWith(baseName) || c.includes(baseName));
      if (match) cover = '/music/covers/' + match;
    }
    // Use sidebar metadata if available
    const meta = sidebarMeta[file] || {};
    data.songs.push({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: meta.name || baseName,
      artist: meta.artist || '',
      cover: meta.cover || cover,
      url: '/music/' + file,
      filename: file,
      createdAt: new Date().toISOString()
    });
    changed = true;
  }

  // Update existing songs with sidebar metadata if they have empty fields
  for (const song of data.songs) {
    const meta = sidebarMeta[song.filename];
    if (meta) {
      if (!song.title || song.title === path.basename(song.filename, path.extname(song.filename))) {
        song.title = meta.name;
      }
      if (!song.artist && meta.artist) {
        song.artist = meta.artist;
      }
      if (!song.cover && meta.cover) {
        song.cover = meta.cover;
      }
      changed = true;
    }
  }

  if (changed) saveMusicData(hexo, data);
  return data;
}

function ensureUtf8Filename(name) {
  try { if (!name) return name; return Buffer.from(name, 'latin1').toString('utf8') || name; } catch (_) { return name; }
}

module.exports = async function (app, hexo) {
  const root = hexo.config.root || '/';
  const apiBase = root + 'hexopro/api/music';

  ensureDir(path.join(hexo.base_dir, MUSIC_DIR));
  ensureDir(path.join(hexo.base_dir, COVER_DIR));

  const mp3Storage = multer.diskStorage({
    destination: path.join(hexo.base_dir, MUSIC_DIR),
    filename: (req, file, cb) => cb(null, ensureUtf8Filename(file.originalname))
  });
  const uploadMp3 = multer({ storage: mp3Storage, limits: { fileSize: 50 * 1024 * 1024 } });

  const coverStorage = multer.diskStorage({
    destination: path.join(hexo.base_dir, COVER_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random().toString(36).substring(2, 8) + path.extname(ensureUtf8Filename(file.originalname)))
  });
  const uploadCover = multer({ storage: coverStorage, limits: { fileSize: 5 * 1024 * 1024 } });

  // List all songs (scan existing files first)
  app.use(apiBase + '/list', function (req, res) {
    if (req.method !== 'GET') return;
    const data = scanExistingFiles(hexo);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ code: 0, data: data.songs }));
  });

  // Upload MP3
  app.use(apiBase + '/upload', function (req, res) {
    if (req.method !== 'POST') return;
    uploadMp3.single('file')(req, res, function (err) {
      if (err) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: err.message })); }
      if (!req.file) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: 'No file' })); }
      const filename = req.file.filename;
      const data = loadMusicData(hexo);
      const newSong = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), title: path.basename(filename, path.extname(filename)), artist: '', cover: '', url: root + 'music/' + filename, filename: filename, createdAt: new Date().toISOString() };
      data.songs.push(newSong);
      saveMusicData(hexo, data);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: newSong }));
    });
  });

  // Upload cover
  app.use(apiBase + '/upload-cover', function (req, res) {
    if (req.method !== 'POST') return;
    uploadCover.single('file')(req, res, function (err) {
      if (err) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: err.message })); }
      if (!req.file) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: 'No file' })); }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: { url: root + 'music/covers/' + req.file.filename } }));
    });
  });

  // Update song
  app.use(apiBase + '/update', function (req, res) {
    if (req.method !== 'PUT') return;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, title, artist, cover } = JSON.parse(body);
        const data = loadMusicData(hexo);
        const song = data.songs.find(s => s.id === id);
        if (!song) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: 'Not found' })); }
        if (title !== undefined) song.title = title;
        if (artist !== undefined) song.artist = artist;
        if (cover !== undefined) song.cover = cover;
        saveMusicData(hexo, data);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ code: 0, data: song }));
      } catch (e) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ code: 1, msg: e.message })); }
    });
  });

  // Delete song
  app.use(apiBase + '/delete', function (req, res) {
    if (req.method !== 'DELETE') return;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        const data = loadMusicData(hexo);
        const idx = data.songs.findIndex(s => s.id === id);
        if (idx === -1) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ code: 1, msg: 'Not found' })); }
        const song = data.songs[idx];
        const mp3Path = path.join(hexo.base_dir, MUSIC_DIR, song.filename);
        if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
        if (song.cover && song.cover.includes('music/covers/')) {
          const coverPath = path.join(hexo.base_dir, 'source', song.cover);
          if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
        data.songs.splice(idx, 1);
        saveMusicData(hexo, data);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ code: 0, msg: 'deleted' }));
      } catch (e) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ code: 1, msg: e.message })); }
    });
  });

  console.log('[Music API] Registered at ' + apiBase + '/*');
};
