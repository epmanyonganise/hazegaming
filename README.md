# HAZE Gaming website

**You won't see us coming.** The website for **hazegaming.co.zw**. It's plain HTML/CSS/JavaScript,
with no build tools or installs.

## Folder layout

```
haze-gaming/
├── index.html            The page itself (all sections)
├── 404.html              "Page not found" page
├── favicon.ico           Browser tab icon (black H on mint)
├── site.webmanifest      App name/icons for "Add to home screen"
├── css/style.css         All styling: brand colours are at the top
├── js/main.js            Smoke animation, member/event cards, name forge
├── data/
│   ├── config.json       ← Discord link, games, social links
│   ├── members.json      ← Member list
│   └── events.json       ← Events & tournaments
├── images/
│   ├── brand/            Original official brand files (untouched)
│   ├── wordmark.png      H + HAZE wordmark (transparent), from the banner
│   ├── logo-h.png        Mint H (transparent), from the mint-on-black logo
│   ├── h-outline.webp    Giant outlined H in the hero, from the poster
│   ├── og-image.png      Link preview for WhatsApp/Discord, from the banner
│   ├── favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
│   └── avatars/          Put member pictures here
├── netlify.toml          Netlify settings
└── robots.txt, sitemap.xml
```

## Everyday editing

You'll mostly only touch the three files in **`data/`**. Open them in VS Code (or Notepad).

> ⚠️ **JSON is strict.** Keep every quote `"` and comma `,`. Put a comma *between* items but
> **never after the last one**. If the members or events vanish after an edit, it's almost always
> a missing or extra comma. Paste the file into <https://jsonlint.com> to find the line.

### Add a member: `data/members.json`
Copy a line and change it:
```json
{ "name": "Shxdow", "role": "Member", "game": "Fortnite", "avatar": "" },
```
- `name`: gamer tag **without** "HAZE" (the site adds the tag)
- `role`: Leader, Founder or Owner get the glowing card
- `avatar`: optional, e.g. `"images/avatars/shxdow.jpg"` (square, about 300×300px)

### Add an event: `data/events.json`
Copy a `{ ... }` block. `date` must be `YYYY-MM-DD`. Past events hide themselves automatically.

### Discord link
It's set in `data/config.json`. It's also written directly on the buttons in `index.html`
(search for `discord.gg`) so they work instantly. If you ever change the invite, update both.

### Colours
The brand palette is at the top of `css/style.css`. Use only these:
Haze Mint `#5EF5C8`, Void Black `#0A0A0A`, Off-white `#F2FFFB`, Smoke Teal `#2E8F74`.

## Previewing on your computer

Because the data is in JSON files, double-clicking `index.html` shows the page but **not** the
members and events (browsers block that for safety). To preview properly:

- **VS Code:** install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.
- **Or** in a terminal in this folder: `python -m http.server 8000`, then open <http://localhost:8000>.

On Netlify everything loads normally.

## Deploying to Netlify

**Drag & drop:** open your site in Netlify → **Deploys** tab → drag the whole `haze-gaming`
folder onto the box. Done in seconds.

**Auto-deploy (optional):** put this folder in a GitHub repo and connect it in Netlify
(*Add new site → Import from Git*). No build command; publish directory is `.`.

## Brand assets
Everything in `images/` is made from the official files in `images/brand/`. The logos are only
cropped, resized, or had their black background made transparent. Nothing was redrawn. If you
get a high-resolution transparent wordmark (PNG or SVG) from your designer, save it over
`images/wordmark.png` for an even sharper hero.

## Link previews
WhatsApp/Discord use `images/og-image.png` (1200×630, built from the banner). WhatsApp caches
previews, so a change can take a while to show. Discord updates within a few minutes.
