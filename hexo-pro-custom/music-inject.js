(function(){
var root=(window.__hexoProBase||'/pro').replace(/\/pro$/,'/');
var musicUrl=root+'pro/music.html';
var musicActive=false;
var overlayPosHandler=null;
var overlayInterval=null;
var overlayObserver=null;
var overlayLastRect='';

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
    if(musicActive)return;
    showMusicPage();
  };

  var items=menu.querySelectorAll('.ant-menu-item, .ant-menu-submenu');
  var lastItem=items[items.length-1];
  if(lastItem){menu.insertBefore(li,lastItem.nextSibling||null);}else{menu.appendChild(li);}

  // Capture-phase listener: when another item is clicked,
  // close the music page first, then let React handle navigation.
  menu.addEventListener('click',function(e){
    if(!musicActive)return;
    var clickedItem=e.target.closest('.ant-menu-item');
    if(!clickedItem)return;
    if(clickedItem.getAttribute('data-menu-id')==='music-management')return;
    closeMusicPage();
  },true);

  return true;
}

function showMusicPage(){
  if(musicActive)return;
  musicActive=true;

  // Remove any leftover container from a previous session
  var old=document.getElementById('musicPageContainer');
  if(old)old.remove();

  var content=document.querySelector('.ant-layout-content')||document.querySelector('[class*="content"]');
  if(!content){
    musicActive=false;
    return;
  }

  var container=document.createElement('div');
  container.id='musicPageContainer';
  // Append to body (outside React's DOM) and cover only the content area,
  // so the sidebar stays clickable and React re-renders never touch it.
  container.style.cssText='position:fixed;z-index:10;background:#fff;overflow:auto;';

  var iframe=document.createElement('iframe');
  iframe.src=musicUrl;
  iframe.style.cssText='width:100%;height:100%;border:none;';
  container.appendChild(iframe);

  var positionOverlay=function(){
    var c=document.querySelector('.ant-layout-content')||document.querySelector('[class*="content"]');
    if(!c)return;
    var r=c.getBoundingClientRect();
    var key=Math.round(r.top)+','+Math.round(r.left)+','+Math.round(r.width)+','+Math.round(r.height);
    if(key===overlayLastRect)return;
    overlayLastRect=key;
    container.style.top=Math.round(r.top)+'px';
    container.style.left=Math.round(r.left)+'px';
    container.style.width=Math.round(r.width)+'px';
    container.style.height=Math.round(r.height)+'px';
  };
  overlayPosHandler=positionOverlay;
  positionOverlay();
  window.addEventListener('resize',positionOverlay);
  window.addEventListener('scroll',positionOverlay,true);
  window.addEventListener('transitionend',positionOverlay,true);
  // Track sidebar collapse/expand and other layout shifts while the page is open
  overlayInterval=setInterval(positionOverlay,400);
  var sider=document.querySelector('.ant-layout-sider');
  if(sider&&'MutationObserver'in window){
    overlayObserver=new MutationObserver(positionOverlay);
    overlayObserver.observe(sider,{attributes:true,attributeFilter:['class','style']});
  }

  document.body.appendChild(container);

  document.querySelectorAll('.ant-menu-item').forEach(function(item){
    item.classList.remove('ant-menu-item-selected');
  });
  var musicItem=document.querySelector('[data-menu-id="music-management"]');
  if(musicItem)musicItem.classList.add('ant-menu-item-selected');
}

window.closeMusicPage=function(){
  if(!musicActive)return;
  musicActive=false;
  var container=document.getElementById('musicPageContainer');
  if(container)container.remove();
  if(overlayPosHandler){
    window.removeEventListener('resize',overlayPosHandler);
    window.removeEventListener('scroll',overlayPosHandler,true);
    window.removeEventListener('transitionend',overlayPosHandler,true);
    overlayPosHandler=null;
  }
  if(overlayInterval){clearInterval(overlayInterval);overlayInterval=null;}
  if(overlayObserver){overlayObserver.disconnect();overlayObserver=null;}
  overlayLastRect='';
  var musicItem=document.querySelector('[data-menu-id="music-management"]');
  if(musicItem)musicItem.classList.remove('ant-menu-item-selected');
};

var attempts=0;
var timer=setInterval(function(){
  if(injectSidebarItem()){clearInterval(timer);}
  attempts++;
  if(attempts>100){clearInterval(timer);}
},300);
})();
