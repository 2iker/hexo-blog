(function(){
var root=(window.__hexoProBase||'/pro').replace(/\/pro$/,'/');
var musicUrl=root+'pro/music.html';
var musicActive=false;

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

  // Intercept clicks on ALL other sidebar items to close music page
  menu.addEventListener('click',function(e){
    if(!musicActive)return;
    var clickedItem=e.target.closest('.ant-menu-item');
    if(!clickedItem)return;
    // If clicked music item, do nothing (already handled)
    if(clickedItem.getAttribute('data-menu-id')==='music-management')return;
    // Close music page and let React handle navigation
    closeMusicPage();
  },true);

  return true;
}

function showMusicPage(){
  if(musicActive)return;
  musicActive=true;

  // Hide React content
  var content=document.querySelector('.ant-layout-content')||document.querySelector('[class*="content"]');
  if(content){
    content.dataset.musicHidden='true';
    content.style.display='none';
  }

  // Create full-page container
  var container=document.createElement('div');
  container.id='musicPageContainer';
  container.style.cssText='position:absolute;top:0;left:0;right:0;bottom:0;z-index:10;background:#fff;';

  var iframe=document.createElement('iframe');
  iframe.src=musicUrl;
  iframe.style.cssText='width:100%;height:100%;border:none;';
  container.appendChild(iframe);

  // Insert into layout
  var layout=document.querySelector('.ant-layout')||document.body;
  layout.appendChild(container);

  // Highlight music menu item
  document.querySelectorAll('.ant-menu-item').forEach(function(item){
    item.classList.remove('ant-menu-item-selected');
  });
  var musicItem=document.querySelector('[data-menu-id="music-management"]');
  if(musicItem)musicItem.classList.add('ant-menu-item-selected');

  // Listen for back from iframe
  window._musicMessageHandler=function(e){
    if(e.data==='closeMusicPage'){
      closeMusicPage();
    }
  };
  window.addEventListener('message',window._musicMessageHandler);
}

window.closeMusicPage=function(){
  if(!musicActive)return;
  musicActive=false;
  var container=document.getElementById('musicPageContainer');
  if(container)container.remove();
  var content=document.querySelector('.ant-layout-content')||document.querySelector('[class*="content"]');
  if(content&&content.dataset.musicHidden==='true'){
    content.style.display='';
    delete content.dataset.musicHidden;
  }
  var musicItem=document.querySelector('[data-menu-id="music-management"]');
  if(musicItem)musicItem.classList.remove('ant-menu-item-selected');
  if(window._musicMessageHandler){
    window.removeEventListener('message',window._musicMessageHandler);
    window._musicMessageHandler=null;
  }
};

// Injection loop
var attempts=0;
var timer=setInterval(function(){
  if(injectSidebarItem()){clearInterval(timer);}
  attempts++;
  if(attempts>100){clearInterval(timer);}
},300);
})();
