/* =============================================================================
   stats.js — "Family Statistics": interesting facts computed live from the data.
   Everything here is derived from FL (the shared index), so it updates itself as
   people, dates and professions are added. No numbers are entered by hand.
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;
  var root = document.getElementById("stats");
  function el(t,c,h){ var e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; }
  function esc(s){ return SITE.escapeText(s==null?"":(""+s)); }
  function year(v){ var m=(''+(v||'')).match(/\b(\d{4})\b/); return m?+m[1]:null; }

  /* ---------- gather ---------- */
  var ppl     = FL.people;
  var blood   = ppl.filter(function(p){ return !p.external; });     // descendants (incl. "to be added")
  var married = ppl.filter(function(p){ return p.external; });      // married into the family
  var named   = ppl.filter(function(p){ return !FL.isPlaceholder(p.name); });
  var namedBlood = blood.filter(function(p){ return !FL.isPlaceholder(p.name); });

  var male   = ppl.filter(function(p){ return p.sex==='m'; }).length;
  var female = ppl.filter(function(p){ return p.sex==='f'; }).length;

  var withDob = named.filter(function(p){ return year(p.dob); });
  var withDod = named.filter(function(p){ return year(p.dod); });

  // generations (0 = Sheikh Mubarak Ali)
  var genOf = {}, maxGen = 0, genDist = {};
  blood.forEach(function(p){ var g=FL.generation(p.id); genOf[p.id]=g; if(g>maxGen) maxGen=g; genDist[g]=(genDist[g]||0)+1; });

  // branches
  var branches = FL.branches().slice().sort(function(a,b){ return b.count-a.count; });

  // intermarriages: both partners are blood descendants
  var seenPair = {}, intermarriages = 0;
  blood.forEach(function(p){
    (p.spouses||[]).forEach(function(s){
      if(s.id && FL.byId[s.id] && !FL.byId[s.id].external){
        var key=[p.id,s.id].sort().join('|'); if(!seenPair[key]){ seenPair[key]=1; intermarriages++; }
      }
    });
  });

  // professions → buckets
  var PROF = [
    { label:"Engineers", re:/engineer/i },
    { label:"Doctors & medicine", re:/doctor|physician|surgeon|medical|medicine/i },
    { label:"Bankers, finance & economists", re:/bank|account|finance|economist/i },
    { label:"Diplomats & civil service", re:/diplomat|ambassador|foreign service|civil serv|secretary|governor/i },
    { label:"Business & management", re:/manager|executive|entrepreneur|business|director|ceo/i },
    { label:"Teachers & educators", re:/teacher|professor|educat|lecturer|academic|tutor/i },
    { label:"Law & judiciary", re:/judge|lawyer|advocate|legal|barrister|attorney/i },
    { label:"Design, arts & architecture", re:/designer|artist|architect|painter/i },
    { label:"Scientists", re:/scientist|chemist|physicist|biologist|research/i },
    { label:"Homemakers", re:/housewife|homemaker/i }
  ];
  var withProf = named.filter(function(p){ return p.profession && p.profession.trim(); });
  var profCounts = {}; PROF.forEach(function(c){ profCounts[c.label]=0; }); var profOther=0;
  withProf.forEach(function(p){ var m=null; for(var i=0;i<PROF.length;i++){ if(PROF[i].re.test(p.profession)){ m=PROF[i]; break; } } if(m) profCounts[m.label]++; else profOther++; });
  var profRows = PROF.map(function(c){ return { label:c.label, count:profCounts[c.label] }; }).filter(function(r){ return r.count>0; }).sort(function(a,b){ return b.count-a.count; });
  if(profOther) profRows.push({ label:"Other professions", count:profOther });

  // most common first names (everyone named), ignoring leading titles like "Sheikh"
  function givenName(full){
    var toks = FL.displayName(full).trim().split(/\s+/);
    while(toks.length>1 && /^(sheikh|dr\.?|syed|qazi|agha|malik|mohd\.?)$/i.test(toks[0])) toks.shift();
    return toks[0] || '';
  }
  var nameMap = {};
  named.forEach(function(p){ var first=givenName(p.name); if(!first) return; var k=first.toLowerCase(); (nameMap[k]=nameMap[k]||{ n:first, c:0 }).c++; });
  var topNames = Object.keys(nameMap).map(function(k){ return nameMap[k]; }).filter(function(x){ return x.c>=2; }).sort(function(a,b){ return b.c-a.c || a.n.localeCompare(b.n); }).slice(0,14);

  // pet names
  var aliased = ppl.filter(function(p){ return p.alias; });
  var aliasMap = {}; aliased.forEach(function(p){ var k=p.alias.toLowerCase(); (aliasMap[k]=aliasMap[k]||{ n:p.alias, c:0 }).c++; });
  var sharedAlias = Object.keys(aliasMap).map(function(k){ return aliasMap[k]; }).filter(function(x){ return x.c>=2; }).sort(function(a,b){ return b.c-a.c; });

  var notable = ppl.filter(function(p){ return p.notable; }).length;
  var honoured = named.filter(function(p){ return p.honors && p.honors.trim(); }).length;

  // largest immediate families (exclude the patriarch himself)
  var bigFamilies = blood.filter(function(p){ return p.id!=='mubarak' && p.children && p.children.length; })
    .map(function(p){ return { name:FL.displayName(p.name), n:p.children.length }; })
    .sort(function(a,b){ return b.n-a.n; }).slice(0,3);

  var oldestBirth = withDob.slice().sort(function(a,b){ return year(a.dob)-year(b.dob); })[0];
  var widestGen = Object.keys(genDist).map(function(g){ return { g:+g, n:genDist[g] }; }).sort(function(a,b){ return b.n-a.n; })[0];
  var distinctNames = Object.keys(nameMap).length;

  /* ---------- render ---------- */
  function big(num, lbl){ return '<div class="big"><div class="num">'+num+'</div><div class="lbl">'+lbl+'</div></div>'; }
  function small(num, lbl){ return '<div class="s"><div class="num">'+num+'</div><div class="lbl">'+lbl+'</div></div>'; }
  function section(title){ var s=el("div","stat-sec"); s.appendChild(el("h3",null,esc(title))); root.appendChild(s); return s; }
  function bars(host, rows, opt){
    opt=opt||{}; var max=rows.reduce(function(m,r){ return Math.max(m, r.count); },0)||1;
    rows.forEach(function(r){
      var row=el("div","barrow");
      row.innerHTML='<div class="bl">'+esc(r.label)+(r.sub?' <span style="color:var(--muted);font-size:12px">'+esc(r.sub)+'</span>':'')+'</div>'+
        '<div class="bt"><div class="bf" style="width:'+Math.max(4,Math.round(r.count/max*100))+'%"></div></div>'+
        '<div class="bc">'+r.count+'</div>';
      if(r.id){ row.style.cursor="pointer"; row.onclick=function(){ SITE.openProfile(r.id); }; }
      host.appendChild(row);
    });
  }

  // hero
  var hero = el("div","stat-hero");
  hero.innerHTML =
    big(ppl.length, "Individuals in all") +
    big(blood.length, "Blood descendants") +
    big(married.length, "Married into the family") +
    big((maxGen+1), "Generations");
  root.appendChild(hero);

  // quick grid
  var grid = el("div","stat-grid");
  grid.innerHTML =
    small(male, "Male") +
    small(female, "Female") +
    small(intermarriages, "Marriages within the family") +
    small(aliased.length, "Have a family pet name") +
    small(notable, "Notable members") +
    small(honoured, "With recorded honours") +
    small(withProf.length, "With a recorded profession") +
    small(distinctNames, "Distinct first names") +
    small(withDob.length, "With a date of birth") +
    small(withDod.length, "Remembered (date of death)");
  root.appendChild(grid);

  // branches
  var bs = section("The seven branches");
  bars(bs, branches.map(function(b){ return { label:b.name, sub:"Branch "+b.index, count:b.count, id:b.id }; }));
  bs.appendChild(el("div","stat-note","Descendants counted under each of Sheikh Mubarak Ali's seven children. Click a branch to open it."));

  // professions
  if(profRows.length){
    var ps = section("Professions & callings");
    bars(ps, profRows);
    ps.appendChild(el("div","stat-note","Among the "+withProf.length+" members whose profession has been recorded so far. As more are added, this grows."));
  }

  // names
  if(topNames.length){
    var ns = section("Most shared first names");
    bars(ns, topNames.map(function(x){ return { label:x.n, count:x.c }; }));
    ns.appendChild(el("div","stat-note","How many people in the archive share each given name."));
  }

  // generation spread
  var gs = section("People by generation");
  var genRows = Object.keys(genDist).map(function(g){ return { g:+g, n:genDist[g] }; }).sort(function(a,b){ return a.g-b.g; })
    .map(function(x){ return { label: x.g===0 ? "1st (Sheikh Mubarak Ali)" : ordinal(x.g+1)+" generation", count:x.n }; });
  bars(gs, genRows);

  // fun facts
  var fs = section("Did you know?");
  var facts = el("div","factlist"); fs.appendChild(facts);
  function fact(html){ facts.appendChild(el("div","fact",html)); }
  fact("The family spans <b>"+(maxGen+1)+" generations</b>, from Sheikh Mubarak Ali down to the newest arrivals.");
  if(branches[0]) fact("The largest branch is <b>"+esc(branches[0].name)+"</b>, with <b>"+branches[0].count+"</b> descendants.");
  if(intermarriages) fact("<b>"+intermarriages+"</b> marriages are between two members of the family — cousins who became husband and wife.");
  if(bigFamilies[0]) fact("The largest immediate family is <b>"+esc(bigFamilies[0].name)+"</b>'s, with <b>"+bigFamilies[0].n+"</b> children.");
  if(topNames[0]) fact("The most shared name is <b>"+esc(topNames[0].n)+"</b> — "+topNames[0].c+" people carry it.");
  if(sharedAlias[0]) fact("Even pet names repeat: <b>"+sharedAlias.length+"</b> nicknames are shared by more than one person (e.g. “"+esc(sharedAlias[0].n)+"”).");
  if(widestGen) fact("The largest single generation is the <b>"+(widestGen.g===0?"1st":ordinal(widestGen.g+1))+"</b>, with <b>"+widestGen.n+"</b> people.");
  if(oldestBirth) fact("The earliest recorded birth year is <b>"+year(oldestBirth.dob)+"</b> ("+esc(FL.displayName(oldestBirth.name))+").");

  var note = el("div","stat-foot","All figures are counted from the archive as it stands today; dates and professions are still being collected, so those counts will keep rising.");
  root.appendChild(note);

  function ordinal(n){ var s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
});
