(function () {
  var href = '/fonts/{{iansui-rest-file}}';
  if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = '{{iansui-font-mime}}';
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.appendChild(link);
})();