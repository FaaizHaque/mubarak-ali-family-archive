/* =============================================================================
   boot.js — decides where the family data comes from, then makes it available.
   Every page waits on `window.familyReady` (a promise) before it renders.

   Source of truth:
     • People come from the Google Sheet in assets/config.js if a URL is set and
       loads successfully; otherwise from the built-in copy (assets/data.js).
     • The site title, introduction, timeline events and honoured non-lineage
       members always come from the built-in copy (they rarely change).
============================================================================= */
window.familyReady = (function(){
  "use strict";
  var emb = window.FAMILY_EMBEDDED || { site:{}, intro:{}, events:[], notableExtra:[], root:{ name:"—", children:[] } };
  var fam = { site:emb.site, intro:emb.intro, events:emb.events, notableExtra:emb.notableExtra, root:emb.root, externals:emb.externals||[] };
  var cfg = window.ARCHIVE_CONFIG || {};
  window.FAMILY_SOURCE = "built-in";

  function finish(){ window.FAMILY = fam; window.FL.load(fam); return fam; }

  var url = (cfg.sheetCsvUrl || "").trim();
  if(!url || typeof fetch === "undefined" || typeof window.buildRootFromCsv !== "function"){
    return Promise.resolve().then(finish);
  }
  return fetch(url, { cache: "no-store" })
    .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(function(text){
      var built = window.buildRootFromCsv(text);
      var root = built && built.root;
      if(root && root.children && root.children.length){ fam.root = root; fam.externals = built.externals || []; window.FAMILY_SOURCE = "sheet"; }
      else throw new Error("sheet produced no people");
      return finish();
    })
    .catch(function(err){
      console.warn("Family archive: could not load the Google Sheet — using the built-in copy.", err);
      window.FAMILY_SOURCE = "built-in (sheet unavailable)";
      return finish();
    });
})();
