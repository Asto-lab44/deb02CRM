# Récap des modifications — CRM/ERP web (React 18 + Supabase)

Document générique réutilisable sur tout projet de la même architecture (React 18 UMD avec JSX pré-compilé + Supabase + pdfmake + helpers globaux modal/toast). 44 évolutions livrées depuis le dernier récap, regroupées en 9 thèmes.

---

## 1. CRM PIPELINE — VUES ET COLONNES

### 1.1 Toggle vue Kanban / Liste

Sur la page Pipeline commercial, ajouter un toggle deux boutons (`⊞` kanban, `☰` liste) dans le header :
- Persisté en `localStorage` sous une clé propre à l'écran
- Vue liste : tableau plat trié par stage puis montant décroissant
- Colonnes : Opportunité, Client, Stage (pastille colorée), Montant, Probabilité, Owner, Échéances (cf. § 1.3)
- Lignes cliquables → ouvre la page Avancer l'opportunité

### 1.2 Vue liste — échéance avec code couleur d'urgence

Helper `fmtClose(iso)` qui retourne `{ label, color, weight, badge }` selon :
- `< 0 j` → rouge + badge « En retard »
- `≤ 7 j` → orange + badge « J-N »
- `≤ 30 j` → ambre
- `> 30 j` → gris ardoise
- `null` → cellule vide (pas de « — »)

Source : `o.close_date || o.data.close_date || o.data.decision_date || o.data.expected_close_date`.

### 1.3 Deux colonnes d'échéance distinctes

Ajouter deux colonnes dans la vue liste :
- **Date de décision potentielle** (champ `close_date`)
- **Échéance contrat concurrent** (champ `contract_end`)

Les libellés des colonnes doivent matcher exactement les libellés des champs du formulaire Avancer l'opportunité (cf. § 2.1).

### 1.4 Remontée du bloc « Actions à mener »

Sur la page Pipeline commercial, l'ordre vertical des sections devient :
1. Kanban / Liste
2. **Actions à mener** (remontée)
3. Comptes & contacts (descendue)

Le commercial voit ses tâches prioritaires avant la liste des comptes.

### 1.5 Stepper SPANCO en pilules rectangulaires

Sur les pages d'avancement de stage (workflow SPANCO ou similaire) et sur les pages de création de contrat, remplacer les ronds verticaux par des **pilules rectangulaires colorées** style « workflow Devis → Commande → BL → Facture » :
- Pleine couleur stage pour les étapes passées + courante
- Bordure colorée + fond clair pour la cible
- Halo `box-shadow: 0 0 0 5px <color>33` sur l'étape courante
- Badge à droite : **VALIDÉ** (passé) / **ACTUELLE** (courant) / **CIBLE** (sélectionné)
- Icône carrée à gauche (✓ ou Letter)
- Label + % sous chaque pilule
- Flèches **→** entre chaque pilule

---

## 2. WORKFLOW D'OPPORTUNITÉ

### 2.1 Bouton « 💾 Enregistrer » sans avancer l'étape

Sur la page d'avancement de stage, ajouter à 3 endroits un bouton qui sauve les champs édités (nom, montant, dates, besoin, concurrent, notes) **sans déclencher de transition** :
1. Topbar (à côté du bouton « Créer un devis »)
2. Barre d'action du bas (à gauche du bouton « Confirmer le passage »)
3. Branche étape finale (à côté du « Marquer comme perdu »)

État `savingOpp` pour disable + spinner pendant la requête. Toast « ✓ Modifications enregistrées ».

### 2.2 Bouton « 🗑 Supprimer l'opportunité »

Topbar de la page d'avancement, disponible à toutes les étapes. Modale de confirmation `HubModal.confirm` style danger, puis appel à une méthode `api.opportunities.remove(id)` qui détache (`UPDATE projects SET opportunity_id = NULL`) puis supprime l'opportunité. Redirection vers la fiche client (ou la page pipeline).

### 2.3 Actions automatiques sur transitions SPANCO

Hook côté client après chaque update d'étape réussi. Les actions sont rattachées au client + à l'opportunité (champ `opp_id`, **pas** `opportunity_id` — cohérence avec le reste du schéma).

| Transition | Action créée | Échéance | Priorité | Tag |
|---|---|---|---|---|
| Prospect → Approche | 📝 « Préparation de la rédaction de l'offre commerciale » | J+7 | Haute | « Préparation offre » (bleu) |
| Approche → Négociation | ✉ « Envoi de l'offre commerciale » | J+5 | Haute | « Offre commerciale » (violet) |

Toast info à la création.

### 2.4 Correction du bug initiales acronymes

L'extraction d'initiales (logo client) cassait sur les acronymes avec parenthèses : « ATPS (ATPS) » → tokens `["ATPS", "(ATPS)"]` → initiales `"A("`.

Nouvelle logique :
1. Strip des parenthèses (`replace(/\s*\([^)]*\)\s*/g, " ")`)
2. Si un seul mot → 2 premières lettres
3. Sinon → première lettre de chaque mot (max 2)

Exemples : `ATPS (ATPS)` → `AT`, `Capexia Conseils (Capexia)` → `CC`, `Pierre Martin` → `PM`.

---

## 3. GESTION COMMERCIALE (DEVIS / COMMANDES / BL / FACTURES)

### 3.1 Note interne technicien

Sous les totaux, bloc dépliable « 🔒 Note interne — visible techniciens uniquement » avec :
- Fond jaune ocre, bordure pointillée
- Badge **NON IMPRIMÉE**
- Textarea 5 lignes (placeholder : configs techniques, accès admin, contraintes infra)
- Compteur caractères + mention « Note héritée du parent » sur docs transformés

Stockée dans `data.internal_notes` (jsonb). La méthode `transform()` côté API copie ce champ vers l'enfant pour la cascade Devis → Commande → BL → Facture.

### 3.2 Groupement Abonnements / One-shot

Chaque ligne reçoit un champ `periodicity` (`"recurring"` ou `"oneshot"`) :
- **Toggle pill** par ligne (📦 Abonnement / 🛠 One-shot) dans le rendu éditeur
- **Auto-détection** depuis la SKU à la création (regex sur `MAINT|HEBE|HOST|HUB|ABO|SUBSC|TEL|M365|EXCH|NAS|HOTLINE|SUPPORT|INFOG|SAAS` → recurring)
- Tri visuel : récurrents en haut, one-shot en bas
- **Sous-total HT abonnements** en bandeau indigo entre les deux groupes (calcul `recurringHt`)

Persistance : `periodicity` envoyé dans `normalizedLine` + extrait via `INTERNAL_KEYS` côté `updateLine` (stocké en `data` jsonb pour ne pas nécessiter de colonne SQL). Hydratation au chargement : `l.periodicity = l.periodicity || data.periodicity || "oneshot"`.

### 3.3 Verrouillage du champ Unité

Le sélecteur 6 options (u / h / j / mois / an / forfait) est remplacé par un input read-only + disabled affichant « u (unité) ». Cohérence garantie pour les exports comptables.

### 3.4 Suppression du champ Conditions de paiement

Le sélecteur « À réception / 30 j net / 45 j fdm / etc. » est retiré du bandeau de l'éditeur. Le grid passe de 3 à 2 colonnes (Rattacher / Statut). Le champ `payment_terms_id` reste en BDD pour rétrocompatibilité mais n'est plus modifiable.

### 3.5 Auto-création de devis depuis URL

Quand `/gestion-commerciale` est ouvert avec `?client=` ou `?opp=` (et pas de `&open=`), créer automatiquement un devis vierge pré-rempli. Garde-fou anti-doublon : ne pas recréer si un devis pour ce couple (client, opp) est déjà ouvert dans la session.

---

## 4. PDF DEVIS — REFONTE COMPLÈTE

### 4.1 Bandeau header

- Logo : `fit [240, 55] → [340, 80]` (+40 %)
- Titre type (DEVIS / FACTURE / …) : 22 pt par défaut, peut être ajusté
- Largeur cellule titre : 140 → 170 pt
- Trait rouge sous le bandeau : 2 → 2,4 px
- Padding cellule logo : 4 → 6 pt vertical

### 4.2 Bloc parties (Astorya / Destinataire)

**Une seule ligne** sous le trait rouge avec deux colonnes :
- **Gauche** : raison sociale (10 pt bold) + adresse + CP/ville + email (8,5 pt)
- **Droite** : bloc client (mêmes tailles, **bold 10 pt** pour le nom)

**Décalage à droite** du bloc client : `margin-left: 40 pt` pour aérer la séparation.

Ligne dense en-dessous : Tel · Site · SIRET · Capital (8,5 pt gris ardoise).

### 4.3 Trait fin gris de séparation

Entre la zone parties et la ligne meta (Date · Devis N° · Validité), insérer une fine ligne SVG :
```js
{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.4, lineColor: "#cbd5e1" }] }
```

### 4.4 Tableau des lignes — groupes + sous-totaux

Boucle restructurée pour rendre dans cet ordre :
1. Lignes **récurrentes** (abonnements) — pas d'en-tête de groupe
2. **Sous-total abonnements HT (par période)** — bandeau compact indigo
3. Lignes **one-shot** (prestations ponctuelles)
4. **Sous-total prestations ponctuelles HT** — bandeau compact indigo (même couleur que abonnements pour cohérence)
5. Lignes texte purement informatives

Helpers :
- `pushSubtotal(label, total, color, bg)` — version ultra-compacte (italique 8 pt, montant 8,5 pt, marges 0, flag `_subtotal: true`)
- Layout du tableau : `paddingTop/paddingBottom = 1` si `cell._subtotal === true`, sinon 6 px

**Alignement strict** : `margin: [0, 0, 0, 0]` sur le montant du sous-total pour qu'il s'aligne sur la colonne « Montant HT » des lignes (la padding droite vient du layout, pas de la cellule).

### 4.5 Code TVA + colonne Montant TTC

Le tableau récap TVA affiche désormais :
- **Code** = `T<rate>` (`T20`, `T10`, `T5.5`…) au lieu d'un index 1/2/3
- Taux suffixé « % »
- **Nouvelle colonne « Montant TTC »** = Base HT + Montant TVA par taux

Bloc totaux à droite : ajout d'une ligne **« Total TTC »** entre Total TVA et NET A PAYER.

### 4.6 Fix carrés vides séparateurs de milliers

`Number.prototype.toLocaleString("fr-FR")` utilise NARROW NO-BREAK SPACE (U+202F) comme séparateur de milliers — la police Roboto embarquée par pdfmake ne dessine pas ce glyphe et affiche un carré vide.

Fix dans la fonction `fmtEUR` :
```js
.replace(/[  ]/g, " ")  // NBSP + NNBSP → espace standard
```

### 4.7 Note logistique au-dessus du tableau TVA (devis uniquement)

Block en italique gris ardoise, justifié, marges 14/10 pt :

> « Nous achetons le matériel tous les jeudis de chaque semaine, par conséquent, merci de nous faire un retour avant ce jour afin de nous permettre de vous livrer la semaine suivante. »

### 4.8 Bloc signature reformaté

Sur les **devis uniquement**, remplacer le libellé Conditions de paiement par :
- Texte gras « Règlement à la commande d'un acompte de 40 % »
- Cadre signature noir 0,7 px encadrant un encart « Bon pour accord : » + espace blanc 24 pt + « Le : »

Pour les autres types de docs, garder le libellé classique.

### 4.9 Positionnement du bloc signature

**Dans le body** juste avant le saut de page CGV (et seulement sur les devis) :
```js
(doc.type === "devis") ? { ...signatureBlock, unbreakable: true, margin: [0, 18, 0, 0] } : null
```

Footer allégé : 30 px sur les devis (juste pagination), 120 px sur les autres docs.

### 4.10 Pied de page allégé sur les devis

Sur les devis, retirer du footer :
- Le bloc Contacts 3 colonnes (Commercial / Admin / Compta) — couvert par les CGV au verso
- La mention Réserve de propriété (art. 2 des CGV)

Ne garder que la pagination. Footer remonté à 30 px.

### 4.11 CGV au verso (1 page)

Block au verso uniquement sur les devis, avec `pageBreak: "before"` :

- Titre rouge centré « CONDITIONS GÉNÉRALES DE VENTE » 13 pt
- Sous-titre identité (SIRET, adresse) 7,5 pt
- **10 articles en 2 colonnes** justifiées
- **Split par longueur de texte** (somme `title.length + body.length`) au lieu du nombre d'articles, pour équilibrer la hauteur des colonnes
- Helper `renderArt(art, num)` pour garantir des fontSize/lineHeight strictement identiques dans les deux colonnes
- Tailles : titre article 8,5 pt bold, corps 7 pt justifié, lineHeight 1,3
- Gap inter-colonnes : 14 pt

Source de données : `window.HubAstoryaCGV` exposé par un module JS dédié (extraction d'un Word officiel via `python-docx`).

---

## 5. PLANNING COMMERCIAL — NOUVELLE PAGE

### 5.1 Page dédiée `/planning-commercial`

Accessible via un bouton « 📅 Planning » dans le header du Pipeline commercial.

### 5.2 Calendrier mensuel style Outlook

- Grille 7 colonnes Lundi → Dimanche
- Cellules jour 110 px de haut
- Navigation `‹ Aujourd'hui ›` (boutons mois)
- Numéro du jour cerclé rouge si aujourd'hui
- Week-ends et jours hors-mois en fond gris pâle
- Compteur d'événements en haut à droite de chaque cellule

### 5.3 Événements

Pilules colorées avec bordure gauche colorée :
- **Violet** : Date de décision potentielle (`close_date`)
- **Cyan** : Échéance contrat concurrent (`contract_end`)

Pastille couleur stage SPANCO devant le nom. Tooltip au survol (nom + client + type + montant).

### 5.4 Limite + popup détaillé

Maximum **3 événements** par cellule, lien « + N de plus » → modale centrée listant tous les événements du jour, cliquables vers la page d'avancement.

### 5.5 Filtre type d'échéance

Toggle 3 boutons : Toutes / Décision / Concurrent.

### 5.6 Bug timezone à éviter

`new Date(year, month, 1).toISOString()` convertit en UTC et **shift d'un jour** en zone UTC+1/+2 (France été). Symptôme : la navigation mois reste bloquée sur le mois affiché.

Fix : helper `toLocalMonth(d)` qui construit le YYYY-MM depuis `getFullYear()` + `getMonth() + 1` en local. Idem pour `today` et pour les ISO des cellules.

---

## 6. ACTIONS À MENER

### 6.1 Lien vers l'opportunité depuis l'action

Le map des actions doit récupérer :
```js
opp_id: a.opp_id || a.opportunity_id || (a.data && (a.data.opp_id || a.data.opportunity_id)) || null
```

(L'API stocke `opp_id` cohérent avec opportunities.create. Garder `opportunity_id` en fallback pour rétrocompat.)

Le titre de chaque action devient cliquable :
- Si `opp_id` → ouvre `/avancer-opportunite?opp=…`
- Sinon si `client_id` → ouvre `/fiche-client?id=…`

Style : souligné pointillé + couleur indigo + tooltip.

### 6.2 Nom du client dans la meta

Injection via `api.clients.list()` au chargement de la liste d'actions. Affiché dans la meta pour distinguer les actions homonymes : « Email d'introduction personnalisé · CAPEXIA ».

### 6.3 Bouton email → Outlook Web (pas mailto:)

L'icône email d'une action ouvre **Outlook Web (OWA)** dans un nouvel onglet au lieu d'un `mailto:` :
```
https://outlook.office.com/owa/?path=/mail/action/compose&to=<encoded_email>&subject=...&body=...
```

Fonctionne sur tout poste sans client mail local installé.

---

## 7. FICHE CLIENT

### 7.1 Bouton « 🗑 Supprimer le client » avec double confirmation

Dans la topbar, à droite du bouton « Exporter les données » :

**1ère modale** — alerte rouge avec :
- Liste du périmètre supprimé (contacts, opportunités, devis, contrats, projets, tickets, actions, factures)
- Rappel d'exporter d'abord (article 20 RGPD)
- Bouton « Continuer » style danger

**2e modale** — saisie obligatoire :
- Champ texte avec instruction « Tapez SUPPRIMER en majuscules pour confirmer »
- Match strict sur la chaîne « SUPPRIMER »

Si confirmé : appel à `api.clients.remove(id)` (soft-delete via `deleted_at`, fallback hard delete si colonne absente). Toast vert puis redirection après 800 ms.

---

## 8. TYPOGRAPHIE GLOBALE

### 8.1 Uniformisation Inter dans toute l'app

1. Corriger toutes les occurrences `'Inter', serif` (mauvais fallback) → `'Inter', system-ui, sans-serif`
2. Harmoniser la plage de poids Inter chargés depuis Google Fonts : `400;500;600;700;800` sur tous les HTML
3. Règle CSS globale forçant Inter sur `html, body, input, select, textarea, button, optgroup` (les inputs natifs héritaient parfois de Helvetica/Arial selon le navigateur)
4. Active `font-variant-numeric: tabular-nums` sur les inputs date/number/time pour aligner les chiffres

---

## 9. DOCUMENTATION

### 9.1 Documentation produit complète

Document Markdown + Word + PDF organisé en 4 parties (Présentation, Modules, Admin, Annexes), 31 chapitres :

- Présentation, modèle économique, architecture technique
- Sécurité RGPD (chiffrement, RLS, droits utilisateurs, registre sous-traitants)
- Hébergement, sauvegardes PITR + air-gap, réversibilité article 20
- 15 modules métier (CRM, workflow opp, gestion commerciale, contrats, planning, tickets, projets, temps, stock, compta, marketing, RH, reporting)
- Administration (rôles, paramétrage, intégrations externes)
- Glossaire 18 acronymes, procédures opérationnelles, FAQ, index des routes

### 9.2 Génération PDF avec header/footer

Script reportlab avec `PageTemplate` + `onPage(canvas, doc)` callback :

**Header sur chaque page** :
- Logo (cercle + a stylisé)
- Tagline « SOLUTION GLOBALE INFORMATIQUE »
- Titre doc + version à droite
- Ligne rouge de séparation

**Footer sur chaque page** :
- SIRET / APE / TVA + coordonnées
- Pagination centrée « Page N »
- Mention confidentielle « Document interne — usage commercial »

Helper `inline(text)` qui **échappe d'abord** les `< > &` avant les substitutions markdown, pour éviter le crash `paraparser` sur les caractères spéciaux.

---

## INVARIANTS TECHNIQUES TRANSVERSES

### Build
- Toute modification de `.jsx` → **rebuild** obligatoire (Babel hors-ligne)
- Génère des `dist/components/*.js` chargés via `<script defer>`
- **Ne jamais** éditer les `dist/*` à la main

### Cache buster
- Tous les HTML chargent les scripts avec `?v=YYYYMMDDHHMM`
- À chaque livraison : bump global via `grep -rl "v=<old>" --include="*.html" | xargs sed`

### Branches
- Push systématique sur la branche principale ET la branche de dev courante

### Commits
- Conventional Commits FR (`feat(scope): …`, `fix(scope): …`, `chore(scope): …`, `ui(scope): …`, `docs(scope): …`)
- Heredoc obligatoire pour les messages multi-ligne

### Modaux et toasts
- **Toujours** `window.HubModal.confirm/prompt/alert` avec fallback natif
- **Toujours** `window.HubToast.success/error/warn/info`

### Sécurité et RGPD
- Email et téléphone des dirigeants ne sont **jamais** dans l'open data — ne pas inventer
- Bouton export ZIP obligatoire sur la fiche client (réversibilité article 20 RGPD)
- Double confirmation obligatoire pour toute suppression définitive (modale + saisie « SUPPRIMER »)

### Données externes
- **SIRENE / INPI** : `https://recherche-entreprises.api.gouv.fr` (gratuit)
- **BODACC** : `https://bodacc-datadila.opendatasoft.com` (gratuit, procédures collectives uniquement)
- **Pappers** : token serveur, fallback BODACC si absent ou quota
- **3CX Web Client** : deep-link `https://<server>/webclient/#/dialer/<tel>`
- **Outlook Web** : deep-link compose `https://outlook.office.com/owa/?path=…`

### Persistance UI
- Préférences (panneaux dépliés, vues, filtres) → `localStorage` sous clé `<app-prefix>.<feature>.v1`
- Toujours `try/catch` autour des `JSON.parse` / `JSON.stringify` (quota navigateur)

### Champs non standard
- Ajouter dans `data` jsonb plutôt que d'imposer une migration SQL
- Helper `INTERNAL_KEYS` dans les `updateLine` / `update` pour extraire ces champs vers `data`
- Hydrater au chargement : `obj.field = obj.field || obj.data.field || default`

---

## RÉCAPITULATIF FONCTIONNEL

| Thème | Évolutions clés |
|---|---|
| CRM Pipeline | Toggle Kanban/Liste, 2 colonnes échéance, planning calendrier, stepper SPANCO en pilules, remontée Actions à mener |
| Workflow Opportunité | Bouton Enregistrer (sans avancer), bouton Supprimer, 2 actions auto sur transitions, fix initiales acronymes |
| Gestion Commerciale | Note interne technicien (cascade), groupement Abonnements/One-shot avec sous-totaux, verrouillage Unité, retrait Conditions de paiement, auto-création depuis URL |
| PDF Devis | Refonte complète : header agrandi, parties harmonisées, trait gris séparation, CGV au verso 1 page, sous-totaux compactés, note logistique, signature avec acompte 40 %, code TVA + Montant TTC, fix carrés vides |
| Planning Commercial | Nouvelle page calendrier style Outlook, événements colorés, filtre, fix timezone |
| Actions | Lien opp/client cliquable, nom client en meta, Outlook Web compose |
| Fiche Client | Bouton Supprimer avec double confirmation |
| Typographie | Inter uniformisé partout, plage de poids harmonisée, CSS global |
| Documentation | 31 chapitres en 4 parties, PDF avec header/footer, helper inline robuste |
