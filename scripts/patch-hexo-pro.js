const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const proDir = path.join(root, 'node_modules', 'hexo-pro');

function log(msg) { console.log('[patch-hexo-pro] ' + msg); }

if (!fs.existsSync(proDir)) {
  log('hexo-pro not installed, nothing to patch');
  process.exit(0);
}

// 1. Add hexo field to package.json (required for hexo auto-loading)
const pkgFile = path.join(proDir, 'package.json');
if (fs.existsSync(pkgFile)) {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (!pkg.hexo) {
    pkg.hexo = { version: '>=7.0.0' };
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
    log('package.json: added hexo field');
  }
}

// 2. Patch index.js to support custom root path
const indexFile = path.join(proDir, 'index.js');
if (fs.existsSync(indexFile)) {
  let c = fs.readFileSync(indexFile, 'utf8');
  const before = c;

  // Fix SPA route check
  c = c.replace(
    /req\.originalUrl\.startsWith\('\/pro'\)/g,
    "req.originalUrl.startsWith(hexo.config.root + 'pro')"
  );

  // Fix static file path
  c = c.replace(
    /req\.originalUrl\.substring\(4\)/g,
    "req.originalUrl.substring((hexo.config.root + 'pro').length)"
  );

  // Fix static serve mount
  c = c.replace("app.use('/pro', serve);", "app.use(hexo.config.root + 'pro', serve);");

  // Add URL rewrite for frontend API calls (only if not already present)
  if (!c.includes('const _hr')) {
    const anchor = "    app.use((req, res, next) => {\n        if (!req.query";
    const rewrite = `    // Rewrite /hexopro/* and /pro/* to include root prefix\n    const _hr = hexo.config.root || '/';\n    if (_hr !== '/') {\n        app.use((req, res, next) => {\n            if ((req.url.startsWith('/hexopro/') || req.url.startsWith('/pro/')) && !req.url.startsWith(_hr)) {\n                req.url = _hr + req.url.substring(1);\n            }\n            next();\n        });\n    }\n\n    app.use((req, res, next) => {\n        if (!req.query`;

    if (c.includes(anchor)) {
      c = c.replace(anchor, rewrite);
    }
  }

  if (c !== before) {
    fs.writeFileSync(indexFile, c);
    log('index.js: patched root path support');
  } else {
    log('index.js: already patched');
  }
}

// 3. Fix index.html asset paths
const htmlFile = path.join(proDir, 'www', 'index.html');
if (fs.existsSync(htmlFile)) {
  let h = fs.readFileSync(htmlFile, 'utf8');
  const hBefore = h;
  h = h.replace(/src="\/pro\//g, 'src="');
  h = h.replace(/href="\/pro\//g, 'href="');
  if (h !== hBefore) {
    fs.writeFileSync(htmlFile, h);
    log('index.html: fixed asset paths');
  } else {
    log('index.html: already patched');
  }
}

log('done');
