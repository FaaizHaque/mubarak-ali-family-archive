# Sheikh Mubarak Ali Family Archive

*Preserving the History, Heritage and Legacy of the Haque Family.*

A free, self-contained website — no server, no database, no build step. It is a
set of plain HTML pages that read from **one shared data file**, so a person
entered once appears correctly across the Family Tree, Directory, Relationship
Finder, Timeline, and Notable Members.

## Pages
| Page | File | What it is |
|------|------|-----------|
| Home | `index.html` | The introduction and links into the archive |
| Family Tree | `tree.html` | Interactive, zoomable/pinch tree of all seven branches |
| Family Directory | `directory.html` | Searchable, filterable list of every member |
| Relationship Finder | `finder.html` | Pick two people → how they are related |
| Timeline | `timeline.html` | Historical events + births/deaths |
| Notable Members | `notable.html` | Distinguished members of the family |
| Gallery | `gallery.html` | Photographs |
| Family Stories | `stories.html` | Memories and accounts |
| Documents & Archive | `documents.html` | Scanned records |

```
assets/   data.js (ALL the family info — the file you edit) · familylib.js · site.js
          styles.css · tree.js · directory.js · finder.js
content/  stories.js · gallery.js · documents.js  (add stories/photos/documents here)
photos/   image files
```

## The one file you edit: `assets/data.js`
Everyone in the family lives in `assets/data.js`. Each person looks like:

```js
{
  name: "Rizwan ul Haque",
  sex: "m",                     // "m", "f", or "" if unknown
  dob: "1975", dod: "",         // dates (optional; leave "" if living)
  profession: "Engineer",       // optional
  photo: "photos/rizwan.jpg",   // optional (put the file in photos/)
  bio: "A few sentences…",      // optional
  notable: true,                // optional → shows on Notable Members
  role: "Ambassador",           // optional (with notable)
  honors: "…",                  // optional (with notable)
  spouses: [ { name: "Romana" } ],
  children: [ { name: "Hira", sex: "f" } ]
}
```

Only `name` is required. To **add a detail**, find the person and add the field.
To **add a person**, copy an existing block into the right `children: [ … ]`.
The full guide is at the top of `assets/data.js`, and every profile shows that
person's `id` so you know which entry to edit.

- **Photos:** drop the file in `photos/`, then set `photo: "photos/…"`.
- **Stories / Gallery / Documents:** edit the matching file in `content/`.
- **Timeline events:** the `events` list near the top of `assets/data.js`.

## Publishing (free, via GitHub Pages)
1. Repo **Settings → Pages**.
2. **Source:** Deploy from a branch → **Branch: `main`**, folder **`/ (root)`** → **Save**.
3. After ~1 minute the site is live at
   `https://faaizhaque.github.io/mubarak-ali-family-archive/`.

Edit any file on GitHub (the ✏️ pencil → *Commit changes*) and the live site
updates within a minute.

## Who can edit
The repository owner is the only editor. To add others later:
**Settings → Collaborators → Add people → Write role.** Remove anyone anytime
from the same screen.

## Design notes
- Marriages within the family are recorded once, with a 🔗 link between the two
  branches, so no one is duplicated.
- Placeholder names (from the original notes) show faintly as "to be added".
- A few ambiguous details are flagged in `assets/data.js` — search for the word
  **"confirm"**.
