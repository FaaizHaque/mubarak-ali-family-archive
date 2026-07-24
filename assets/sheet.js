/* =============================================================================
   sheet.js — read the family from a published Google Sheet (CSV) and rebuild the
   same tree the rest of the site uses. If no sheet is configured (or it fails to
   load), the site falls back to the built-in data in assets/data.js.

   One row per person. Columns (header row, any order; extra columns ignored):
     id, name, sex, parent_id, spouse, spouse_id, spouse_note,
     dob, dod, profession, photo, notable, role, honors, note, todo, bio
============================================================================= */
(function(){
  "use strict";

  // --- RFC-4180 CSV parser (handles quotes, commas and newlines in fields) ---
  function parseCsv(text){
    text = (''+text).replace(/^﻿/, '');            // strip BOM
    var rows=[], row=[], field='', inQ=false, i=0, c;
    for(; i<text.length; i++){
      c = text[i];
      if(inQ){
        if(c === '"'){ if(text[i+1] === '"'){ field+='"'; i++; } else inQ=false; }
        else field += c;
      } else {
        if(c === '"') inQ=true;
        else if(c === ','){ row.push(field); field=''; }
        else if(c === '\n'){ row.push(field); rows.push(row); row=[]; field=''; }
        else if(c === '\r'){ /* ignore, handle \n */ }
        else field += c;
      }
    }
    if(field.length || row.length){ row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows){
    if(!rows.length) return [];
    var head = rows[0].map(function(h){ return (''+h).trim().toLowerCase(); });
    var out=[];
    for(var r=1; r<rows.length; r++){
      var cells=rows[r];
      if(cells.length===1 && (''+cells[0]).trim()==='') continue;   // blank line
      var o={}; for(var c=0;c<head.length;c++){ o[head[c]] = (cells[c]!=null ? (''+cells[c]).trim() : ''); }
      if(!o.id && !o.name) continue;                                 // skip empty rows
      out.push(o);
    }
    return out;
  }

  function truthy(v){ return /^(y|yes|true|1|x|✓)$/i.test((''+v).trim()); }
  function splitList(v){ return (''+(v||'')).split(';').map(function(s){ return s.trim(); }).filter(Boolean); }

  function buildRootFromCsv(text){
    var objs = rowsToObjects(parseCsv(text));
    if(!objs.length) return null;

    var byId = {}, nodes = [];
    objs.forEach(function(o){
      if(!o.id){ o.id = (o.name||'person').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
      var names = splitList(o.spouse), notes = splitList(o.spouse_note), spouses = [];
      names.forEach(function(nm, idx){ spouses.push({ name: nm, note: notes[idx] || '' }); });
      if(o.spouse_id){
        if(spouses.length) spouses[0].id = o.spouse_id;
        else spouses.push({ id:o.spouse_id, name:'', note: notes.join('; ') });
      } else if(!spouses.length && notes.length){
        spouses.push({ name:'', note: notes.join('; ') });
      }
      var node = { id:o.id, name:o.name||'', sex:(o.sex||'').toLowerCase() };
      if(spouses.length) node.spouses = spouses;
      ['dob','dod','profession','photo','role','honors','note','todo','bio','alias'].forEach(function(k){ if(o[k]) node[k]=o[k]; });
      if(truthy(o.notable)) node.notable = true;
      node._parent = o.parent_id || '';
      byId[o.id] = node; nodes.push(node);
    });

    // fill in spouse display names for in-family spouses linked only by id
    nodes.forEach(function(n){ (n.spouses||[]).forEach(function(s){ if(s.id && !s.name && byId[s.id]) s.name = byId[s.id].name; }); });

    // Choose the root (Sheikh Mubarak Ali), then nest everyone else under their
    // parent. Rows with NO parent_id (other than the root) are "external" people —
    // spouses who married in: they get a full profile but sit outside the descent tree.
    var rootId = byId['mubarak'] ? 'mubarak' : (nodes.filter(function(n){ return !n._parent; })[0]||{}).id;
    var root = byId[rootId] || null, externals = [];
    if(!root) return null;
    nodes.forEach(function(n){
      if(n.id===rootId) return;
      var pid=n._parent, p=pid && byId[pid];
      if(p){ (p.children=p.children||[]).push(n); }
      else if(pid){ (root.children=root.children||[]).push(n); }   // parent id typo → attach to root
      else { n.external=true; externals.push(n); }                 // no parent → married in
    });
    nodes.forEach(function(n){ delete n._parent; });

    // Link each external spouse back onto their partner's card so it becomes clickable.
    externals.forEach(function(E){
      (E.spouses||[]).forEach(function(s){
        var P = s.id && byId[s.id]; if(!P) return;
        var m = (P.spouses||[]).filter(function(x){ return !x.id && x.name && x.name.toLowerCase()===(E.name||'').toLowerCase(); })[0];
        if(m) m.id = E.id; else { (P.spouses=P.spouses||[]).push({ id:E.id, name:E.name }); }
      });
    });

    // auto cross-reference: a spouse whose children live on their partner's line
    function disp(nm){ return (!nm || /^(x+|tbd|\?+|[A-Z]{1,4})$/.test(nm)) ? 'Name to be added' : nm; }
    nodes.forEach(function(n){
      if(n.external || (n.children && n.children.length)) return;
      var link=(n.spouses||[]).filter(function(s){ return s.id && byId[s.id]; })
                              .map(function(s){ return byId[s.id]; })
                              .filter(function(s){ return s.children && s.children.length; })[0];
      if(link) n.ref = { to: link.id, text: 'Their children are shown under ' + disp(link.name) + ' →' };
    });

    return { root: root, externals: externals };
  }

  if(typeof window !== 'undefined'){
    window.parseCsv = parseCsv;
    window.buildRootFromCsv = buildRootFromCsv;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = { parseCsv: parseCsv, buildRootFromCsv: buildRootFromCsv };
  }
})();
