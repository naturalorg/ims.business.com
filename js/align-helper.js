/* Alignment helper: right/centre-aligns a column header to match its data cells (all tables, all pages) */
(function(){
  var t=null;
  function fix(){
    document.querySelectorAll('table').forEach(function(tb){
      if(!tb.tHead||tb.tHead.rows.length!==1||!tb.tBodies[0]) return;
      var hr=tb.tHead.rows[0], hc=hr.cells, n=hc.length;
      for(var k=0;k<n;k++) if(hc[k].colSpan>1) return;
      var rows=[].slice.call(tb.tBodies[0].rows).filter(function(r){return r.cells.length===n&&![].some.call(r.cells,function(c){return c.colSpan>1;});}).slice(0,8);
      if(!rows.length) return;
      for(var i=0;i<n;i++){
        if(hc[i].style.textAlign) continue;
        var r=0,c=0;
        rows.forEach(function(row){var a=getComputedStyle(row.cells[i]).textAlign; if(a==='right'||a==='end') r++; else if(a==='center') c++;});
        var v=r>rows.length/2?'r':(c>rows.length/2?'c':'');
        if(v) hc[i].setAttribute('data-al',v); else hc[i].removeAttribute('data-al');
      }
    });
  }
  new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){(window.requestIdleCallback||function(f){f();})(fix);},700);}).observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
})();
