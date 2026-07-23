/* =============================================================================
   person.js — full-page profile for one person, opened as person.html?id=<id>.
   Shows details, a formatted biography, and links to relatives' own pages.
============================================================================= */
window.familyReady.then(function(){
  "use strict";
  var FL = window.FL, SITE = window.SITE;
  var box = document.getElementById("person");
  var id = new URLSearchParams(location.search).get("id") || (location.hash||"").replace("#","");
  var n = id && FL.byId[id];

  function el(t,c,h){ var e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; }
  function esc(s){ return SITE.escapeText(s==null?"":(""+s)); }
  function relLink(name, sex, pid){
    var a = document.createElement(pid ? "a" : "span");
    a.className = "relbtn " + (sex==="m"?"m":sex==="f"?"f":"") + (FL.isPlaceholder(name)?" placeholder":"");
    a.innerHTML = '<span class="dot"></span>' + esc(FL.displayName(name));
    if(pid) a.href = "person.html?id=" + encodeURIComponent(pid);
    return a;
  }
  function sec(title){ var d=el("div","psec"); d.appendChild(el("h3",null,title)); box.appendChild(d); return d; }

  if(!n){
    box.innerHTML = '<a class="back" href="directory.html">← Back to the directory</a>' +
      '<div class="empty-state"><div class="ico">🔍</div><h3>Person not found</h3>' +
      '<p>That profile does not exist. <a href="directory.html">Browse the directory</a> to find someone.</p></div>';
    return;
  }

  document.title = FL.displayName(n.name) + " · " + FL.site.title;

  var back = el("a","back","← Back to the directory"); back.href = "directory.html"; box.appendChild(back);

  // header
  var head = el("div","phead");
  var av = el("div","pav "+(n.sex||"u"));
  SITE.fillAvatar(av, n, {zoom:true, full:true});
  head.appendChild(av);
  var ht = el("div"); ht.style.minWidth="0";
  ht.appendChild(el("h2",null,esc(FL.displayName(n.name))));
  if(n.role) ht.appendChild(el("div","prole",esc(n.role)));
  var tags = el("div","ptags");
  function tag(t){ tags.appendChild(el("span","tag",esc(t))); }
  if(n.notable) tag("★ Notable member");
  if(n.sex==="m") tag("Male"); else if(n.sex==="f") tag("Female");
  if(n.external) tag("Married into the family");
  var br = FL.branchOf(id); if(br) tag("Branch: "+FL.displayName(br.name));
  if(n.dob||n.dod) tag((n.dob||"?")+(n.dod?" – "+n.dod:" – present"));
  if(n.profession) tag("💼 "+n.profession);
  if(n.honors) tag("🏅 "+n.honors);
  ht.appendChild(tags); head.appendChild(ht); box.appendChild(head);

  if(n.bio) sec("Biography").appendChild(SITE.renderBio(n.bio));
  else if(n.honors) sec("Honours & achievements").appendChild(el("div","biobody",esc(n.honors)));
  if(n.note) sec("Note").appendChild(el("div","biobody",esc(n.note)));

  var d = sec("Details"), any=false;
  function kv(k,v){ any=true; var r=el("div","kv"); r.innerHTML='<span class="k">'+esc(k)+'</span><span>'+esc(v)+'</span>'; d.appendChild(r); }
  if(n.role) kv("Role", n.role);
  if(n.dob) kv("Born", n.dob);
  if(n.dod) kv("Died", n.dod);
  if(n.profession) kv("Profession", n.profession);
  if(n.honors) kv("Honours", n.honors);
  if(!any) d.appendChild(el("div","empty","No dates or profession recorded yet."));

  if(n.spouses && n.spouses.length){
    var sp = sec(n.spouses.length>1?"Spouses":"Spouse"), row=el("div","rels");
    n.spouses.forEach(function(s){ row.appendChild(relLink(s.name,"",s.id)); });
    sp.appendChild(row);
    n.spouses.forEach(function(s){ if(s.note){ var nt=el("div","biobody"); nt.style.cssText="font-size:12.5px;color:var(--muted);margin-top:6px"; nt.textContent=(s.name && !FL.isPlaceholder(s.name)?FL.displayName(s.name)+" — ":"")+s.note; sp.appendChild(nt); } });
  }

  var pars = FL.parentsOf(id);
  if(pars.length){ var ps=sec(pars.length>1?"Parents":"Parent"), pr=el("div","rels"); pars.forEach(function(p){ pr.appendChild(relLink(p.name,p.sex,p.id)); }); ps.appendChild(pr); }

  var kids = FL.effectiveChildren(n);
  if(kids.length){ var cs=sec("Children ("+kids.length+")"), cr=el("div","rels"); kids.forEach(function(c){ cr.appendChild(relLink(c.name,c.sex,c.id)); }); cs.appendChild(cr); }
  else if(n.ref){ var cs2=sec("Children"); var a=el("a","relbtn","🔗 "+esc(n.ref.text)); a.href="person.html?id="+encodeURIComponent(n.ref.to); cs2.appendChild(a); }
  if(n.todo) sec("To be added").appendChild(el("div","edit",esc(n.todo)));

  var more = sec("More");
  var treeId = n.external ? ((n.spouses||[]).map(function(s){ return s.id; }).filter(function(x){ return x && FL.byId[x]; })[0]) : id;
  if(treeId){ var t = el("a","relbtn", n.external ? "🌳 Show their family in the tree" : "🌳 Show in the family tree"); t.href="tree.html#"+encodeURIComponent(treeId); more.appendChild(t); }
  var edit = el("div","edit"); edit.style.marginTop="10px";
  edit.innerHTML = 'To add or update this person, use the <a href="edit.html">✎ Add / edit a person</a> editor or ask your assistant. For a photo, upload <code>photos/'+esc(id)+'.jpg</code> to the repository. (id: <code>'+esc(id)+'</code>)';
  more.appendChild(edit);
});
