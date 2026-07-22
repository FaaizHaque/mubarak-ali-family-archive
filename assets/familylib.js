/* =============================================================================
   familylib.js — shared logic for the whole archive (no page-specific code).
   Call FL.load(familyObject) once the data is ready (see boot.js); then the
   tree, directory, relationship finder, timeline and notable pages all draw
   from this single index. Enter a person once and they appear everywhere.
============================================================================= */
(function(){
  "use strict";
  var FL = window.FL = {};

  /* ---------- text helpers (available before data loads) ---------- */
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

  /* ---------- shared state (mutated in place so closures stay valid) ---------- */
  var F = null;
  var byId = FL.byId = {};
  var parentOf = FL.parentOf = {};
  var people = FL.people = [];
  var used = {};

  FL.load = function(fam){
    F = fam;
    for(var k in byId) delete byId[k];
    for(var k2 in parentOf) delete parentOf[k2];
    for(var k3 in used) delete used[k3];
    people.length = 0;
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
    // Index explicit external people (married in): clickable & searchable, not in the descent tree.
    (F.externals||[]).forEach(function(e){
      if(!e.id || byId[e.id]){ var base=e.id||FL.slug(FL.displayName(e.name)), id=base, i=2; while(used[id]) id=base+'-'+(i++); e.id=id; }
      used[e.id]=true; byId[e.id]=e; people.push(e); e.external=true;
    });
    FL.externals = F.externals || [];

    // Auto-promote every named, not-yet-linked spouse into its own clickable
    // "married-in" profile (id = slug of their name), so any spouse can be tapped
    // and can carry a photo (photos/<id>.jpg) with no data entry. Explicit rows win.
    people.slice().forEach(function(p){
      (p.spouses||[]).forEach(function(s){
        if(s.id || !s.name || FL.isPlaceholder(s.name)) return;
        var base=FL.slug(s.name), id=base, i=2; while(used[id]) id=base+'-'+(i++); used[id]=true;
        var e={ id:id, name:s.name, sex:(p.sex==='m'?'f':p.sex==='f'?'m':''), external:true, autoSpouse:true,
                spouses:[{ id:p.id, name:FL.displayName(p.name) }] };
        byId[id]=e; people.push(e); s.id=id;   // link the partner's chip to this profile
      });
    });
    FL.site = F.site || { title:"Family Archive", subtitle:"" };
    FL.intro = F.intro || { paragraphs: [] };
    FL.events = F.events || [];
    FL.notableExtra = F.notableExtra || [];
    FL.root = F.root;
    return FL;
  };

  // A person's children, or (for a married-in spouse with none of their own) their partner's children.
  FL.effectiveChildren = function(n){
    if(n.children && n.children.length) return n.children;
    if(n.external){ var p=(n.spouses||[]).map(function(s){ return s.id && byId[s.id]; }).filter(Boolean)[0]; if(p && p.children) return p.children; }
    return [];
  };

  /* ---------- lineage helpers ---------- */
  function chain(id){
    var out = [], n = byId[id], d = 0;
    while(n){ out.push({ node:n, depth:d }); n = parentOf[n.id]; d++; }
    return out;
  }
  FL.chain = chain;

  // Both parents: the parent a person is nested under, plus that parent's
  // in-family spouse (co-parent), so intra-family marriages trace from either side.
  FL.parentsOf = function(id){
    var out=[], p=parentOf[id];
    if(p){ out.push(p);
      (p.spouses||[]).forEach(function(s){
        if(s.id && byId[s.id] && byId[s.id]!==p && out.indexOf(byId[s.id])<0) out.push(byId[s.id]);
      });
    }
    return out;
  };
  function ancestorMap(id){
    var dist={}, q=[[id,0]]; dist[id]=0;
    while(q.length){
      var cur=q.shift();
      FL.parentsOf(cur[0]).forEach(function(par){
        if(dist[par.id]==null || cur[1]+1<dist[par.id]){ dist[par.id]=cur[1]+1; q.push([par.id, cur[1]+1]); }
      });
    }
    return dist;
  }
  FL.ancestorMap = ancestorMap;

  FL.descendantCount = function(node){
    var n = 0; (node.children||[]).forEach(function(c){ n += 1 + FL.descendantCount(c); });
    return n;
  };
  FL.generation = function(id){ return chain(id).length - 1; };
  FL.branchOf = function(id){
    var c = chain(id);
    if(c.length < 2) return null;
    return c[c.length - 2].node;
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
  function greatChain(n){ if(n<=1) return ""; if(n===2) return "grand"; return new Array(n-2+1).join("great-") + "grand"; }
  function ancWord(depth, sex){ if(depth===1) return sex==='f'?"mother":sex==='m'?"father":"parent"; return greatChain(depth) + (sex==='f'?"mother":sex==='m'?"father":"parent"); }
  function descWord(depth, sex){ if(depth===1) return sex==='f'?"daughter":sex==='m'?"son":"child"; return greatChain(depth) + (sex==='f'?"daughter":sex==='m'?"son":"child"); }

  function bloodRelationship(aId, bId){
    var A = byId[aId], B = byId[bId];
    if(!A || !B) return { headline:"Unknown", detail:"", via:"" };
    var aN = FL.displayName(A.name), bN = FL.displayName(B.name);
    var mapA = ancestorMap(aId), mapB = ancestorMap(bId);
    var best = null;
    Object.keys(mapA).forEach(function(cid){
      if(mapB[cid]!=null){
        var d1 = mapA[cid], d2 = mapB[cid];
        if(!best || (d1+d2) < (best.d1+best.d2) ||
           ((d1+d2) === (best.d1+best.d2) && Math.abs(d1-d2) < Math.abs(best.d1-best.d2)))
          best = { node:byId[cid], d1:d1, d2:d2 };
      }
    });
    if(!best) return { headline:"No direct blood link", detail:aN+" and "+bN+" may be connected by marriage rather than descent.", via:"" };

    var C = best.node, d1 = best.d1, d2 = best.d2, viaC = "Common ancestor: " + FL.displayName(C.name);
    if(d1===0){ var w=ancWord(d2, A.sex); return { headline: cap(w)+" & "+descWord(d2, B.sex), detail: aN+" is "+bN+"'s "+w+".", via:"" }; }
    if(d2===0){ var w2=ancWord(d1, B.sex); return { headline: cap(w2)+" & "+descWord(d1, A.sex), detail: bN+" is "+aN+"'s "+w2+".", via:"" }; }
    if(d1===1 && d2===1) return { headline:(A.sex&&A.sex===B.sex?(A.sex==='f'?"Sisters":"Brothers"):"Siblings"), detail:aN+" and "+bN+" are siblings.", via:"Shared parent: "+FL.displayName(C.name) };
    var g=Math.min(d1,d2), cousinLevel=g-1, removed=Math.abs(d1-d2);
    if(cousinLevel===0){
      var elder, younger; if(d1<d2){elder=A;younger=B;}else{elder=B;younger=A;}
      var grand=removed-1, pre = grand<=0?"":(grand===1?"grand-":new Array(grand-1+1).join("great-")+"grand-");
      var uterm=elder.sex==='f'?"aunt":elder.sex==='m'?"uncle":"aunt/uncle";
      var nterm=younger.sex==='f'?"niece":younger.sex==='m'?"nephew":"niece/nephew";
      return { headline:cap(pre+uterm)+" & "+pre+nterm, detail:FL.displayName(elder.name)+" is "+FL.displayName(younger.name)+"'s "+pre+uterm+".", via:viaC };
    }
    var rt=removedText(removed), head=cap(ordinal(cousinLevel))+" cousins"+(rt?", "+rt:"");
    return { headline:head, detail:aN+" and "+bN+" are "+ordinal(cousinLevel)+" cousins"+(rt?", "+rt:"")+".", via:viaC };
  }

  // Are two people directly married to each other? (checks either side's spouse list)
  FL.areSpouses = function(aId, bId){
    var A=byId[aId], B=byId[bId]; if(!A||!B) return false;
    return (A.spouses||[]).some(function(s){ return s.id===bId; }) ||
           (B.spouses||[]).some(function(s){ return s.id===aId; });
  };

  // Public relationship: report marriage first (many family marriages are also
  // blood relations, e.g. cousins who wed), then fall back to pure descent.
  FL.relationship = function(aId, bId){
    if(aId===bId) return { headline:"The same person", detail:"", via:"" };
    var A=byId[aId], B=byId[bId];
    if(!A||!B) return { headline:"Unknown", detail:"", via:"" };
    var blood = bloodRelationship(aId, bId);
    if(FL.areSpouses(aId, bId)){
      var pair = ((A.sex==='m'&&B.sex==='f')||(A.sex==='f'&&B.sex==='m')) ? "Husband & wife" : "Married";
      var det = FL.displayName(A.name)+" and "+FL.displayName(B.name)+" are married.";
      if(blood && blood.headline && blood.headline!=="No direct blood link" && blood.headline!=="Unknown")
        det += " They are also "+blood.headline.toLowerCase()+".";
      return { headline:pair, detail:det, via:(blood&&blood.via)||"" };
    }
    return blood;
  };

  /* ---------- collectors for pages ---------- */
  FL.notablePeople = function(){
    var out = [];
    people.forEach(function(p){ if(p.notable) out.push({ id:p.id, name:FL.displayName(p.name), sex:p.sex, role:p.role||"", honors:p.honors||"", photo:p.photo||"", branch:(FL.branchOf(p.id)||{}).name }); });
    (FL.notableExtra||[]).forEach(function(x){ out.push({ id:null, name:x.name, sex:x.sex||"", role:x.relation||"", honors:x.honors||"", photo:x.photo||"", branch:null }); });
    return out;
  };
  FL.datedPeople = function(){
    var out = [];
    people.forEach(function(p){ if(p.dob) out.push({ id:p.id, year:(''+p.dob), name:FL.displayName(p.name), kind:"birth" }); if(p.dod) out.push({ id:p.id, year:(''+p.dod), name:FL.displayName(p.name), kind:"death" }); });
    return out;
  };
  FL.directory = function(){
    return people.map(function(p){
      var par = parentOf[p.id], br = FL.branchOf(p.id);
      return { id:p.id, name:FL.displayName(p.name), raw:p.name, placeholder:FL.isPlaceholder(p.name), sex:p.sex||"",
        gen:p.external?null:FL.generation(p.id), branch:br?FL.displayName(br.name):(p.external?"Married in":"—"), branchId:br?br.id:"",
        parent:par?FL.displayName(par.name):"", spouses:(p.spouses||[]).map(function(s){ return s.name && !FL.isPlaceholder(s.name)?s.name:(s.note||"—"); }),
        profession:p.profession||"", dob:p.dob||"", dod:p.dod||"", notable:!!p.notable, external:!!p.external };
    });
  };
  FL.branches = function(){
    return (F.root.children||[]).map(function(b,i){ return { id:b.id, name:FL.displayName(b.name), sex:b.sex, index:i+1, count:FL.descendantCount(b) }; });
  };
})();
