/* =============================================================================
   site.js — shared chrome for every page: header, navigation, footer, theme
   toggle, and the profile drawer (used by the tree, directory and finder).
   Include AFTER data.js + familylib.js. Reads document.body.dataset.page to
   highlight the active tab. You rarely need to touch this.
============================================================================= */
(function(){
  "use strict";
  var FL = window.FL;
  var page = document.body.dataset.page || "home";

  var NAV = [
    { label:"Home", href:"index.html", page:"home" },
    { label:"The Family", page:"explore", children:[
      { label:"Family Tree",         href:"tree.html",      page:"tree" },
      { label:"Family Directory",    href:"directory.html", page:"directory" },
      { label:"Relationship Finder", href:"finder.html",    page:"finder" },
      { label:"Timeline",            href:"timeline.html",  page:"timeline" },
      { label:"Notable Members",     href:"notable.html",   page:"notable" }
    ]},
    { label:"Gallery",             href:"gallery.html",   page:"gallery" },
    { label:"Family Stories",      href:"stories.html",   page:"stories" },
    { label:"Documents & Archive", href:"documents.html", page:"documents" }
  ];

  /* ---------- theme ---------- */
  var THEME_KEY = "sma-theme";
  function savedTheme(){ try{ return localStorage.getItem(THEME_KEY); }catch(e){ return null; } }
  function effective(){
    var t = document.documentElement.getAttribute("data-theme");
    if(t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  (function initTheme(){ var t = savedTheme(); if(t) document.documentElement.setAttribute("data-theme", t); })();
  function toggleTheme(){
    var next = effective()==="dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    updateThemeBtn();
  }
  function updateThemeBtn(){ var b=document.getElementById("themebtn"); if(b) b.textContent = effective()==="dark" ? "☀️" : "🌙"; }

  /* ---------- header + nav ---------- */
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

  function isActive(item){
    if(item.page===page) return true;
    if(item.children) return item.children.some(function(c){ return c.page===page; });
    return false;
  }

  function buildHeader(){
    var hdr = el("header","hdr");
    var top = el("div","top");
    var crest = el("a","crest","م"); crest.href="index.html"; crest.title="Home"; crest.style.textDecoration="none";
    var titles = el("div","titles");
    var h1 = el("h1"); var a=el("a",null,FL.site.title); a.href="index.html"; a.style.color="inherit"; h1.appendChild(a);
    titles.appendChild(h1);
    titles.appendChild(el("div","sub",FL.site.subtitle||""));
    var tools = el("div","tools");
    var theme = el("button","themebtn"); theme.id="themebtn"; theme.title="Toggle light / dark"; theme.onclick=toggleTheme;
    var menu = el("button","menubtn","☰"); menu.title="Menu";
    tools.appendChild(theme); tools.appendChild(menu);
    top.appendChild(crest); top.appendChild(titles); top.appendChild(tools);
    hdr.appendChild(top);

    var nav = el("nav","nav"); nav.id="nav";
    NAV.forEach(function(item){
      if(item.children){
        var wrap = el("div","navitem" + (isActive(item)?" active":""));
        var btn = el("button",null,item.label);
        var dd = el("div","dropdown");
        item.children.forEach(function(c){
          var link = el("a", c.page===page?"active":"", c.label); link.href=c.href; dd.appendChild(link);
        });
        btn.onclick = function(e){ e.stopPropagation(); wrap.classList.toggle("open"); };
        wrap.appendChild(btn); wrap.appendChild(dd); nav.appendChild(wrap);
      } else {
        var link = el("a", isActive(item)?"active":"", item.label); link.href=item.href; nav.appendChild(link);
      }
    });
    hdr.appendChild(nav);
    menu.onclick = function(e){ e.stopPropagation(); nav.classList.toggle("open"); };
    document.addEventListener("click", function(){ document.querySelectorAll(".navitem.open").forEach(function(n){ n.classList.remove("open"); }); });

    document.body.insertBefore(hdr, document.body.firstChild);
    updateThemeBtn();
  }

  function buildFooter(){
    if(document.body.classList.contains("page-tree")) return;
    var f = el("footer","footer");
    var year = "";  // static; avoids Date in some sandboxes
    f.innerHTML = '<div class="in"><div>'+FL.site.title+' · a living family archive</div>'+
      '<div><a href="edit.html">✎ Add / edit a person</a> &nbsp;·&nbsp; <a href="index.html">Home</a></div></div>';
    document.body.appendChild(f);
  }

  /* ---------- shared profile drawer ---------- */
  var drawer, backdrop, toastEl, toastT;
  function buildDrawer(){
    backdrop = el("div","drawer-backdrop"); backdrop.onclick=closeProfile; document.body.appendChild(backdrop);
    drawer = el("div","drawer");
    drawer.innerHTML =
      '<div class="dhead"><button class="close" title="Close">✕</button>'+
      '<div class="dav u" id="d-av"></div><h3 id="d-name"></h3><div class="dtags" id="d-tags"></div></div>'+
      '<div class="dbody" id="d-body"></div>';
    drawer.querySelector(".close").onclick = closeProfile;
    document.body.appendChild(drawer);
    toastEl = el("div","toast"); document.body.appendChild(toastEl);
  }
  function closeProfile(){
    drawer.classList.remove("on"); backdrop.classList.remove("on");
    if(location.hash) history.replaceState(null,"",location.pathname+location.search);
  }
  function relBtn(name, sex, id){
    var b = el("button","relbtn "+(sex==="m"?"m":sex==="f"?"f":"")+(FL.isPlaceholder(name)?" placeholder":""));
    b.innerHTML = '<span class="dot"></span>'+FL.displayName(name);
    if(id) b.onclick = function(){ openProfile(id); };
    return b;
  }
  function sec(body, title){ var d=el("div","sec"); d.appendChild(el("h4",null,title)); body.appendChild(d); return d; }

  // Render a multi-line bio: "Label: value" lines, "Heading:" subheads, and "• " bullets.
  function renderBio(text){
    var wrap=el("div","biobody"), lines=(''+text).split(/\r?\n/), ul=null;
    lines.forEach(function(line){
      var t=line.trim();
      if(!t){ ul=null; return; }
      if(/^[•\-\*]\s?/.test(t)){
        if(!ul){ ul=el("ul","biolist"); wrap.appendChild(ul); }
        var li=document.createElement("li"); li.textContent=t.replace(/^[•\-\*]\s?/,""); ul.appendChild(li);
      } else if(/:$/.test(t) && t.length<48){
        ul=null; wrap.appendChild(el("div","biohead",escapeText(t.replace(/:$/,""))));
      } else {
        ul=null; var m=t.match(/^([^:]{2,42}):\s+(.+)$/), d=el("div","bioline");
        if(m) d.innerHTML="<b>"+escapeText(m[1])+":</b> "+escapeText(m[2]); else d.textContent=t;
        wrap.appendChild(d);
      }
    });
    return wrap;
  }

  // Fill an avatar element: initials first, then a photo if one exists. Uses the
  // explicit `photo` field, else auto-looks for photos/<id>.jpg|.jpeg|.png — so
  // just uploading photos/<id>.jpg is enough, no data edit needed.
  function fillAvatar(elem, node){
    if(!node) return;
    elem.textContent = FL.initials(node.name);
    var cands;
    if(node.photo) cands = [node.photo];
    else if(node.id) cands = ["photos/"+node.id+".jpg","photos/"+node.id+".jpeg","photos/"+node.id+".png"];
    else return;
    var i=0;
    (function next(){
      if(i>=cands.length) return;
      var url=cands[i++], im=new Image();
      im.alt="";
      im.onload=function(){ elem.textContent=""; elem.appendChild(im); };
      im.onerror=next;
      im.src=url;
    })();
  }

  function openProfile(id){
    var n = FL.byId[id]; if(!n) return;
    if(!drawer) buildDrawer();
    try{ history.replaceState(null,"","#"+id); }catch(e){ location.hash = id; }

    var av = document.getElementById("d-av"); av.className = "dav "+(n.sex||"u"); av.innerHTML="";
    fillAvatar(av, n);
    document.getElementById("d-name").textContent = FL.displayName(n.name);

    var tags = document.getElementById("d-tags"); tags.innerHTML="";
    function tag(t){ tags.appendChild(el("span","tag",t)); }
    if(n.notable) tag("★ Notable member");
    if(n.sex==="m") tag("Male"); else if(n.sex==="f") tag("Female");
    if(n.external) tag("Married into the family");
    var br = FL.branchOf(id); if(br) tag("Branch: "+FL.displayName(br.name));
    if(n.dob||n.dod) tag((n.dob||"?")+(n.dod?" – "+n.dod:" – present"));
    if(n.profession) tag("💼 "+n.profession);

    var body = document.getElementById("d-body"); body.innerHTML="";

    if(n.bio){ var s=sec(body,"Biography"); s.appendChild(renderBio(n.bio)); }
    if(n.honors){ var sh=sec(body,"Honours & achievements"); sh.appendChild(el("div","bio",escapeText(n.honors))); }
    if(n.note){ var sn=sec(body,"Note"); sn.appendChild(el("div","bio",escapeText(n.note))); }

    var d = sec(body,"Details"); var any=false;
    function kv(k,v){ any=true; var r=el("div","kv"); r.innerHTML='<span class="k">'+k+'</span><span>'+v+'</span>'; d.appendChild(r); }
    if(n.role) kv("Role", escapeText(n.role));
    if(n.dob) kv("Born", escapeText(n.dob));
    if(n.dod) kv("Died", escapeText(n.dod));
    if(n.profession) kv("Profession", escapeText(n.profession));
    if(!any) d.appendChild(el("div","empty","No dates or profession recorded yet."));

    if(n.spouses && n.spouses.length){
      var sp = sec(body, n.spouses.length>1?"Spouses":"Spouse");
      n.spouses.forEach(function(s){
        var line = el("div"); line.style.marginBottom="6px";
        line.appendChild(relBtn(s.name,"",s.id));
        if(s.note){ var i=el("span",null,s.note); i.style.cssText="font-size:12px;color:var(--muted);margin-left:6px"; line.appendChild(i); }
        sp.appendChild(line);
      });
    }
    var pars = FL.parentsOf ? FL.parentsOf(n.id) : (FL.parentOf[n.id]?[FL.parentOf[n.id]]:[]);
    if(pars.length){ var psec=sec(body, pars.length>1?"Parents":"Parent"); pars.forEach(function(pp){ psec.appendChild(relBtn(pp.name,pp.sex,pp.id)); }); }

    var kids = FL.effectiveChildren(n);
    if(kids.length){ var cs=sec(body,"Children ("+kids.length+")"); kids.forEach(function(c){ cs.appendChild(relBtn(c.name,c.sex,c.id)); }); }
    else if(n.ref){ var cs2=sec(body,"Children"); var rb=el("button","relbtn","🔗 "+n.ref.text); rb.onclick=function(){ openProfile(n.ref.to); }; cs2.appendChild(rb); }
    if(n.todo){ var td=sec(body,"To be added"); td.appendChild(el("div","addnote",escapeText(n.todo))); }

    var add = sec(body,"Add / update this person");
    add.appendChild(el("div","addnote",'To add a <b>photo, dates, profession or biography</b>, edit <code>assets/data.js</code> and find this person (id: <code>'+n.id+'</code>). The guide is at the top of that file.'));
    var fullLink = el("a",null,"↗ Open full profile page"); fullLink.href = "person.html?id=" + encodeURIComponent(id);
    fullLink.style.cssText = "display:block;text-align:center;margin-top:10px;background:linear-gradient(180deg,var(--gold-soft),var(--gold));color:#231a03;border-radius:10px;padding:10px;font-size:13px;font-weight:700;text-decoration:none";
    add.appendChild(fullLink);
    var share = el("div","sharerow");
    var showTree = el("button",null,"🌳 Show in tree"); showTree.onclick = function(){ showInTree(id); };
    var copy = el("button",null,"🔗 Copy link"); copy.onclick = function(){ copyLink(id); };
    share.appendChild(showTree); share.appendChild(copy); add.appendChild(share);

    drawer.classList.add("on"); backdrop.classList.add("on");
  }

  function showInTree(id){
    var n = FL.byId[id];   // a married-in spouse isn't in the tree — centre on their partner instead
    if(n && n.external){ var pid=(n.spouses||[]).map(function(s){ return s.id; }).filter(function(x){ return x && FL.byId[x]; })[0]; if(pid) id=pid; }
    if(window.SITE && typeof window.SITE.onShowInTree === "function"){ window.SITE.onShowInTree(id); }
    else location.href = "tree.html#" + id;
  }
  function copyLink(id){
    var base = location.href.replace(/[#?].*$/,"");
    var url = base.replace(/[^\/]*$/,"tree.html") + "#" + id;
    var t = url;
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ toast("Link copied"); }, function(){ toast("Copy failed"); });
    else { var i=el("input"); i.value=t; document.body.appendChild(i); i.select(); try{document.execCommand("copy"); toast("Link copied");}catch(e){} i.remove(); }
  }
  function toast(m){ if(!toastEl) return; toastEl.textContent=m; toastEl.classList.add("on"); clearTimeout(toastT); toastT=setTimeout(function(){ toastEl.classList.remove("on"); },1600); }
  function escapeText(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML; }

  /* ---------- boot ---------- */
  buildDrawer();   // drawer DOM has no data dependency; header/footer need FL.site

  window.SITE = {
    openProfile: openProfile,
    closeProfile: closeProfile,
    toast: toast,
    escapeText: escapeText,
    renderBio: renderBio,
    fillAvatar: fillAvatar,
    onShowInTree: null   // the tree page overrides this to centre instead of navigate
  };

  (window.familyReady || Promise.resolve()).then(function(){ buildHeader(); buildFooter(); });
})();
