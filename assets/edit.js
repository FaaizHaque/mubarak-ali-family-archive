/* =============================================================================
   edit.js — a plain-language "Add / Edit person" form that saves back to the
   archive's people.csv on GitHub. No spreadsheet, no columns. (See EDITOR-SETUP.md)
============================================================================= */

/* ---- pure CSV update (exposed for testing) ---- */
(function(){
  function esc(v){ v=(v==null?'':''+v); return /[",\n\r]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
  function serialize(rows){ return rows.map(function(r){ return r.map(esc).join(','); }).join('\n'); }
  function updateCsv(text, id, values, addMode){
    var rows = window.parseCsv(text);
    if(!rows.length) throw new Error('empty data file');
    var header = rows[0].map(function(h){ return (''+h).trim().toLowerCase(); });
    function ci(name){ return header.indexOf(name); }
    var idIdx = ci('id'); if(idIdx<0) throw new Error('data file has no id column');
    function setRow(r){ while(r.length<header.length) r.push(''); Object.keys(values).forEach(function(k){ var c=ci(k); if(c>=0) r[c]=values[k]; }); }
    if(addMode){
      var nr=[]; for(var i=0;i<header.length;i++) nr.push('');
      nr[idIdx]=id; setRow(nr); rows.push(nr);
    } else {
      var found=false;
      for(var j=1;j<rows.length;j++){ if(((rows[j][idIdx]||'')+'').trim()===id){ setRow(rows[j]); found=true; break; } }
      if(!found) throw new Error('Could not find this person in the data file (id: '+id+').');
    }
    return serialize(rows);
  }
  window.EDIT = { updateCsv: updateCsv };
})();

/* ---- editor UI ---- */
if(window.familyReady) window.familyReady.then(function(){
  "use strict";
  var FL=window.FL, SITE=window.SITE, CFG=window.ARCHIVE_CONFIG||{}, repo=CFG.repo||{};
  var host=document.getElementById('ed'), TOKEN_KEY='sma-gh-token';
  function token(){ try{return localStorage.getItem(TOKEN_KEY)||'';}catch(e){return '';} }
  function setToken(t){ try{localStorage.setItem(TOKEN_KEY,t);}catch(e){} }
  function clearToken(){ try{localStorage.removeItem(TOKEN_KEY);}catch(e){} }
  function el(t,c,h){ var e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; }
  function attr(v){ return SITE.escapeText(v||'').replace(/"/g,'&quot;'); }

  function render(){ host.innerHTML=''; if(!token()) renderSetup(); else renderEditor(); }

  function renderSetup(){
    var c=el('div','card2');
    c.innerHTML='<h3 style="margin:0 0 8px">One-time sign-in</h3>'+
      '<p class="lede" style="font-size:14px">To save changes, paste a GitHub access token — it stays only on this device (your browser) and lets the editor write to your archive.</p>'+
      '<div class="field"><label>GitHub access token</label><input type="text" id="tok" placeholder="github_pat_…">'+
      '<div class="hint">Create one at <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">GitHub → Fine-grained tokens</a> with access to <b>'+SITE.escapeText(repo.name||'')+'</b> and <b>Contents: Read and write</b>. Step-by-step in <a href="https://github.com/'+SITE.escapeText(repo.owner||'')+'/'+SITE.escapeText(repo.name||'')+'/blob/main/EDITOR-SETUP.md" target="_blank" rel="noopener">EDITOR-SETUP.md</a>.</div></div>'+
      '<div class="actions"><button class="btn btn-primary" id="savetok">Save &amp; continue</button></div>';
    host.appendChild(c);
    document.getElementById('savetok').onclick=function(){ var t=document.getElementById('tok').value.trim(); if(t){ setToken(t); render(); } };
  }

  function renderEditor(){
    var bar=el('div','signedin','Signed in on this device · <a href="#" id="signout">sign out</a>');
    host.appendChild(bar);
    document.getElementById('signout').onclick=function(e){ e.preventDefault(); clearToken(); render(); };
    var tools=el('div','toolbar');
    tools.innerHTML='<input type="search" id="pick" placeholder="Search a person to edit…" style="flex:1;min-width:220px"><button class="btn" id="addnew">+ Add new person</button>';
    host.appendChild(tools);
    host.appendChild(el('div',null,'')).id='picklist';
    host.appendChild(el('div',null,'')).id='formhost';
    var pick=document.getElementById('pick'), list=document.getElementById('picklist');
    pick.addEventListener('input',function(){
      var q=pick.value.trim().toLowerCase(); list.innerHTML=''; if(!q) return;
      FL.people.filter(function(p){ return !p.autoSpouse && !FL.isPlaceholder(p.name) && FL.displayName(p.name).toLowerCase().indexOf(q)>=0; }).slice(0,20).forEach(function(p){
        var where=p.external?'married in':((FL.branchOf(p.id)||{}).name||'');
        var b=el('button','pickrow', SITE.escapeText(FL.displayName(p.name))+' <span style="color:var(--muted);font-size:12px">· '+SITE.escapeText(where)+'</span>');
        b.onclick=function(){ list.innerHTML=''; pick.value=''; showForm(p); };
        list.appendChild(b);
      });
    });
    document.getElementById('addnew').onclick=function(){ showForm(null); };
  }

  function field(label,id,val,hint,type){
    return '<div class="field"><label>'+label+'</label>'+
      (type==='textarea' ? '<textarea id="'+id+'">'+SITE.escapeText(val||'')+'</textarea>'
                         : '<input type="text" id="'+id+'" value="'+attr(val)+'">')+
      (hint?'<div class="hint">'+hint+'</div>':'')+'</div>';
  }

  function showForm(person){
    var addMode=!person, n=person||{}, fh=document.getElementById('formhost'); fh.innerHTML='';
    var c=el('div','card2');
    var sexSel='<div class="field"><label>Sex</label><select id="f_sex"><option value="">—</option>'+
      '<option value="m"'+(n.sex==='m'?' selected':'')+'>Male</option><option value="f"'+(n.sex==='f'?' selected':'')+'>Female</option></select></div>';
    var parentField = addMode
      ? '<div class="field"><label>Parent (mother or father already in the tree)</label><input type="text" id="f_parent" placeholder="type a name…"><input type="hidden" id="f_parent_id"><div class="hint">Leave blank only for a spouse who married in.</div><div id="parentlist"></div></div>'
      : '';
    c.innerHTML='<h3 style="margin:0 0 12px">'+(addMode?'Add a new person':'Editing: '+SITE.escapeText(FL.displayName(n.name)))+'</h3>'+
      field('Full name','f_name',n.name,'')+ sexSel + parentField +
      field('Alias / pet name','f_alias',n.alias,'Optional family nickname, shown under the name (e.g. “Munni”).')+
      (addMode?field('Spouse (name)','f_spouse','',''):'')+
      '<div class="row2"><div>'+field('Date of birth','f_dob',n.dob,'e.g. 1958')+'</div><div>'+field('Date of death','f_dod',n.dod,'leave blank if living')+'</div></div>'+
      field('Profession','f_profession',n.profession,'')+
      field('Biography','f_bio',n.bio,'Use a blank line between paragraphs.','textarea')+
      field('Note','f_note',n.note,'','textarea')+
      '<div class="field check"><input type="checkbox" id="f_notable"'+(n.notable?' checked':'')+'> <label style="margin:0;text-transform:none;letter-spacing:0;color:var(--ink);font-weight:400">Feature on the Notable Members page</label></div>'+
      '<div class="row2"><div>'+field('Role / title','f_role',n.role,'e.g. Ambassador')+'</div><div>'+field('Honours','f_honors',n.honors,'e.g. Sitara-e-Imtiaz')+'</div></div>'+
      field('Photo file','f_photo',n.photo,'Optional. Easiest: upload <code>photos/'+SITE.escapeText(n.id||'their-id')+'.jpg</code> to the repo and leave this blank.')+
      '<div class="actions"><button class="btn btn-primary" id="savebtn">'+(addMode?'Add person':'Save changes')+'</button><span class="status" id="status"></span></div>';
    fh.appendChild(c);
    if(addMode) wireParentPicker();
    document.getElementById('savebtn').onclick=function(){ doSave(person, addMode); };
    c.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function wireParentPicker(){
    var inp=document.getElementById('f_parent'), hid=document.getElementById('f_parent_id'), lst=document.getElementById('parentlist');
    inp.addEventListener('input',function(){
      var q=inp.value.trim().toLowerCase(); lst.innerHTML=''; hid.value='';
      if(!q) return;
      FL.people.filter(function(p){ return !p.external && !FL.isPlaceholder(p.name) && FL.displayName(p.name).toLowerCase().indexOf(q)>=0; }).slice(0,10).forEach(function(p){
        var b=el('button','pickrow', SITE.escapeText(FL.displayName(p.name)));
        b.onclick=function(){ inp.value=FL.displayName(p.name); hid.value=p.id; lst.innerHTML=''; };
        lst.appendChild(b);
      });
    });
  }

  function val(id){ var e=document.getElementById(id); return e?(''+e.value).trim():''; }

  function doSave(person, addMode){
    var status=document.getElementById('status'); status.className='status'; status.textContent='Saving…';
    var name=val('f_name'); if(!name){ status.className='status err'; status.textContent='Please enter a name.'; return; }
    var values={ name:name, sex:val('f_sex'), alias:val('f_alias'), dob:val('f_dob'), dod:val('f_dod'), profession:val('f_profession'),
      bio:val('f_bio'), note:val('f_note'), role:val('f_role'), honors:val('f_honors'), photo:val('f_photo'),
      notable: document.getElementById('f_notable').checked ? 'yes' : '' };
    var id;
    if(addMode){ id=uniqueId(name); values.parent_id=val('f_parent_id'); values.spouse=val('f_spouse'); }
    else { id=person.id; }
    saveToGithub(id, values, addMode, status);
  }
  function uniqueId(name){ var base=FL.slug(name)||'person', id=base, i=2; while(FL.byId[id]) id=base+'-'+(i++); return id; }

  function apiUrl(){ return 'https://api.github.com/repos/'+repo.owner+'/'+repo.name+'/contents/'+encodeURIComponent(repo.file); }
  function b64encode(s){ return btoa(unescape(encodeURIComponent(s))); }
  function b64decode(b){ return decodeURIComponent(escape(atob((b||'').replace(/\s/g,'')))); }
  function ghGet(){
    return fetch(apiUrl()+'?ref='+repo.branch,{headers:{Authorization:'Bearer '+token(),Accept:'application/vnd.github+json'}})
      .then(function(r){ if(!r.ok) throw new Error('Could not read the archive ('+r.status+'). Check your token has access to '+repo.name+'.'); return r.json(); })
      .then(function(j){ return { sha:j.sha, text:b64decode(j.content) }; });
  }
  function ghPut(text, sha, msg){
    return fetch(apiUrl(),{method:'PUT',headers:{Authorization:'Bearer '+token(),Accept:'application/vnd.github+json','Content-Type':'application/json'},
      body:JSON.stringify({message:msg, content:b64encode(text), sha:sha, branch:repo.branch})})
      .then(function(r){ if(!r.ok) throw new Error('Save failed ('+r.status+'). Your token may lack Contents: write.'); return r.json(); });
  }
  function saveToGithub(id, values, addMode, status){
    ghGet().then(function(got){
      var newText=window.EDIT.updateCsv(got.text, id, values, addMode);
      return ghPut(newText, got.sha, (addMode?'Add ':'Update ')+values.name+' (via editor)');
    }).then(function(){
      status.className='status ok'; status.textContent='Saved ✓ — it appears on the site within about a minute.';
    }).catch(function(err){ status.className='status err'; status.textContent=(''+(err&&err.message||err)).slice(0,220); });
  }

  render();
});
