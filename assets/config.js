/* =============================================================================
   config.js — site settings you can change without touching any other code.

   dataUrl / sheetCsvUrl: where the site reads its people from (CSV).
   • "people.csv"  → the archive's own file in this repo (recommended). Edits made
     with the built-in editor, or by your assistant, show up here directly.
   • a Google "Publish to web → .csv" link → read from a Google Sheet instead.
   • ""            → use the built-in copy in assets/data.js.
============================================================================= */
window.ARCHIVE_CONFIG = {
  sheetCsvUrl: "people.csv",

  // GitHub repo the built-in editor (edit.html) saves to. Only used by the editor.
  repo: { owner: "FaaizHaque", name: "mubarak-ali-family-archive", branch: "main", file: "people.csv" }
};
