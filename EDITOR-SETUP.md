# The built-in editor (Add / Edit a person)

The archive has a simple form editor at **`edit.html`** (also linked in the page
footer as *"✎ Add / edit a person"*). You pick a person, fill in plain boxes —
name, dates, profession, biography — and click save. No spreadsheet, no columns.

It saves straight into the archive's data file (`people.csv`) on GitHub, and the
change appears on the site within about a minute.

## One-time setup: a GitHub access token
So the editor can save for you, it needs a personal access token — a private key
that stays **only in your browser on this device** (nowhere else).

1. Go to **https://github.com/settings/tokens?type=beta** (GitHub → Settings →
   Developer settings → **Fine-grained tokens** → *Generate new token*).
2. **Token name:** anything, e.g. `family-archive-editor`.
3. **Expiration:** your choice (e.g. 1 year).
4. **Repository access:** *Only select repositories* → choose
   **`mubarak-ali-family-archive`**.
5. **Permissions:** expand *Repository permissions* → set **Contents** to
   **Read and write**. (Leave everything else as *No access*.)
6. Click **Generate token** and **copy** it (it starts with `github_pat_…`).
7. Open **`edit.html`** on the site, paste the token, click **Save & continue**.

That's it. The token is remembered on this device; click *sign out* on the
editor to remove it. If you ever want a fresh one, delete the old token on GitHub
and generate a new one.

## Using it
- **Edit someone:** type their name, pick them, change any boxes, **Save changes**.
- **Add someone:** click **+ Add new person**, enter their name, choose a parent
  already in the tree (or leave the parent blank for a spouse who married in),
  and save.
- **Photos:** still the easiest by upload — put `photos/<their-id>.jpg` in the
  repo. The photo box in the form is only for special cases.

## Notes
- Only people who have their own row can be edited directly. Auto-created
  married-in spouses (shown faintly) don't yet — use **Add new person** to give
  one a full record if you want their dates/biography.
- The editor and the "just tell your assistant" method both write to the same
  file, so they stay in sync. The Google Sheet is now a **backup**; if you'd
  rather drive the live site from the sheet again, set `sheetCsvUrl` in
  `assets/config.js` back to the sheet's published-CSV link.
