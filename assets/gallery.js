/* =============================================================================
   gallery.js — the curated family photo gallery. Photographs are organised into:
     • The Elders — Sheikh Mubarak Ali and his seven children
     • One section per branch, each SUB-GROUPED BY HOUSEHOLD (the branch head's
       children and their families)
     • Gatherings & Occasions — group and cross-family photographs
   Photos are listed in gallery.csv and live in the gallery/ folder — kept
   entirely separate from the profile pictures in photos/. See GALLERY-SETUP.md.

   Placement is automatic: give a photo a `place` of `elders`, `gatherings`, or
   the name/id of a person in it, and the gallery files it under the right
   branch → household by reading the family tree. No manual section lists.
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE, CFG = window.ARCHIVE_CONFIG || {};
  var host = document.getElementById("gal"),
      navEl = document.getElementById("galnav"),
      emptyBox = document.getElementById("empty");
  var GAL_URL = (CFG.galleryCsvUrl || "gallery.csv");

  // name -> [ids], so `place` can be a person's name (ids stay the safe option)
  var nameIndex = {};
  FL.people.forEach(function(p){
    if(FL.isPlaceholder(p.name)) return;
    var k = FL.displayName(p.name).toLowerCase();
    (nameIndex[k] = nameIndex[k] || []).push(p.id);
  });

  function el(t,c,h){ var e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; }
  function attr(v){ return SITE.escapeText(v||"").replace(/"/g,"&quot;"); }

  fetch(GAL_URL, { cache:"no-store" })
    .then(function(r){ return r.ok ? r.text() : ""; })
    .catch(function(){ return ""; })
    .then(function(text){ build(parseManifest(text)); });

  /* ---------- read gallery.csv ---------- */
  function parseManifest(text){
    if(!text || typeof window.parseCsv !== "function") return [];
    var rows = window.parseCsv(text); if(!rows.length) return [];
    var head = rows[0].map(function(h){ return (''+h).trim().toLowerCase(); });
    var ix = {}; head.forEach(function(h,i){ ix[h]=i; });
    var out = [];
    for(var r=1; r<rows.length; r++){
      var c = rows[r]; if(c.length===1 && !(''+c[0]).trim()) continue;
      var get = function(k){ var i=ix[k]; return i==null ? '' : (''+(c[i]||'')).trim(); };
      var file = get('file') || get('photo'); if(!file) continue;
      if(!/\//.test(file)) file = 'gallery/' + file;          // bare name → gallery/ folder
      out.push({ file:file, caption:get('caption'),
                 place:(get('place') || get('section') || get('household') || ''),
                 year:get('year'),
                 people:(get('people')||'').split(/[;,]/).map(function(s){return s.trim();}).filter(Boolean) });
    }
    return out;
  }

  /* ---------- work out which section + household a photo belongs to ---------- */
  function idFromPlace(p){
    if(!p) return null;
    if(FL.byId[p]) return p;                                   // exact id
    var hit = nameIndex[p.toLowerCase()];                      // or a unique name
    return (hit && hit.length===1) ? hit[0] : null;
  }
  function resolvePlace(place){
    var key = (place||'').trim().toLowerCase();
    if(key==='elders' || key==='elder') return { section:'elders', householdId:null };
    if(key==='gatherings' || key==='gathering' || key==='occasions' || key==='occasion')
      return { section:'gatherings', householdId:null };
    var id = idFromPlace(place);
    if(!id) return { section:'gatherings', householdId:null, unplaced: !!place };
    var n = FL.byId[id];
    if(n.external){ var pid=(n.spouses||[]).map(function(s){return s.id;}).filter(function(x){return x&&FL.byId[x];})[0]; if(pid) n=FL.byId[pid]; }
    var ch = FL.chain(n.id);                                   // [{node,depth} ... root]
    if(!ch || !ch.length) return { section:'gatherings', householdId:null };
    if(ch.length <= 2) return { section:'elders', householdId:null };   // patriarch or a branch head
    return { section: ch[ch.length-2].node.id, householdId: ch[ch.length-3].node.id };
  }

  /* ---------- render ---------- */
  function build(items){
    var branches = FL.branches();
    var order = [{key:'elders'}].concat(branches.map(function(b){ return {key:b.id, branch:b}; })).concat([{key:'gatherings'}]);
    var meta = {
      elders:     { title:'The Elders', sub:'Sheikh Mubarak Ali and his seven children' },
      gatherings: { title:'Gatherings & Occasions', sub:'Group and cross-family photographs' }
    };
    branches.forEach(function(b){ meta[b.id] = { title:'Branch '+b.index+' — '+FL.displayName(b.name), branch:b }; });

    var buckets = {}; order.forEach(function(o){ buckets[o.key] = { general:[], hh:{} }; });
    var unplaced = 0;
    items.forEach(function(it){
      var pl = resolvePlace(it.place); if(pl.unplaced) unplaced++;
      var bk = buckets[pl.section] || buckets.gatherings;
      if(pl.householdId){ (bk.hh[pl.householdId] = bk.hh[pl.householdId] || []).push(it); }
      else bk.general.push(it);
    });

    host.innerHTML = ''; if(navEl) navEl.innerHTML = ''; if(emptyBox) emptyBox.innerHTML = '';
    if(!items.length){ renderEmpty(order, meta); return; }

    function total(bk){ return bk.general.length + Object.keys(bk.hh).reduce(function(a,k){ return a+bk.hh[k].length; },0); }

    order.forEach(function(o){
      var bk = buckets[o.key]; if(!total(bk)) return;
      var short = meta[o.key].title.replace(/^Branch \d+ — /,'');
      var a = el('a', null, SITE.escapeText(short)); a.href = '#sec-'+o.key; navEl.appendChild(a);
    });

    order.forEach(function(o){
      var bk = buckets[o.key], m = meta[o.key]; if(!total(bk)) return;
      var wrap = el('section','gsecwrap'); wrap.id = 'sec-'+o.key;
      var head = el('div','galsec','<h3 class="h">'+SITE.escapeText(m.title)+'</h3>'+(m.sub?'<div class="s">'+SITE.escapeText(m.sub)+'</div>':''));
      wrap.appendChild(head);

      if(m.branch){
        var kids = (FL.byId[o.key].children || []);
        kids.forEach(function(hh){
          var arr = bk.hh[hh.id]; if(!arr || !arr.length) return;
          wrap.appendChild(el('div','galhh', SITE.escapeText(FL.displayName(hh.name))+'’s family'));
          wrap.appendChild(grid(arr));
        });
        Object.keys(bk.hh).forEach(function(hid){                 // households not directly under this head (rare)
          if(kids.some(function(k){ return k.id===hid; })) return;
          var arr = bk.hh[hid]; var nm = FL.displayName((FL.byId[hid]||{}).name || '');
          wrap.appendChild(el('div','galhh', SITE.escapeText(nm)+'’s family'));
          wrap.appendChild(grid(arr));
        });
      }
      if(bk.general.length){
        if(m.branch) wrap.appendChild(el('div','galhh','More from this branch'));
        wrap.appendChild(grid(bk.general));
      }
      host.appendChild(wrap);
    });

    if(unplaced) host.appendChild(el('div','galsec-empty',
      'Note: '+unplaced+' photo'+(unplaced>1?'s':'')+' had an unrecognised “place” and '+(unplaced>1?'were':'was')+' shown under Gatherings & Occasions.'));
    host.appendChild(addNote());
  }

  function grid(items){
    items = items.slice().sort(function(a,b){ return (''+(a.year||'')).localeCompare(''+(b.year||'')); });
    var g = el('div','gal');
    items.forEach(function(it){ g.appendChild(card(it)); });
    return g;
  }

  function peopleNames(it){
    return (it.people||[]).map(function(pid){ var n=FL.byId[pid]; return n?FL.displayName(n.name):null; }).filter(Boolean).join(', ');
  }

  function card(it){
    var cap = it.caption || peopleNames(it);
    var g = el('div','g');
    g.innerHTML = '<div class="gimg"><img alt="" loading="lazy"></div>' +
      (cap ? '<div class="cap">'+SITE.escapeText(cap)+(it.year?' <span class="yr">'+SITE.escapeText(it.year)+'</span>':'')+'</div>' : '');
    var img = g.querySelector('img');
    img.onerror = function(){ g.querySelector('.gimg').innerHTML = '<div class="ph">Photo file not found<br><code>'+SITE.escapeText(it.file)+'</code></div>'; };
    img.onclick = function(){ SITE.openLightbox(it.file, cap||''); };
    img.style.cursor = 'zoom-in';
    img.src = it.file;
    if(it.people && it.people.length){
      var pr = el('div','gpeople');
      it.people.forEach(function(pid){ var n=FL.byId[pid]; if(!n) return;
        var b = el('button','gtag', SITE.escapeText(FL.displayName(n.name))); b.onclick=function(){ SITE.openProfile(pid); }; pr.appendChild(b);
      });
      if(pr.childNodes.length) g.appendChild(pr);
    }
    return g;
  }

  function addNote(){
    return el('div','galaddnote',
      '➕ To add photographs, see <a href="https://github.com/'+attr((CFG.repo||{}).owner)+'/'+attr((CFG.repo||{}).name)+'/blob/main/GALLERY-SETUP.md" target="_blank" rel="noopener">the gallery guide</a>, or send them to your assistant and say which family they belong to.');
  }

  function renderEmpty(order, meta){
    var wrap = el('div');
    wrap.innerHTML =
      '<div class="empty-state"><div class="ico">🖼️</div><h3>The gallery is ready — no photographs yet</h3>'+
      '<p>Photographs are organised into the sections below. Add a photo and it appears in the right place automatically.</p></div>';
    var preview = el('div','galpreview');
    order.forEach(function(o){ preview.appendChild(el('span','galchip', SITE.escapeText(meta[o.key].title))); });
    wrap.appendChild(preview);
    var d = el('div','howto',
      '<h4>How to add photographs</h4>'+
      '<ol>'+
      '<li>Upload the image files into the <code>gallery/</code> folder in the repository (you can drag several in at once).</li>'+
      '<li>Add one line per photo to <code>gallery.csv</code>: the <b>file</b> name, a <b>caption</b>, and a <b>place</b>.</li>'+
      '<li><b>place</b> is either <code>elders</code>, <code>gatherings</code>, or the <b>name or id of a person</b> in the photo — the gallery then files it under their branch and household for you.</li>'+
      '</ol>'+
      '<p class="lede" style="font-size:13px;margin-top:6px">Full guide: <a href="https://github.com/'+attr((CFG.repo||{}).owner)+'/'+attr((CFG.repo||{}).name)+'/blob/main/GALLERY-SETUP.md" target="_blank" rel="noopener">GALLERY-SETUP.md</a>. Or just send the photos to your assistant and say which family they belong to.</p>');
    wrap.appendChild(d);
    emptyBox.appendChild(wrap);
  }
});
