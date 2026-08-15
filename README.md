# Générateur d'équipes

Application React/Vite (Material UI) pour répartir des joueur·euse·s de volley
en équipes équilibrées (taille, genre, niveau). Pensée mobile-first :
l'organisateur saisit sa liste depuis son téléphone pendant la séance, mais
reste utilisable confortablement sur desktop. Thème clair/sombre au choix
(bouton dans l'en-tête).

Connexion par e-mail + code OTP, et listes de joueur·euse·s sauvegardées
(niveau/genre compris) via le backend PHP+MySQL de `server/` (voir plus bas).

## Utilisation

1. `npm install`
2. Démarrer le backend local en parallèle — voir `CLAUDE.md` pour la marche à
   suivre exacte (conteneurs Docker `tg-mysql`/`tg-php` réutilisables,
   `server/config.php` local) et `server/README.md` pour le détail du backend
   lui-même (endpoints, contraintes PHP 7.4, déploiement).
3. `npm run dev` — le proxy Vite (`vite.config.js`) redirige `/api/*` vers ce
   serveur local.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run lint` — vérifie le code avec ESLint
- `npm run test` — lance les tests (Vitest + Testing Library)
- `npm run deploy` — build puis publie `dist/` sur GitHub Pages (à retirer
  une fois le frontend basculé sur le même hébergement que le backend, pour
  que le cookie de session fonctionne en same-origin — pas encore fait)

## Parcours

La connexion est **optionnelle** : l'app est utilisable de bout en bout sans
compte (session ponctuelle, rien n'est sauvegardé). Se connecter (bouton dans
l'en-tête, e-mail + code OTP reçu par mail, pas de mot de passe) débloque en
plus la sauvegarde de listes de joueur·euse·s d'une séance à l'autre.

1. **Accueil** (`Home`, uniquement si connecté·e) — tableau de bord avec deux
   entrées : démarrer une session ponctuelle, ou piocher dans une liste
   sauvegardée (une grille de cartes) — l'ouvrir affiche d'abord un point
   « qui est là ce soir ? » (`AttendancePicker`) pour cocher les présent·e·s
   avant de continuer. Un bouton « Gérer mes listes » mène à la page
   dédiée ci-dessous. Sans compte (ou en session ponctuelle), on tombe
   directement à l'étape Configuration.
2. **Configuration** (`Setup`) — nombre de joueur·euse·s par équipe ; c'est un
   réglage de session, pas un attribut sauvegardé sur la liste.
3. **Liste des joueur·euse·s** (`PlayersList`) — tableau compact (nom, niveau,
   genre) trié et groupé par niveau, avec le total de joueur·euse·s en pied de
   tableau et une case « présent·e ce soir » par ligne (les absent·e·s ne sont
   pas envoyé·e·s à la génération, mais restent sur le roster de la liste). Un
   tap sur une ligne ouvre un drawer d'édition. Actions flottantes : un bouton
   "+" pour ajouter un·e joueur·euse — avec une recherche dans le répertoire
   personnel pour faire venir quelqu'un·e qui n'est pas un·e habitué·e de
   cette liste (badge « invité·e », jamais sauvegardé) — et « Coller une
   liste » pour importer un texte en masse (`Nom, niveau, genre`, une ligne
   par personne), ou pour un·e utilisateur·rice connecté·e, piocher depuis une
   autre liste enregistrée. En quittant vers la génération, si le roster a
   changé, un drawer propose d'enregistrer ces changements sur la liste avant
   de continuer.
4. **Génération** (`GenerateTeams`) — équipes générées automatiquement, notées
   sur 4 points pour l'équilibre des niveaux et la parité de genre. On peut
   relancer la génération ou échanger deux joueur·euse·s manuellement entre
   équipes.
5. **Export** (`ExportTeams`) — liste finale par équipe, copiable dans le
   presse-papiers.

Un bloc « Comment ça marche ? » (`HowItWorks`) explique le principe aux
personnes non connectées.

### Gérer mes listes

Page dédiée (`ListsHome` + `ListDetail`, accessible depuis l'accueil), séparée
du parcours de génération ci-dessus :

- `ListsHome` : grille des listes sauvegardées, création et suppression.
- `ListDetail` : renommer une liste et éditer son roster (ajout à la main,
  recherche dans le répertoire personnel, import en masse) — chaque
  changement est persisté immédiatement, sans étape de validation
  différée.

## Structure

- `src/pages/` — un composant par étape du parcours ci-dessus, plus `Home`
  (tableau de bord) et `ListsHome`/`ListDetail` (gestion des listes).
- `src/components/` — composants partagés entre pages (`AuthPanel`,
  `HowItWorks`, `AttendancePicker`, panneaux d'import, résumés d'équipe/de
  niveaux) et `src/components/ui/` : quelques primitives maison (drawer,
  toasts, stepper numérique, sélecteur de genre, barre d'action mobile, etc.)
  qui viennent compléter Material UI plutôt que le remplacer — le design
  system du projet est MUI (thème dans `src/lib/theme.js` et
  `src/lib/muiTheme.js`).
- `src/lib/` — logique pure, sans dépendance React, testée unitairement :
  - `teamGenerator.js` : génère et note les équipes (équilibre des niveaux,
    parité de genre).
  - `playerImport.js` : parse le texte collé en masse en joueur·euse·s.
  - `listSync.js` : diffe le roster chargé depuis le serveur contre l'état
    local (`computeListDiff`) et applique les changements via l'API
    (`applyListDiff`) — les joueur·euse·s « invité·e » (`isAdHoc`) en sont
    toujours exclus.
  - `api.js` : petit client fetch (`credentials: 'include'`, une fonction
    par endpoint du backend).
  - `theme.js`/`muiTheme.js` : préférence de thème clair/sombre et
    construction du thème MUI correspondant.
  - `teamColors.js`, `colorRamp.js`, `layout.js` : petits utilitaires
    (couleurs par équipe, dégradés, positionnement des éléments flottants).
  - `useIsDesktop.js`, `useThemePreference.js` : hooks React ponctuels.
- Les fichiers `*.test.js`/`*.test.jsx` sont colocalisés avec le code qu'ils
  testent.

## Backend

`server/` contient le backend PHP (auth email + OTP, persistance des listes
et joueur·euse·s) consommé par ce frontend. Voir `server/README.md` pour son
déploiement et son développement local — stack, contraintes et endpoints
totalement séparés de ceux du frontend.
