// Probe actual AVIF/WebP decode — catches Safari Lockdown Mode silent breakage
function __imgProbe(s){return new Promise(function(r){var i=new Image;i.onload=function(){r(i.width>0)};i.onerror=function(){r(!1)};i.src=s})}
window.__avif=__imgProbe('assets/probe.avif');
window.__webp=__imgProbe('assets/probe.webp');
