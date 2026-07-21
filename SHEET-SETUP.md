# Editing the family in a Google Sheet

The site can read all the people from a Google Sheet, so you (and anyone you
invite to the sheet) can edit names, dates, professions, photos and bios in a
familiar spreadsheet instead of editing code. Set-up is a one-time job of about
five minutes.

> Until you finish these steps, the site keeps using its built-in copy of the
> family — so nothing breaks in the meantime.

## Step 1 — Create the sheet from the starter file
1. Download **`people.csv`** from this repo
   (open it on GitHub → the **···** menu / **Download** button), or just open:
   `https://github.com/FaaizHaque/mubarak-ali-family-archive/blob/main/people.csv`
2. Go to **https://sheets.new** to make a new Google Sheet.
3. **File → Import → Upload**, choose `people.csv`.
4. Import location: **Replace current sheet**. Separator: **Comma** (or Detect
   automatically). Click **Import data**.

You now have every family member in a spreadsheet, one person per row.

## Step 2 — Publish it as a CSV link
1. In the sheet: **File → Share → Publish to web**.
2. In the dialog, **Link** tab: choose the **specific sheet** (e.g. *Sheet1*),
   and for the format choose **Comma-separated values (.csv)**.
3. Click **Publish**, confirm, and **copy the link** it gives you (it ends in
   `output=csv`).

## Step 3 — Point the site at your sheet
1. Open **`assets/config.js`** in the repo (the ✏️ pencil on GitHub).
2. Paste your link between the quotes:
   ```js
   window.ARCHIVE_CONFIG = {
     sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv"
   };
   ```
3. **Commit changes.** Done — the site now reads people from your sheet.

Edits you make in the sheet appear on the site within a few minutes (Google
refreshes the published CSV on a short delay).

## The columns
Most are optional — a person only needs a **name**. Fill in whatever you know.

| Column | What it is |
|---|---|
| `id` | A unique tag for the person (e.g. `b1-farrah`). **Don't change existing ones** — other rows point to them. |
| `name`, `sex` | Name; sex is `m`, `f`, or blank. |
| `parent_id` | The `id` of the parent this person sits under. Blank only for Sheikh Mubarak Ali. |
| `spouse` | Spouse's name (free text). |
| `spouse_id` | If the spouse is **also in the family**, their `id` — this is what links the two branches for a cousin marriage. Otherwise leave blank. |
| `spouse_note` | e.g. "married 1975", "divorced", "name to be added". |
| `dob`, `dod` | Born / died (leave `dod` blank if living). |
| `profession`, `photo`, `bio` | Profession; a photo filename in `photos/`; a short life story. |
| `notable`, `role`, `honors` | Put `yes` in `notable` to feature them on the Notable Members page, with an optional `role` and `honors`. |
| `note`, `todo` | A general note; `todo` shows a faint "to be added" reminder. |

### To add a new person
Add a new row, give them a **unique `id`**, a `name`, and set `parent_id` to the
`id` of their mother or father already in the sheet. That's it — they appear in
the tree, directory and finder automatically. (For a marriage between two people
already in the family, put the wife's row `id` in the husband's `spouse_id`.)

### Good to know
- Keep the **header row** (the first row) exactly as it is.
- The sheet must stay **published**. If it's ever unpublished or unreachable,
  the site quietly falls back to the built-in copy.
- Prefer not to use a sheet after all? Set `sheetCsvUrl` back to `""` and the
  site uses the built-in copy in `assets/data.js`.

And as always — you can just send the details to your assistant and have them
entered for you.
