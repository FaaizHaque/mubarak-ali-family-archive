/* =============================================================================
   directory.js — searchable / filterable A–Z list of every family member.
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;
  var rows = FL.directory();
  var branches = FL.branches();

  var qEl = document.getElementById("q"),
      brEl = document.getElementById("branch"),
      genEl = document.getElementById("gen"),
      sortEl = document.getElementById("sort"),
      hideEl = document.getElementById("hideph"),
      grid = document.getElementById("grid"),
      countEl = document.getElementById("count"),
      noneEl = document.getElementById("none");

  branches.forEach(function(b){ var o=document.createElement("option"); o.value=b.id; o.textContent="Branch "+b.index+" — "+b.name; brEl.appendChild(o); });
  var maxGen = rows.reduce(function(m,r){ return Math.max(m,r.gen); },0);
  for(var g=0; g<=maxGen; g++){ var o=document.createElement("option"); o.value=String(g); o.textContent="Generation "+(g+1); genEl.appendChild(o); }

  function avatar(r){
    var a=document.createElement("div"); a.className="avatar "+(r.sex||"");
    if(r.photoTried){} // no photo field in directory rows by default
    a.textContent = FL.initials(r.raw);
    return a;
  }
  function pcard(r){
    var b=document.createElement("button"); b.className="pcard"+(r.placeholder?" placeholder":"");
    b.onclick=function(){ SITE.openProfile(r.id); };
    b.appendChild(avatar(r));
    var m=document.createElement("div"); m.style.minWidth="0";
    var extra=[];
    if(r.profession) extra.push(FL.isPlaceholder(r.profession)?"":SITE.escapeText(r.profession));
    if(r.dob||r.dod) extra.push((r.dob||"?")+(r.dod?"–"+r.dod:""));
    m.innerHTML =
      '<div class="nm">'+(r.notable?'<span class="starred">★</span> ':'')+SITE.escapeText(r.name)+'</div>'+
      '<div class="mt"><span class="b">'+SITE.escapeText(r.branch)+'</span> · Gen '+(r.gen+1)+(r.parent?' · child of '+SITE.escapeText(r.parent):'')+'</div>'+
      (extra.filter(Boolean).length?'<div class="mt">'+extra.filter(Boolean).join(" · ")+'</div>':'');
    b.appendChild(m);
    return b;
  }

  function render(){
    var q=(qEl.value||"").trim().toLowerCase();
    var br=brEl.value, gen=genEl.value, sort=sortEl.value, hide=hideEl.checked;
    var list = rows.filter(function(r){
      if(hide && r.placeholder) return false;
      if(br && r.branchId!==br) return false;
      if(gen!=="" && String(r.gen)!==gen) return false;
      if(q){
        var hay=(r.name+" "+r.parent+" "+r.spouses.join(" ")+" "+r.profession).toLowerCase();
        if(hay.indexOf(q)<0) return false;
      }
      return true;
    });
    list.sort(function(a,b){
      if(sort==="branch"){ if(a.branch!==b.branch) return a.branch<b.branch?-1:1; if(a.gen!==b.gen) return a.gen-b.gen; }
      else if(sort==="gen"){ if(a.gen!==b.gen) return a.gen-b.gen; }
      return a.name.toLowerCase()<b.name.toLowerCase()?-1:a.name.toLowerCase()>b.name.toLowerCase()?1:0;
    });
    grid.innerHTML="";
    list.forEach(function(r){ grid.appendChild(pcard(r)); });
    countEl.textContent = list.length + " " + (list.length===1?"person":"people");
    noneEl.style.display = list.length ? "none" : "block";
  }

  [qEl].forEach(function(e){ e.addEventListener("input", render); });
  [brEl,genEl,sortEl,hideEl].forEach(function(e){ e.addEventListener("change", render); });
  render();

  // open a profile if arriving with #id
  var h=(location.hash||"").replace("#",""); if(h && FL.byId[h]) SITE.openProfile(h);
});
