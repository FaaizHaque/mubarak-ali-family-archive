# The photo gallery

The gallery is a **curated** collection of family photographs, organised so it
never becomes a jumble:

- **The Elders** — Sheikh Mubarak Ali and his seven children.
- **One section per branch** (Branch 1–7), each **sub-grouped by household** —
  i.e. by the branch head's children and their families.
- **Gatherings & Occasions** — group photos, weddings, reunions and old
  cross-family pictures that don't belong to a single person.

Gallery photos are kept **separate from the profile pictures**. Profile head-shots
live in `photos/` (one per person, named by id). Gallery photos live in `gallery/`
and you can add as many as you like.

---

## Adding photographs — two steps

**1. Upload the image files** into the `gallery/` folder in the repository.
On GitHub you can open the `gallery/` folder → **Add file → Upload files** and drag
in several at once. Give them clear names, e.g. `anwar-family-1972.jpg`.

**2. Add one line per photo to `gallery.csv`.** The columns are:

| column | meaning |
|---|---|
| `file` | the image's file name, e.g. `anwar-family-1972.jpg` (just the name — `gallery/` is assumed) |
| `caption` | what the photo shows, e.g. `Anwar ul Haque with his children, Lahore` |
| `place` | **where it belongs** — see below |
| `year` | *(optional)* e.g. `1972` — used to order photos and shown as a small date |
| `people` | *(optional)* ids of people in the photo, separated by commas — adds clickable name tags that open their profiles |

That's it — save `gallery.csv` and the photo appears on the site within a minute.

---

## The `place` column

`place` is the only thing you need to think about. It is **one** of:

- `elders` — puts the photo in **The Elders** section.
- `gatherings` — puts it in **Gatherings & Occasions** (group / cross-family / old photos).
- **a person's name or id** — the gallery reads the family tree and files the photo
  under that person's **branch** and **household** automatically. You don't pick the
  branch or household yourself; it's worked out for you.

> Names work (`Moin ul Haque`), but because some names repeat in the family, an
> **id** is the safe choice (`b3-moin`). You can find anyone's id on their profile —
> open their card and look at the *"Add / update this person"* note, which shows
> `id: …`. When in doubt, just ask your assistant.

### Examples

```csv
file,caption,place,year,people
mubarak-ali-portrait.jpg,Sheikh Mubarak Ali,elders,,mubarak
arif-1955.jpg,Sheikh Muhammad Arif,elders,1955,b3-arif
anwar-family-1972.jpg,Anwar ul Haque with his children,b3-anwar,1972,b3-anwar
moin-ambassador.jpg,Moin ul Haque presenting credentials,b3-moin,2020,b3-moin
farooq-graduation.jpg,Farooq Masroor's graduation,farooq,1989,farooq
eid-gathering-1998.jpg,Eid gathering at the family home,gatherings,1998,
```

- The first two land in **The Elders**.
- `anwar-family-1972.jpg` and `moin-ambassador.jpg` both land in **Branch 3 —
  Sheikh Muhammad Arif**, under the **Anwar ul Haque** household (Moin is Anwar's
  son, so his photo files under Anwar's family too).
- `farooq-graduation.jpg` lands in **Branch 5 — Sughra**, under the **Masroor** household.
- The Eid photo goes to **Gatherings & Occasions**.

If a `place` isn't recognised, the photo still shows up under Gatherings & Occasions
(nothing is ever lost), and the page notes that it needs a correct `place`.

---

## The easiest option of all

You don't have to touch the file yourself. **Upload the images to `gallery/` and tell
your assistant** "these are photos of Anwar's family / the elders / a 1998 gathering",
and the `gallery.csv` lines will be written for you.
