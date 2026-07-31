/* =============================================================================
   Documents & Archive — the family's publications, articles, poetry, letters and
   records. Put each file (a PDF or image) in a documents-files/ folder, then add
   an entry below. Word (.docx) files are converted to PDF first so they open in
   any browser.

   Fields:
     file      — path to the PDF/image, e.g. "documents-files/arz-e-multan.pdf",
                 OR a web link, e.g. "https://www.brecorder.com/news/123" — a link
                 opens in a new tab (prefer a preserved PDF for anything that could
                 later vanish behind a paywall or be taken down).              (required)
     title     — what it is                                                       (required)
     member    — whose "corner" it belongs to, e.g. "Moin ul Haque". Omit for
                 general family records.
     memberId  — that person's id (optional) — makes the corner heading link to
                 their profile, e.g. "b3-moin".
     category  — Book · Article · Poetry · Letter · Certificate · Record …  (optional tag)
     source    — for a web link, where it lives, e.g. "Business Recorder" — shown as a ↗ chip
     note      — a short description                                        (optional)
     year      — e.g. "1972"                                                (optional)
============================================================================= */
window.DOCUMENTS = [
  { member:"Moin ul Haque", memberId:"b3-moin", category:"Article", title:"A Requiem to Naltar", note:"A first-hand account of the Naltar helicopter tragedy of 8 May 2015, written on its eleventh anniversary.", file:"documents-files/a-requiem-to-naltar.pdf", year:"2026" },
  { member:"Moin ul Haque", memberId:"b3-moin", category:"Article", title:"The Forgotten Lockdown", note:"An essay contrasting the world's COVID-19 lockdowns with the forgotten, months-long lockdown in Indian-Occupied Jammu & Kashmir. Written in Paris, May 2020.", file:"documents-files/the-forgotten-lockdown.pdf", year:"2020" },
  { member:"Moin ul Haque", memberId:"b3-moin", category:"Poetry", title:"Daddy (ڈیڈی)", note:"An Urdu elegy for Sheikh Ahsan ul Haque, lovingly known as ‘Daddy’, written on his passing.", file:"documents-files/daddy-an-elegy.pdf", year:"2025" },

  { member:"Imran ul Haque", memberId:"imran", category:"Article", title:"Energy sector reforms — I", note:"Part I of his energy-sector reforms series — on Pakistan's gas supply, circular debt, subsidies and the energy mix. Business Recorder, 29 December 2022.", file:"documents-files/energy-sector-reforms-i.pdf", year:"2022" },
  { member:"Imran ul Haque", memberId:"imran", category:"Article", title:"Energy sector reforms – II: low-hanging fruit rotting", note:"Part II — on governance, meritocracy, accountability and honouring commercial contracts. Business Recorder, 25 January 2023.", file:"documents-files/energy-sector-reforms-ii.pdf", year:"2023" },
  { member:"Imran ul Haque", memberId:"imran", category:"Article", title:"Energy sector reforms: Low-hanging fruit rotting – III", note:"Part III — on deregulation, privatisation, reviving state enterprises and the K-Electric model. Business Recorder, 2 February 2023.", file:"documents-files/energy-sector-reforms-iii.pdf", year:"2023" },

  { member:"Nadeem ul Haque", memberId:"nadeem-ul-haq", category:"Article", title:"The poverty measurement industry", note:"On Pakistan's shifting poverty lines, and how measuring poverty has come to substitute for combating it. Dawn, 12 November 2025.", file:"documents-files/poverty-measurement-industry.pdf", year:"2025" },
  { member:"Nadeem ul Haque", memberId:"nadeem-ul-haq", category:"Article", title:"Vertical growth", note:"On why Pakistan's cities must be allowed to grow upward — ending the two-floor restriction to unlock housing and investment. Dawn, 16 November 2022.", file:"documents-files/vertical-growth.pdf", year:"2022" },

  // ---- Templates: copy a line, fill it in, and drop the file into documents-files/ ----
  // { member:"Ikram ul Haque", memberId:"ikram", category:"Book", title:"Arz-e-Multan", note:"A history of the Multan region.", file:"documents-files/arz-e-multan.pdf", year:"1972" },
  // { category:"Certificate", title:"Migration certificate", note:"Issued 1948", file:"documents-files/migration-1948.pdf", year:"1948" }
];
