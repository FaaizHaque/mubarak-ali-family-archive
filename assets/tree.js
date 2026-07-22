/* =============================================================================
   tree.js — renders the family tree and handles pan / zoom / pinch / collapse.
   Clicking a person opens the shared profile drawer (window.SITE.openProfile).
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;
  var stage = document.getElementById("stage");
  var world = document.getElementById("world");
  var tree  = document.getElementById("tree");

  /* ---------- build DOM ---------- */
  function card(node, depth){
    var li = document.createElement("li");
    li.setAttribute("data-li", node.id);

    var c = document.createElement("div");
    c.className = "node" + (node.sex==="m"?" sex-m":node.sex==="f"?" sex-f":"") + (depth===0?" root":"");
    if(FL.isPlaceholder(node.name)) c.className += " placeholder";
    c.setAttribute("data-id", node.id);

    var av = document.createElement("div"); av.className="avatar "+(node.sex||"");
    SITE.fillAvatar(av, node);
    c.appendChild(av);

    var meta = document.createElement("div"); meta.className="meta";
    meta.appendChild(mk("div","name", FL.displayName(node.name)));
    if(node.spouses && node.spouses.length){
      var parts = node.spouses.map(function(s){
        if(s.name && !FL.isPlaceholder(s.name)) return s.id ? "<b class='sp-link' data-id='"+esc(s.id)+"'>"+esc(s.name)+"</b>" : "<b>"+esc(s.name)+"</b>";
        if(s.note) return "<i style='opacity:.8'>"+esc(s.note)+"</i>";
        return "<i style='opacity:.7'>name TBD</i>";
      });
      meta.appendChild(mk("div","spouses", "<span class='heart'>⚭</span> "+parts.join(", ")));
    }
    if(node.ref) meta.appendChild(mk("div","reflink","🔗 "+esc(node.ref.text)));
    var badges = document.createElement("div"); badges.className="badges";
    if(node.dob||node.dod) badges.appendChild(mk("span","nchip",(esc(node.dob)||"?")+" – "+esc(node.dod||"")));
    if(node.profession) badges.appendChild(mk("span","nchip","💼 "+esc(node.profession)));
    if(badges.children.length) meta.appendChild(badges);
    c.appendChild(meta);
    if(node.notable) c.appendChild(mk("div","star","★"));
    li.appendChild(c);

    var kids = (node.children||[]).slice();
    if(node.todo) kids.push({ __todo: node.todo });
    if(kids.length){
      var ul = document.createElement("ul");
      kids.forEach(function(k){
        if(k.__todo){ var tli=document.createElement("li"); tli.appendChild(mk("div","node todo","＋ "+esc(k.__todo))); ul.appendChild(tli); }
        else ul.appendChild(card(k, depth+1));
      });
      li.appendChild(ul);
      var tg = document.createElement("button"); tg.className="toggle";
      var cnt = FL.descendantCount(node);
      function setTg(){ tg.textContent = li.classList.contains("collapsed") ? ("+"+cnt) : "–"; }
      tg.addEventListener("click", function(e){ e.stopPropagation(); li.classList.toggle("collapsed"); setTg(); });
      tg.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
      c.appendChild(tg);
      if(depth>=2) li.classList.add("collapsed");
      setTg(); li._setTg = setTg;
    }
    return li;
  }
  function mk(tag,cls,html){ var e=document.createElement(tag); e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function esc(s){ return SITE.escapeText(s==null?"":(""+s)); }

  var rootUl = document.createElement("ul");
  rootUl.appendChild(card(FL.root, 0));
  tree.appendChild(rootUl);

  /* ---------- pan / zoom ---------- */
  var tx=0, ty=0, scale=1, MIN=.14, MAX=3;
  function apply(){ world.style.transform="translate("+tx+"px,"+ty+"px) scale("+scale+")"; }
  function clampS(s){ return Math.max(MIN, Math.min(MAX, s)); }
  function zoomAround(px,py,ns){ ns=clampS(ns); var wx=(px-tx)/scale, wy=(py-ty)/scale; scale=ns; tx=px-wx*scale; ty=py-wy*scale; apply(); }

  var pointers=new Map(), moved=false, downX=0, downY=0, sTx=0, sTy=0, pinchDist=0, pinchScale=1, tapNode=null, tapSpouse=null;
  function xy(e){ var r=stage.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
  stage.addEventListener("pointerdown", function(e){
    stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId, xy(e));
    if(pointers.size===1){ moved=false; var p=xy(e); downX=p.x; downY=p.y; sTx=tx; sTy=ty; stage.classList.add("grabbing");
      tapNode = (e.target && e.target.closest) ? e.target.closest(".node") : null;
      tapSpouse = (e.target && e.target.closest) ? e.target.closest(".sp-link") : null; }
    else if(pointers.size===2){ tapNode=null; tapSpouse=null; var pt=[...pointers.values()]; pinchDist=Math.hypot(pt[0].x-pt[1].x, pt[0].y-pt[1].y); pinchScale=scale; }
  });
  stage.addEventListener("pointermove", function(e){
    if(!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, xy(e));
    if(pointers.size===2){ var pt=[...pointers.values()]; var d=Math.hypot(pt[0].x-pt[1].x, pt[0].y-pt[1].y); var mid={x:(pt[0].x+pt[1].x)/2,y:(pt[0].y+pt[1].y)/2}; if(pinchDist>0) zoomAround(mid.x,mid.y,pinchScale*(d/pinchDist)); moved=true; }
    else if(pointers.size===1){ var p=xy(e); var dx=p.x-downX, dy=p.y-downY; if(Math.abs(dx)+Math.abs(dy)>5) moved=true; tx=sTx+dx; ty=sTy+dy; apply(); }
  });
  function handleUp(e, allowTap){
    // a tap = the last pointer lifted without dragging, over a (non-placeholder) node
    var doTap = allowTap && pointers.size===1 && !moved && tapNode && !tapNode.classList.contains("todo");
    var node = tapNode, sp = tapSpouse;
    if(pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    if(pointers.size<2) pinchDist=0;
    if(pointers.size===0){ stage.classList.remove("grabbing"); tapNode=null; tapSpouse=null; }
    if(doTap){
      var spid = sp && sp.getAttribute("data-id");
      if(spid && FL.byId[spid]) SITE.openProfile(spid);          // tapped a spouse name → open the spouse
      else SITE.openProfile(node.getAttribute("data-id"));
    }
  }
  stage.addEventListener("pointerup", function(e){ handleUp(e, true); });
  stage.addEventListener("pointercancel", function(e){ handleUp(e, false); });
  stage.addEventListener("wheel", function(e){ e.preventDefault(); var p=xy(e); zoomAround(p.x,p.y,scale*Math.exp(-e.deltaY*0.0016)); }, {passive:false});

  /* ---------- fit / center ---------- */
  function fit(){
    var w=world.offsetWidth, h=world.offsetHeight, sw=stage.clientWidth, sh=stage.clientHeight;
    scale=clampS(Math.min(sw/w, sh/h)*0.96); tx=(sw-w*scale)/2; ty=Math.min(40,(sh-h*scale)/2); apply();
  }
  function centerOn(id, open){
    var node=FL.byId[id]; if(!node) return;
    var p=node; while(p){ var li=document.querySelector('[data-li="'+p.id+'"]'); if(li && li.classList.contains("collapsed")){ li.classList.remove("collapsed"); if(li._setTg) li._setTg(); } p=FL.parentOf[p.id]; }
    if(scale<0.8){ scale=0.9; apply(); }
    requestAnimationFrame(function(){
      var c=document.querySelector('.node[data-id="'+id+'"]'); if(!c) return;
      var cr=c.getBoundingClientRect(), sr=stage.getBoundingClientRect();
      tx += (sr.left+sr.width/2) - (cr.left+cr.width/2);
      ty += (sr.top+Math.min(sr.height*0.4,220)) - (cr.top+cr.height/2);
      apply(); c.classList.remove("flash"); void c.offsetWidth; c.classList.add("flash");
      if(open) SITE.openProfile(id);
    });
  }
  SITE.onShowInTree = function(id){ centerOn(id, false); };

  document.getElementById("zin").onclick=function(){ zoomAround(stage.clientWidth/2, stage.clientHeight/2, scale*1.25); };
  document.getElementById("zout").onclick=function(){ zoomAround(stage.clientWidth/2, stage.clientHeight/2, scale/1.25); };
  document.getElementById("fit").onclick=fit;
  var expanded=false;
  document.getElementById("expand").onclick=function(){
    expanded=!expanded;
    document.querySelectorAll('li[data-li]').forEach(function(li){ if(li.querySelector(":scope > ul")){ li.classList.toggle("collapsed", !expanded); if(li._setTg) li._setTg(); } });
    this.innerHTML = expanded ? "Collapse<br>all" : "Expand<br>all";
    if(!expanded) fit();
  };

  apply();
  requestAnimationFrame(function(){
    fit();
    var h=(location.hash||"").replace("#","");
    if(h && FL.byId[h]) centerOn(h, true);
  });
});
