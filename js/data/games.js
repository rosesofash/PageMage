// Hand-curated game data. This is the "game → story" bridge that Open Library can't give us.
//
//   tags     – genres / story categories. A book must match at least one of these to be recommended.
//   themes   – what the story is *about*
//   tropes   – recurring story devices
//   subjects – exact Open Library subject names used to fetch candidate books.
//              Every subject here was checked to return results on openlibrary.org.
//   wiki     – English Wikipedia page title, used to load the game's cover art.
//   cover    – optional image path/URL that overrides the Wikipedia cover (e.g. "img/undertale.png").
//   accent   – colour used for this game's glow and highlights.
//   gameplay – how it plays (shown on the game page, NOT used for matching books).
//   mentions – how many times it came up in our research board ("times mentioned").
//   pick     – optional: whose personal pick it is (shown next to the year).
//
// Book matching compares each book's tags against tags + themes + tropes + subjects.

export const GAMES = [
  {
    id: "elden-ring",
    title: "Elden Ring",
    year: 2022,
    studio: "FromSoftware",
    wiki: "Elden_Ring",
    accent: "#d4af37",
    synopsis:
      "The Elden Ring has been shattered, and the demigods who claimed its shards have gone mad with power and waged war across the Lands Between. You are one of the Tarnished, exiles called back from death to reclaim the Ring and become Elden Lord. The story is pieced together from ruins, item descriptions, and the broken, desperate people you meet along the way.",
    tags: ["dark fantasy", "epic fantasy", "high fantasy", "mythology"],
    themes: ["gods", "decay", "ambition", "fate", "death and rebirth", "power", "hubris"],
    tropes: ["fallen kingdom", "ancient curse", "knights", "cryptic lore", "exile", "demigods", "dragons"],
    subjects: ["dark fantasy", "epic fantasy", "knights and knighthood", "gods", "dragons"],
  },
  {
    id: "the-last-of-us",
    title: "The Last of Us",
    year: 2013,
    studio: "Naughty Dog",
    wiki: "The_Last_of_Us_(video_game)",
    mentions: 1,
    accent: "#7fa35b",
    synopsis:
      "Twenty years after a fungal pandemic collapsed civilization, hardened smuggler Joel is hired to escort Ellie, a fourteen-year-old who may hold the key to a cure, across a ruined United States. What starts as a job becomes a fierce, fragile bond between two people who have lost almost everything.",
    tags: ["post-apocalyptic", "dystopia", "survival horror", "horror"],
    themes: ["grief", "loss", "revenge", "survival", "found family", "morality", "love and loss", "humanity", "fathers and daughters"],
    tropes: ["pandemic", "epidemics", "zombies", "zombie apocalypse", "road trip", "reluctant guardian", "morally grey hero", "end of the world"],
    gameplay: ["third-person", "survival horror", "action adventure"],
    subjects: ["post-apocalyptic", "epidemics", "zombies", "survival", "dystopia"],
  },
  {
    id: "omori",
    title: "Omori",
    year: 2020,
    studio: "OMOCAT",
    wiki: "Omori_(video_game)",
    accent: "#c7a6ff",
    synopsis:
      "In a bright dreamworld called Headspace, Omori and his friends go on colourful adventures. In the waking world, Sunny hasn't left his house in years, haunted by something that happened to his sister. As the days before his move run out, he has to face the truth he's buried, and the friends he left behind.",
    tags: ["psychological horror", "psychological fiction", "coming of age", "surreal"],
    themes: ["grief", "guilt", "depression", "friendship", "trauma", "memory", "forgiveness", "loss"],
    tropes: ["dream world", "dreams", "unreliable narrator", "hidden truth", "childhood friends", "brothers and sisters"],
    subjects: ["psychological fiction", "coming of age", "grief", "guilt", "dreams"],
  },
  {
    id: "expedition-33",
    title: "Clair Obscur: Expedition 33",
    year: 2025,
    studio: "Sandfall Interactive",
    wiki: "Clair_Obscur:_Expedition_33",
    accent: "#e05a47",
    synopsis:
      "Once a year, the Paintress wakes and paints a number on her monolith, and everyone of that age turns to smoke and vanishes. With the number about to reach 33, Gustave and his companions leave the city of Lumière as Expedition 33, the latest in a long line of doomed expeditions sent to destroy her before she paints again.",
    tags: ["dark fantasy", "magic realism", "surreal", "epic fantasy"],
    themes: ["grief", "loss", "familial love", "families", "moving on", "escapism", "death", "sacrifice", "morality"],
    tropes: ["doomed expedition", "countdown to death", "painted world", "artists", "found family", "quests (expeditions)"],
    subjects: ["dark fantasy", "magic realism", "grief", "death", "quests (expeditions)"],
    gameplay: ["turn-based", "third-person", "JRPG"],
  },
  {
    id: "half-life",
    title: "Half-Life 1 & 2",
    year: 2004,
    studio: "Valve",
    wiki: "Half-Life_2",
    accent: "#ff7a00",
    mentions: 1,
    synopsis:
      "Theoretical physicist Gordon Freeman survives an experiment gone wrong at the Black Mesa Research Facility, one that tears open a rift to an alien world. Twenty years later, Earth is ruled by the alien Combine, and Gordon is pulled out of stasis by the mysterious G-Man to join the resistance in City 17.",
    tags: ["science fiction", "post-apocalyptic", "dystopia", "alien invasion"],
    themes: ["perseverance", "hope", "resistance", "ambiguity", "science ethics", "survival"],
    tropes: ["silent protagonist", "scientist hero", "experiment gone wrong", "occupied earth", "extraterrestrial beings", "life on other planets", "mysterious handler"],
    subjects: ["extraterrestrial beings", "dystopias", "post-apocalyptic", "alien invasion", "resistance"],
    gameplay: ["first-person", "shooter", "puzzle platformer"],
  },
  {
    id: "titanfall-2",
    title: "Titanfall 2",
    year: 2016,
    studio: "Respawn Entertainment",
    wiki: "Titanfall_2",
    accent: "#4fb3bf",
    mentions: 1,
    synopsis:
      "When his mentor is killed on the battlefield, rifleman Jack Cooper inherits his Titan, BT-7274: a giant robot with a dry sense of humor and a mission to finish. Stranded behind enemy lines, the two have to learn to trust each other to stop a weapon that could wipe out the Militia.",
    tags: ["military science fiction", "space warfare", "science fiction", "space opera"],
    themes: ["trust", "friendship", "filling someone's shoes", "reaching your potential", "courage", "loyalty", "overcoming odds"],
    tropes: ["robots", "artificial intelligence", "soldiers", "mentor's death", "rookie hero", "behind enemy lines"],
    subjects: ["military science fiction", "space warfare", "robots", "soldiers", "artificial intelligence"],
    gameplay: ["first-person", "shooter", "movement shooter"],
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    year: 2020,
    studio: "CD Projekt Red",
    wiki: "Cyberpunk_2077",
    accent: "#f3e600",
    mentions: 2,
    synopsis:
      "In Night City, a megacity run by corporations, the mercenary V takes on a heist that goes wrong. V is left with a prototype biochip carrying the digital ghost of rebel rockerboy Johnny Silverhand, and it's slowly overwriting V's mind. With little time left, V has to find a way to survive, or decide what's worth doing with the time that remains.",
    tags: ["cyberpunk", "dystopia", "science fiction", "noir"],
    themes: ["sacrifice", "morality", "corporate domination", "loss of identity", "identity", "nihilism", "accepting fate", "mortality", "living life to the fullest"],
    tropes: ["corporations", "megacity", "virtual reality", "artificial intelligence", "cybernetics", "mercenary", "heist gone wrong"],
    subjects: ["cyberpunk", "virtual reality", "dystopias", "artificial intelligence", "corporations"],
    gameplay: ["first-person", "action RPG", "open world"],
  },
  {
    id: "limbus-company",
    title: "Limbus Company",
    year: 2023,
    studio: "Project Moon",
    wiki: "Limbus_Company",
    accent: "#b8323b",
    mentions: 1,
    synopsis:
      "In a dystopian City run by ruthless corporations, Dante, a manager with a clock for a head, leads twelve Sinners into the ruins of a fallen company to collect the Golden Boughs. Each Sinner is drawn from a classic novel, from Faust and Don Quixote to Moby-Dick, and each chapter digs into one Sinner's past, guilt, and trauma.",
    tags: ["dystopia", "horror", "psychological horror", "psychological fiction"],
    themes: ["grief", "loss", "trauma", "sin", "guilt", "morality", "redemption", "regret"],
    tropes: ["literary characters", "sinners", "corporations", "dystopian city", "time manipulation", "found family", "obsession"],
    subjects: ["dystopias", "horror", "psychological fiction", "guilt", "sin"],
    gameplay: ["turn-based strategy", "visual novel", "story-driven gacha"],
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    year: 2023,
    studio: "Larian Studios",
    wiki: "Baldur's_Gate_3",
    accent: "#a259ff",
    mentions: 3,
    synopsis:
      "Mind flayers abduct you and implant a parasitic tadpole that will eventually turn you into one of them. You escape with a band of infected strangers, including a vampire spawn, a warlock, and a disgraced cleric, and search for a cure while a cult of the \"Absolute\" gathers power across the Sword Coast. Every choice and every companion can change the story.",
    tags: ["high fantasy", "dark fantasy", "sword and sorcery", "dungeons & dragons"],
    themes: ["morality", "cost of power", "power", "freedom", "companionship", "resisting tyranny", "breaking cycles", "survival", "redemption", "revenge", "sacrifice"],
    tropes: ["party of misfits", "found family", "mind control", "parasite", "vampires", "demons", "gods", "cults", "dragons"],
    subjects: ["forgotten realms", "dungeons & dragons", "dark fantasy", "vampires", "demons"],
    gameplay: ["turn-based combat", "RPG", "party-based"],
  },
  {
    id: "life-is-strange",
    title: "Life Is Strange",
    year: 2015,
    studio: "Dontnod Entertainment",
    wiki: "Life_Is_Strange_(video_game)",
    accent: "#3fa7d6",
    mentions: 1,
    synopsis:
      "Photography student Max Caulfield discovers she can rewind time, just in time to save her childhood best friend, Chloe. As the two dig into the disappearance of a fellow student in the small town of Arcadia Bay, Max's visions of a coming storm suggest that every change she makes has a cost.",
    tags: ["coming of age", "mystery", "supernatural", "young adult fiction"],
    themes: ["friendship", "choice and consequence", "grief", "identity", "lgbtq", "loss", "first love"],
    tropes: ["time travel", "butterfly effect", "small town", "missing persons", "best friends", "coming storm", "photography"],
    subjects: ["time travel", "coming of age", "missing persons", "best friends", "small town"],
    gameplay: ["episodic", "choice-based", "narrative adventure"],
  },
  {
    id: "sally-face",
    title: "Sally Face",
    year: 2016,
    studio: "Portable Moose",
    wiki: "Sally_Face",
    cover: "img/sally-face.png",
    accent: "#7ad1c4",
    mentions: 1,
    synopsis:
      "Sal Fisher, a boy who wears a prosthetic mask after a childhood accident, moves into a run-down apartment complex where a string of grisly murders once took place. With his friends Larry, Ashley and Todd, and his ability to talk to ghosts, he uncovers a cult whose plans reach far beyond the building.",
    tags: ["horror", "mystery", "supernatural", "psychological horror"],
    themes: ["friendship", "trauma", "grief", "loss", "lgbtq", "outsiders"],
    tropes: ["ghost stories", "ghosts", "haunted houses", "cults", "murder", "apartment building", "small town"],
    subjects: ["ghost stories", "haunted houses", "cults", "murder", "horror"],
    gameplay: ["point-and-click", "episodic", "adventure"],
  },
  {
    id: "far-cry-5",
    title: "Far Cry 5",
    year: 2018,
    studio: "Ubisoft Montreal",
    wiki: "Far_Cry_5",
    accent: "#d9a441",
    synopsis:
      "In rural Hope County, Montana, a rookie sheriff's deputy is sent to arrest Joseph Seed, the charismatic leader of the doomsday cult Project at Eden's Gate. The arrest goes wrong, the cult seizes the county, and the deputy has to rally the locals against the Seed family before Joseph's prophecy of \"the Collapse\" comes true.",
    tags: ["thrillers", "horror", "dystopia"],
    themes: ["faith", "fanaticism", "freedom", "family", "manipulation", "end of the world", "religion", "resistance"],
    tropes: ["cults", "doomsday prophecy", "cult leader", "rural america", "montana", "brainwashing", "small town", "siblings"],
    subjects: ["cults", "religious fanaticism", "end of the world", "montana", "thrillers"],
    gameplay: ["first-person", "shooter", "open world"],
  },
  {
    id: "signalis",
    title: "Signalis",
    year: 2022,
    studio: "rose-engine",
    wiki: "Signalis",
    accent: "#c4262e",
    synopsis:
      "Elster, an android Replika, wakes in her crashed ship on a frozen planet with one goal: find Ariane, the woman she promised to stay with. Her search leads into a sealed mining facility of a totalitarian regime, where memories, dreams and time itself start to come apart, and cosmic horror waits underneath.",
    tags: ["survival horror", "cosmic horror", "dystopia", "horror"],
    themes: ["love", "memory", "grief", "loss", "identity", "promises", "totalitarianism", "lgbtq"],
    tropes: ["androids", "lovers separated", "unreliable narrator", "dream world", "lovecraftian", "time loop", "the king in yellow", "lesbians"],
    subjects: ["androids", "totalitarianism", "lovecraftian", "dystopias", "lesbians"],
    gameplay: ["top-down", "survival horror", "puzzle"],
  },
];
