# Récap des modifications — Hub Astorya CRM/ERP

**Période** : depuis le dernier récap (`3d8962d`) — 23 commits cumulés.
**Repo** : `Asto-lab44/deb02CRM` (branches `main` + `claude/sharp-edison-P3k0r`).
**Stack** : React 18 UMD (JSX pré-compilé via `node tools/build.js`), Supabase, pdfmake.

Ce document est conçu pour être passé tel quel à un autre LLM avec accès au repo. Chaque section décrit **CE QU'IL FAUT FAIRE**, **OÙ** (fichier + ancre), et **POURQUOI** — pas le code complet, juste les invariants pour reproduire.

---

## 1. Email du contact client → Outlook Web (au lieu de `mailto:`)

**Fichier** : `components/ClientPage.jsx`
**Pourquoi** : `mailto:` ouvre un client local non installé sur tous les postes. Outlook Web (OWA) fonctionne partout.

À faire : sur l'icône Email du contact (et de tout contact additionnel), remplacer
```jsx
href={"mailto:" + email}
```
par une URL Outlook Web :
```
https://outlook.office.com/owa/?path=/mail/action/compose&to=<email>
```
avec `encodeURIComponent` sur l'email.

---

## 2. Drag-and-drop des opportunités entre colonnes du Pipe contrats

**Fichier** : `components/ClientPage.jsx` (section « Pipe contrats », rendu kanban des `pipeStages`).
**Pourquoi** : le drag-and-drop existait sur la page CRMPipeline mais pas sur la fiche client.

À faire :
- Sur chaque carte d'opportunité : ajouter `draggable={!!(o.ref || o.id)}` et un handler `onDragStart` qui stocke `oppId` dans `dataTransfer`.
- Sur chaque colonne (le wrapper de stage) : ajouter `onDragOver` (preventDefault + dropEffect = move), `onDragLeave`, et `onDrop` qui :
  1. Lit `oppId` depuis dataTransfer
  2. Ouvre une `HubModal.confirm` (fallback `confirm`) demandant « Déplacer X de Y vers Z ? »
  3. Si OK : `api.opportunities.update(id, { stage: col.k, proba: stageProba[col.k] })` avec `stageProba = { qualif: 20, discovery: 35, propo: 55, nego: 75, won: 100 }`
  4. Toast + reload de la liste `api.opportunities.list({ client_id: ... })`.

---

## 3. Modale « Nouvelle opportunité » en pleine largeur

**Fichier** : `components/NewOpportunity.jsx`
**À faire** : sur le style du modal container, mettre `width: "calc(100vw - 24px)"` et `maxWidth: "none"`. Garder les marges intérieures inchangées.

---

## 4. Auto-création d'un devis pré-rempli quand `/gestion-commerciale` est ouvert avec `?client=` ou `?opp=`

**Fichier** : `components/CommercialDocs.jsx`
**Contexte** : depuis la fiche client / opportunité, on doit pouvoir cliquer « Créer un devis » et arriver sur un devis vierge déjà rattaché.
**À faire** :
- Au mount, lire `URLSearchParams` : `client`, `opp`, `open`.
- Si `client` ou `opp` présents **et** pas de `open` : créer automatiquement un nouveau devis avec ces champs pré-remplis (numéro auto-incrémenté style `DEV-2026-NNNN`).
- Garde-fou : ne pas redoubler si un devis pour ce couple `(client, opp)` est déjà ouvert dans la session.
- Bug à éviter : `?opp=undefined` survient si l'appelant ne checke pas `o.ref || o.id` — verrouiller côté appelant ET côté CommercialDocs.

---

## 5. Redesign panneau « Informations compte » sur fiche client

**Fichier** : `components/ClientPage.jsx`
**À faire** : remplacer le panneau plat par 3 sections de type carte, fond coloré pastel pour chaque :
1. **Suivi commercial** (bleu indigo `#eef2ff`) — owner, statut, derniers contacts
2. **Cycle de vie** (vert `#ecfdf5`) — date création, anniversaire compte, ancienneté
3. **Identité légale** (gris `#fafbfc`) — SIRET, NAF, TVA, capital, adresse siège

Headers compacts (fontSize 10–11, uppercase, letterSpacing 0.5), bordure colorée gauche 3 px.

---

## 6. Badge « Auto-complété SIRENE » ne chevauche plus le bouton ×

**Fichier** : `components/NewProspect.jsx`
**À faire** : sur le style `searchTag`, conditionner la position right :
```js
right: (companyName || companySiren) ? 44 : 8
```
Le bouton × occupe la zone droite quand un prospect est sélectionné.

---

## 7. KPIs placeholder remis à zéro sur les tuiles ERP Home sans données réelles

**Fichier** : `components/ERPHome.jsx`
**À faire** : pour les tuiles Marketing, Support, Projets, Commande fournisseur, Comptabilité, Trésorerie, RH, Rapports, Administration → remplacer les valeurs mockées (« 12 leads chauds », « 4 tickets P1 »…) par `0` ou `—`.
**Tuiles qui gardent leurs vraies KPIs** : CRM, Devis & Factures, Temps & Activités.

---

## 8. PDF commercial — logo INFORMATIQUE complet, header & totaux réduits, bloc signature en footer de dernière page

**Fichiers** : `components/commercial-pdf.js`, `components/astorya-assets.js`
**À faire** :
- `astorya-assets.js` : étendre le viewBox du SVG logo de `0 0 1900 600` à `0 0 3300 600` pour que « SOLUTION GLOBALE INFORMATIQUE » tienne sans troncature.
- `commercial-pdf.js` :
  - Cellule logo : `fit: [240, 55]` (au lieu de 300×85)
  - Header band widths : `["*", 140]`, fontSize 22
  - Totaux : width 180, fontSize 9 / 10.5
  - Bloc « Devis suivi par / IBAN / Bon pour accord » : déplacé dans le `footer(currentPage, pageCount)` callback et rendu **uniquement** quand `currentPage === pageCount`.
  - `FOOTER_HEIGHT = 210` (au lieu de 120).

---

## 9. Dossier « mise à disposition gratuite Hub Astorya » — articles + contrat

**Nouveaux fichiers** :
- `Hub_Astorya_Articles_et_Contrat.md` (~700 lignes)
- `Hub_Astorya_Articles_et_Contrat.docx` (généré via python-docx)
- `Hub_Astorya_Articles_et_Contrat.pdf` (généré via reportlab, polices DejaVu)

**Contenu** :
- 3 articles (présentation Hub Astorya pour clients, FAQ, email type)
- 1 contrat de mise à disposition avec clauses draconiennes (anti-vol code, RGPD, sécurité)
- 5 annexes (RIB, sous-traitants, etc.)
- **Article 2 bis** : services payants (hébergement + BDD + SSL + maintenance + TMA)
- **Article 8 bis** : obligation assurance cyber + sauvegarde air-gap non-refusable
- **Article 10 bis** : exclusion responsabilité Astorya pour modifications code source par tiers (IA générative, dev externe)
- Annexe 5 enrichie avec **grille tarifaire** :
  - Essentiel 49–89 €/mois
  - Business 129–199 €/mois
  - Premium 290–450 €/mois
  - Restauration 690 € (simple) / 1 200 € (avec données) / 1 500 €+ (catastrophe)

**Reproduction PDF/Word** :
- Scripts `/tmp/md2docx.py` (python-docx) et `/tmp/md2pdf_rl.py` (reportlab)
- Police : `/usr/share/fonts/truetype/dejavu/DejaVuSans*.ttf` (pas d'Oblique.ttf → fallback DejaVuSans.ttf pour italic)
- LibreOffice headless **NE FONCTIONNE PAS** dans cet env — utiliser uniquement python-docx + reportlab.

---

## 10. Module export réversibilité RGPD — bouton « ⬇ Exporter les données » sur fiche client

**Fichier** : `components/api.js` (ajouter en bas avant `window.api = {...}`), `components/ClientPage.jsx` (bouton dans la topbar de la fiche).
**À faire** : créer un module `dataExport` :
```js
const dataExport = {
  _toCsv(rows) { /* CSV UTF-8 BOM, séparateur ; */ },
  async collect(clientId) { /* fetch toutes les tables liées au client */ },
  _loadJSZip() { /* lazy CDN cdnjs/jszip */ },
  async downloadZip(clientId, clientName) {
    // Produit un ZIP avec data/*.csv, data_complete.json, manifest.json, README.md
    // Nom : export-<client-slug>-<YYYY-MM-DD>.zip
  },
};
window.api = { ..., dataExport };
```
Sur ClientPage : bouton « ⬇ Exporter les données » dans la barre d'actions du client → `api.dataExport.downloadZip(clientId, clientName)`.

---

## 11. Document séparé « Contrat de Services Hub Astorya »

**Nouveaux fichiers** :
- `Hub_Astorya_Contrat_de_Services.md`
- `Hub_Astorya_Contrat_de_Services.docx`
- `Hub_Astorya_Contrat_de_Services.pdf`

**Contenu** : préambule + 16 articles + 5 annexes
1. Objet / 2. Durée et reconduction / 3. Description des prestations (hébergement, BDD, SSL, sauvegardes, maintenance, TMA, support) / 4. Tarification (révision Syntec +5 % max) / 5. SLA (99,5 % / 99,7 %, P1-P4) / 6. Obligations Prestataire / 7. Obligations Client / 8. Responsabilité (plafond 1× CA annuel) / 9. Restauration (690 € / 1 200 € / 1 500 €+) / 10. PI / 11. Confidentialité / 12. Assurances / 13. Résiliation / 14. Force majeure / 15. Droit/juridiction Nantes / 16. Dispositions diverses

Annexes : 1 SLA détaillé par formule, 2 Annexe tarifaire, 3 Sous-traitants (Vercel/Supabase/OVH), 4 Mode opératoire support, 5 Bon de commande type.

---

## 12. Stepper SPANCO sur la page Nouveau contrat (identique workflow opp/devis/BL/facture)

**Fichier** : `components/NewContract.jsx`
**À faire** : remplacer le mini stepper (24 px) par le pattern SPANCO de `AdvanceOpportunity.jsx` :
- 5 gros cercles de **38 px** colorés
- Couleurs par étape :
  - Type & rattachement → `#94a3b8` (gris), letter `T`, proba 15 %
  - Client & contact → `#3b82f6` (bleu), letter `C`, proba 35 %
  - Produits & pricing → `#a855f7` (violet), letter `P`, proba 60 %
  - Conditions juridiques → `#ea580c` (orange), letter `J`, proba 85 %
  - Signature & envoi → `#10b981` (vert), letter `S`, proba 100 %
- Halo coloré `box-shadow: 0 0 0 5px <color>33` sur l'étape courante
- Lignes connectrices positionnées au centre des cercles (`top: 18`, `left: calc(50% + 22px)`, `right: calc(-50% + 22px)`)
- Label + % sous chaque cercle
- Calcul automatique de l'étape courante = première étape non-`done` (basé sur le remplissage : `contractType`, `clientId && (signatory.name || clientContacts.length)`, `products.length && sums.totalY1HT`, `startDate && selectedTemplate`).

Styles à ajouter dans `ncStyles` : `spancoStepper`, `spancoStep`, `spancoDot`, `spancoLine` (cf. lignes 649–652 d'AdvanceOpportunity.jsx).

---

## 13. Panneau dépliable « Articles du contrat » dans la section Conditions juridiques

**Nouveau fichier** : `components/contract-articles.js`
**Fichiers modifiés** : `components/NewContract.jsx`, `nouveau-contrat.html`

**À faire** :
1. **Extraire les 16 articles** du `Hub_Astorya_Contrat_de_Services.md` en JS via un parser Python (regex sur `## ARTICLE N — TITRE`) → produire `window.HubContractArticles = [{n, title, body}, ...]`.
2. **Inclure** `<script src="components/contract-articles.js?v=...">` dans `nouveau-contrat.html` **avant** `NewContract.js`.
3. Dans `NewContract.jsx` :
   - State `contractArticles` initialisé depuis `window.HubContractArticles`, chaque item enrichi d'un `originalBody` + flag `edited`.
   - State `expandedArticles` (object {n: bool}) et `articlesPanelOpen` (bool, **ouvert par défaut**).
   - Helpers : `toggleArticle`, `updateArticleBody`, `resetArticleBody`, computed `editedCount`.
4. **UI** insérée dans la section 04 « Conditions juridiques », juste après les Clauses spécifiques :
   - Bouton header repliable « 📑 Articles du contrat · 16 articles » + badge orange « ● N modifiés » si des articles ont été touchés.
   - Pour chaque article : header cliquable (Art. N + titre + badge MODIFIÉ si edited), textarea monospace (font: 'SF Mono, Consolas') pleine largeur avec rows auto (`Math.min(20, Math.max(6, body.split('\n').length + 1))`).
   - Sous chaque textarea : compteur caractères/mots + bouton « ↺ Restaurer le texte original » si edited.
5. **Sauvegarde** : dans le payload du contrat, ajouter `articles_overrides: contractArticles.filter(a => a.edited).map(a => ({n, title, body}))`.
6. Styles à ajouter dans `ncStyles` : `articlesPanel`, `articlesPanelHead`, `articlesPanelBody`, `articleItem`, `articleHead`, `articleNum` (badge violet #4f46e5), `articleBody`, `articleTextarea`.

---

## 14. Pré-remplissage du contact à partir des dirigeants déclarés (NewProspect)

**Fichier** : `components/NewProspect.jsx`
**Source** : open data INSEE/INPI exposé par `recherche-entreprises.api.gouv.fr` (champ `dirigeants`).
**À faire** : dans `pickCompany(e)`, après l'auto-fill société :
1. Filtrer `e.dirigeants` sur `type_dirigeant === "personne physique"` (fallback : tous).
2. **Premier dirigeant** : pré-remplir `contactPrenom` (capitalisé), `contactNom` (UPPER), `contactRole` (mappé via `mapDirigeantQualite`), `contactLi` (slug `linkedin.com/in/prenom-nom`) — **seulement si tous les champs contact sont vides**.
3. **Co-dirigeants suivants** (jusqu'à 3) : injecter dans `extraContactList` — seulement si liste vide.
4. Setter un state `contactAutoFilled` (bool) → afficher un bandeau bleu indigo en haut de la section Contact : « 🔍 Auto-complété depuis les dirigeants déclarés … Email et téléphone restent à renseigner manuellement » + bouton **Effacer** qui reset tout.
5. Reset `contactAutoFilled` dans `clearSelection()`.

**Helper `mapDirigeantQualite(q)`** — mapping libellé INPI → option du dropdown Fonction :
- `/président|pdg|directeur général/` → `"CEO / Directeur général"`
- `/gérant|co-gérant|associé|membre/` → `"Gérant / Dirigeant"`
- `/daf|directeur financier/` → `"DAF / Directeur financier"`
- `/directeur général délégué/` → `"COO / Directeur des opérations"`
- `/secrétaire général/` → `"Secrétaire général"`
- default `""` (laisse l'utilisateur choisir).

Toast d'import : « ✓ Entreprise + N dirigeants importés depuis SIRENE ».

---

## 15. Kanban Pipe contrats + CRM Pipeline — vue compacte (≈ 2 cartes) + bouton « déployer »

**Fichiers** : `components/ClientPage.jsx`, `components/CRMPipeline.jsx`, `components/responsive.css`

**À faire** :
1. **Zone scrollable interne** : wrapper la `.map` des cartes dans une div avec :
   ```js
   maxHeight: expandedStages[s.k] ? "none" : 296,
   overflowY: "auto", paddingRight: 4, marginRight: -4
   ```
   et `className="hub-kanban-scroll"`.
2. **Bouton déployer** dans le header de chaque colonne, visible **seulement si `opps.length > 2`** :
   - Icône `⇣` (réduit) / `⇡` (déployé)
   - Border + background prennent la couleur du stage quand actif (`color + "15"` fond, `color` border, `color` texte).
   - State `expandedStages` (object {[stageKey]: bool}) **persisté en localStorage** sous `hubAstorya.pipeExpanded.v1` (ClientPage) et `hubAstorya.crmKanbanExpanded.v1` (CRMPipeline).
3. **Scrollbar discrète** dans `responsive.css` :
   ```css
   .hub-kanban-scroll::-webkit-scrollbar { width: 6px; }
   .hub-kanban-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
   .hub-kanban-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
   ```

**Important** : pas de bouton de repli vers la gauche (testé puis retiré — trop d'éléments dans le header). On reste sur grid `repeat(5, 1fr)` simple.

---

## 16. PDF du contrat de souscription inclut les 16 articles personnalisés

**Fichier** : `components/contract-pdf.js`
**À faire** :
1. Dans `buildDocDefinition(p)`, remplacer
   ```js
   const cgvBlock = buildCgvBlock(K, kindKey);
   ```
   par
   ```js
   const cgvBlock = (Array.isArray(p.articles) && p.articles.length > 0)
     ? buildCustomArticlesBlock(p.articles, K)
     : buildCgvBlock(K, kindKey);
   ```
2. **Ajouter trois helpers** avant `buildCgvBlock` :
   - `parseInlineRich(line)` : découpe `**gras**`, `*italique*`, `` `code` `` en tokens pdfmake.
   - `renderArticleBody(body)` : parse markdown léger (`### sous-titres`, listes `1.` et `-`, séparateurs `---`, paragraphes agrégés sur lignes consécutives) en stack pdfmake.
   - `buildCustomArticlesBlock(articles, K)` : trie par numéro, rend titre `K.cgvTitle` avec `pageBreak: "before"`, puis chaque article comme `ARTICLE N — TITLE` style h2 + body parsé.
3. Côté `NewContract.jsx` : dans le payload de `generateContractPdf`, ajouter
   ```js
   articles: contractArticles.map(a => ({ n: a.n, title: a.title, body: a.body }))
   ```

---

## 17. Section 5 « Signature & workflow » — bouton aperçu PDF complet contextualisé

**Fichier** : `components/NewContract.jsx`
**À faire** : juste après les 3 cartes de mode signature, ajouter un bandeau rosé (`linear-gradient(135deg, #fff5f6, #fff)`, border `#fecdd3`) avec :
- Titre « 📄 Aperçu du contrat pré-rempli »
- Sous-titre dynamique selon `signMethod` : « électronique qualifiée DocuSign » / « simple par scan retour » / « manuscrite — original papier »
- Bouton rouge `#c91c45` « 📄 Voir l'aperçu PDF complet » qui appelle `generateContractPdf()`.

Modifier aussi le subtitle de la FormRow « Mode de signature » : « Sélectionnez puis prévisualisez le contrat complet pré-rempli ci-dessous ».

---

## 18. Bouton raccourci « 📑 Articles du contrat » dans la topbar de Nouveau contrat

**Fichier** : `components/NewContract.jsx`
**À faire** : dans la topbar (header) du `NewContract`, juste avant le bouton rouge « 📄 Aperçu PDF du contrat », ajouter un bouton ghost couleur indigo :
- Label « 📑 Articles du contrat » + badge violet pâle avec le count
- onClick : `setArticlesPanelOpen(true)` puis `setTimeout(() => document.getElementById("nc-articles-panel").scrollIntoView({behavior:"smooth", block:"start"}), 50)`
- Mettre `id="nc-articles-panel"` sur le `<div style={ncStyles.articlesPanel}>`.

---

## Invariants techniques

- **Build** : `cd tools && npm run build` après chaque modification de `.jsx`. Génère `dist/components/*.js`. Ne **pas** modifier directement les `dist/*`.
- **Cache buster** : bump `v=YYYYMMDDHHMM` dans **tous** les `*.html` (`grep -rl "v=<old>" --include="*.html"` puis `sed`).
- **Branches** : push systématique sur `main` ET `claude/sharp-edison-P3k0r`.
- **Commit style** : Conventional Commits FR (`feat(...)`, `fix(...)`, `chore(...)`, `docs(...)`, `refactor(...)`). Co-Authored-By Claude Opus 4.8.
- **Modal pattern** : toujours `window.HubModal.confirm/prompt/alert` avec fallback `confirm/prompt/alert` natif si `HubModal` indisponible.
- **Toast pattern** : `window.HubToast.success/error/warn/info`.
- **Pas de Babel runtime** : tout passe par le build statique. Les helpers JS purs (non-JSX) vont dans `components/<nom>.js` directement.
- **Sentence case strict** sur les labels FR — première lettre majuscule, le reste minuscule, pas d'all-caps.

---

## Liste des 23 commits (du plus ancien au plus récent)

```
634c29a feat(client-page): icône Email ouvre Outlook Web au lieu de mailto:
896b4ce feat(client-page): drag-and-drop des opportunités entre colonnes du Pipe contrats
69ea5dc chore(opp): modale Nouvelle opportunité en pleine largeur
3caf5d7 feat(cdocs): création auto d'un devis pré-rempli quand /gestion-commerciale est ouvert avec ?client= ou ?opp=
f760efd chore(client): redesign panneau "Informations compte" — 3 sections cartes
af55853 fix(prospect): badge "Auto-complété SIRENE" ne chevauche plus le bouton ×
62b92f2 chore(home): remet à zéro les KPIs placeholder sur les tuiles sans données réelles
c85a7f0 fix(pdf): logo INFORMATIQUE complet + zone header + totaux réduits
e9f2def fix(pdf): bloc "Devis suivi par + IBAN / Bon pour accord" collé en bas de la dernière page
c934695 docs: dossier "mise à disposition gratuite Hub Astorya" — articles + contrat
19db985 docs: dossier mise à disposition Hub Astorya en Word + PDF
8664f3e feat(export): module réversibilité RGPD — bouton "Exporter les données" client
936c7ba docs(contrat): dissocie logiciel gratuit / services payants (héberg. + TMA)
ed30a9f docs(contrat): obligations sécurité Client + exclusion code tiers + tarifs restauration
0a693d2 docs: ajoute le Contrat de Services Hub Astorya (md/docx/pdf)
193b723 ui(NewContract): stepper SPANCO identique au workflow opp/devis/BL/facture
c781c33 feat(NewContract): panneau dépliable des 16 articles du Contrat de Services
44e59b5 feat(NewProspect): pré-remplit le contact à partir des dirigeants déclarés
25479d6 feat(kanban): bouton repli par colonne sur Pipe contrats + CRM Pipeline
33b6d9f feat(kanban): ascenseur vertical interne par colonne (Pipe contrats + CRM)
4332f99 fix(kanban): hauteur visible limitée à ~2 cartes par colonne
668db51 refactor(kanban): retire le repli vers la gauche, garde le bouton déployer
87eeba1 ui(NewContract): panneau articles ouvert par défaut + raccourci topbar
87ac696 feat(contract-pdf): aperçu PDF inclut les 16 articles personnalisés
```
