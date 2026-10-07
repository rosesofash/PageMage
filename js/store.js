// Fake "backend" for the saved reading list, stored in the browser's localStorage.
//
// Every function is async on purpose: when you build a real backend (e.g. Vercel functions in /api),
// replace each body with a fetch() call and nothing else in the app has to change. For example:
//
//   export async function saveBook(book) {
//     const res = await fetch("/api/saved", { method: "POST", body: JSON.stringify(book) });
//     return res.json();
//   }

const SAVED_KEY = "pagemage:saved";

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked (private mode) — the app still works, it just won't remember.
  }
}

export async function getSavedBooks() {
  return read(SAVED_KEY, []);
}

/** Saves the fields needed to redraw the book later, plus which game it was recommended for. */
export async function saveBook(book, game) {
  const saved = await getSavedBooks();
  if (!saved.some((b) => b.key === book.key)) {
    saved.unshift({ ...book, savedFrom: game?.title ?? null, savedAt: new Date().toISOString() });
    write(SAVED_KEY, saved);
  }
  return saved;
}

export async function removeBook(bookKey) {
  const saved = (await getSavedBooks()).filter((b) => b.key !== bookKey);
  write(SAVED_KEY, saved);
  return saved;
}
