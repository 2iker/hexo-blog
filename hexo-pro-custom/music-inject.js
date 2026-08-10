(function(){
var proBase=window.__hexoProBase||'/pro';
var musicUrl=proBase+'/music.html';
var musicRoute=proBase+'/music';
var musicActive=false;
var pollTimer=null;
var musicItem=null;

function isMusicRoute(){
  return location.pathname===musicRoute||location.pathname===musicRoute+'/';
}

function setMusicSelected(on){
  if(!musicItem)return;
  if(on)musicItem.classList.add('ant-menu-item-selected');
  else musicItem.classList.remove('ant-menu-item-selected');
}

function ensureMusicFrame(){
  var host=document.querySelector('.music-route-host');
  if(!host)return;
  if(host.querySelector('iframe.music-frame'))return;
  var iframe=document.createElement('iframe');
  iframe.className='music-frame';
  iframe.src=musicUrl;
  iframe.style.cssText='width:100%;height:100%;border:none;display:block;';
  host.appendChild(iframe);
  setMusicSelected(true);
}

function closeMusicPage(){
  musicActive=false;
  var host=document.querySelector('.music-route-host');
  if(host){
    var f=host.querySelector('iframe.music-frame');
    if(f)f.remove();
  }
  if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
  setMusicSelected(false);
}

function startTracking(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(function(){
    if(!musicActive)return;
    if(isMusicRoute()){
      ensureMusicFrame();
    }else{
      closeMusicPage();
    }
  },250);
}

function openMusicPage(){
  if(musicActive&&isMusicRoute())return;
  musicActive=true;
  if(!isMusicRoute()){
    history.pushState({},'',musicRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  startTracking();
}

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

  li.onclick=function(e){
    e.preventDefault();
    e.stopPropagation();
    openMusicPage();
  };

  var items=menu.querySelectorAll('.ant-menu-item, .ant-menu-submenu');
  var lastItem=items[items.length-1];
  if(lastItem){menu.insertBefore(li,lastItem.nextSibling||null);}else{menu.appendChild(li);}

  // When another menu item is clicked, React navigates and removes the music
  // route host; clear our selection style immediately for a snappy response.
  menu.addEventListener('click',function(e){
    var clickedItem=e.target.closest('.ant-menu-item');
    if(!clickedItem)return;
    if(clickedItem.getAttribute('data-menu-id')==='music-management')return;
    if(musicActive)setMusicSelected(false);
  },true);

  return true;
}

window.addEventListener('popstate',function(){
  if(isMusicRoute()){
    openMusicPage();
  }else{
    closeMusicPage();
  }
});

window.closeMusicPage=function(){
  closeMusicPage();
  if(isMusicRoute()){
    history.pushState({},'',proBase+'/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

var attempts=0;
var timer=setInterval(function(){
  if(injectSidebarItem()){
    clearInterval(timer);
    musicItem=document.querySelector('[data-menu-id="music-management"]');
    if(isMusicRoute()){
      musicActive=true;
      startTracking();
    }
  }
  attempts++;
  if(attempts>100){clearInterval(timer);}
},300);
})();
