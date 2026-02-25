// Upgrade noscript <img> to best supported format; upgrade video poster
Promise.all([window.__avif,window.__webp]).then(function(r){
  var ext=r[0]?'.avif':r[1]?'.webp':'.jpg';
  document.querySelectorAll('noscript').forEach(function(ns){
    var html=ns.textContent;
    if(html.indexOf('<img ')===-1)return;
    if(ext!=='.jpg')html=html.replace(/\.jpg(?=["'\s])/g,ext);
    var tmp=document.createElement('div');tmp.innerHTML=html;
    var img=tmp.querySelector('img');
    if(img)ns.parentNode.insertBefore(img,ns);
  });
  document.querySelectorAll('[data-poster]').forEach(function(v){v.poster=v.dataset.poster+ext});
});

// Nav shadow on scroll
window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navCheck = document.getElementById('nav-check');

const isMobileMenu = () => getComputedStyle(hamburger).display !== 'none';

const closeMenu = () => {
    navCheck.checked = false;
    hamburger.setAttribute('aria-expanded', 'false');
    if (isMobileMenu()) navLinks.setAttribute('aria-hidden', 'true');
};

navCheck.addEventListener('change', () => {
    const open = navCheck.checked;
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    navLinks.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
        const firstLink = navLinks.querySelector('a');
        if (firstLink) firstLink.focus();
    }
});

// Keyboard support for label
hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navCheck.checked = !navCheck.checked;
        navCheck.dispatchEvent(new Event('change'));
    }
});

navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
});

// Close mobile menu on Escape or click outside
// Lightbox keyboard (arrows) & swipe navigation
const lbIds = ['lb-1', 'lb-2', 'lb-3'];
const lbNav = (dir) => {
    const m = location.hash.match(/^#lb-(\d+)$/);
    if (!m) return false;
    const i = lbIds.indexOf(m[0].slice(1));
    const next = i + dir;
    if (next >= 0 && next < lbIds.length) { location.hash = '#' + lbIds[next]; return true; }
    return false;
};
let touchX = 0;
document.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) lbNav(dx < 0 ? 1 : -1);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (navCheck.checked) { closeMenu(); hamburger.focus(); }
        if (location.hash.startsWith('#lb-')) { location.hash = '#gallery'; }
    }
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'ArrowLeft') lbNav(-1);
});
document.addEventListener('click', (e) => {
    if (navCheck.checked && !navLinks.contains(e.target) && !hamburger.contains(e.target) && e.target !== navCheck) {
        closeMenu();
    }
});

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.01, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => observer.observe(el));
} else {
    reveals.forEach(el => el.classList.add('visible'));
}

// Scroll-spy: highlight active nav link
const spySections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const navLogo = document.querySelector('.nav-logo');
const heroEl = document.querySelector('.hero');
const clearActive = () => { navAnchors.forEach(a => a.classList.remove('active')); navLogo.classList.remove('active'); };
const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            clearActive();
            const hit = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
            if (hit) hit.classList.add('active');
        }
    });
}, { rootMargin: '-20% 0px -60% 0px' });
spySections.forEach(s => spyObserver.observe(s));
const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { clearActive(); navLogo.classList.add('active'); }
}, { rootMargin: '-20% 0px -60% 0px' });
heroObserver.observe(heroEl);

// Language toggle – checkbox drives CSS via :has(#lang-zh:checked); JS syncs lang attr + localStorage
const langCb = document.getElementById('lang-zh');
langCb.addEventListener('change', () => {
    const isZh = langCb.checked;
    document.documentElement.setAttribute('lang', isZh ? 'zh-TW' : 'en-GB');
    document.title = isZh ? '\u5510\u9cf3 \u00b7 \u6578\u4f4d\u6cbb\u7406\u5927\u4f7f' : 'Audrey Tang \u00b7 Cyber Ambassador';
    try { localStorage.setItem('lang', isZh ? 'zh-TW' : 'en-GB'); } catch (e) {}
    document.getElementById('lang-announce').textContent = isZh ? '語言已切換為華文' : 'Language switched to English';
});
document.querySelector('.lang-toggle').addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); langCb.click(); }
});
