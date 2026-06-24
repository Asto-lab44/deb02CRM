# Récap des modifications — CRM/ERP web (React 18 + Supabase)

Document conçu pour être passé tel quel à un autre LLM. Il décrit **18 évolutions fonctionnelles** à reproduire sur un projet du même type :
- Front : **React 18 UMD** (sans bundler) avec JSX **pré-compilé** par un script Babel maison (style `tools/build.js`) qui produit des `dist/components/*.js` chargés en `<script defer>` dans des `*.html`.
- Backend : **Supabase** (auth + Postgres + RLS + Storage) exposé via un module `window.api`.
- PDF : **pdfmake** (UMD CDN).
- Modaux/toasts : helpers globaux `window.HubModal.{confirm,prompt,alert}` et `window.HubToast.{success,error,warn,info}` (fallback natif si absents).
- Données externes : `recherche-entreprises.api.gouv.fr` (SIRENE/INPI), Pappers (procédures collectives), BODACC.

Pour chaque section : **objectif**, **fichier(s) visé(s)**, **invariants à respecter**. Aucun code intégral — uniquement les contrats d'API et les patterns à adapter à la base cible.

---

## 1. Email du contact client → Outlook Web (au lieu de `mailto:`)

**Fichier** : page de fiche client.
**Pourquoi** : `mailto:` ouvre un client local non installé sur tous les postes. Outlook Web (OWA) fonctionne partout.

Sur l'icône Email d'un contact, remplacer `mailto:<email>` par
```
https://outlook.office.com/owa/?path=/mail/action/compose&to=<encoded_email>
```
en faisant `encodeURIComponent` sur l'email.

---

## 2. Drag-and-drop des opportunités entre colonnes du kanban (fiche client)

**Fichier** : composant kanban de la fiche client.

- Sur chaque carte : `draggable={!!(opp.id)}` + `onDragStart` qui stocke l'id dans `dataTransfer.setData("oppId", id)`.
- Sur chaque colonne : `onDragOver` (preventDefault + dropEffect `"move"`), `onDragLeave`, `onDrop` :
  1. Récupère `oppId` depuis `dataTransfer`.
  2. Ouvre une `HubModal.confirm` (fallback `confirm`) : « Déplacer X de Y vers Z ? ».
  3. Si OK : `api.opportunities.update(id, { stage: col.key, proba: stageProba[col.key] })`.
  4. Toast + reload de `api.opportunities.list({ client_id })`.
- Table de probabilité par stage (à adapter) :
  ```js
  { qualif: 20, discovery: 35, propo: 55, nego: 75, won: 100 }
  ```

---

## 3. Modale « Nouvelle opportunité » en pleine largeur

**Fichier** : composant modal de création opportunité.

Style du container : `width: "calc(100vw - 24px)"` + `maxWidth: "none"`. Garder les marges intérieures inchangées.

---

## 4. Auto-création d'un devis pré-rempli quand on arrive avec `?client=` ou `?opp=`

**Fichier** : composant de gestion commerciale (éditeur de devis).

- Au mount, lire `URLSearchParams` : `client`, `opp`, `open`.
- Si `client` ou `opp` présents **et** pas de `open` → créer automatiquement un devis vierge rattaché.
- Numéro : `DEV-YYYY-NNNN`.
- Garde-fou anti-doublon : ne pas recréer si un devis pour ce couple `(client, opp)` est déjà ouvert dans la session courante.
- **Bug à éviter** : `?opp=undefined` arrive si l'appelant ne checke pas `o.ref || o.id` côté lien — verrouiller des deux côtés (lien ET cible).

---

## 5. Redesign panneau « Informations compte » de la fiche client

**Fichier** : fiche client.

Remplacer un panneau plat par **3 cartes** à fond pastel et bordure colorée gauche 3 px :
1. **Suivi commercial** — fond `#eef2ff` (indigo pâle)
2. **Cycle de vie** — fond `#ecfdf5` (vert pâle)
3. **Identité légale** — fond `#fafbfc` (gris pâle)

Headers compacts : fontSize 10–11, `text-transform: uppercase`, `letter-spacing: 0.5`.

---

## 6. Badge auto-complétion ne doit pas chevaucher le bouton ×

**Fichier** : formulaire prospect.

Sur le style du badge « 🔍 Auto-complété via base SIRENE » :
```js
right: (companyName || companySiren) ? 44 : 8
```
Le `× 44px` doit être réservé à droite quand un prospect est sélectionné.

---

## 7. Réinitialiser à zéro les KPIs placeholder sur les tuiles du home sans données réelles

**Fichier** : home ERP.

Remplacer les valeurs mockées (« 12 leads chauds », « 4 tickets P1 »…) par `0` ou `—` pour les tuiles non encore branchées sur des données réelles. Ne **pas** toucher aux tuiles qui ont déjà des vraies KPIs.

---

## 8. PDF commercial — logo complet, header & totaux réduits, signature en footer de dernière page

**Fichiers** : générateur PDF commercial (pdfmake) + module SVG des assets.

- **SVG logo** : étendre le `viewBox` (ex : passer de `0 0 1900 600` à `0 0 3300 600`) si la tagline du logo est tronquée. Garder le ratio.
- **PDF** :
  - Cellule logo : `fit: [240, 55]` (au lieu de tailles plus grandes).
  - Header band widths : `["*", 140]`, fontSize 22 pour le titre.
  - Bloc totaux : width 180, fontSize 9 / 10.5.
  - Bloc « Suivi par / IBAN / Bon pour accord » : **rendu uniquement** dans le `footer(currentPage, pageCount)` callback **quand** `currentPage === pageCount`. Réserver une hauteur footer suffisante (`~210`).

---

## 9. Document légal « mise à disposition gratuite + services payants » + générateurs

**Nouveaux fichiers** :
- `<nom_doc>.md` (markdown source, ~700 lignes)
- `<nom_doc>.docx` (généré via **python-docx**)
- `<nom_doc>.pdf` (généré via **reportlab**, polices DejaVu)

**Structure recommandée** :
- 3 articles d'introduction (présentation, FAQ, email type)
- 1 contrat principal avec clauses sécurité (anti-vol code, RGPD)
- Annexes (RIB, sous-traitants…)
- **Article 2 bis** : services payants (hébergement + BDD + SSL + maintenance + TMA) → renvoie vers un Contrat de Services séparé.
- **Article 8 bis** : assurance cyber obligatoire + sauvegarde air-gap non-refusable.
- **Article 10 bis** : exclusion de responsabilité pour modification du code par tiers (IA générative, dev externe).
- Grille tarifaire en annexe : 3 formules (ex : Essentiel / Business / Premium) + tarifs restauration (simple / avec données / catastrophe).

**Conversion** :
- Scripts Python : `md2docx.py` (python-docx) et `md2pdf_rl.py` (reportlab).
- Police : `/usr/share/fonts/truetype/dejavu/DejaVuSans*.ttf` (l'`Oblique.ttf` n'existe pas sur certains environnements → fallback `DejaVuSans.ttf` pour l'italique).
- **LibreOffice headless** échoue souvent en environnement managé → utiliser **uniquement** python-docx + reportlab.

---

## 10. Module export de réversibilité RGPD — bouton « ⬇ Exporter les données »

**Fichiers** : module API global (`window.api`) + fiche client.

Créer un module `dataExport` :
```js
const dataExport = {
  _toCsv(rows) { /* CSV UTF-8 BOM, séparateur ; */ },
  async collect(clientId) { /* fetch toutes les tables liées au client */ },
  _loadJSZip() { /* lazy CDN cdnjs/jszip */ },
  async downloadZip(clientId, clientName) {
    // ZIP contenant : data/*.csv (une par table), data_complete.json,
    // manifest.json (versions + checksums), README.md
    // Nom : export-<slug-client>-<YYYY-MM-DD>.zip
  },
};
window.api = { ..., dataExport };
```

Bouton « ⬇ Exporter les données » sur la fiche client → `api.dataExport.downloadZip(clientId, clientName)`.
**Article correspondant** dans le contrat : clause de réversibilité (art. 20 RGPD).

---

## 11. Document séparé « Contrat de Services »

**Nouveaux fichiers** : `<nom_doc_services>.md` + `.docx` + `.pdf`.

**Structure** : préambule + **16 articles** + 5 annexes.

Articles type :
1. Objet
2. Durée et reconduction
3. Description des prestations (hébergement, BDD, SSL, sauvegardes, maintenance, TMA, support)
4. Tarification (révision Syntec +5 % max)
5. SLA (99,5 % / 99,7 %, P1–P4)
6. Obligations Prestataire
7. Obligations Client
8. Responsabilité (plafond 1× CA annuel)
9. Restauration (3 paliers tarifaires)
10. PI
11. Confidentialité
12. Assurances
13. Résiliation
14. Force majeure
15. Droit / juridiction (siège du prestataire)
16. Dispositions diverses

Annexes : SLA détaillé par formule, annexe tarifaire, sous-traitants techniques (héb. + BDD + DNS), mode opératoire support, bon de commande type.

---

## 12. Stepper de workflow type SPANCO sur la page Nouveau contrat

**Fichier** : composant Nouveau contrat.

Remplacer un mini stepper (24 px) par un stepper visuel identique à celui de la page « Avancer opportunité » (qui suit le pattern SPANCO Prospect → Approche → Négociation → Conclusion → Ordre) :

- **5 gros cercles 38 px** colorés (à adapter selon les étapes du workflow contrat) :
  - Étape 1 (gris `#94a3b8`)
  - Étape 2 (bleu `#3b82f6`)
  - Étape 3 (violet `#a855f7`)
  - Étape 4 (orange `#ea580c`)
  - Étape 5 (vert `#10b981`)
- Lettre dans le cercle non-complété, **✓** pour les étapes passées/courante.
- **Halo coloré** `box-shadow: 0 0 0 5px <color>33` sur l'étape courante.
- Lignes connectrices positionnées au centre des cercles : `top: 18`, `left: calc(50% + 22px)`, `right: calc(-50% + 22px)`, hauteur 2 px, couleur = stage si passé, sinon `#e2e8f0`.
- Label + % sous chaque cercle.
- **Calcul automatique de l'étape courante** = première étape non-`done` (basé sur le remplissage du formulaire).

---

## 13. Panneau dépliable « Articles du contrat » dans la section Conditions juridiques

**Fichiers** : composant Nouveau contrat + nouveau fichier de données + HTML correspondant.

**1. Fichier de données** (`components/contract-articles.js`, ou équivalent) :
```js
window.HubContractArticles = [
  { n: 1, title: "OBJET DU CONTRAT", body: "..." },
  // ...16 entrées extraites du markdown du Contrat de Services
];
```

Extraction depuis le `.md` : script Python qui découpe sur `## ARTICLE N — TITRE`.

**2. Inclusion HTML** : `<script src="components/contract-articles.js?v=...">` **avant** le composant Nouveau contrat.

**3. Composant Nouveau contrat** :
- State `contractArticles` initialisé depuis `window.HubContractArticles`, chaque item enrichi de `{ originalBody, edited: false }`.
- State `expandedArticles` (object `{ [n]: bool }`) et `articlesPanelOpen: true` (**ouvert par défaut**).
- Helpers : `toggleArticle`, `updateArticleBody`, `resetArticleBody`. Computed : `editedCount`.

**4. UI** (insérée dans la section « Conditions juridiques », après les clauses) :
- Header repliable avec compteur et badge « ● N modifiés » si des articles ont été touchés.
- Pour chaque article : header cliquable (badge violet « Art. N » + titre + badge MODIFIÉ si edited), **textarea monospace** pleine largeur (`font-family: 'SF Mono', Consolas`), rows auto-calculé : `Math.min(20, Math.max(6, body.split("\n").length + 1))`.
- Sous chaque textarea : compteur caractères/mots + bouton « ↺ Restaurer le texte original » si edited.

**5. Persistance** : payload du contrat → `articles_overrides: contractArticles.filter(a => a.edited).map(a => ({ n, title, body }))`.

---

## 14. Pré-remplissage du contact à partir des dirigeants déclarés (open data)

**Fichier** : formulaire prospect.

**Source** : `recherche-entreprises.api.gouv.fr` expose un champ `dirigeants` (open data INSEE/INPI) sur les résultats de recherche.

Dans le handler « picker entreprise » :
1. Filtrer les dirigeants sur `type_dirigeant === "personne physique"` (fallback : tous).
2. **Premier dirigeant** → pré-remplir `prenom` (capitalisé), `nom` (UPPER), `fonction` (mappée via helper), `linkedin` slug (`linkedin.com/in/<prenom-nom>`) — **seulement si tous les champs contact sont vides** (ne pas écraser une saisie manuelle).
3. **Co-dirigeants suivants** (jusqu'à 3) → injecter dans la liste des co-contacts — seulement si liste vide.
4. State `contactAutoFilled: true` → bandeau bleu indigo en haut de la section contact : « 🔍 Auto-complété depuis les dirigeants déclarés … Email et téléphone restent à renseigner manuellement » + bouton **Effacer** qui reset tout.
5. Reset `contactAutoFilled` quand on change de prospect / vide la sélection.

**Helper `mapDirigeantQualite(q)`** (libellé INPI → option du dropdown Fonction) :
- `/président|pdg|directeur général/` → `"CEO / Directeur général"`
- `/gérant|co-gérant|associé|membre/` → `"Gérant / Dirigeant"`
- `/daf|directeur financier/` → `"DAF / Directeur financier"`
- `/directeur général délégué/` → `"COO / Directeur des opérations"`
- `/secrétaire général/` → `"Secrétaire général"`
- default `""` (laisse l'utilisateur choisir)

Toast : « ✓ Entreprise + N dirigeants importés depuis SIRENE ».

**Limite réglementaire** : email + téléphone des dirigeants ne sont **pas** des données publiques — laisser vides.

---

## 15. Kanban — vue compacte (≈ 2 cartes) + bouton « déployer » par colonne

**Fichiers** : tous les composants qui rendent un kanban + une feuille CSS partagée.

**1. Zone scrollable interne** : la zone qui rend les cartes est wrappée dans :
```js
<div className="hub-kanban-scroll"
     style={{
       maxHeight: expanded[col.key] ? "none" : 296,
       overflowY: "auto",
       paddingRight: 4,
       marginRight: -4,
     }}>
```

**2. Bouton déployer** dans le header de chaque colonne, visible **seulement si `cards.length > 2`** :
- Icône `⇣` (réduit) / `⇡` (déployé)
- Style actif : `border: <stage_color>`, `background: <stage_color>15`, `color: <stage_color>`
- State `expanded` (object `{ [stageKey]: bool }`) **persisté en localStorage** sous une clé unique par écran (ex : `<app>.pipeExpanded.v1`, `<app>.crmKanbanExpanded.v1`).

**3. CSS scrollbar discrète** :
```css
.hub-kanban-scroll::-webkit-scrollbar { width: 6px; }
.hub-kanban-scroll::-webkit-scrollbar-track { background: transparent; }
.hub-kanban-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.hub-kanban-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.hub-kanban-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
```

**Anti-pattern à éviter** : **ne pas** ajouter de bouton « replier vers la gauche » qui transforme la colonne en barre verticale 44 px. Testé puis retiré : trop d'éléments concurrents dans le header. Rester sur `grid-template-columns: repeat(N, 1fr)` simple.

---

## 16. PDF du contrat inclut les articles personnalisés

**Fichier** : générateur PDF du contrat.

**1.** Dans `buildDocDefinition(payload)` :
```js
const cgvBlock = (Array.isArray(payload.articles) && payload.articles.length > 0)
  ? buildCustomArticlesBlock(payload.articles, K)
  : buildCgvBlock(K, kindKey); // legacy générique
```

**2.** Trois helpers à implémenter :

- `parseInlineRich(line)` — découpe `**gras**`, `*italique*`, `` `code` `` en tokens pdfmake `[{text, bold}, {text, italics}, …]`.
- `renderArticleBody(body)` — mini-parser markdown :
  - `### sous-titres` (`fontSize` 10.5 / 10 / 9.5 selon niveau, `bold`, color `#0f172a`, margin `[0,6,0,3]`)
  - Listes numérotées `1. xxx` → `{ ol: [...] }`
  - Listes à puces `- xxx` ou `• xxx` → `{ ul: [...] }`
  - Séparateurs `---` → ignorés
  - Paragraphes : agrège les lignes consécutives non-vides, `alignment: "justify"`, `margin: [0,0,0,4]`
- `buildCustomArticlesBlock(articles, K)` — trie par `n`, rend `K.cgvTitle` avec `pageBreak: "before"`, puis pour chaque article : `"ARTICLE N — TITRE"` en style h2, puis le body parsé.

**3.** Côté formulaire : ajouter au payload `articles: contractArticles.map(a => ({ n, title, body }))`.

---

## 17. Section « Signature & workflow » — bouton aperçu PDF complet contextualisé

**Fichier** : composant Nouveau contrat.

Juste après les cartes de mode signature, ajouter un bandeau rosé :
- Style : `background: linear-gradient(135deg, #fff5f6, #fff)`, `border: 1px solid #fecdd3`, `border-radius: 10`.
- Titre « 📄 Aperçu du contrat pré-rempli ».
- Sous-titre **dynamique** selon `signMethod` : « électronique qualifiée DocuSign » / « simple par scan retour » / « manuscrite — original papier ».
- Bouton rouge primaire `#c91c45` « 📄 Voir l'aperçu PDF complet » qui appelle le générateur PDF (`generateContractPdf()`).

Mettre à jour le subtitle de la FormRow « Mode de signature » : « Sélectionnez puis prévisualisez le contrat complet pré-rempli ci-dessous ».

---

## 18. Bouton raccourci « 📑 Articles du contrat » dans la topbar de Nouveau contrat

**Fichier** : composant Nouveau contrat.

Dans la topbar, avant le bouton rouge « 📄 Aperçu PDF » :
- Bouton ghost couleur indigo avec label « 📑 Articles du contrat » + badge violet pâle contenant le count.
- `onClick` :
  ```js
  setArticlesPanelOpen(true);
  setTimeout(() => {
    document.getElementById("nc-articles-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
  ```
- Mettre `id="nc-articles-panel"` sur le conteneur du panneau articles.

---

## Invariants techniques transverses

### Build
- Toute modification d'un `.jsx` nécessite un **rebuild** : `cd tools && npm run build` (ou équivalent du projet).
- Le build génère des `dist/components/*.js` — **ne jamais** les éditer à la main.
- Les fichiers JS purs (helpers non-JSX, données globales) vont directement dans `components/<nom>.js` et sont chargés tels quels.

### Cache buster
- Tous les `*.html` chargent les scripts avec une query string `?v=YYYYMMDDHHMM`.
- À chaque livraison front : bump global via `grep -rl "v=<old>" --include="*.html"` + `sed`.

### Branches
- Push systématique sur **les deux branches** : la branche principale (`main` ou `master`) **et** la branche de dev courante (style `claude/<slug>` ou équivalent).

### Conventions de commit
- Format Conventional Commits **en français** : `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`, `docs: ...`, `refactor(scope): ...`, `ui(scope): ...`.
- Heredoc obligatoire pour le message multi-ligne.
- Footer `Co-Authored-By:` si l'environnement le demande.

### Modaux et toasts
- **Toujours** utiliser `window.HubModal.confirm/prompt/alert` avec fallback `confirm/prompt/alert` natif.
- Toasts : `window.HubToast.success/error/warn/info`.

### Typographie
- **Sentence case strict** sur les labels FR : première lettre majuscule, le reste minuscule. Pas d'all-caps.
- Pas de `text-transform: uppercase` sur les en-têtes de liste ou les labels de formulaire (autorisé uniquement sur micro-tags 10 px).
- Police monospace pour les nombres et dates : `font-variant-numeric: tabular-nums`.

### Dates et nombres
- Dates affichées : `toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })`.
- Montants : `Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €"`.
- Dates alignées **à droite** dans les listes.

### Sécurité / RGPD
- Email et téléphone des dirigeants **ne sont jamais** dans l'open data — ne pas les inventer.
- Clause de réversibilité (art. 20 RGPD) → bouton export ZIP obligatoire.
- Article cyber-assurance + sauvegarde air-gap → non-négociables côté contrat.

### Données externes
- **SIRENE / INPI** : `https://recherche-entreprises.api.gouv.fr/search?q=<q>&page=1&per_page=6` — gratuit, sans clé.
- **BODACC** : `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/...` — gratuit, sans clé, **uniquement procédures collectives** (pas de contact).
- **Pappers** : token nécessaire — exposer côté proxy back, fallback BODACC si absent ou quota dépassé.

### Stockage local
- Préférences UI (panneaux dépliés, vues, filtres) → `localStorage` sous clé `<app-prefix>.<feature>.v1`.
- Toujours `try/catch` autour des `JSON.parse` / `JSON.stringify` (quota navigateur).

---

## Liste fonctionnelle (récap)

| # | Évolution | Fichier(s) | Type |
|---|---|---|---|
| 1 | Email → Outlook Web | fiche client | UX |
| 2 | Drag-and-drop opportunités | fiche client | feat |
| 3 | Modale « Nouvelle opportunité » pleine largeur | modal opp | UX |
| 4 | Devis auto-créé depuis `?client=`/`?opp=` | gestion commerciale | feat |
| 5 | Refonte panneau « Informations compte » | fiche client | UX |
| 6 | Badge SIRENE ne chevauche plus × | formulaire prospect | fix |
| 7 | KPIs placeholder remis à zéro | home ERP | chore |
| 8 | PDF commercial : logo + totaux + signature footer | gen. PDF commercial | fix |
| 9 | Document mise à disposition + services | md/docx/pdf | docs |
| 10 | Export ZIP réversibilité RGPD | api + fiche client | feat |
| 11 | Contrat de Services séparé | md/docx/pdf | docs |
| 12 | Stepper SPANCO Nouveau contrat | composant contrat | UI |
| 13 | Panneau 16 articles dépliable | composant contrat + données | feat |
| 14 | Auto-fill dirigeants SIRENE | formulaire prospect | feat |
| 15 | Kanban compact + bouton déployer | kanbans + CSS | feat |
| 16 | PDF contrat avec articles personnalisés | gen. PDF contrat | feat |
| 17 | Section signature : aperçu PDF contextualisé | composant contrat | UI |
| 18 | Bouton topbar « Articles du contrat » | composant contrat | UX |
