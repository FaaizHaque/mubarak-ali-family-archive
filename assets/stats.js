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
  var deceased = named.filter(function(p){ return p.deceased; });   // died (date known or not)

  // generations (0 = Sheikh Mubarak Ali)
  var genOf = {}, maxGen = 0, genDist = {};
  blood.forEach(function(p){ var g=FL.generation(p.id); genOf[p.id]=g; if(g>maxGen) maxGen=g; genDist[g]=(genDist[g]||0)+1; });

  // branches
  var branches = FL.branches().slice().sort(function(a,b){ return b.count-a.count; });

  // intermarriages: both partners are blood descendants
  var seenPair = {}, intermarriagePairs = [];
  blood.forEach(function(p){
    (p.spouses||[]).forEach(function(s){
      if(s.id && FL.byId[s.id] && !FL.byId[s.id].external){
        var key=[p.id,s.id].sort().join('|'); if(!seenPair[key]){ seenPair[key]=1; intermarriagePairs.push([p, FL.byId[s.id]]); }
      }
    });
  });
  var intermarriages = intermarriagePairs.length;

  // professions → buckets
  var PROF = [
    { label:"Engineers", re:/engineer/i },
    { label:"Doctors & medicine", re:/doctor|physician|surgeon|medical|medicine/i },
    { label:"Bankers, finance & economists", re:/bank|account|finance|economist/i },
    { label:"Civil service", re:/civil serv|\bCSP\b|chief secretary|bureaucrat|deputy commissioner|district magistrate|\bcommissioner\b|federal secretary|provincial secretary/i, keep:true },
    { label:"Foreign service & diplomacy", re:/foreign service|ambassador|high commissioner|\bdiplomat|\bconsul\b|embassy/i, keep:true },
    { label:"Armed forces", re:/\barmy\b|\bnavy\b|air ?force|armed forces|\bcolonel\b|brigadier|lieutenant|\badmiral\b|air marshal|air commodore|\bPAF\b|\bPMA\b|military/i, keep:true },
    { label:"Business & management", re:/manager|executive|entrepreneur|business|director|\bceo\b|\bmd\b|\bcfo\b|\bcso\b/i },
    { label:"Teachers & educators", re:/teacher|professor|educat|lecturer|academic|tutor/i },
    { label:"Law & judiciary", re:/judge|lawyer|advocate|legal|barrister|attorney/i },
    { label:"Design, arts & architecture", re:/designer|artist|architect|painter/i },
    { label:"Scientists", re:/scientist|chemist|physicist|biologist|research/i },
    { label:"Homemakers", re:/housewife|homemaker/i }
  ];
  // scan the profession AND the curated role, so those whose careers are recorded as a role
  // (e.g. "Civil servant (CSP) · Chief Secretary") are counted, not just those with a profession.
  function career(p){ return ((p.profession||'')+'  '+(p.role||'')).trim(); }
  var withCareer = named.filter(function(p){ return career(p); });
  var profCounts = {}; PROF.forEach(function(c){ profCounts[c.label]=0; }); var profOther=0;
  withCareer.forEach(function(p){ var t=career(p), m=null; for(var i=0;i<PROF.length;i++){ if(PROF[i].re.test(t)){ m=PROF[i]; break; } } if(m) profCounts[m.label]++; else profOther++; });
  var profRows = PROF.map(function(c){ return { label:c.label, count:profCounts[c.label], keep:c.keep }; }).filter(function(r){ return r.count>0 || r.keep; }).sort(function(a,b){ return b.count-a.count; });
  if(profOther) profRows.push({ label:"Other professions", count:profOther });

  // ---- education: scan biography, profession, honours, summary and role for degrees & institutions ----
  function eduText(p){ return [p.bio,p.profession,p.honors,p.summary,p.role].filter(Boolean).join("  "); }
  function anyMatch(text, res){ for(var i=0;i<res.length;i++){ if(res[i].test(text)) return true; } return false; }
  var hasEdu = named.filter(function(p){ return /universit|college|school|institut|polytechnic|\bMBA\b|\bMS\b|\bMSc\b|\bMA\b|\bBE\b|\bBA\b|\bBSc\b|\bPh\.?D\b|bachelor|master|doctor|degree|graduate|a[- ]?level|icaew|chartered|acca|\bcfa\b/i.test(eduText(p)); });
  var DEG = [
    { label:"Doctorate (PhD)",            res:[/\bph\.?d\b/i, /doctoral|doctorate/i] },
    { label:"Master's degree",            res:[/\bMBA\b/i, /\bM\.?S\.?c?\b/, /\bMA\b/, /\bMPhil\b/i, /master'?s|masters/i] },
    { label:"Bachelor's degree",          res:[/\bbachelor/i, /\bB\.?E\b/, /\bB\.?S\.?c?\b/, /\bB\.?A\b/, /\bBBA\b/i, /\bLL\.?B\b/i] },
    { label:"Professional (CA / ACCA / CFA)", res:[/chartered accountant/i, /\bICAEW\b/i, /\bACCA\b/i, /\bCFA\b/i, /\bCPA\b/i] },
    { label:"A / O Levels",               res:[/\bA[- ]?levels?\b/i, /\bO[- ]?levels?\b/i] }
  ];
  var degRows = DEG.map(function(d){ return { label:d.label, count: named.filter(function(p){ return anyMatch(eduText(p), d.res); }).length }; })
                   .filter(function(r){ return r.count>0; });   // keep level order (highest first)

  // headline education counts for the quick grid
  var phdPeople    = named.filter(function(p){ return anyMatch(eduText(p), DEG[0].res); });          // Doctorate
  var phdCount     = phdPeople.length;
  var mastersCount = named.filter(function(p){ return anyMatch(eduText(p), DEG[1].res); }).length;   // Master's
  var FOREIGN_UNI = [/\bMIT\b/, /massachusetts institute/i, /\bLSE\b/, /london school of economics/i, /\bINSEAD\b/i, /harvard/i, /\boxford\b/i, /\bcambridge\b/i, /stanford/i, /wharton/i, /university of chicago/i, /notre dame/i, /syracuse/i, /\bdundee\b/i, /city university/i, /les roches/i, /north east london/i, /london business school/i, /\bLBS\b/, /asian institute of technology/i, /\b(from|in)\s+france\b/i, /\(france\)/i];
  var foreignUniPeople = named.filter(function(p){ return anyMatch(eduText(p), FOREIGN_UNI); });
  var foreignUniCount = foreignUniPeople.length;

  var INST = [
    { label:"Aitchison College",              res:[/aitchison/i] },
    { label:"University of Engineering & Technology (UET)", res:[/university of engineering/i, /\bUET\b/] },
    { label:"University of Dundee",           res:[/dundee/i] },
    { label:"Kinnaird College",               res:[/kinnaird/i] },
    { label:"City University, London",        res:[/city university/i] },
    { label:"Les Roches, Switzerland",        res:[/les roches/i] },
    { label:"Lahore Grammar School",          res:[/lahore grammar/i] },
    { label:"North East London Polytechnic",  res:[/north east london/i] },
    { label:"National Defence University",    res:[/national defence university/i] },
    { label:"Learning Alliance",              res:[/learning alliance/i] },
    { label:"School of Public Policy, Lahore", res:[/school of public policy/i] },
    { label:"LUMS",                           res:[/\bLUMS\b/i, /lahore university of management/i] },
    { label:"LSE",                            res:[/\bLSE\b/, /london school of economics/i] },
    { label:"INSEAD",                         res:[/\bINSEAD\b/i] },
    { label:"MIT",                            res:[/\bMIT\b/, /massachusetts institute of technology/i] },
    { label:"Harvard University",             res:[/harvard/i] },
    { label:"University of Oxford",           res:[/\boxford\b(?!\s+brookes)/i] },
    { label:"University of Cambridge",        res:[/\bcambridge\b/i] },
    { label:"Stanford University",            res:[/stanford/i] },
    { label:"IBA, Karachi",                   res:[/\bIBA\b/, /institute of business administration/i] },
    { label:"NUST",                           res:[/\bNUST\b/] },
    { label:"GIKI",                           res:[/\bGIKI\b/i, /ghulam ishaq khan/i] },
    { label:"London Business School",         res:[/london business school/i, /\bLBS\b/] },
    { label:"Wharton",                        res:[/wharton/i] },
    { label:"University of Chicago",          res:[/university of chicago/i] },
    { label:"University of Notre Dame",       res:[/notre dame/i] },
    { label:"Syracuse University",            res:[/syracuse/i] },
    { label:"Oxford Brookes University",      res:[/oxford brookes/i] },
    { label:"Bahria University",              res:[/bahria/i] },
    { label:"University of Management & Technology (UMT)", res:[/university of management (and|&) technology/i, /\bUMT\b/] },
    { label:"Asian Institute of Technology",  res:[/asian institute of technology/i] }
  ];
  var instRows = INST.map(function(it){ return { label:it.label, count: named.filter(function(p){ return anyMatch(eduText(p), it.res); }).length }; })
                     .filter(function(r){ return r.count>0; }).sort(function(a,b){ return b.count-a.count || a.label.localeCompare(b.label); });

  // most common first names (everyone named), ignoring leading titles like "Sheikh"
  function givenName(full){
    var toks = FL.displayName(full).trim().split(/\s+/);
    while(toks.length>1 && /^(sheikh|dr\.?|syed|qazi|agha|malik|mohd\.?)$/i.test(toks[0])) toks.shift();
    return toks[0] || '';
  }
  var NAME_FOLD = { 'farah':'Farrah' };   // count spelling variants of a name together
  var nameMap = {};
  named.forEach(function(p){ var first=givenName(p.name); if(!first) return; var canon=NAME_FOLD[first.toLowerCase()]||first; var k=canon.toLowerCase(); (nameMap[k]=nameMap[k]||{ n:canon, c:0 }).c++; });
  var topNames = Object.keys(nameMap).map(function(k){ return nameMap[k]; }).filter(function(x){ return x.c>=2; }).sort(function(a,b){ return b.c-a.c || a.n.localeCompare(b.n); }).slice(0,14);

  // pet names
  var aliased = ppl.filter(function(p){ return p.alias; });
  var aliasMap = {}; aliased.forEach(function(p){ var k=p.alias.toLowerCase(); (aliasMap[k]=aliasMap[k]||{ n:p.alias, c:0 }).c++; });
  var sharedAlias = Object.keys(aliasMap).map(function(k){ return aliasMap[k]; }).filter(function(x){ return x.c>=2; }).sort(function(a,b){ return b.c-a.c; });

  var notable = ppl.filter(function(p){ return p.notable; }).length;
  // Awards: distinctions conferred by a state or notable institution (not titles, roles or authorship)
  var AWARD_RE = /sitara|hilal|nishan|tamgha|imtiaz|pride of performance|medalli|\bmedal\b|\baward(?:s|ed)?\b|laureate|\bprize\b|quaid-?e-?azam|gallantry|basalat|jur['’]?at/i;
  var honouredList = named.filter(function(p){ return p.honors && AWARD_RE.test(p.honors); });
  var honoured = honouredList.length;
  // Leadership positions: CEOs, chairs, MDs, ambassadors, heads of institutions, etc.
  var LEADER_RE = /chief executive|\bCEO\b|managing director|\bMD\b|chairman|chairperson|\bambassador\b|high commissioner|director[- ]?general|\bDG\b|chief secretary|vice[- ]?chancellor|deputy chairman|country head|\bpresident\b|\bfounder\b|co-?founder|consul[- ]?general|chief of protocol|\bCOO\b|\bCFO\b|\bCTO\b|\bCSO\b|head of/i;
  var leadersList = named.filter(function(p){ return LEADER_RE.test([p.profession,p.role,p.summary].filter(Boolean).join('  ')); });
  // list leaders by family seniority — mirrors the manual order on the Notable Members page (ORDER in notable.js; keep in sync)
  var SENIORITY = ["b3-arif","abdul-samad","ikram","inam","riffat-pasha","b1-siraj","b3-imdad","hamid",
                   "nadeem-ul-haq","imran","amir","tahir-jawaid","b3-faisal","b3-moin","b3-adil","moqeem"];
  var SEN_IX = {}; SENIORITY.forEach(function(id,i){ SEN_IX[id]=i; });
  leadersList.sort(function(a,b){
    var ia=SEN_IX[a.id], ib=SEN_IX[b.id];
    if(ia!=null && ib!=null) return ia-ib;
    if(ia!=null) return -1; if(ib!=null) return 1;
    return 0;
  });

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

  // quick grid — some tiles are clickable to reveal the people behind the number
  var grid = el("div","stat-grid"); root.appendChild(grid);
  var reveal = el("div","stat-reveal"); reveal.style.display="none"; root.appendChild(reveal);

  function nameChip(p, extra){
    var a = el(p.id ? "button" : "span", "rv-name"); a.textContent = FL.displayName(p.name);
    if(p.id) a.onclick = function(){ SITE.openProfile(p.id); };
    if(!extra) return a;
    var wrap = el("span","rv-pair"); wrap.appendChild(a); wrap.appendChild(el("span","rv-extra","— "+esc(extra)));
    return wrap;
  }
  function openReveal(title, build){
    reveal.innerHTML = "";
    var head = el("div","rv-head"); head.appendChild(el("h4",null,esc(title)));
    var x = el("button","rv-x","✕"); x.onclick = function(){ reveal.style.display="none"; }; head.appendChild(x);
    reveal.appendChild(head);
    var listEl = el("div","rv-list"); build(listEl); reveal.appendChild(listEl);
    reveal.style.display = ""; reveal.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }
  function peopleReveal(title, arr){ return function(){ openReveal(title, function(list){
    arr.forEach(function(p){ var row=el("div","rv-row"); row.appendChild(nameChip(p)); list.appendChild(row); });
  }); }; }
  function tile(num, lbl, onTap){
    var t = el("div","s"+(onTap?" tap":"")); t.innerHTML='<div class="num">'+num+'</div><div class="lbl">'+esc(lbl)+'</div>';
    if(onTap){ t.setAttribute("role","button"); t.setAttribute("tabindex","0"); t.onclick=onTap;
      t.onkeydown=function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); onTap(); } }; }
    grid.appendChild(t);
  }

  tile(male, "Male");
  tile(female, "Female");
  tile(intermarriages, "Marriages within the family", function(){
    openReveal("Marriages within the family", function(list){
      intermarriagePairs.forEach(function(pr){
        var row=el("div","rv-row");
        row.appendChild(nameChip(pr[0])); row.appendChild(el("span","rv-amp","&")); row.appendChild(nameChip(pr[1]));
        list.appendChild(row);
      });
    });
  });
  tile(aliased.length, "Have a family pet name");
  tile(honoured, "National / foreign awards", function(){
    openReveal("National / foreign awards", function(list){
      honouredList.forEach(function(p){ var row=el("div","rv-row"); row.appendChild(nameChip(p, p.honors)); list.appendChild(row); });
    });
  });
  tile(mastersCount, "Hold a Master’s degree");
  tile(phdCount, "Hold a PhD", peopleReveal("Members who hold a PhD", phdPeople));
  tile(foreignUniCount, "Studied at a foreign university", peopleReveal("Studied at a foreign university", foreignUniPeople));
  tile(withCareer.length, "With a recorded profession");
  tile(leadersList.length, "In leadership positions", function(){
    openReveal("Leadership positions (CEO, chair, MD, ambassador…)", function(list){
      leadersList.forEach(function(p){ var row=el("div","rv-row"); row.appendChild(nameChip(p, p.role||p.profession)); list.appendChild(row); });
    });
  });
  tile(distinctNames, "Distinct first names");

  // Living & remembered — builds up as the family is recorded as living or departed
  var ls = section("Living & remembered");
  if(deceased.length){
    var living = named.length - deceased.length;
    var withDates = deceased.filter(function(p){ return year(p.dod); }).length;
    bars(ls, [{ label:"Living", count:living }, { label:"Passed away (remembered)", count:deceased.length }]);
    ls.appendChild(el("div","stat-note","Among the "+named.length+" named members of the family. Exact dates of death are shown where known ("+withDates+" recorded so far)."));
  } else {
    ls.appendChild(el("div","stat-empty","No dates of death have been recorded yet. Once they are added, this section will show how many of the family are living and how many are remembered — building up over time."));
  }

  // branches
  var bs = section("The seven branches");
  bars(bs, branches.map(function(b){ return { label:b.name, sub:"Branch "+b.index, count:b.count, id:b.id }; }));
  bs.appendChild(el("div","stat-note","Descendants counted under each of Sheikh Mubarak Ali's seven children. Click a branch to open it."));

  // professions
  if(profRows.length){
    var ps = section("Professions & callings");
    bars(ps, profRows);
    ps.appendChild(el("div","stat-note","Among the "+withCareer.length+" members whose profession or calling has been recorded so far. Civil, foreign and armed-forces service are counted from their recorded roles."));
  }

  // education & degrees
  var es = section("Education & degrees");
  if(degRows.length){
    bars(es, degRows);
    es.appendChild(el("div","stat-note","Counted from the "+hasEdu.length+" members whose education is recorded (a person can hold more than one qualification)."));
  } else {
    es.appendChild(el("div","stat-empty","Education details are still being collected — add a member's schooling or degrees to their biography and they will be counted here."));
  }

  // educational institutions
  if(instRows.length){
    var is = section("Educational institutions");
    bars(is, instRows);
    is.appendChild(el("div","stat-note","Schools, colleges and universities the family has attended. New institutions appear here automatically as they are added to biographies."));
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
  var mastersPlus = named.filter(function(p){ return anyMatch(eduText(p), [/\bph\.?d\b/i,/doctoral|doctorate/i,/\bMBA\b/i,/\bM\.?S\.?c?\b/,/\bMA\b/,/master'?s|masters/i]); }).length;
  if(mastersPlus) fact("<b>"+mastersPlus+"</b> members hold a <b>Master's degree or higher</b> — and counting, as more records are added.");
  if(instRows[0]) fact("The most-attended institution on record is <b>"+esc(instRows[0].label)+"</b>.");

  var note = el("div","stat-foot","All figures are counted from the archive as it stands today; dates, education and professions are still being collected, so those counts will keep rising.");
  root.appendChild(note);

  function ordinal(n){ var s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
});
