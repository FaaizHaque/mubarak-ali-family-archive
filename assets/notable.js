/* =============================================================================
   notable.js — the Notable Members page. Elders are shown first, then their
   descendants generation by generation. A married-in notable is placed at the
   generation of their in-family spouse (so, e.g., a branch head's husband sits
   among the elders).
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;
  var host = document.getElementById("grid");
  var list = FL.notablePeople();
  if(!list.length){ host.innerHTML = '<div class="empty">No notable members recorded yet — see the guide below.</div>'; return; }

  function genOf(p){
    if(!p.id) return 1;                                   // honoured non-lineage → with the elders
    var n = FL.byId[p.id]; if(!n) return 99;
    if(n.external){
      var sp = (n.spouses||[]).map(function(s){ return s.id && FL.byId[s.id]; }).filter(function(x){ return x && !x.external; })[0];
      return sp ? FL.generation(sp.id) : 1;
    }
    return FL.generation(p.id);
  }
  // family-seniority rank: a pre-order walk of the tree visits elder branches and elder
  // siblings first, so a lower rank = more senior within the family.
  var rank = {}, ri = 0;
  (function walk(n){ if(!n) return; rank[n.id] = ri++; (n.children||[]).forEach(walk); })(FL.byId["mubarak"]);
  function seniority(p){
    var n = p.id && FL.byId[p.id]; if(!n) return 1e9;
    if(n.external){                                       // married-in → sit just after their in-family spouse
      var sp = (n.spouses||[]).map(function(s){ return s.id && FL.byId[s.id]; }).filter(function(x){ return x && !x.external; })[0];
      return sp && rank[sp.id]!=null ? rank[sp.id] + 0.5 : 1e9;
    }
    return rank[n.id]!=null ? rank[n.id] : 1e9;
  }
  function birthYear(p){ var n = p.id && FL.byId[p.id]; var m = n && (''+(n.dob||'')).match(/\b(\d{4})\b/); return m ? +m[1] : null; }

  // Manual ordering: within each display group (Family elders, then each later
  // generation) notables appear in this exact sequence; anyone not listed follows,
  // by the automatic birth-order / seniority sort.
  var ORDER = [
    // Family elders
    "b3-arif", "abdul-samad", "ikram", "inam", "riffat-pasha", "b1-siraj", "b3-imdad", "hamid",
    // 3rd generation
    "nadeem-ul-haq", "imran", "amir", "tahir-jawaid", "b3-faisal", "b3-moin", "b3-adil", "moqeem"
  ];
  var ORDER_IX = {}; ORDER.forEach(function(id, i){ ORDER_IX[id] = i; });
  function groupRank(p){ return p._gen <= 2 ? 2 : p._gen; }   // all elders form a single group

  list.forEach(function(p){ p._gen = genOf(p); });
  // Within a generation: members with a recorded birth date come first (oldest first);
  // the rest follow by family seniority — senior branch first, then birth order.
  list.sort(function(a,b){
    var ga = groupRank(a), gb = groupRank(b);
    if(ga !== gb) return ga - gb;                       // Family elders first, then generation by generation
    var ia = ORDER_IX[a.id], ib = ORDER_IX[b.id];
    if(ia != null || ib != null){                      // manual sequence wins; listed before unlisted
      if(ia == null) return 1;
      if(ib == null) return -1;
      return ia - ib;
    }
    var ya = birthYear(a), yb = birthYear(b);
    if(ya && yb) return ya - yb || seniority(a) - seniority(b);
    if(ya) return -1;
    if(yb) return 1;
    return seniority(a) - seniority(b);
  });

  function ordinal(n){ var s=["th","st","nd","rd"], v=n%100; return n + (s[(v-20)%10] || s[v] || s[0]); }
  function groupLabel(gen){ return gen<=2 ? "Family elders" : ordinal(gen) + " generation"; }

  host.className = "";                                    // build our own generation groups inside
  var lastLabel = null, curGrid = null;
  list.forEach(function(p){
    var label = groupLabel(p._gen);
    if(label !== lastLabel){
      var h = document.createElement("h3"); h.className = "notable-gen"; h.textContent = label; host.appendChild(h);
      curGrid = document.createElement("div"); curGrid.className = "grid"; host.appendChild(curGrid);
      lastLabel = label;
    }
    var el = document.createElement(p.id ? "button" : "div");
    el.className = "pcard"; el.style.alignItems = "flex-start";
    if(p.id) el.onclick = function(){ SITE.openProfile(p.id); }; else el.style.cursor = "default";
    var av = document.createElement("div"); av.className = "avatar " + (p.sex||"");
    SITE.fillAvatar(av, { id:p.id, name:p.name, photo:p.photo });
    var m = document.createElement("div"); m.style.minWidth = "0";
    var desc = p.summary || p.honors;   // prefer a 2–3 line summary; fall back to honours
    m.innerHTML = '<div class="nm"><span class="starred">★</span> ' + SITE.escapeText(p.name) + '</div>' +
      (p.role ? '<div class="mt"><span class="b">' + SITE.escapeText(p.role) + '</span></div>' : '') +
      (desc ? '<div class="mt" style="margin-top:5px;line-height:1.5">' + SITE.escapeText(desc) + '</div>' : '');
    el.appendChild(av); el.appendChild(m); curGrid.appendChild(el);
  });
});
