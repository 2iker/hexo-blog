const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const adminDir = path.join(root, 'node_modules', 'hexo-admin');

function log(msg) {
  console.log('[patch-hexo-admin] ' + msg);
}

function patchFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  const before = c;
  for (const [find, replace] of replacements) {
    c = c.split(find).join(replace);
  }
  if (c !== before) {
    fs.writeFileSync(file, c);
    log(path.basename(file) + ': patched');
  }
}

if (!fs.existsSync(adminDir)) {
  log('hexo-admin not installed, nothing to patch');
  process.exit(0);
}

// 1. Fix api.js: pass `next` through the middleware wrapper
patchFile(path.join(adminDir, 'api.js'), [
  [
    "app.use(hexo.config.root + 'admin/api/' + path, function (req, res) {",
    "app.use(hexo.config.root + 'admin/api/' + path, function (req, res, next) {"
  ],
  ['fn(req, res)\n    })', 'fn(req, res, next)\n    })']
]);

// 2. Fix hexo-front-matter: util.isDate removed in Node 20+
patchFile(
  path.join(adminDir, 'node_modules', 'hexo-front-matter', 'lib', 'front_matter.js'),
  [['var isDate = util.isDate;', "var isDate = util.isDate || function (d) { return d instanceof Date && !isNaN(d); };"]]
);

log('done');
