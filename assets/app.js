!function(){"use strict";var e=document.getElementById("story");if(e){if("IntersectionObserver"in window){var t=new IntersectionObserver(function(e){e.forEach(function(e){e.isIntersecting&&(e.target.setAttribute("data-reveal","in"),t.unobserve(e.target))})},{threshold:.08,rootMargin:"0px 0px -20px 0px"});e.querySelectorAll('[data-reveal]:not([data-reveal="in"])').forEach(function(e){t.observe(e)})}else e.querySelectorAll("[data-reveal]").forEach(function(e){e.setAttribute("data-reveal","in")});var o=document.getElementById("minister-data"),n=[];try{n=JSON.parse(o.textContent)}catch(v){n=[]}var a=window.matchMedia("(prefers-reduced-motion: reduce)");if(n.length){var r=null,i=null,l=-1,c=null,s=null,u=[],d="";function p(){var e,t=n[l];i.pos.textContent="Statement "+(l+1)+" of "+n.length,i.date.textContent=t.date,i.portrait.src="./assets/images/"+({"MA Muhit":"M A Muhit"}[e=t.who]||e)+".jpg",i.portrait.alt=t.who,i.who.textContent=t.who,i.role.textContent=t.role,i.context.textContent=t.c,i.tag.textContent=t.dir?"Direct quote":"Reported statement",i.topic.textContent=t.topic,i.quote.textContent=t.dir?"“"+t.s+"”":t.s,i.prev.disabled=0===l,i.next.disabled=l===n.length-1}function f(e){var t=l+e;if(!(t<0||t>=n.length)){var o=document.activeElement;l=t,p(),i.volume.scrollTop=0,o&&o.disabled&&i.volume.focus({preventScroll:!0})}}function m(){if(r){r.setAttribute("data-open","out");var e=r;r=null;clearTimeout(s),s=setTimeout(function(){e.parentNode&&e.parentNode.removeChild(e),document.body.style.overflow=d||"",u.forEach(function(e){e[0].inert=e[1]}),u=[],c&&c.isConnected&&c.focus({preventScroll:!0})},a.matches?0:200)}}e.addEventListener("click",function(t){var o=t.target.closest("[data-volume]");if(o){var a,v,y,b=o.getAttribute("data-volume"),h=n.findIndex(function(e){return e.id===b});h>=0&&(v=o,(a=h)<0||a>=n.length||(clearTimeout(s),c=v||document.activeElement,l=a,(y=document.createElement("div")).className="archive-overlay",y.setAttribute("data-open","out"),y.innerHTML='<div class="archive-scrim" data-close></div><div class="open-volume" role="dialog" aria-modal="true" aria-labelledby="statement-title" tabindex="-1"><div class="volume-toolbar"><span data-pos></span><button type="button" class="volume-close" aria-label="Close book" data-close>×</button></div><div class="open-spread"><div class="volume-context"><p class="statement-date" id="statement-title" data-date></p><img class="statement-portrait" data-portrait alt="" width="120" height="120" loading="lazy" decoding="async"><p class="statement-speaker" data-who></p><p data-role></p><p class="statement-occasion" data-context></p><p class="statement-kind" data-tag></p></div><div class="volume-leaf"><span class="leaf-topic" data-topic></span><blockquote data-quote></blockquote></div></div><div class="volume-navigation"><button type="button" class="volume-prev" aria-label="Previous statement">←</button><button type="button" class="volume-next" aria-label="Next statement">→</button></div></div>',i={volume:y.querySelector(".open-volume"),pos:y.querySelector("[data-pos]"),date:y.querySelector("[data-date]"),portrait:y.querySelector("[data-portrait]"),who:y.querySelector("[data-who]"),role:y.querySelector("[data-role]"),context:y.querySelector("[data-context]"),tag:y.querySelector("[data-tag]"),topic:y.querySelector("[data-topic]"),quote:y.querySelector("[data-quote]"),prev:y.querySelector(".volume-prev"),next:y.querySelector(".volume-next")},y.addEventListener("click",function(e){e.target.closest("[data-close]")&&m()}),i.prev.addEventListener("click",function(){f(-1)}),i.next.addEventListener("click",function(){f(1)}),r=y,p(),d=document.body.style.overflow,document.body.style.overflow="hidden",u=[],Array.prototype.forEach.call(e.children,function(e){u.push([e,e.inert]),e.inert=!0}),e.appendChild(r),requestAnimationFrame(function(){r&&(r.setAttribute("data-open","in"),i.volume.focus({preventScroll:!0}))})))}}),document.addEventListener("keydown",function(e){if(r){if("Escape"===e.key)return e.preventDefault(),void m();if("ArrowRight"===e.key)return e.preventDefault(),void f(1);if("ArrowLeft"===e.key)return e.preventDefault(),void f(-1);if("Tab"===e.key){var t=Array.prototype.slice.call(i.volume.querySelectorAll('button:not(:disabled),[tabindex="0"]'));if(!t.length)return;var o=t[0],n=t[t.length-1];!e.shiftKey||document.activeElement!==o&&document.activeElement!==i.volume?e.shiftKey||document.activeElement!==n||(e.preventDefault(),o.focus()):(e.preventDefault(),n.focus())}}})}if("function"==typeof window.initStoryEditorial){var _ed=function(){try{window.initStoryEditorial(e)}catch(y){}};window.requestIdleCallback?requestIdleCallback(_ed,{timeout:1500}):setTimeout(_ed,150)}!function(){var t=e.querySelectorAll("outbreak-map, outbreak-trend");if(t.length){var o=!1;if("IntersectionObserver"in window){var n=new IntersectionObserver(function(e){e.some(function(e){return e.isIntersecting})&&(r(),n.disconnect())},{rootMargin:"800px 0px"});t.forEach(function(e){n.observe(e)})}else r()}function a(e){return new Promise(function(t,o){var n=document.createElement("script");n.src=e,n.async=!1,n.onload=t,n.onerror=o,document.body.appendChild(n)})}function r(){o||(o=!0,a("./assets/vendor/leaflet/leaflet.js?v=db49d009c8").then(function(){return a("./assets/outbreak.js?v=d7c4951e0b")}).catch(function(){}))}}()}}();
/*pa:start*/
(() => {
  const root = document.querySelector('.pa');
  if (!root) return;
  const track = root.querySelector('.pa-files');
  const files = [...track.querySelectorAll('.pa-file')];
  const previous = root.querySelector('[data-promise-prev]');
  const next = root.querySelector('[data-promise-next]');
  const position = root.querySelector('#promise-position');
  const links = [...root.querySelectorAll('.pa-cells a')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  function update(index) {
    current = index;
    position.textContent = 'Promise ' + (index + 1) + ' of ' + files.length;
    previous.disabled = index === 0;
    next.disabled = index === files.length - 1;
    links.forEach(link => {
      if (link.hash === '#' + files[index].id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  function go(index, instant = false) {
    index = Math.max(0, Math.min(files.length - 1, index));
    update(index);
    track.scrollTo({left: files[index].offsetLeft - files[0].offsetLeft, behavior: instant || reduced.matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target !== track) return;
    const keys = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: files.length - 1};
    if (event.key in keys) { event.preventDefault(); go(keys[event.key]); }
  });
  links.forEach(link => link.addEventListener('click', event => {
    const index = files.findIndex(file => '#' + file.id === link.hash);
    if (index < 0) return;
    event.preventDefault();
    go(index);
    track.focus({preventScroll:true});
    track.scrollIntoView({block:'nearest', inline:'nearest', behavior:reduced.matches ? 'instant' : 'smooth'});
  }));
  // Read the final native scroll position after touch, trackpad or keyboard scrolling.
  let timer;
  track.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const left = track.scrollLeft;
      const distances = files.map(file => Math.abs(file.offsetLeft - files[0].offsetLeft - left));
      update(distances.indexOf(Math.min(...distances)));
    }, 120);
  }, {passive:true});
  let trackWidth = track.clientWidth;
  const trackResize = new ResizeObserver(() => {
    if (track.clientWidth !== trackWidth) {
      trackWidth = track.clientWidth;
      go(current, true);
    }
  });
  trackResize.observe(track);
  function followHash() {
    const index = files.findIndex(file => '#' + file.id === location.hash);
    if (index >= 0) go(index, true);
  }
  window.addEventListener('hashchange', followHash);
  const dialog = root.querySelector('.pa-detail-dialog');
  const detailContent = dialog.querySelector('.pa-detail-content');
  let bodyOverflow = '';
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-promise-detail]');
    if (!button) return;
    const template = root.querySelector('#promise-detail-' + button.dataset.promiseDetail);
    detailContent.replaceChildren(template.content.cloneNode(true));
    bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
  });
  dialog.querySelector('[data-promise-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = bodyOverflow; });
  update(0);
  followHash();
})();
/*pa:end*/
