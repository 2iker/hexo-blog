const path = require('path');
const fs = require('fs');
const multer = require('multer');

const MUSIC_DATA_FILE = 'music_data.json';
const MUSIC_DIR = 'source/music';
const COVER_DIR = 'source/music/covers';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getMusicDataPath(hexo) {
  return path.join(hexo.base_dir, MUSIC_DATA_FILE);
}

function loadMusicData(hexo) {
  const filePath = getMusicDataPath(hexo);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error('[Music API] Failed to parse music_data.json:', e.message);
    }
  }
  return { songs: [] };
}

function saveMusicData(hexo, data) {
  fs.writeFileSync(getMusicDataPath(hexo), JSON.stringify(data, null, 2), 'utf8');
}

function ensureUtf8Filename(name) {
  try {
    if (!name) return name;
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    return decoded || name;
  } catch (_) {
    return name;
  }
}

module.exports = async function (app, hexo) {
  const root = hexo.config.root || '/';
  const apiBase = root + 'hexopro/api/music';

  ensureDir(path.join(hexo.base_dir, MUSIC_DIR));
  ensureDir(path.join(hexo.base_dir, COVER_DIR));

  // Configure multer for MP3 uploads
  const mp3Storage = multer.diskStorage({
    destination: path.join(hexo.base_dir, MUSIC_DIR),
    filename: (req, file, cb) => {
      const name = ensureUtf8Filename(file.originalname);
      cb(null, name);
    }
  });
  const uploadMp3 = multer({ storage: mp3Storage, limits: { fileSize: 50 * 1024 * 1024 } });

  // Configure multer for cover uploads
  const coverStorage = multer.diskStorage({
    destination: path.join(hexo.base_dir, COVER_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(ensureUtf8Filename(file.originalname));
      const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
      cb(null, name);
    }
  });
  const uploadCover = multer({ storage: coverStorage, limits: { fileSize: 5 * 1024 * 1024 } });

  // List all songs
  app.use(apiBase + '/list', function (req, res) {
    if (req.method !== 'GET') return;
    const data = loadMusicData(hexo);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ code: 0, data: data.songs }));
  });

  // Upload MP3 file
  app.use(apiBase + '/upload', function (req, res) {
    if (req.method !== 'POST') return;
    uploadMp3.single('file')(req, res, function (err) {
      if (err) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ code: 1, msg: err.message }));
      }
      if (!req.file) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ code: 1, msg: 'No file uploaded' }));
      }
      const filename = req.file.filename;
      const data = loadMusicData(hexo);
      const newSong = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        title: path.basename(filename, path.extname(filename)),
        artist: '',
        cover: '',
        url: root + 'music/' + filename,
        filename: filename,
        createdAt: new Date().toISOString()
      };
      data.songs.push(newSong);
      saveMusicData(hexo, data);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: newSong }));
    });
  });

  // Upload cover image
  app.use(apiBase + '/upload-cover', function (req, res) {
    if (req.method !== 'POST') return;
    uploadCover.single('file')(req, res, function (err) {
      if (err) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ code: 1, msg: err.message }));
      }
      if (!req.file) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ code: 1, msg: 'No file uploaded' }));
      }
      const coverUrl = root + 'music/covers/' + req.file.filename;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 0, data: { url: coverUrl } }));
    });
  });

  // Update song metadata
  app.use(apiBase + '/update', function (req, res) {
    if (req.method !== 'PUT') return;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, title, artist, cover } = JSON.parse(body);
        const data = loadMusicData(hexo);
        const song = data.songs.find(s => s.id === id);
        if (!song) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ code: 1, msg: 'Song not found' }));
        }
        if (title !== undefined) song.title = title;
        if (artist !== undefined) song.artist = artist;
        if (cover !== undefined) song.cover = cover;
        saveMusicData(hexo, data);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ code: 0, data: song }));
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ code: 1, msg: e.message }));
      }
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
        if (idx === -1) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ code: 1, msg: 'Song not found' }));
        }
        const song = data.songs[idx];
        // Delete MP3 file
        const mp3Path = path.join(hexo.base_dir, MUSIC_DIR, song.filename);
        if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
        // Delete cover file
        if (song.cover && song.cover.includes('music/covers/')) {
          const coverName = song.cover.split('/').pop();
          const coverPath = path.join(hexo.base_dir, COVER_DIR, coverName);
          if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
        data.songs.splice(idx, 1);
        saveMusicData(hexo, data);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ code: 0, msg: 'deleted' }));
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ code: 1, msg: e.message }));
      }
    });
  });

  console.log('[Music API] Registered at ' + apiBase + '/*');
};
