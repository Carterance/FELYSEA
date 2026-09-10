export type EveningCard = {
  id: string;
  label: string;
  description: string;
};

export const EVENING_CARDS: EveningCard[] = [
  { id: "romance", label: "❤️ Romance", description: "Créer une ambiance romantique, à deux." },
  { id: "surprise", label: "✨ Surprise", description: "L'un des deux choisit quelque chose pour l'autre." },
  { id: "decouverte", label: "💫 Découverte", description: "Essayer quelque chose de nouveau pour le couple." },
  { id: "douceur", label: "🌙 Douceur", description: "Une soirée très calme et tendre." },
  { id: "jeu", label: "🎲 Jeu", description: "Créer une ambiance ludique." },
  { id: "spontaneite", label: "🍃 Spontanéité", description: "Ne rien planifier à l'avance." },
];

/**
 * Propose 3 cartes cohérentes avec le plan de la soirée, sans jamais répéter
 * les cartes jouées récemment si une alternative existe.
 */
export function suggestCards(
  plan: { mood: string },
  recentCardIds: string[] = []
): EveningCard[] {
  const priority: Record<string, string[]> = {
    romance: ["romance", "douceur", "surprise"],
    douceur: ["douceur", "romance", "spontaneite"],
    jeu: ["jeu", "surprise", "spontaneite"],
    aventure: ["decouverte", "surprise", "jeu"],
    nouveaute: ["decouverte", "surprise", "jeu"],
    intensite: ["surprise", "decouverte", "romance"],
  };

  const preferredIds = priority[plan.mood] ?? ["romance", "douceur", "jeu"];
  const allIds = EVENING_CARDS.map((c) => c.id);
  const rankedPool = [...preferredIds, ...allIds.filter((id) => !preferredIds.includes(id))];
  const fresh = rankedPool.filter((id) => !recentCardIds.includes(id));
  const rest = rankedPool.filter((id) => recentCardIds.includes(id));
  const finalIds = [...fresh, ...rest].slice(0, 3);

  return finalIds
    .map((id) => EVENING_CARDS.find((c) => c.id === id))
    .filter((c): c is EveningCard => Boolean(c));
}

const INTENSITY_SCALE = ["soft", "sensual", "intense", "very_intense"] as const;
type Intensity = (typeof INTENSITY_SCALE)[number];

const INTENSITY_LABELS: Record<Intensity, string> = {
  soft: "douce",
  sensual: "sensuelle",
  intense: "intense",
  very_intense: "très intense",
};

const MOOD_LABELS: Record<string, string> = {
  douceur: "une ambiance douce et tendre",
  romance: "une ambiance romantique",
  jeu: "une ambiance joueuse",
  aventure: "une pointe d'aventure",
  nouveaute: "une touche de nouveauté",
  intensite: "une intensité assumée",
};

export type Answer = {
  moods: string[];
  energyLevel: number;
  noveltySeek: number;
  intensity: string;
  preferences: string[];
  optOut: boolean;
};

export type EveningPlanDraft = {
  mood: string;
  intensity: string;
  ambianceLabel: string;
  musicSuggestion: string;
  lightingSuggestion: string;
  ritual: string;
  ideas: string[];
};

const LIGHTING = [
  "Bougies et lumière tamisée",
  "Guirlande lumineuse chaude, lumière principale éteinte",
  "Une seule lampe d'ambiance, le reste dans la pénombre",
];

const MUSIC = {
  douce: "Playlist acoustique et voix feutrées",
  joueuse: "Playlist pop rythmée, énergique sans être bruyante",
  intense: "Playlist électro-sensuelle, basses discrètes",
};

const RITUALS = [
  "Commencez par 10 minutes sans téléphone, juste à vous parler",
  "Préparez ensemble une boisson ou un petit plat avant de commencer",
  "Prenez chacun 2 minutes pour dire une chose que vous appréciez chez l'autre",
];

/**
 * Cherche le meilleur compromis entre les deux réponses plutôt que de les
 * additionner. Si l'un des deux a activé "optOut", on ne génère pas de
 * soirée à connotation intime — on retombe sur un mood "douceur" pur.
 */
export function computeEveningPlan(
  a: Answer,
  b: Answer,
  recentMoods: string[] = []
): EveningPlanDraft {
  if (a.optOut || b.optOut) {
    return {
      mood: "douceur",
      intensity: "soft",
      ambianceLabel: "Un moment calme, sans pression",
      musicSuggestion: MUSIC.douce,
      lightingSuggestion: LIGHTING[0],
      ritual: "Installez-vous confortablement, sans autre objectif que d'être ensemble.",
      ideas: [
        "Un film ou une série que vous aimez tous les deux",
        "Un massage sans attente, juste pour le plaisir de l'autre",
        "Discuter de vos semaines, vraiment, sans distraction",
      ],
    };
  }

  // Intensité : on prend le niveau le plus BAS des deux (jamais le plus haut) —
  // le confort du partenaire le moins partant prime toujours.
  const intensityIndex = Math.min(
    INTENSITY_SCALE.indexOf(a.intensity as Intensity),
    INTENSITY_SCALE.indexOf(b.intensity as Intensity)
  );
  const intensity = INTENSITY_SCALE[Math.max(intensityIndex, 0)];

  // Nouveauté : moyenne arrondie
  const novelty = Math.round((a.noveltySeek + b.noveltySeek) / 2);

  // Moods : intersection d'abord, sinon on prend un mood de chaque
  const sharedMoods = a.moods.filter((m) => b.moods.includes(m));
  let moodPool = sharedMoods.length > 0 ? sharedMoods : [...new Set([...a.moods, ...b.moods])];

  // Anti-répétition : on évite de reproposer le mood dominant des 2 dernières semaines si une alternative existe
  const fresh = moodPool.filter((m) => !recentMoods.includes(m));
  if (fresh.length > 0) moodPool = fresh;

  const primaryMood = moodPool[0] ?? "romance";
  const secondaryMood = moodPool[1];

  const ambianceLabel = [MOOD_LABELS[primaryMood], secondaryMood && MOOD_LABELS[secondaryMood]]
    .filter(Boolean)
    .join(" avec ");

  const musicKey = intensity === "soft" ? "douce" : intensity === "sensual" ? "joueuse" : "intense";

  const ideas = buildIdeas(primaryMood, novelty);

  return {
    mood: primaryMood,
    intensity,
    ambianceLabel: ambianceLabel || `une ambiance ${INTENSITY_LABELS[intensity]}`,
    musicSuggestion: MUSIC[musicKey],
    lightingSuggestion: LIGHTING[novelty >= 4 ? 2 : novelty >= 2 ? 1 : 0],
    ritual: RITUALS[(primaryMood.length + intensity.length) % RITUALS.length],
    ideas,
  };
}

function buildIdeas(mood: string, novelty: number): string[] {
  const base: Record<string, string[]> = {
    douceur: ["Un bain ou une douche partagée, sans se presser", "Un massage lent, à tour de rôle"],
    romance: ["Une lettre ou un message que vous vous lisez à voix haute", "Un dîner aux chandelles, même simple"],
    jeu: ["Un jeu de cartes ou de dés à connotation coquine", "Un défi ou un pari ludique entre vous deux"],
    aventure: ["Changer de pièce ou de décor pour la soirée", "Essayer une position ou un jeu que vous n'avez jamais testé"],
    nouveaute: ["Introduire un nouvel accessoire ou une nouvelle playlist", "Essayer un rituel que vous n'avez encore jamais fait ensemble"],
    intensite: ["Prolonger les préliminaires plus longtemps que d'habitude", "Se concentrer entièrement sur le plaisir de l'autre, chacun son tour"],
  };
  const ideas = base[mood] ?? base.romance;
  if (novelty >= 4) {
    return [...ideas, "Proposer une surprise que vous gardez secrète jusqu'au dernier moment"];
  }
  return ideas;
}
