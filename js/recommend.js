// The recommendation engine:
//   1. Fetch candidate books for each of the game's Open Library subjects.
//   2. Clean each book's subjects into tags and keep its top N (the ones most related to the game).
//   3. A book must share at least one genre (the game's `tags`) with the game; themes, tropes and subjects add to its score.
//   4. Score = tag match + rating + most read + want to read (weights in config.js).

import { CONFIG } from "./config.js";
import { searchBySubject, englishTitle, englishCover } from "./api/openlibrary.js";

const STOPWORDS = new Set(["the", "and", "of", "a", "an", "in", "to", "for", "with", "on", "at", "by", "from"]);

// Words too broad to count as a match on their own ("fantasy" alone shouldn't match "dark fantasy").
const GENERIC_WORDS = new Set([
  "fiction", "fictional", "stories", "story", "tales", "tale", "novel", "novels", "books", "book", "literature",
  "general", "life", "world", "fantasy", "science", "dark", "epic", "historical", "history", "psychological",
  "psychology", "romance", "romantic", "adventure", "adventures", "action", "humor", "humorous", "contemporary",
  "american", "english", "british", "young", "adult", "adults", "new", "great", "social", "political", "modern",
  "classic", "classics", "series", "aspects", "relationships", "collections", "anthologies", "genre",
]);

/** "Fathers and sons--Fiction" → "fathers and sons", "Fiction, horror" → "horror", "Regression (Civilization)" → "regression" */
export function normalizeTag(raw) {
  return raw
    .toLowerCase()
    .replace(/--.*$/, "")
    .replace(/^fiction,\s*/, "")
    .replace(/,\s*general$/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9'&\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (tag) => tag.split(/[\s-]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));

// "zombie" ≈ "zombies", "dystopia" ≈ "dystopian", but not "myth" ≈ "mythology"
function sameWord(a, b) {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.startsWith(short) && long.length - short.length <= 3;
}

/**
 * How well a book tag matches a game term: 1 = strong, 0.5 = partial or broad, 0 = no match.
 * Broad terms like "fantasy" or "science fiction" top out at 0.5, so specific overlaps ("post-apocalyptic") rank higher.
 */
function tagSimilarity(bookTag, gameTerm) {
  const bookWords = words(bookTag);
  const termWords = words(gameTerm);
  if (!bookWords.length || !termWords.length) return 0;
  const strong = termWords.every((w) => GENERIC_WORDS.has(w)) ? 0.5 : 1;
  if (bookTag === gameTerm) return strong;
  // every word of the game term appears in the book tag: "fantasy epic" ⊇ "epic fantasy", "dystopian" ⊇ "dystopia"
  if (termWords.every((w) => bookWords.some((v) => sameWord(w, v)))) return strong;
  // otherwise, partial credit for sharing a specific (non-generic) word: "survival skills" ~ "survival horror"
  const specific = termWords.filter((w) => !GENERIC_WORDS.has(w));
  return specific.some((w) => bookWords.some((v) => sameWord(w, v))) ? 0.5 : 0;
}

/** Every term describing the game, normalized, with its kind. Only `tags` count as genres for the must-share-a-genre rule. */
export function gameTerms(game) {
  const terms = new Map();
  const add = (list, kind) => {
    for (const raw of list) {
      const term = normalizeTag(raw);
      if (term && !terms.has(term)) terms.set(term, kind);
    }
  };
  add(game.tags, "genre");
  add(game.subjects, "subject");
  add(game.themes, "theme");
  add(game.tropes, "trope");
  return [...terms].map(([term, kind]) => ({ term, kind }));
}

/** Clean a book's raw subjects, then rank them by relevance to the game and keep the top N. */
export function topTagsForBook(rawSubjects = [], terms) {
  const cleaned = [];
  for (const raw of rawSubjects) {
    if (CONFIG.noiseSubjects.some((re) => re.test(raw))) continue;
    const tag = normalizeTag(raw);
    if (!tag || tag.length > 40 || cleaned.some((t) => t.tag === tag)) continue;
    let best = { score: 0, term: null, kind: null };
    let isGenre = false; // tracked separately: a tag can match a genre and, more strongly, a theme
    for (const { term, kind } of terms) {
      const score = tagSimilarity(tag, term);
      if (score > best.score) best = { score, term, kind };
      if (score > 0 && kind === "genre") isGenre = true;
    }
    cleaned.push({ tag, ...best, isGenre, order: cleaned.length });
  }
  // Open Library doesn't rank subjects, so "top" = most related to the game first, then original order.
  cleaned.sort((a, b) => b.score - a.score || a.order - b.order);
  return cleaned.slice(0, CONFIG.topTagsPerBook);
}

function bayesianRating(avg = 0, count = 0) {
  const { average, weight } = CONFIG.ratingPrior;
  return (avg * count + average * weight) / (count + weight);
}

/** Run async tasks with a max concurrency. */
async function limitedAll(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]().catch((err) => {
        console.warn(err);
        return [];
      });
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/** Fetch, match, score, and return the top books for a game. */
export async function recommendBooks(game) {
  const tasks = game.subjects.flatMap((subject) =>
    CONFIG.sorts.map((sort) => () => searchBySubject(subject, sort))
  );
  const batches = await limitedAll(tasks, CONFIG.maxParallelRequests);
  if (batches.every((b) => b.length === 0)) throw new Error("No results from Open Library");

  // De-duplicate by work key.
  const docs = new Map();
  for (const doc of batches.flat()) {
    if (!docs.has(doc.key)) docs.set(doc.key, doc);
  }

  const terms = gameTerms(game);
  const candidates = [];
  for (const doc of docs.values()) {
    if (CONFIG.requireCover && !doc.cover_i) continue;
    if ((doc.subject ?? []).some((s) => CONFIG.excludedSubjects.some((re) => re.test(s)))) continue;

    const topTags = topTagsForBook(doc.subject, terms);
    const matches = topTags.filter((t) => t.score > 0);
    if (!matches.some((t) => t.isGenre)) continue; // must share a genre
    if (matches.length < CONFIG.minTagMatches) continue;

    // Count each game term once, so "epic fantasy" + "fantasy epic" + "fiction fantasy epic" isn't 3 matches.
    const byTerm = new Map();
    for (const t of matches) byTerm.set(t.term, Math.max(byTerm.get(t.term) ?? 0, t.score));
    const overlap = [...byTerm.values()].reduce((sum, s) => sum + s, 0);

    candidates.push({
      key: doc.key,
      title: englishTitle(doc),
      authors: doc.author_name ?? [],
      year: doc.first_publish_year ?? null,
      pages: doc.number_of_pages_median ?? null,
      coverId: englishCover(doc),
      ratingAverage: doc.ratings_average ?? null,
      ratingCount: doc.ratings_count ?? 0,
      readingLogCount: doc.readinglog_count ?? 0,
      wantToReadCount: doc.want_to_read_count ?? 0,
      alreadyReadCount: doc.already_read_count ?? 0,
      tags: topTags.map((t) => t.tag),
      matchedTags: matches.map((t) => t.tag),
      matchedTerms: [...byTerm.keys()],
      // one tag per matched game term ("dystopian" and "dystopias" both match "dystopia"), for the card chips
      keyTags: matches.filter((t, i) => matches.findIndex((m) => m.term === t.term) === i).map((t) => t.tag),
      tagScore: Math.min(1, overlap / 3), // 3 distinct strong matches = full marks
    });
  }

  // Normalize popularity against the best book in this pool (log scale so mega-hits don't flatten everyone).
  const maxLog = Math.max(1, ...candidates.map((b) => b.readingLogCount));
  const maxWant = Math.max(1, ...candidates.map((b) => b.wantToReadCount));
  const w = CONFIG.weights;

  for (const b of candidates) {
    const ratingScore = (bayesianRating(b.ratingAverage ?? 0, b.ratingCount) - 1) / 4;
    const readScore = Math.log1p(b.readingLogCount) / Math.log1p(maxLog);
    const wantScore = Math.log1p(b.wantToReadCount) / Math.log1p(maxWant);
    b.score = w.tags * b.tagScore + w.rating * ratingScore + w.readingLog * readScore + w.wantToRead * wantScore;
    b.scoreBreakdown = { tagScore: b.tagScore, ratingScore, readScore, wantScore };
  }

  // Best first, skipping duplicate titles and capping books per author for variety.
  const picked = [];
  const perAuthor = new Map();
  const seenTitles = new Set();
  for (const b of candidates.sort((a, b) => b.score - a.score)) {
    const author = b.authors[0] ?? "";
    const title = b.title.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") // "Shōgun" = "Shogun"
      .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (seenTitles.has(title) || (perAuthor.get(author) ?? 0) >= CONFIG.maxBooksPerAuthor) continue;
    seenTitles.add(title);
    perAuthor.set(author, (perAuthor.get(author) ?? 0) + 1);
    picked.push(b);
    if (picked.length === CONFIG.booksPerGame) break;
  }
  return picked;
}
