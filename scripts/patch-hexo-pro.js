const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const proDir = path.join(root, 'node_modules', 'hexo-pro');

function log(msg) {
  console.log('[patch-hexo-pro] ' + msg);
}

if (!fs.existsSync(proDir)) {
  log('hexo-pro not installed, nothing to patch');
  process.exit(0);
}

// Patch hexo-pro index.js to support custom root path (e.g. /hexo-blog/)
// hexo-pro hardcodes '/pro' but needs to use hexo.config.root + 'pro'
const indexFile = path.join(proDir, 'index.js');
if (fs.existsSync(indexFile)) {
  let c = fs.readFileSync(indexFile, 'utf8');
  const before = c;

  // Fix 1: route check uses hexo.config.root + 'pro'
  c = c.replace(
    "if (req.originalUrl.startsWith('/pro')) {",
    "if (req.originalUrl.startsWith(hexo.config.root + 'pro')) {"
  );

  // Fix 2: static file path uses proPrefix
  c = c.replace(
    "const isStaticFile = ['.html', '.css', '.js', '.jpg', '.png', '.gif'].some(extension => req.originalUrl.endsWith(extension));\n            let filePath = path.join(__dirname, 'www', \"index.html\");\n            if (isStaticFile) {\n                filePath = path.join(__dirname, 'www', req.originalUrl.substring(4));",
    "const proPrefix = hexo.config.root + 'pro';\n            const isStaticFile = ['.html', '.css', '.js', '.jpg', '.png', '.gif'].some(extension => req.originalUrl.endsWith(extension));\n            let filePath = path.join(__dirname, 'www', \"index.html\");\n            if (isStaticFile) {\n                filePath = path.join(__dirname, 'www', req.originalUrl.substring(proPrefix.length));"
  );

  // Fix 3: static serve mount uses root
  c = c.replace("app.use('/pro', serve);", "app.use(hexo.config.root + 'pro', serve);");

  if (c !== before) {
    fs.writeFileSync(indexFile, c);
    log('index.js: patched root path support');
  } else {
    log('index.js: already patched');
  }
}

log('done');
