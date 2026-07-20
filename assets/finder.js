/* =============================================================================
   finder.js — pick two people, compute their relationship via FL.relationship.
============================================================================= */
(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;

  // searchable list of real (non-placeholder) people
  var everyone = FL.people
    .filter(function(p){ return !FL.isPlaceholder(p.name); })
    .map(function(p){ var br=FL.branchOf(p.id); return { id:p.id, name:FL.displayName(p.name), sex:p.sex||"", branch:br?FL.displayName(br.name):"", parent:(FL.parentOf[p.id]?FL.displayName(FL.parentOf[p.id].name):"") }; })
    .sort(function(a,b){ return a.name.toLowerCase()<b.name.toLowerCase()?-1:1; });

  var chosen = { a:null, b:null };

  function makePicker(rootId, side){
    var root = document.getElementById(rootId);
    var input = root.querySelector("input");
    var list = root.querySelector(".plist");
    var sel = root.querySelector(".sel");

    function show(items){
      list.innerHTML="";
      items.slice(0,40).forEach(function(x){
        var b=document.createElement("button");
        b.innerHTML = SITE.escapeText(x.name) + (x.branch?' <span style="color:var(--muted);font-size:12px">· '+SITE.escapeText(x.branch)+(x.parent?', child of '+SITE.escapeText(x.parent):'')+'</span>':'');
        b.onclick=function(){ pick(x); };
        list.appendChild(b);
      });
      list.classList.toggle("on", items.length>0);
    }
    function pick(x){
      chosen[side]=x;
      input.value="";
      list.classList.remove("on");
      sel.innerHTML="";
      var av=document.createElement("div"); av.className="avatar "+(x.sex||""); av.style.cssText="width:40px;height:40px"; av.textContent=FL.initials(x.name);
      var nm=document.createElement("div");
      nm.innerHTML='<div style="font-weight:700">'+SITE.escapeText(x.name)+'</div><div style="font-size:12px;color:var(--muted)">'+SITE.escapeText(x.branch||"")+'</div>';
      var view=document.createElement("button"); view.className="relbtn"; view.style.marginLeft="auto"; view.textContent="Profile";
      view.onclick=function(){ SITE.openProfile(x.id); };
      sel.appendChild(av); sel.appendChild(nm); sel.appendChild(view);
      compute();
    }
    input.addEventListener("input", function(){
      var q=input.value.trim().toLowerCase();
      if(!q){ list.classList.remove("on"); return; }
      show(everyone.filter(function(p){ return p.name.toLowerCase().indexOf(q)>=0; }));
    });
    input.addEventListener("focus", function(){ if(input.value.trim()) input.dispatchEvent(new Event("input")); });
    document.addEventListener("click", function(e){ if(!root.contains(e.target)) list.classList.remove("on"); });
  }

  function compute(){
    var out=document.getElementById("result");
    if(!chosen.a || !chosen.b){ out.className="result empty"; out.textContent="Choose two people above to see how they are related."; return; }
    if(chosen.a.id===chosen.b.id){ out.className="result empty"; out.textContent="That's the same person — pick two different people."; return; }
    var r = FL.relationship(chosen.a.id, chosen.b.id);
    out.className="result";
    out.innerHTML =
      '<div style="font-size:13px;color:var(--muted)">'+SITE.escapeText(chosen.a.name)+' &nbsp;↔&nbsp; '+SITE.escapeText(chosen.b.name)+'</div>'+
      '<div class="rel">'+SITE.escapeText(r.headline)+'</div>'+
      (r.detail?'<div class="det">'+SITE.escapeText(r.detail)+'</div>':'')+
      (r.via?'<div class="via">'+SITE.escapeText(r.via)+'</div>':'');
  }

  makePicker("pa","a");
  makePicker("pb","b");
})();
