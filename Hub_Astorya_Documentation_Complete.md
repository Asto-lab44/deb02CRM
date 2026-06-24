# HUB ASTORYA — DOCUMENTATION COMPLÈTE

**Version** : 2026.06
**Éditeur** : ASTORYA SGI — 9 rue du Petit Châtelier, 44300 Nantes — SIRET 523 625 804 00027

---

## TABLE DES MATIÈRES

1. Présentation générale
2. Architecture technique
3. Authentification et accès
4. Navigation et structure
5. CRM — Module commercial
6. Workflow d'opportunité SPANCO
7. Gestion commerciale (Devis → Commande → BL → Facture)
8. Contrats et signature électronique
9. Planning commercial
10. Tickets et hotline
11. Projets et livrables
12. Temps et activités
13. Stock et catalogue
14. Comptabilité et trésorerie
15. Marketing et intelligence concurrentielle
16. Ressources humaines
17. Administration et paramétrage
18. Sécurité et RGPD
19. Sauvegarde et réversibilité
20. Support et maintenance

---

## 1. PRÉSENTATION GÉNÉRALE

**Hub Astorya** est une suite CRM/ERP web complète destinée aux PME du secteur des services informatiques. Conçue par ASTORYA SGI pour ses propres besoins puis ouverte à ses clients sous forme de **mise à disposition gratuite**, la plateforme couvre l'intégralité du cycle commercial : prospection, opportunités, devis, contrats, facturation, projets, support et pilotage.

### Public cible

- Gérants et dirigeants de PME (vue 360° du business)
- Équipes commerciales (pipeline, devis, signatures)
- Techniciens et support (tickets, hotline 3CX)
- Comptables (facturation, trésorerie)
- Administrateurs IT (catalogue, utilisateurs, paramètres)

### Modèle de distribution

Le logiciel est **fourni gratuitement**. L'hébergement, la gestion BDD, les certificats SSL, les sauvegardes et la maintenance sont facturés via un **Contrat de Services** distinct (3 formules : Essentiel 49–89 €/mois, Business 129–199 €/mois, Premium 290–450 €/mois).

---

## 2. ARCHITECTURE TECHNIQUE

### Stack

- **Front-end** : React 18 UMD avec JSX pré-compilé (Babel hors-ligne), distribution `dist/components/*.js`
- **Back-end** : Supabase (PostgreSQL + RLS + Storage + Auth + Realtime)
- **Hébergement** : Vercel (CDN Edge + déploiement Git)
- **PDF** : pdfmake (UMD CDN, polices Roboto)
- **APIs externes** : recherche-entreprises.api.gouv.fr (SIRENE/INPI), Pappers, BODACC
- **Téléphonie** : 3CX Web Client (deep-link dialer)
- **Messagerie** : Outlook Web (OWA, deep-link compose)

### Hébergement

- **Région** : EU (Vercel + Supabase, conformité RGPD)
- **Sauvegardes** : point-in-time recovery 7 jours + snapshots quotidiens 30 jours + **sauvegarde déconnectée air-gap** mensuelle (article 8 bis)
- **Disponibilité contractuelle** : 99,5 % (Essentiel) à 99,9 % (Premium)

### Cache et performance

- Cache buster `?v=YYYYMMDDHHMM` sur tous les assets statiques
- localStorage pour préférences UI (panneaux dépliés, vues, filtres)
- Lazy-loading des modules lourds (JSZip, pdfmake)

---

## 3. AUTHENTIFICATION ET ACCÈS

### Connexion

- Route : `/login`
- Méthode : email + mot de passe via Supabase Auth
- Sessions JWT persistantes (7 jours par défaut)
- Vérification automatique de session sur chaque page protégée (`api.auth.requireAuth()`)

### Profils et permissions

Géré dans `/administration-utilisateurs` :
- **Administrateur** : accès complet, gestion utilisateurs
- **Commercial** : pipeline, devis, contrats, fiche client
- **Technicien** : tickets, hotline, fiche client en lecture
- **Comptable** : factures, trésorerie, exports
- **Lecture seule** : audit / direction

---

## 4. NAVIGATION ET STRUCTURE

### Page d'accueil

- Route : `/accueil-simple` (ou `/`)
- Vue d'ensemble par tuiles : CRM, Devis & Factures, Temps & Activités, Marketing, Support, Projets, Stock, Comptabilité, Trésorerie, RH, Rapports, Administration
- KPIs en temps réel sur les modules connectés à des données réelles
- Bannière de bienvenue personnalisée

### Sidebar et raccourcis

- Menu latéral persistant avec icônes module
- Recherche globale (Ctrl+K)
- Notifications hotline (clignotement rouge sur P1)
- Activity tracker (présence en ligne)

---

## 5. CRM — MODULE COMMERCIAL

### Route : `/crm`

### Sections de la page

1. **KPI strip** : Pipeline total, Pondéré (probabilité), Signées, Total opportunités
2. **Kanban SPANCO** : 5 colonnes Prospect → Approche → Négociation → Conclusion → Ordre
3. **Toggle vue** : ⊞ Kanban / ☰ Liste / 📅 Planning
4. **Bouton + Nouveau prospect** et **+ Nouvelle opportunité**
5. **Actions à mener** : tâches commerciales en file, triées par priorité
6. **Comptes & contacts** : liste consolidée prospects + clients

### Kanban

- Drag-and-drop entre colonnes (confirmation modale + mise à jour SPANCO + probabilité)
- Bouton ⇣ par colonne pour déployer (≈ 2 cartes visibles par défaut, ascenseur interne)
- Persistance des préférences en localStorage

### Vue liste

- Colonnes : Opportunité, Client, Stage, Montant, Probabilité, Owner, Date de décision potentielle, Échéance contrat concurrent
- Tri par stage puis montant décroissant
- Code couleur d'urgence sur les échéances (rouge en retard, orange ≤ 7j, ambre ≤ 30j)

### Vue planning

- Calendrier mensuel style Outlook (7 colonnes Lun→Dim)
- Navigation `‹ Aujourd'hui ›`
- Événements en pilules colorées (violet = décision potentielle, cyan = fin contrat concurrent)
- 3 événements max par jour, lien « + N de plus » → popup détaillé
- Filtre par type d'échéance

### Création d'un prospect

Route : `/nouveau-prospect`

Champs principaux :
- **Société** : recherche temps réel SIRENE → auto-complétion (raison sociale, SIREN, NAF, TVA, adresse, effectif, secteur)
- **Contact principal** : pré-rempli depuis les dirigeants déclarés (open data INSEE/INPI) — prénom, nom, fonction mappée
- **Co-contacts** : auto-injectés jusqu'à 3 dirigeants
- **Tier** : A / B / C (priorité commerciale)
- **Établissements secondaires** : ajout dynamique

Vérifications automatiques :
- Format SIREN, TVA intracom, email, téléphone
- Check BODACC procédures collectives (badge orange si redressement, rouge si liquidation)
- Auto-création d'actions selon le type d'action choisi (email, appel, RDV)

### Création d'une opportunité

Route : `/nouvelle-opportunite`

- Modale en pleine largeur
- Rattachement automatique au client si `?client=...` dans l'URL
- Choix du stage initial (Prospect par défaut)
- Champ montant estimé + date de décision potentielle
- Notes internes et besoin exprimé

---

## 6. WORKFLOW D'OPPORTUNITÉ SPANCO

### Route : `/avancer-opportunite?opp=...`

### Stepper visuel

Pilules rectangulaires colorées (style workflow Sage), reliées par des flèches :
- **Prospect** (gris, 20 %) — Letter P
- **Approche** (bleu, 35 %) — Letter A
- **Négociation** (violet, 55 %) — Letter N
- **Conclusion** (orange, 75 %) — Letter C
- **Ordre** (vert, 100 %) — Letter O

Badge dynamique sur chaque pilule : VALIDÉ (passé), ACTUELLE (courant), CIBLE (sélectionné pour passage).

### Champs éditables

- Nom de l'opportunité
- Montant estimé (€)
- Date de décision potentielle
- Besoin exprimé
- Concurrent actuel + montant concurrent (k€/an)
- Échéance du contrat actuel chez le concurrent
- Notes internes

### Critères de passage

À chaque étape cible, une checklist de critères de sortie doit être validée. Si tous ne le sont pas, une modale de confirmation propose d'avancer malgré tout.

### Boutons d'action

- **💾 Enregistrer** : sauvegarde les modifications sans changer de stage
- **📄 Créer un devis** : ouvre `/gestion-commerciale` pré-rempli avec ce client + cette opp
- **📋 Devis en cours** : raccourci vers les documents commerciaux liés
- **🗑 Supprimer** : suppression définitive avec modale de confirmation (détache les projets liés)
- **✕ Marquer comme perdu** : passe à 0 % proba, stage `lost`
- **✓ Confirmer le passage** : déclenche l'avancement SPANCO

### Cascade automatique en Ordre

Au passage en stage `won` (Ordre) :
1. Tous les devis non-transformés sont marqués `accepté`
2. Transformation cascade Devis → Commande → BL
3. Création automatique d'un projet dans le module Projets & Livrables (si aucun lié)
4. Toast de récap des étapes

### Actions créées automatiquement

| Transition | Action générée |
|---|---|
| Prospect → Approche | 📝 « Préparation de la rédaction de l'offre commerciale » (priorité haute, 7 j) |
| Approche → Négociation | ✉ « Envoi de l'offre commerciale » (priorité haute, 5 j) |

### Santé de l'opportunité

Score sur 100 calculé à partir de :
- Critères validés (50 %)
- Probabilité du stage cible (50 %)

Avec libellé qualitatif : Saine (≥ 70), À surveiller (40–69), À risque (< 40).

### Impact si passage

Bloc Avant / Après affichant :
- Montant pondéré avant changement
- Montant pondéré après changement
- Gain pondéré (vert si positif)

---

## 7. GESTION COMMERCIALE — DEVIS / COMMANDE / BL / FACTURE

### Route : `/gestion-commerciale`

### Workflow

```
Devis (DEV-2026-NNNN) → Commande (CMD-2026-NNNN) → BL (BL-2026-NNNN) → Facture (FAC-2026-NNNN)
```

Règles de transformation :
- Un devis doit être **Accepté** pour être transformé en commande
- Une commande doit être **Acceptée** pour générer un BL
- Un BL doit être **Livré** pour produire une facture
- **Même après transformation, les lignes et champs restent éditables** (ajout/modification/suppression autorisés)

### Sidebar gauche

- + Nouveau devis (raccourci proéminent)
- Devis (compteur), Commandes client, Bons livraison, Factures
- Section Administration → Catalogue & paramètres

### Création automatique

Quand on arrive sur `/gestion-commerciale?client=...&opp=...` sans `&open=...`, un nouveau devis vierge est automatiquement créé et pré-rempli (client, opp, n° auto-incrémenté).

### KPI strip

- Total HT
- Total TTC
- En attente (compte des documents pending)
- Documents (compteur global)

### Filtres

- Tous / Brouillons
- Recherche : raison sociale ou code client
- Plage de dates (`DATE … → …`)

### Liste de documents

Colonnes : Référence, Code raison sociale, Date, Nom + titre, Montant HT, Statut.

### Panneau de prévisualisation à droite

Au clic sur un document, panneau live avec :
- Référence + statut
- Workflow Sage en cours (D → C → B → F avec pastilles)
- Client + date
- Lignes du document (libellé + SKU + qty × PU)
- Totaux HT / TVA / TTC
- Bouton **Ouvrir** plein écran

### Édition d'un document

Page de saisie pleine fenêtre :
- En-tête : référence, type (badge), client (recherche), date, validité/échéance
- Lignes : ajout via catalogue articles (avec recherche IA en fallback)
- Pour chaque ligne : référence article, désignation, quantité, prix unitaire HT, remise %, TVA, total HT
- Lignes texte uniquement supportées
- Bandeau « Devis figé » dès qu'il est Accepté ou Transformé (lecture seule, sauf les éditeurs ligne autorisés)
- Synchronisation bidirectionnelle Commande ↔ BL (la dernière modification gagne)

### Catalogue d'articles

Route : `/gestion-commerciale-admin`
- Familles uniformisées (HUB, MAINTENANCE, HEBERGEMENT, TÉLÉPHONIE, IMPRESSION…)
- Codes au format `<FAMILLE>-<MARQUE>-<MODÈLE>`
- Désignations en sentence case
- 95 articles dédupliqués
- Référence fournisseur + prix d'achat indicatif (stockés dans `data` jsonb)

### Génération PDF

Bouton **📄 Aperçu PDF** sur chaque document :
- Logo Astorya SVG en en-tête (300×85 px max, viewBox 0 0 3300 600)
- Encadrés société émettrice + client
- Tableau lignes avec colonne ligne / désignation / qté / PU HT / total HT
- Tableau récap TVA : Code (T20, T10, T5.5…), Base HT, Taux TVA, Montant TVA, **Montant TTC**
- Bloc totaux : Total HT, Total TVA, **Total TTC**, NET A PAYER (noir/blanc highlighté)
- Bloc signature en footer **uniquement sur la dernière page** (ne flotte plus mid-page sur les docs courts)
- Footer : 3 colonnes Contacts (Commercial / Admin / Compta) + réserve de propriété + pagination
- **CGV ASTORYA 2025 au verso** des devis uniquement (10 articles en 2 colonnes, pageBreak before)

---

## 8. CONTRATS ET SIGNATURE ÉLECTRONIQUE

### Route : `/nouveau-contrat`

### Stepper

Pilules rectangulaires identiques au workflow SPANCO :
- **Type & rattachement** (gris, 15 %)
- **Client & contact** (bleu, 35 %)
- **Produits & pricing** (violet, 60 %)
- **Conditions juridiques** (orange, 85 %)
- **Signature & envoi** (vert, 100 %)

Calcul automatique de l'étape courante selon le remplissage.

### Section 1 — Type & rattachement

- Type de contrat : Abonnement SaaS / Licence perpétuelle / Prestation / Renouvellement
- Catégorie : Nouveau / Extension / Upsell
- Opportunité d'origine (reprise auto des conditions négociées)

### Section 2 — Client & contact signataire

- Entité contractante (rattachée au client)
- Signataire habilité : choix dans la liste des contacts existants ou création inline (prénom, nom, fonction, email, tél)

### Section 3 — Produits & pricing

- Lignes catalogue éditables (libellé, SKU, PU HT, Qté, périodicité annuel/oneshot)
- Conditions commerciales :
  - Durée d'engagement (12 / 36 / 60 mois)
  - Tacite reconduction (préavis 90 j)
  - Indexation annuelle (Aucune / SYNTEC / INSEE IPC, plafonnée à N %)
  - Délai paiement (15 j / 30 j net / 45 j fdm / 60 j)
  - Périodicité facturation (Mensuel / Trim. / Trim. terme à échoir / Annuel avance)
- Récapitulatif financier + bloc TCV / Coûts / Marge estimée

### Section 4 — Conditions juridiques & dates

- Date de début / fin (auto-calculée selon durée)
- Modèle juridique (CGV PDF uploadé via administration)
- Annexes (SLA, DPA RGPD, RIB…)
- Clauses spécifiques négociées (tag NÉGOCIÉ + texte libre)

### Panneau « 📑 Articles du contrat »

Ouvert par défaut, accessible via raccourci topbar.

Contenu : 16 articles pré-remplis depuis `window.HubContractArticles` (extraits du « Contrat de Services Hub Astorya ») :
1. Objet du contrat
2. Durée et reconduction
3. Description des prestations
4. Tarification et facturation
5. Niveaux de service (SLA)
6. Obligations du Prestataire
7. Obligations du Client
8. Responsabilité
9. Restauration et remise en fonctionnement
10. Propriété intellectuelle
11. Confidentialité
12. Assurances
13. Résiliation
14. Force majeure
15. Droit applicable et juridiction
16. Dispositions diverses

Chaque article :
- Header cliquable (Art. N + titre + badge MODIFIÉ si edited)
- Textarea monospace pleine largeur, hauteur auto
- Compteur caractères / mots
- Bouton **↺ Restaurer le texte original** si modifié

Les diffs (`articles_overrides`) sont sauvegardés avec le contrat.

### Section 5 — Signature & workflow

Choix du mode de signature :
- **✍ Signature électronique qualifiée** (eIDAS via DocuSign — valeur juridique probante, 2 j)
- **📧 Signature simple** (scan retour PDF, à éviter > 50 k€)
- **🖋 Signature manuscrite** (original papier, RDV physique)

Bandeau aperçu PDF avec mention dynamique du mode choisi + bouton **📄 Voir l'aperçu PDF complet**.

### Génération PDF du contrat

Bouton **📄 Aperçu PDF du contrat** + détection automatique du modèle (Auto / Hébergement / Téléphonie / Maintenance / Service / Page Pack).

Contenu PDF :
- Header logo + titre (CONDITIONS PARTICULIÈRES)
- Identification des parties (Prestataire + Client)
- Description de la prestation + tableau capacité/volume
- Conditions financières (coût + facturation + périodicité)
- Conditions particulières (sites, durée, référent, délai paiement, indexation)
- Bloc signature
- **16 articles personnalisés** (depuis le panneau dépliable) — remplacent les CGV génériques quand `payload.articles` est fourni
- Mandat SEPA (selon type)
- Footer pagination + identité Astorya

---

## 9. PLANNING COMMERCIAL

### Route : `/planning-commercial`

Vue calendaire style Outlook :
- Grille 7 colonnes Lun → Dim, cellules jour 110 px
- Navigation ‹ Aujourd'hui ›
- Numéro du jour cerclé rouge si aujourd'hui
- Week-ends et jours hors-mois en gris pâle
- Événements en pilules colorées avec bordure gauche :
  - **Violet** : Date de décision potentielle
  - **Cyan** : Échéance contrat concurrent
- Pastille couleur stage SPANCO devant le nom
- Limite 3 événements par jour + lien « + N de plus » → popup détaillé
- Filtre : Toutes / Décision / Concurrent

Source de données : `api.opportunities.list()`. Chaque opp génère 1 ou 2 entrées selon les dates renseignées.

---

## 10. TICKETS ET HOTLINE

### Route : `/ticketing`

- Liste des tickets avec filtres : priorité (P1–P4), statut, type, owner
- Compteur P1 (clignotant rouge si > 0)
- Création de ticket via modale (client, type, description, priorité, SLA)
- Détail ticket : timeline, attachments, échanges, escalade
- Intégration 3CX (lancement appel via Web Client)

### Hotline popup

Notifications temps réel :
- Pop-up clignotant sur P1 entrant
- Toast de notification sur P2
- Lien direct vers le ticket
- Acquittement obligatoire

### Procédure badge

Sur chaque ticket, badge de procédure standard (RAS / Escalade / Intervention sur site / Devis nécessaire) avec checklist de qualification.

---

## 11. PROJETS ET LIVRABLES

### Routes

- `/projets` — Liste maîtresse
- `/projets-tableau` — Vue tableau triable
- `/projets-kanban` — Kanban par statut
- `/projets-calendrier` — Vue calendrier
- `/projets-gantt` — Diagramme de Gantt
- `/projet?id=...` — Détail projet

### Fonctionnalités

- Auto-création de projet quand une opp passe en stage `won` (Ordre)
- Lien bidirectionnel opportunity_id ↔ project_id
- Statuts : Prévu, En cours, En pause, Terminé, Annulé
- Phases avec dates de début/fin + responsable
- Documents commerciaux liés (devis, commande, BL, facture)
- Inventaire des actifs livrés (modale AssetInventory)
- Compteur d'heures consommées (lien temps & activités)

---

## 12. TEMPS ET ACTIVITÉS

### Route : `/temps-activites`

- Saisie temps par jour / semaine / mois
- Catégories : Production, Avant-vente, Support, Administratif, Formation
- Rattachement client / projet / ticket
- Validation manager
- Export CSV pour paie

---

## 13. STOCK ET CATALOGUE

### Route : `/stock`

- Inventaire des actifs (matériel + licences)
- Liaison fournisseur (table suppliers + combo dynamique)
- Mouvements : entrée, sortie, transfert, réservation
- Catalogue articles (familles, marques, modèles, prix d'achat indicatif, prix de vente)
- Modale AssetInventory pour rattacher du stock à un projet/client

---

## 14. COMPTABILITÉ ET TRÉSORERIE

### Routes

- `/comptabilite` — Vue d'ensemble
- `/facturation` — Gestion factures et avoirs
- `/tresorerie` — Encaissements / décaissements

### Fonctionnalités

- Export FEC (Fichier des Écritures Comptables)
- Rapprochement bancaire manuel
- Suivi des relances (J+15, J+30, J+45 fdm)
- Tableau de bord ARC (Avenir Recouvrement Clients)
- Graphes : CA mensuel, marge, créances par âge

---

## 15. MARKETING ET INTELLIGENCE CONCURRENTIELLE

### Routes

- `/marketing` — Pilotage campagnes
- `/intelligence-concurrentielle` — Veille concurrents
- `/fins-contrats-concurrents` — Pipeline reconquête concurrent

### Marketing

- Campagnes email, événements, salons
- Tracking des leads par source
- Brouillons IA d'emails d'introduction
- Plaquette PDF Astorya téléchargeable

### Intelligence concurrentielle

- Battle cards par concurrent (Salesforce, Pega, Sage…)
- Forces / faiblesses / pricing comparé
- Cas clients gagnés contre concurrent
- Veille tarifaire et nouveautés produit

### Fins de contrats concurrents

Vue dédiée des opportunités avec champ `contract_end` renseigné, triées par urgence. Permet de relancer les prospects 90 jours avant la fin de leur contrat actuel.

---

## 16. RESSOURCES HUMAINES

### Route : `/ressources-humaines`

- Annuaire collaborateurs
- Onboarding / offboarding
- Compétences et certifications
- Suivi formations
- Évaluations annuelles

### Équipe commerciale

Route : `/equipe-commerciale` — Vue dédiée des commerciaux avec leurs KPI individuels (CA généré, taux de transformation, panier moyen, opportunités en cours).

---

## 17. ADMINISTRATION ET PARAMÉTRAGE

### Routes

- `/administration-utilisateurs` — Gestion users, rôles, permissions, modèles CGV
- `/administration-contrats-mapping` — Règles de détection auto du modèle de contrat

### Administration utilisateurs

- Création / modification / désactivation de compte
- Attribution de rôle (Admin / Commercial / Technicien / Comptable / Lecture)
- Upload de templates CGV (PDF) avec extraction de texte
- Templates marqués `is_default` pour pré-sélection

### Bouton de purge

Bouton **🧹 Purger opportunités** (admin uniquement) — supprime toutes les opportunités test/junk de la table + localStorage. Action irréversible avec triple confirmation.

### Mapping contrats

Règles de détection automatique du modèle de contrat selon les SKU produits :
- HOST/HEBE/SERV/365/EXCH → Hébergement
- TEL/PHONE/SDA/FIBRE → Téléphonie
- MAINT/HOTLINE/SUPPORT → Maintenance
- SVC/PREST → Service
- PAGE/PACK/PRINT/MFP → Page Pack
- Règles utilisateur custom configurables

---

## 18. SÉCURITÉ ET RGPD

### Mesures techniques

- Chiffrement TLS 1.3 sur tous les flux
- Row-Level Security (RLS) Supabase sur toutes les tables sensibles
- Sessions JWT avec rotation
- Audit log de toutes les actions sensibles
- Pas de mot de passe stocké en clair (bcrypt côté Supabase)

### Conformité RGPD

- Hébergement EU exclusivement
- Article 20 RGPD (portabilité) : module d'export ZIP intégral des données client
- Droit à l'effacement : suppression complète + journal des suppressions
- DPO référent : achat@astorya.fr
- Registre des sous-traitants (Vercel, Supabase, OVH) en annexe du Contrat de Services

### Cyber-assurance obligatoire

Le Client doit souscrire une assurance cyber (article 8 bis du Contrat de mise à disposition). Couverture minimale : RC pro + atteinte aux données + rançongiciel.

### Sauvegarde air-gap

Sauvegarde mensuelle déconnectée physiquement du SI (option non-refusable, article 8 bis). Restauration depuis air-gap facturée selon grille tarifaire (690 €, 1 200 €, 1 500 €+).

### Exclusion de responsabilité

Toute modification du code source du Hub par le Client via un tiers (IA générative, développeur externe, fork) **annule la garantie** d'Astorya (article 10 bis). Restauration depuis sauvegarde fonctionnelle facturée selon grille.

---

## 19. SAUVEGARDE ET RÉVERSIBILITÉ

### Sauvegardes automatiques

- Snapshot quotidien de la base à 02h00 (rétention 30 jours)
- Point-in-time recovery 7 jours
- Réplication WAL temps réel (Supabase managed)
- Sauvegarde air-gap mensuelle externalisée

### Export de réversibilité (article 20 RGPD)

Bouton **⬇ Exporter les données** sur la fiche client. Génère un ZIP contenant :
- `data/<table>.csv` — une CSV UTF-8 BOM par table liée au client (clients, contacts, opportunities, commercial_docs, contracts, tickets, actions, projects…)
- `data_complete.json` — dump complet structuré
- `manifest.json` — versions + checksums SHA-256
- `README.md` — schéma des données + exemple d'import

Nom du fichier : `export-<slug-client>-<YYYY-MM-DD>.zip`

### Restauration après incident

Procédure documentée :
1. Diagnostic initial (≤ 2h)
2. Restauration depuis sauvegarde chaude (PITR) → 4–8h
3. Si échec, restauration depuis air-gap → 24–72h
4. Tests d'intégrité + recette utilisateur
5. Bilan post-mortem

Tarification selon gravité (cf. Annexe 5 du Contrat de Services).

---

## 20. SUPPORT ET MAINTENANCE

### Canaux de support

- **Hotline 3CX** : Web Client intégré, dial direct depuis l'app
- **Email** : achat@astorya.fr
- **Tickets** : module `/ticketing` avec SLA contractuel
- **Portail client** : suivi des demandes en temps réel

### SLA par formule (Contrat de Services)

| Formule | Disponibilité | P1 (critique) | P2 (haute) | P3 (normale) |
|---|---|---|---|---|
| Essentiel | 99,5 % | ≤ 4h | ≤ 8h ouvrées | ≤ 2j ouvrés |
| Business | 99,7 % | ≤ 2h | ≤ 4h ouvrées | ≤ 1j ouvré |
| Premium | 99,9 % | ≤ 1h | ≤ 2h ouvrées | ≤ 4h ouvrées |

### Maintenance corrective

Incluse dans toutes les formules. Corrections de bugs déployées par Astorya sans intervention client.

### Maintenance évolutive

Incluse pour les évolutions générales du produit. Évolutions spécifiques au client : devis sur demande (TMA).

### TMA (Tierce Maintenance Applicative)

Sur demande, devis au forfait ou en régie. Couvre :
- Développements spécifiques
- Connecteurs API tiers
- Personnalisation du PDF / mailing
- Imports de données externes
- Formations utilisateurs sur site

---

## CONTACTS

**ASTORYA SGI**
9 rue du Petit Châtelier
44300 Nantes
SIRET 523 625 804 00027
Tél : 02 85 52 13 96
Email : contact@astorya.fr
Site : www.astorya.fr

**Hotline support** : 02 85 52 13 96 (option 1)
**Commercial** : 02 85 52 13 96 (option 2)
**Comptabilité** : compta@astorya.fr

---

*Document généré automatiquement à partir du code source du Hub Astorya — version 2026.06.*
*Pour toute correction ou suggestion, contacter achat@astorya.fr.*
