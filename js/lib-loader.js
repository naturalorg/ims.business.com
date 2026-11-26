/* Lazy loader: heavy export libraries are fetched AFTER the app is on screen, so they never block first paint. */
(function(){
  var LIBS=[
    ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js']
  ];
  function add(u){return new Promise(function(res){var s=document.createElement('script');s.src=u;s.async=false;s.onload=s.onerror=function(){res();};document.head.appendChild(s);});}
  var started=null;
  window.loadLibs=function(){ if(!started){ started=LIBS.reduce(function(p,l){return p.then(function(){return add(l[0]);});},Promise.resolve()); } return started; };
  function go(){ (window.requestIdleCallback||function(f){setTimeout(f,300);})(function(){window.loadLibs();}); }
  if(document.readyState==='complete') go(); else window.addEventListener('load',go);
})();
