/* =============================================================================
   familylib.js — shared logic for the whole archive (no page-specific code).
   Reads window.FAMILY (from data.js) and exposes window.FL used by every page:
   the tree renderer, the directory, the relationship finder, the timeline and
   the notable-members page all draw from this one index — enter a person once
   in data.js and they appear correctly everywhere.
============================================================================= */
(function(){
  "use strict";
  var F = window.FAMILY;
  var FL = window.FL = {};

  /* ---------- text helpers ---------- */
  FL.isPlaceholder = function(n){
    if(!n) return true;
    var s = (''+n).trim();
    if(!s) return true;
    return /^(x+|tbd|\?+|na|n\/a|\.\.+)$/i.test(s) || /^[A-Z]{1,4}$/.test(s);
  };
  FL.displayName = function(n){ return FL.isPlaceholder(n) ? 'Name to be added' : n; };
  FL.initials = function(n){
    if(FL.isPlaceholder(n)) return '?';
    var p = n.trim().split(/\s+/);
    return (p[0][0] + (p.length>1 ? p[p.length-1][0] : '')).toUpperCase();
  };
  FL.slug = function(s){ return (s||'x').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); };

  /* ---------- build the index (ids, parents, flat list) ---------- */
  var byId = FL.byId = {};
  var parentOf = FL.parentOf = {};     // id -> parent node
  var people = FL.people = [];         // flat list of every person node
  var used = {};
  (function assign(node, parent){
    if(!node.id || byId[node.id]){
      var base = node.id || FL.slug(FL.displayName(node.name)), id = base, i = 2;
      while(used[id]) id = base + '-' + (i++);
      node.id = id;
    }
    used[node.id] = true; byId[node.id] = node; people.push(node);
    if(parent) parentOf[node.id] = parent;
    (node.children||[]).forEach(function(c){ assign(c, node); });
  })(F.root, null);

  FL.site = F.site || { title: "Family Archive", subtitle: "" };
  FL.intro = F.intro || { paragraphs: [] };
  FL.events = F.events || [];
  FL.root = F.root;

  /* ---------- lineage helpers ---------- */
  function chain(id){                    // [{node,depth}] self=0 up to root
    var out = [], n = byId[id], d = 0;
    while(n){ out.push({ node:n, depth:d }); n = parentOf[n.id]; d++; }
    return out;
  }
  FL.chain = chain;

  FL.descendantCount = function(node){
    var n = 0; (node.children||[]).forEach(function(c){ n += 1 + FL.descendantCount(c); });
    return n;
  };
  FL.generation = function(id){ return chain(id).length - 1; };   // 0 = Mubarak Ali

  FL.branchOf = function(id){            // top-level branch node this person sits under
    var c = chain(id);
    if(c.length < 2) return null;        // the root itself
    return c[c.length - 2].node;         // the child of root on this path
  };

  /* ---------- relationship engine ---------- */
  var ORD = ["zeroth","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];
  function ordinal(n){ return ORD[n] || (n + "th"); }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function removedText(m){
    if(m===0) return "";
    if(m===1) return "once removed";
    if(m===2) return "twice removed";
    if(m===3) return "three times removed";
    return m + " times removed";
  }
  function greatChain(n){ // n steps of ancestry: 1 parent,2 grand,3 great-grand...
    if(n<=1) return "";
    if(n===2) return "grand";
    return new Array(n-2+1).join("great-") + "grand";
  }
  function ancWord(depth, sex){
    if(depth===1) return sex==='f'?"mother":sex==='m'?"father":"parent";
    var g = greatChain(depth);
    return g + (sex==='f'?"mother":sex==='m'?"father":"parent");
  }
  function descWord(depth, sex){
    if(depth===1) return sex==='f'?"daughter":sex==='m'?"son":"child";
    var g = greatChain(depth);
    return g + (sex==='f'?"daughter":sex==='m'?"son":"child");
  }
  function sibWord(sex){ return sex==='f'?"sister":sex==='m'?"brother":"sibling"; }

  // Returns { headline, detail, via } describing how A relates to B.
  FL.relationship = function(aId, bId){
    if(aId===bId) return { headline:"The same person", detail:"", via:"" };
    var A = byId[aId], B = byId[bId];
    if(!A || !B) return { headline:"Unknown", detail:"", via:"" };
    var aN = FL.displayName(A.name), bN = FL.displayName(B.name);
    var cA = chain(aId), mapA = {};
    cA.forEach(function(x){ mapA[x.node.id] = x.depth; });
    var best = null;
    chain(bId).forEach(function(x){
      var d1 = mapA[x.node.id];
      if(d1 != null){ var d2 = x.depth; if(!best || (d1+d2) < (best.d1+best.d2)) best = { node:x.node, d1:d1, d2:d2 }; }
    });
    if(!best) return { headline:"No direct blood link", detail:aN+" and "+bN+" may be connected by marriage rather than descent.", via:"" };

    var C = best.node, d1 = best.d1, d2 = best.d2, viaC = "Common ancestor: " + FL.displayName(C.name);

    if(d1===0){ // A is ancestor of B
      var w = ancWord(d2, A.sex);
      return { headline: cap(w) + " & " + descWord(d2, B.sex),
               detail: aN + " is " + bN + "'s " + w + ".", via:"" };
    }
    if(d2===0){ // B is ancestor of A
      var w2 = ancWord(d1, B.sex);
      return { headline: cap(w2) + " & " + descWord(d1, A.sex),
               detail: bN + " is " + aN + "'s " + w2 + ".", via:"" };
    }
    if(d1===1 && d2===1){
      return { headline: (A.sex&&A.sex===B.sex ? (A.sex==='f'?"Sisters":"Brothers") : "Siblings"),
               detail: aN + " and " + bN + " are siblings.",
               via: "Shared parent: " + FL.displayName(C.name) };
    }
    var g = Math.min(d1,d2), cousinLevel = g - 1, removed = Math.abs(d1-d2);

    if(cousinLevel===0){ // aunt/uncle <-> niece/nephew (possibly grand)
      var elder, younger;
      if(d1 < d2){ elder=A; younger=B; } else { elder=B; younger=A; }
      var grand = removed - 1;
      var pre = grand<=0 ? "" : (grand===1 ? "grand-" : new Array(grand-1+1).join("great-") + "grand-");
      var uterm = elder.sex==='f' ? "aunt" : elder.sex==='m' ? "uncle" : "aunt/uncle";
      var nterm = younger.sex==='f' ? "niece" : younger.sex==='m' ? "nephew" : "niece/nephew";
      return { headline: cap(pre+uterm) + " & " + pre + nterm,
               detail: FL.displayName(elder.name) + " is " + FL.displayName(younger.name) + "'s " + pre + uterm + ".",
               via: viaC };
    }
    // cousins
    var rt = removedText(removed);
    var head = cap(ordinal(cousinLevel)) + " cousins" + (rt ? ", " + rt : "");
    return { headline: head,
             detail: aN + " and " + bN + " are " + ordinal(cousinLevel) + " cousins" + (rt ? ", " + rt : "") + ".",
             via: viaC };
  };

  /* ---------- collectors for pages ---------- */
  FL.notablePeople = function(){
    var out = [];
    people.forEach(function(p){ if(p.notable) out.push({
      id:p.id, name:FL.displayName(p.name), sex:p.sex, role:p.role||"", honors:p.honors||"", photo:p.photo||"", branch:(FL.branchOf(p.id)||{}).name
    }); });
    (F.notableExtra||[]).forEach(function(x){ out.push({
      id:null, name:x.name, sex:x.sex||"", role:x.relation||"", honors:x.honors||"", photo:x.photo||"", branch:null
    }); });
    return out;
  };

  FL.datedPeople = function(){           // people with a birth or death year, for the timeline
    var out = [];
    people.forEach(function(p){
      if(p.dob) out.push({ id:p.id, year:(''+p.dob), name:FL.displayName(p.name), kind:"birth" });
      if(p.dod) out.push({ id:p.id, year:(''+p.dod), name:FL.displayName(p.name), kind:"death" });
    });
    return out;
  };

  // A–Z directory rows, optionally the whole list sorted by name.
  FL.directory = function(){
    return people.map(function(p){
      var par = parentOf[p.id], br = FL.branchOf(p.id);
      return {
        id: p.id,
        name: FL.displayName(p.name),
        raw: p.name,
        placeholder: FL.isPlaceholder(p.name),
        sex: p.sex||"",
        gen: FL.generation(p.id),
        branch: br ? FL.displayName(br.name) : "—",
        branchId: br ? br.id : "",
        parent: par ? FL.displayName(par.name) : "",
        spouses: (p.spouses||[]).map(function(s){ return s.name && !FL.isPlaceholder(s.name) ? s.name : (s.note||"—"); }),
        profession: p.profession||"",
        dob: p.dob||"", dod: p.dod||"",
        notable: !!p.notable
      };
    });
  };

  FL.branches = function(){              // the seven branches (root's children)
    return (F.root.children||[]).map(function(b, i){
      return { id:b.id, name:FL.displayName(b.name), sex:b.sex, index:i+1, count:FL.descendantCount(b) };
    });
  };
})();
