# Générateur d'équipes

Application React/Vite (Tailwind CSS, sans lib de composants) pour répartir des
joueur·euse·s de volley en équipes équilibrées (taille, genre, niveau). Pensée
mobile-first : l'organisateur saisit sa liste depuis son téléphone pendant la
séance, mais reste utilisable confortablement sur desktop.

## Utilisation

1. `npm install`
2. `npm run dev`

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run lint` — vérifie le code avec ESLint
- `npm run test` — lance les tests (Vitest + Testing Library)
- `npm run deploy` — build puis publie `dist/` sur GitHub Pages

## Parcours

1. **Configuration** (`Setup`) — nombre de joueur·euse·s par équipe.
2. **Liste des joueur·euse·s** (`PlayersList`) — tableau compact (nom, niveau,
   genre) trié et groupé par niveau. Un tap sur une ligne ouvre un drawer
   d'édition. Deux actions flottantes : un bouton "+" pour ajouter
   un·e joueur·euse, et « Coller une liste » pour importer un texte en masse
   (`Nom, niveau, genre`, une ligne par personne).
3. **Génération** (`GenerateTeams`) — équipes générées automatiquement, notées
   sur 4 points pour l'équilibre des niveaux et la parité de genre. On peut
   relancer la génération ou échanger deux joueur·euse·s manuellement entre
   équipes.
4. **Export** (`ExportTeams`) — liste finale par équipe, copiable dans le
   presse-papiers.

## Structure

- `src/pages/` — un composant par étape du parcours ci-dessus.
- `src/components/` — composants partagés entre pages (résumés d'équipe/de
  niveaux) et `src/components/ui/` : le petit design system maison (boutons,
  drawer, toasts, etc.) — pas de librairie de composants externe.
- `src/lib/` — logique pure, sans dépendance React, testée unitairement :
  - `teamGenerator.js` : génère et note les équipes (équilibre des niveaux,
    parité de genre).
  - `playerImport.js` : parse le texte collé en masse en joueur·euse·s.
  - `teamColors.js`, `layout.js` : petits utilitaires (couleurs par équipe,
    positionnement des éléments flottants).
- Les fichiers `*.test.js`/`*.test.jsx` sont colocalisés avec le code qu'ils
  testent.
