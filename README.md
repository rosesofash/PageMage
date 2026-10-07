# PageMage
Ash &amp; Eddie's project to encourage gamers to find books they could read and enjoy.

Pick a game from the 3D wheel, see its genres, themes and tropes, and get book recommendations from
[Open Library](https://openlibrary.org/developers/api) that share its story.

## Run it locally

The app uses JavaScript modules, so it has to be served over `http://`. Double-clicking `index.html` won't work.

- **VS Code:** install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.
- **Or with Node 18+:** `npx serve .` and open the URL it prints.

## Deploy on Vercel

It's a static site, so there's nothing to build.

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Framework preset: **Other**. Leave the build command and output directory empty → **Deploy**.

Every push to `main` redeploys automatically. When you add a backend (an LLM, real accounts), put serverless
functions in an `api/` folder, e.g. `api/recommend.js`. Vercel serves them at `/api/recommend`.

## How it's organised

| File | What it does |
| --- | --- |
| `js/data/games.js` | The games: synopsis, **tags** (genres), **themes**, **tropes**, and the Open Library **subjects** used to search. Add games here. |
| `js/config.js` | Tuning knobs: top tags per book, score weights, how many books, which subjects count as noise. |
| `js/recommend.js` | The engine: fetch books per subject → take each book's own top 10 tags → recommend only if they match the game → score. |
| `js/api/openlibrary.js` | Open Library search / work details / cover + store links. |
| `js/api/wikipedia.js` | Loads game cover art from Wikipedia. |
| `js/store.js` | **Fake backend** for the saved reading list (browser `localStorage`). Swap each function for a `fetch('/api/...')` call later. |
| `js/ui/carousel.js` | The 3D game wheel (mouse wheel, drag, arrow keys). |
| `js/app.js` | Connects everything to the page. |

## How recommendations are scored

1. For each of the game's `subjects`, search Open Library (fiction only) sorted by **most read** and by **rating**.
2. Clean each book's subjects (drop catalog noise like `nyt:…` or `Reading Level-Grade 7`, merge duplicates) and take its
   **own top 10 tags**: its first 10 real subjects on Open Library. A book is only recommended if those top 10 match the game.
3. By default at least 1 of the top 10 must match, and it must be one of the game's **genres** (`tags`). Change
   `minTagMatches` / `requireGenreMatch` in `config.js` to be stricter. Extra matching themes and tropes raise the score.
4. Score = 50% tag match + 20% rating + 15% readers + 15% want-to-read. The weights are in `config.js`.
5. Popularity floor: at least 50 ratings, 200 want-to-read and 50 already-read (`minRatings` / `minWantToRead` /
   `minAlreadyRead` in `config.js`).
6. At most 2 books per author, no duplicate titles, 12 books total.

Tip: open the browser console and inspect `scoreBreakdown` on a book to see why it ranked where it did.

Deep links work too: `index.html#signalis` opens straight to that game.
