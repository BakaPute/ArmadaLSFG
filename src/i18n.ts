export type Language =
  "fr"
  | "en";


const preferredLocale = (
  navigator.languages?.[0]
  ?? navigator.language
  ?? "en"
).toLowerCase();


export const language: Language =
  preferredLocale.startsWith("fr")
    ? "fr"
    : "en";


export const t = (
  fr: string,
  en: string,
) => language === "fr"
  ? fr
  : en;


export const translateRefreshMessage = (
  message: string,
) => {
  if (language === "fr") {
    return message;
  }

  const exact: Record<string, string> = {
    "Démarrage de l'actualisation...":
      "Starting refresh...",
    "Détection LSFG-VK...":
      "Detecting LSFG-VK...",
    "Analyse des bibliothèques Steam...":
      "Scanning Steam libraries...",
    "Enregistrement du cache...":
      "Saving cache...",
    "Actualisation terminée.":
      "Refresh complete.",
    "Échec de l'actualisation.":
      "Refresh failed.",
  };

  if (message in exact) {
    return exact[message];
  }

  const withGame = message.match(
    /^Analyse Steam : (.*) \((\d+)\/(\d+)\)$/
  );

  if (withGame) {
    return (
      `Steam scan: ${withGame[1]} `
      + `(${withGame[2]}/${withGame[3]})`
    );
  }

  const withoutGame = message.match(
    /^Analyse Steam \((\d+)\/(\d+)\)$/
  );

  if (withoutGame) {
    return (
      "Steam scan "
      + `(${withoutGame[1]}/${withoutGame[2]})`
    );
  }

  return message;
};


export const translateError = (
  message: string,
) => {
  if (language === "fr") {
    return message;
  }

  const replacements: Array<
    [RegExp, string]
  > = [
    [
      /Jeu Steam introuvable\./g,
      "Steam game not found.",
    ],
    [
      /Exécutable invalide pour ce jeu\./g,
      "Invalid executable for this game.",
    ],
    [
      /Impossible d'associer ce profil à un jeu Steam installé\./g,
      "Unable to match this profile to an installed Steam game.",
    ],
    [
      /Multiplicateur invalide\. Valeurs autorisées : 2, 3, 4\./g,
      "Invalid multiplier. Allowed values: 2, 3, 4.",
    ],
    [
      /Flow Scale invalide\. Valeurs autorisées : 0\.25, 0\.5, 0\.75, 1\.0\./g,
      "Invalid Flow Scale. Allowed values: 0.25, 0.5, 0.75, 1.0.",
    ],
    [
      /Profil inconnu :/g,
      "Unknown profile:",
    ],
    [
      /Exécutable personnalisé introuvable\./g,
      "Custom executable not found.",
    ],
    [
      /Chemin personnalisé invalide\./g,
      "Invalid custom path.",
    ],
  ];

  return replacements.reduce(
    (result, [pattern, replacement]) =>
      result.replace(
        pattern,
        replacement,
      ),
    message,
  );
};
