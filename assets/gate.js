/*  Sheikh Mubarak Ali Family Archive — soft access gate
    -----------------------------------------------------
    Shows a family password prompt before any page content is revealed.

    IMPORTANT: this is a light deterrent, NOT real security. Because this is a
    public static site, the underlying files (people.csv, photos, PDFs) stay
    directly reachable by URL. The gate keeps casual / accidental visitors out;
    it does not protect the data from anyone determined to look. For genuine
    access control, host behind Cloudflare Access (keeps the repo private).

    TO CHANGE THE FAMILY PASSWORD (two easy ways):
      • Just tell your assistant the new password and it will update PASS_HASH.
      • Or do it yourself: open the site, open the browser DevTools console, run
          (async p => { const b = await crypto.subtle.digest('SHA-256',
            new TextEncoder().encode('mubarak-ali-family-archive::' + p));
            return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); })('YOUR NEW PASSWORD')
        copy the 64-character result, and paste it as PASS_HASH below.
*/
(function () {
  var SALT = "mubarak-ali-family-archive::";
  var PASS_HASH = "32f2b3c36509a32046933bee69dd6dc4d9ab728df4286256fef3dc4e0451fc2d"; // temporary password: "family" — please change
  var KEY = "smaf_gate_ok";

  try { if (sessionStorage.getItem(KEY) === PASS_HASH) return; } catch (e) {}

  // Hide all page content until unlocked (takes effect the moment <body> renders)
  var hide = document.createElement("style");
  hide.id = "smaf-gate-hide";
  hide.textContent = "body{visibility:hidden!important}#smaf-gate,#smaf-gate *{visibility:visible!important}";
  (document.head || document.documentElement).appendChild(hide);

  function reveal() {
    var g = document.getElementById("smaf-gate"); if (g) g.parentNode.removeChild(g);
    var h = document.getElementById("smaf-gate-hide"); if (h) h.parentNode.removeChild(h);
  }

  function hashOf(pw) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + pw)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  function build() {
    var ov = document.createElement("div");
    ov.id = "smaf-gate";
    ov.setAttribute("style", "position:fixed;inset:0;z-index:2147483647;background:#fbf7ee;color:#23314b;display:flex;align-items:center;justify-content:center;font-family:'Palatino Linotype',Palatino,Georgia,'Times New Roman',serif");
    ov.innerHTML =
      '<form id="smaf-gate-form" style="width:min(92vw,380px);text-align:center;padding:8px">'
      + '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a9822b;margin-bottom:14px">Sheikh Mubarak Ali Family Archive</div>'
      + '<h1 style="font-size:22px;font-weight:700;margin:0 0 6px;line-height:1.2">A private family archive</h1>'
      + '<p style="font-size:14px;color:#6f6a5c;line-height:1.5;margin:0 0 20px">Please enter the family password to continue.</p>'
      + '<input id="smaf-gate-pw" type="password" autocomplete="current-password" placeholder="Family password" style="width:100%;box-sizing:border-box;padding:12px 14px;font-size:15px;border:1px solid #d8cdb4;border-radius:10px;background:#fff;color:#23314b;outline:none">'
      + '<button type="submit" style="width:100%;margin-top:12px;padding:12px 14px;font-size:15px;font-weight:600;color:#fff;background:#a9822b;border:0;border-radius:10px;cursor:pointer">Enter</button>'
      + '<div id="smaf-gate-err" style="min-height:18px;margin-top:12px;font-size:13px;color:#b3341f"></div>'
      + '</form>';
    document.body.appendChild(ov);

    var form = document.getElementById("smaf-gate-form");
    var pw = document.getElementById("smaf-gate-pw");
    var err = document.getElementById("smaf-gate-err");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      hashOf(pw.value || "").then(function (h) {
        if (h === PASS_HASH) {
          try { sessionStorage.setItem(KEY, PASS_HASH); } catch (e) {}
          reveal();
        } else {
          err.textContent = "That password isn’t right — please try again.";
          pw.value = ""; pw.focus();
        }
      }).catch(function () { err.textContent = "This browser couldn’t run the check (the site needs HTTPS)."; });
    });
    pw.focus();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
