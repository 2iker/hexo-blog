(function(){
var API=(window.__hexoProBase||'/pro').replace(/\/$/,'')+'/hexopro/api/music';
var root=(window.__hexoProBase||'/pro').replace(/\/pro$/,'/');
function getToken(){return localStorage.getItem('hexoProToken')||'';}
function toast(msg,type){var el=document.createElement('div');el.style.cssText='position:fixed;top:24px;right:24px;padding:12px 20px;border-radius:6px;color:#fff;font-size:14px;z-index:10001;background:'+(type==='error'?'#ff4d4f':'#52c41a');el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove()},3000);}
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
var songs=[],currentTitle='';

function createModal(){
if(document.getElementById('musicModal'))return;
var css=document.createElement('style');
css.textContent='#musicModal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:10000;display:none;align-items:center;justify-content:center}#musicModal.active{display:flex}#musicModal .mm-panel{background:#fff;border-radius:12px;width:800px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.2)}#musicModal .mm-header{padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between}#musicModal .mm-header h3{margin:0;font-size:16px}#musicModal .mm-body{flex:1;overflow-y:auto;padding:16px 20px;min-height:200px}#musicModal .mm-song{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;margin-bottom:8px;background:#fafafa;transition:background .2s}#musicModal .mm-song:hover{background:#f0f0f0}#musicModal .mm-cover{width:48px;height:48px;border-radius:6px;background:linear-gradient(135deg,#667eea,#764ba2);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;overflow:hidden}#musicModal .mm-cover img{width:100%;height:100%;object-fit:cover}#musicModal .mm-info{flex:1;min-width:0}#musicModal .mm-title{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#musicModal .mm-artist{font-size:12px;color:#999;margin-top:2px}#musicModal .mm-acts{display:flex;gap:6px;flex-shrink:0}#musicModal .mm-btn{padding:5px 12px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;transition:all .2s;line-height:1.4}#musicModal .mm-btn:hover{border-color:#1890ff;color:#1890ff}#musicModal .mm-btn.primary{background:#1890ff;color:#fff;border-color:#1890ff}#musicModal .mm-btn.danger{color:#ff4d4f;border-color:#ff4d4f}#musicModal .mm-btn.danger:hover{background:#ff4d4f;color:#fff}#musicModal .mm-upload{border:2px dashed #d9d9d9;border-radius:8px;padding:24px;text-align:center;cursor:pointer;margin-top:16px;transition:all .2s}#musicModal .mm-upload:hover{border-color:#1890ff;background:#e6f7ff}#musicModal .mm-empty{text-align:center;padding:40px;color:#999;font-size:14px}#musicModal .mm-player{border-top:1px solid #f0f0f0;padding:12px 20px;display:none;align-items:center;gap:12px;background:#fafafa}#musicModal .mm-player.active{display:flex}#mmEditOverlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:10001;display:none;align-items:center;justify-content:center}#mmEditOverlay.active{display:flex}.mm-input{width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:6px;font-size:14px;box-sizing:border-box}.mm-input:focus{outline:none;border-color:#1890ff;box-shadow:0 0 0 2px rgba(24,144,255,.2)}.mm-label{display:block;font-size:13px;color:#666;margin-bottom:4px}';
document.head.appendChild(css);
var modal=document.createElement('div');modal.id='musicModal';
modal.innerHTML='<div class="mm-panel"><div class="mm-header"><h3>🎵 音乐管理</h3><button class="mm-btn" id="mmCloseBtn" style="font-size:16px;padding:2px 8px">✕</button></div><div class="mm-body" id="mmBody"><div class="mm-empty">点击下方区域上传 MP3 文件</div></div><div class="mm-upload" id="mmUpload"><div style="font-size:28px">📁</div><div style="color:#999;font-size:13px;margin-top:4px">点击或拖拽 MP3 文件到这里</div><input type="file" id="mmFileInput" accept="audio/*" multiple style="display:none"></div><div class="mm-player" id="mmPlayer"><div style="flex:1;min-width:0"><div id="mmPlayTitle" style="font-size:13px;font-weight:500">-</div><div id="mmPlayArtist" style="font-size:11px;color:#999">-</div></div><button class="mm-btn" id="mmPlayBtn">▶</button><button class="mm-btn" id="mmStopBtn">✕</button></div></div>';
document.body.appendChild(modal);
var editModal=document.createElement('div');editModal.id='mmEditOverlay';
editModal.innerHTML='<div style="background:#fff;border-radius:12px;padding:24px;width:420px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,.2)"><h3 style="margin:0 0 16px;font-size:16px">编辑歌曲</h3><input type="hidden" id="mmEditId"><div style="margin-bottom:12px"><label class="mm-label">标题</label><input id="mmEditTitle" class="mm-input"></div><div style="margin-bottom:12px"><label class="mm-label">歌手</label><input id="mmEditArtist" class="mm-input"></div><div style="margin-bottom:16px"><label class="mm-label">封面 URL</label><input id="mmEditCover" class="mm-input" placeholder="https://example.com/cover.jpg"></div><div style="display:flex;justify-content:flex-end;gap:8px"><button class="mm-btn" id="mmEditCancel">取消</button><button class="mm-btn primary" id="mmEditSave">保存</button></div></div>';
document.body.appendChild(editModal);
var audio=document.createElement('audio');audio.id='mmAudio';document.body.appendChild(audio);
document.getElementById('mmCloseBtn').onclick=function(){document.getElementById('musicModal').classList.remove('active');};
document.getElementById('mmPlayBtn').onclick=function(){var a=document.getElementById('mmAudio');if(a.paused){a.play();this.textContent='⏸';}else{a.pause();this.textContent='▶';}};
document.getElementById('mmStopBtn').onclick=function(){var a=document.getElementById('mmAudio');a.pause();a.currentTime=0;document.getElementById('mmPlayer').classList.remove('active');};
document.getElementById('mmUpload').onclick=function(){document.getElementById('mmFileInput').click();};
document.getElementById('mmFileInput').onchange=function(){uploadFiles(this.files);};
document.getElementById('mmEditCancel').onclick=function(){document.getElementById('mmEditOverlay').classList.remove('active');};
document.getElementById('mmEditSave').onclick=saveEdit;
var uz=document.getElementById('mmUpload');
uz.ondragover=function(e){e.preventDefault();uz.style.borderColor='#1890ff';uz.style.background='#e6f7ff';};
uz.ondragleave=function(){uz.style.borderColor='';uz.style.background='';};
uz.ondrop=function(e){e.preventDefault();uz.style.borderColor='';uz.style.background='';uploadFiles(e.dataTransfer.files);};
modal.onclick=function(e){if(e.target===modal)modal.classList.remove('active');};
editModal.onclick=function(e){if(e.target===editModal)editModal.classList.remove('active');};
audio.ontimeupdate=function(){document.getElementById('mmPlayTitle').textContent=(audio.paused?'▶':'⏸ ')+' '+currentTitle;};
audio.onended=function(){document.getElementById('mmPlayBtn').textContent='▶';};
}

window.openMusicModal=function(){
createModal();
document.getElementById('musicModal').classList.add('active');
fetch(API+'/list',{headers:{'Authorization':'Bearer '+getToken()}})
.then(function(r){return r.json();})
.then(function(json){songs=json.data||[];renderSongs();})
.catch(function(){document.getElementById('mmBody').innerHTML='<div class="mm-empty">加载失败</div>';});
};

function renderSongs(){
var el=document.getElementById('mmBody');
if(!songs.length){el.innerHTML='<div class="mm-empty">暂无歌曲，上传 MP3 文件开始管理</div>';return;}
el.innerHTML=songs.map(function(s){
var cv=s.cover?'<div class="mm-cover"><img src="'+esc(s.cover)+'" onerror="this.parentElement.innerHTML=\'♪\'"></div>':'<div class="mm-cover">♪</div>';
return '<div class="mm-song">'+cv+'<div class="mm-info"><div class="mm-title">'+esc(s.title)+'</div><div class="mm-artist">'+(s.artist?esc(s.artist):'未知歌手')+'</div></div><div class="mm-acts"><button class="mm-btn" data-play="'+s.id+'">▶</button><button class="mm-btn" data-edit="'+s.id+'">✏️</button><button class="mm-btn danger" data-del="'+s.id+'">🗑️</button></div></div>';
}).join('');
el.querySelectorAll('[data-play]').forEach(function(b){b.onclick=function(){playSong(this.getAttribute('data-play'));};});
el.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editSong(this.getAttribute('data-edit'));};});
el.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){deleteSong(this.getAttribute('data-del'));};});
}

function playSong(id){var s=songs.find(function(x){return x.id===id;});if(!s)return;currentTitle=s.title;var a=document.getElementById('mmAudio');a.src=root+'music/'+s.filename;a.play();document.getElementById('mmPlayer').classList.add('active');document.getElementById('mmPlayTitle').textContent='⏸ '+s.title;document.getElementById('mmPlayArtist').textContent=s.artist||'未知歌手';document.getElementById('mmPlayBtn').textContent='⏸';}
function editSong(id){var s=songs.find(function(x){return x.id===id;});if(!s)return;document.getElementById('mmEditId').value=id;document.getElementById('mmEditTitle').value=s.title||'';document.getElementById('mmEditArtist').value=s.artist||'';document.getElementById('mmEditCover').value=s.cover||'';document.getElementById('mmEditOverlay').classList.add('active');}
function saveEdit(){var id=document.getElementById('mmEditId').value;var data={id:id,title:document.getElementById('mmEditTitle').value,artist:document.getElementById('mmEditArtist').value,cover:document.getElementById('mmEditCover').value};fetch(API+'/update',{method:'PUT',headers:{'Authorization':'Bearer '+getToken(),'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json();}).then(function(json){if(json.code===0){toast('保存成功');var i=songs.findIndex(function(x){return x.id===id;});if(i>=0)songs[i]=json.data;renderSongs();document.getElementById('mmEditOverlay').classList.remove('active');}else toast(json.msg||'保存失败','error');}).catch(function(){toast('保存出错','error');});}
function deleteSong(id){if(!confirm('确定删除这首歌？'))return;fetch(API+'/delete',{method:'DELETE',headers:{'Authorization':'Bearer '+getToken(),'Content-Type':'application/json'},body:JSON.stringify({id:id})}).then(function(r){return r.json();}).then(function(json){if(json.code===0){toast('已删除');songs=songs.filter(function(x){return x.id!==id;});renderSongs();}else toast(json.msg||'删除失败','error');}).catch(function(){toast('删除出错','error');});}
function uploadFiles(files){for(var i=0;i<files.length;i++){(function(file){var fd=new FormData();fd.append('file',file);fetch(API+'/upload',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:fd}).then(function(r){return r.json();}).then(function(json){if(json.code===0){toast('上传成功: '+file.name);songs.push(json.data);renderSongs();}else toast(json.msg||'上传失败','error');}).catch(function(){toast('上传出错','error');});})(files[i]);}}

// Sidebar injection
function injectSidebarItem(){
var menu=document.querySelector('ul.ant-menu.ant-menu-root');
if(!menu)return false;
if(menu.querySelector('[data-menu-id="music-management"]'))return true;
var li=document.createElement('li');
li.className='ant-menu-item';
li.setAttribute('role','menuitem');
li.setAttribute('tabindex','-1');
li.setAttribute('data-menu-id','music-management');
li.style.cssText='padding-left:24px;cursor:pointer;';
li.innerHTML='<span role="img" aria-label="music" class="anticon anticon-music ant-menu-item-icon"><svg viewBox="64 64 896 896" focusable="false" data-icon="music" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M842.8 186H643.2l-67.4-89.6c-4.4-5.9-11.4-9.4-18.8-9.4h-4.4c-7.4 0-14.4 3.5-18.8 9.4L526 186H392.2l-67.4-89.6c-4.4-5.9-11.4-9.4-18.8-9.4h-4.4c-7.4 0-14.4 3.5-18.8 9.4L314 186H181.2c-35.4 0-64.2 28.8-64.2 64.2v499.6c0 35.4 28.8 64.2 64.2 64.2h661.6c35.4 0 64.2-28.8 64.2-64.2V250.2c0-35.4-28.8-64.2-64.2-64.2zM445 715c0 30.8-25 55.8-55.8 55.8S333.4 745.8 333.4 715s25-55.8 55.8-55.8 55.8 25 55.8 55.8zm318.4 0c0 30.8-25 55.8-55.8 55.8s-55.8-25-55.8-55.8 25-55.8 55.8-55.8 55.8 25 55.8 55.8zM791 369H501V279h290v90z"></path></svg></span><span class="ant-menu-title-content">音乐管理</span>';
li.onclick=function(e){e.preventDefault();e.stopPropagation();window.openMusicModal();};
var items=menu.querySelectorAll('.ant-menu-item, .ant-menu-submenu');
var lastItem=items[items.length-1];
if(lastItem){menu.insertBefore(li,lastItem.nextSibling||null);}else{menu.appendChild(li);}
return true;
}
var attempts=0;
var timer=setInterval(function(){
if(injectSidebarItem()){clearInterval(timer);}
attempts++;
if(attempts>100){clearInterval(timer);}
},300);
})();
