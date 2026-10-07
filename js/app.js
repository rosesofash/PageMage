import { GAMES } from "./data/games.js";
import { recommendBooks } from "./recommend.js";
import { getWork, cleanDescription, coverUrl, storeLinks } from "./api/openlibrary.js";
import { getWikiImage } from "./api/wikipedia.js";
import { Carousel } from "./ui/carousel.js";
import * as store from "./store.js";

const $ = (sel) => document.querySelector(sel);

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const fmt = new Intl.NumberFormat();

const state = {
  game: null,
  books: [],
  openBook: null,
  saved: [],
  user: null,
  requestId: 0,
  afterLogin: null, // action to retry once the user logs in
};

/* ---------- Game covers ---------- */

function gameCoverUrl(game) {
  return game.cover ? Promise.resolve(game.cover) : getWikiImage(game.wiki);
}

/** Fills an element with the game's cover, or a styled placeholder when there isn't one. */
function paintCover(el, game) {
  el.innerHTML = `<span class="cover-fallback">${esc(game.title)}</span>`;
  gameCoverUrl(game).then((url) => {
    if (!url) return;
    const img = new Image();
    img.alt = `${game.title} cover art`;
    img.draggable = false;
    img.onload = () => {
      // Wide images (logos) are shown whole instead of cropped.
      if (img.naturalWidth > img.naturalHeight * 1.05) el.classList.add("is-logo");
      el.replaceChildren(img);
    };
    img.src = url;
  });
}

/* ---------- Carousel ---------- */

function renderGameCard(game) {
  const card = document.createElement("div");
  card.className = "game-card";
  card.id = `game-card-${game.id}`;
  card.style.setProperty("--accent", game.accent);
  card.setAttribute("aria-label", game.title);
  card.innerHTML = `<div class="game-card__art"></div><div class="game-card__label">${esc(game.title)}</div>`;
  paintCover(card.querySelector(".game-card__art"), game);
  return card;
}

const carousel = new Carousel($("#carousel-stage"), GAMES, {
  renderCard: renderGameCard,
  onSelect: showGame,
  onFrontChange: (game) => {
    $("#front-title").textContent = game.title;
    if (!state.game) document.documentElement.style.setProperty("--accent", game.accent);
  },
});
$("#prev-game").addEventListener("click", () => carousel.step(-1));
$("#next-game").addEventListener("click", () => carousel.step(1));

/* ---------- Game detail + recommendations ---------- */

async function showGame(game) {
  state.game = game;
  history.replaceState(null, "", `#${game.id}`);
  const requestId = ++state.requestId;
  document.documentElement.style.setProperty("--accent", game.accent);

  const detail = $("#game-detail");
  detail.hidden = false;
  paintCover($("#detail-cover"), game);
  $("#detail-meta").textContent = [game.year, game.studio, game.pick && `${game.pick}'s pick`].filter(Boolean).join(" · ");
  $("#detail-title").textContent = game.title;
  $("#detail-synopsis").textContent = game.synopsis;
  $("#books-for").textContent = game.title;
  $("#detail-tags").innerHTML = [
    ["Genres", game.tags],
    ["Themes", game.themes],
    ["Tropes", game.tropes],
    ["Gameplay", game.gameplay ?? []], // shown for context only; not used to match books
  ]
    .filter(([, list]) => list.length)
    .map(([label, list]) => `<div><dt>${label}</dt><dd class="chips">${list.map((t) => `<span class="chip${label === "Gameplay" ? " is-gameplay" : ""}">${esc(t)}</span>`).join("")}</dd></div>`)
    .join("");

  $("#books-status").textContent = "Searching Open Library…";
  $("#book-row").innerHTML = Array.from({ length: 6 }, () => `<div class="book-card is-skeleton"><div class="book-card__cover"></div><div class="line"></div><div class="line short"></div></div>`).join("");
  detail.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const books = await recommendBooks(game);
    if (requestId !== state.requestId) return; // user picked another game meanwhile
    state.books = books;
    renderBooks(books);
    $("#books-status").textContent = books.length
      ? `Top ${books.length} matches, ranked by shared tags, rating, and how many people read or want to read them.`
      : "No matching books found. Try adding more subjects for this game in js/data/games.js.";
  } catch (err) {
    if (requestId !== state.requestId) return;
    console.error(err);
    $("#book-row").innerHTML = "";
    $("#books-status").textContent = "Couldn't reach Open Library. Check your connection and pick the game again.";
  }
}

function renderBooks(books) {
  const row = $("#book-row");
  row.innerHTML = books
    .map((b, i) => {
      // one tag per matched game term first, then unmatched tags; show the main 3
      const tags = [...(b.keyTags ?? b.matchedTags), ...b.tags.filter((t) => !b.matchedTags.includes(t))].slice(0, 3);
      return `
        <button class="book-card" type="button" data-book="${i}">
          <img class="book-card__cover" src="${coverUrl(b.coverId, "M")}" alt="" loading="lazy" />
          <span class="book-card__title">${esc(b.title)}</span>
          <span class="book-card__author">${esc(b.authors[0] ?? "Unknown author")}</span>
          <span class="chips">${tags.map((t) => `<span class="chip${b.matchedTags.includes(t) ? " is-match" : ""}">${esc(t)}</span>`).join("")}</span>
        </button>`;
    })
    .join("");
}

$("#book-row").addEventListener("click", (e) => {
  const card = e.target.closest("[data-book]");
  if (card) openBook(state.books[Number(card.dataset.book)]);
});

/* ---------- Book popup ---------- */

async function openBook(book) {
  state.openBook = book;
  const modal = $("#book-modal");
  $("#book-modal-cover").src = coverUrl(book.coverId, "L");
  $("#book-modal-cover").alt = `Cover of ${book.title}`;
  $("#book-modal-title").textContent = book.title;
  $("#book-modal-author").textContent = book.authors.length ? `by ${book.authors.slice(0, 3).join(", ")}` : "Unknown author";

  const stats = [
    ["Rating", book.ratingAverage ? `★ ${book.ratingAverage.toFixed(2)} (${fmt.format(book.ratingCount)})` : "No ratings yet"],
    ["Readers", fmt.format(book.readingLogCount)],
    ["Want to read", fmt.format(book.wantToReadCount)],
    ["First published", book.year ?? "—"],
    ["Pages", book.pages ?? "—"],
  ];
  $("#book-modal-stats").innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  $("#book-modal-tags").innerHTML = book.tags
    .map((t) => `<span class="chip${book.matchedTags?.includes(t) ? " is-match" : ""}">${esc(t)}</span>`)
    .join("");
  $("#book-modal-links").innerHTML = storeLinks(book)
    .map((l) => `<a class="btn btn-ghost" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`)
    .join("");
  updateSaveButton();

  const desc = $("#book-modal-desc");
  desc.innerHTML = `<p class="muted">Loading synopsis…</p>`;
  modal.showModal();

  try {
    const work = await getWork(book.key);
    if (state.openBook !== book) return;
    const text = cleanDescription(work.description);
    desc.innerHTML = text
      ? text.split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join("")
      : `<p class="muted">No synopsis on Open Library yet.</p>`;
  } catch {
    if (state.openBook === book) desc.innerHTML = `<p class="muted">Couldn't load the synopsis.</p>`;
  }
}

function isSaved(book) {
  return state.saved.some((b) => b.key === book?.key);
}

function updateSaveButton() {
  const saved = isSaved(state.openBook);
  const btn = $("#save-book-btn");
  btn.textContent = saved ? "♥ Saved" : "♡ Save to my list";
  btn.classList.toggle("is-saved", saved);
}

$("#save-book-btn").addEventListener("click", () => toggleSave(state.openBook));

async function toggleSave(book) {
  if (!state.user) {
    state.afterLogin = () => toggleSave(book);
    openLogin("Log in to save books to your list.");
    return;
  }
  if (isSaved(book)) {
    state.saved = await store.removeBook(book.key);
    toast(`Removed “${book.title}”`);
  } else {
    state.saved = await store.saveBook(book, state.game);
    toast(`Saved “${book.title}”`);
  }
  updateSaveButton();
  renderSavedList();
}

/* ---------- Account (demo) ---------- */

function openLogin(reason) {
  $("#login-reason").textContent = reason ?? "Demo login: any username works and nothing is sent anywhere.";
  $("#login-modal").showModal();
  $("#login-form").username.focus();
}

$("#login-form").addEventListener("submit", async (e) => {
  const username = e.target.username.value.trim();
  if (!username) return e.preventDefault();
  state.user = await store.login(username);
  state.saved = await store.getSavedBooks();
  e.target.reset();
  renderAccount();
  toast(`Welcome, ${state.user.username}!`);
  const next = state.afterLogin;
  state.afterLogin = null;
  next?.();
});

$("#login-modal").addEventListener("close", () => {
  if (!state.user) state.afterLogin = null;
});

$("#account-btn").addEventListener("click", async () => {
  if (!state.user) return openLogin();
  await store.logout();
  state.user = null;
  state.saved = [];
  renderAccount();
  toast("Logged out");
});

function renderAccount() {
  $("#account-btn").textContent = state.user ? `Log out (${state.user.username})` : "Log in";
  renderSavedList();
  updateSaveButton();
}

/* ---------- Saved list ---------- */

function renderSavedList() {
  $("#saved-count").textContent = state.saved.length;
  const list = $("#saved-list");
  if (!state.user) {
    list.innerHTML = `<p class="muted">Log in to keep a reading list.</p><button class="btn btn-primary" type="button" data-action="login">Log in</button>`;
    return;
  }
  if (!state.saved.length) {
    list.innerHTML = `<p class="muted">Nothing saved yet. Open a book and tap “Save to my list”.</p>`;
    return;
  }
  list.innerHTML = state.saved
    .map(
      (b, i) => `
      <div class="saved-item">
        <button class="saved-item__main" type="button" data-open="${i}">
          <img src="${coverUrl(b.coverId, "S")}" alt="" />
          <span>
            <strong>${esc(b.title)}</strong>
            <span class="muted">${esc(b.authors[0] ?? "")}${b.savedFrom ? ` · for ${esc(b.savedFrom)}` : ""}</span>
          </span>
        </button>
        <button class="icon-btn" type="button" data-remove="${i}" aria-label="Remove ${esc(b.title)}">×</button>
      </div>`
    )
    .join("");
}

$("#saved-list").addEventListener("click", async (e) => {
  const target = e.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "login") {
    $("#list-modal").close();
    openLogin();
  } else if (target.dataset.open) {
    $("#list-modal").close();
    openBook(state.saved[Number(target.dataset.open)]);
  } else if (target.dataset.remove) {
    const book = state.saved[Number(target.dataset.remove)];
    state.saved = await store.removeBook(book.key);
    renderSavedList();
    updateSaveButton();
  }
});

$("#my-list-btn").addEventListener("click", () => {
  renderSavedList();
  $("#list-modal").showModal();
});

/* ---------- Dialogs + toast ---------- */

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (e) => {
    // close on the × button or a click on the backdrop
    if (e.target.closest("[data-close]") || e.target === dialog) dialog.close();
  });
});

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

/* ---------- Start ---------- */

state.user = await store.getCurrentUser();
state.saved = await store.getSavedBooks();
renderAccount();

// Deep links: index.html#hollow-knight opens that game directly.
const linked = GAMES.findIndex((g) => g.id === location.hash.slice(1));
if (linked >= 0) carousel.select(linked);
