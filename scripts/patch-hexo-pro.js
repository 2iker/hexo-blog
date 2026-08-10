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
    const rewrite = [
      '    // Rewrite /hexopro/* and /pro/* to include root prefix',
      "    const _hr = hexo.config.root || '/';",
      "    if (_hr !== '/') {",
      '        app.use((req, res, next) => {',
      "            if ((req.url.startsWith('/hexopro/') || req.url.startsWith('/pro/')) && !req.url.startsWith(_hr)) {",
      '                req.url = _hr + req.url.substring(1);',
      '                req.originalUrl = _hr + req.originalUrl.substring(1);',
      '            }',
      '            next();',
      '        });',
      '    }',
      '',
      '    app.use((req, res, next) => {',
      '        if (!req.query'
    ].join('\n');

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

// 3. Fix index.html asset paths (skip if custom index.html exists)
const htmlFile = path.join(proDir, 'www', 'index.html');
const customHtml = path.join(root, 'hexo-pro-custom', 'index.html');
if (fs.existsSync(customHtml)) {
  // Custom index.html already has asset fixes + music injection, copy directly
  fs.copyFileSync(customHtml, htmlFile);
  log('index.html: replaced with custom version (asset fixes + music injection)');
} else if (fs.existsSync(htmlFile)) {
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

// 4. Fix main.js bundle basename (hardcoded /pro -> dynamic) + add /music route
const mainJsDir = path.join(proDir, 'www', 'static', 'js');
if (fs.existsSync(mainJsDir)) {
  const mainFiles = fs.readdirSync(mainJsDir).filter(f => f.startsWith('main') && f.endsWith('.js'));
  for (const mainFile of mainFiles) {
    const mainPath = path.join(mainJsDir, mainFile);
    let m = fs.readFileSync(mainPath, 'utf8');
    const mBefore = m;
    const target = 'basename:"/pro"';
    const replacement = 'basename:(window.__hexoProBase||"/pro")';
    if (m.includes(target)) {
      m = m.split(target).join(replacement);
      log('main.js: fixed basename');
    }
    // Add a real /music route (empty host that music-inject.js fills with the music iframe)
    const routeTarget = 'o.createElement(s.qh,{path:"*",element:B((function(){return n(87389)("./".concat(m))})).render()}))';
    const routeReplacement = 'o.createElement(s.qh,{path:"/music",element:o.createElement("div",{className:"music-route-host",style:{width:"100%",height:"100%"}})}),' + routeTarget;
    if (!m.includes('music-route-host') && m.includes(routeTarget)) {
      m = m.split(routeTarget).join(routeReplacement);
      log('main.js: added /music route');
    }
    if (m !== mBefore) {
      fs.writeFileSync(mainPath, m, 'utf8');
    }
  }
}

log('done');

// 5. Copy custom files (music_api.js, music.html) from hexo-pro-custom/
const customDir = path.join(root, 'hexo-pro-custom');
if (fs.existsSync(customDir)) {
  const customFiles = fs.readdirSync(customDir);
  for (const file of customFiles) {
    if (file === 'index.html') continue; // Already handled in step 3
    const src = path.join(customDir, file);
    const dst = path.join(proDir, file === 'music.html' ? 'www' : '', file);
    try {
      fs.copyFileSync(src, dst);
      log('custom: copied ' + file);
    } catch (e) {
      log('custom: failed to copy ' + file + ': ' + e.message);
    }
  }
}

// 6. Patch api.js to register music_api and add root body-parser
const apiFile = path.join(proDir, 'api.js');
if (fs.existsSync(apiFile)) {
  let a = fs.readFileSync(apiFile, 'utf8');
  // Add music_api
  if (!a.includes("require('./music_api')")) {
    a = a.replace(
      "const theme_api = require('./theme_api'); // 主题市场API",
      "const theme_api = require('./theme_api'); // 主题市场API\nconst music_api = require('./music_api'); // 音乐管理API\nconst music_netease_api = require('./music_netease_api'); // 网易云音乐搜索API"
    );
    a = a.replace(
      "theme_api(app, hexo, use, db); // 注册主题市场API",
      "theme_api(app, hexo, use, db); // 注册主题市场API\n        music_api(app, hexo); // 注册音乐管理API\n        music_netease_api(app, hexo); // 注册网易云音乐搜索API"
    );
  }
  // Add body-parser for root-prefixed path (fix 400 error on post/update)
  if (!a.includes("root + 'hexopro/api'")) {
    a = a.replace(
      "app.use('/hexopro/api', bodyParser.urlencoded({ extended: true }));",
      "app.use('/hexopro/api', bodyParser.urlencoded({ extended: true }));\n\n    // Also add body-parser for root-prefixed path (after rewrite)\n    const _root = hexo.config.root || '/';\n    if (_root !== '/') {\n        app.use(_root + 'hexopro/api', bodyParser.json({ limit: '50mb' }));\n        app.use(_root + 'hexopro/api', bodyParser.urlencoded({ extended: true }));\n    }"
    );
  }
  fs.writeFileSync(apiFile, a);
  log('api.js: patched');
}

// 7. Patch update.js to trigger hexo regeneration after save
const updateFile = path.join(proDir, 'update.js');
if (fs.existsSync(updateFile)) {
  let u = fs.readFileSync(updateFile, 'utf8');
  if (!u.includes('hexo.generate()')) {
    u = u.replace(
      "hexo.log.info('文章保存成功！');",
      "hexo.log.info('文章保存成功！');\n        hexo.generate().catch(err => { hexo.log.error('博客重新生成失败:', err); });"
    );
    fs.writeFileSync(updateFile, u);
    log('update.js: added hexo.generate() after save');
  }
}


// 8. Move the sidebar-music inject to be a sibling of <aside class="sidebar">
// (direct child of .column) so the player renders as its own card below the
// sidebar. It is hidden while the TOC panel is active via the :has() rule in
// source/css/sidebar-music.css.
const themeSidebarFile = path.join(root, 'node_modules', 'hexo-theme-next', 'layout', '_macro', 'sidebar.njk');
if (fs.existsSync(themeSidebarFile)) {
  let t = fs.readFileSync(themeSidebarFile, 'utf8');
  const injectLine = "{{- next_inject('sidebar') }}";
  const macroEnd = "</aside>\n{% endmacro %}";
  const desired = "</aside>\n\n  " + injectLine + "\n{% endmacro %}";
  if (t.includes(desired)) {
    log('hexo-theme-next/sidebar.njk: already patched (inject after </aside>)');
  } else if (t.includes(injectLine)) {
    // Remove the inject call wherever it currently sits, then re-insert it right
    // after the closing </aside> so it is a sibling of the sidebar column.
    t = t.split(injectLine).join('');
    t = t.replace(/\n[ \t]*\n[ \t]*\n/g, '\n\n');
    if (t.includes(macroEnd)) {
      t = t.replace(macroEnd, desired);
      fs.writeFileSync(themeSidebarFile, t, 'utf8');
      log('hexo-theme-next/sidebar.njk: sidebar inject moved after </aside> (sibling of .sidebar)');
    } else {
      log('hexo-theme-next/sidebar.njk: could not find </aside>; layout differs, skipping');
    }
  } else {
    log('hexo-theme-next/sidebar.njk: inject line not found; layout differs, skipping');
  }
}
