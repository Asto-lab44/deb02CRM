# HUB ASTORYA — DOCUMENTATION COMPLÈTE

**Version** : 2026.06
**Éditeur** : ASTORYA SGI — 9 rue du Petit Châtelier, 44300 Nantes
**SIRET** : 523 625 804 00027 · **APE** : 6202A · **TVA** : FR68523625804
**URL production** : https://msp.astorya.fr/
**Contact** : contact@astorya.fr · 02 85 52 13 96

---

## SOMMAIRE DÉTAILLÉ

**Partie I — Présentation et architecture**
1. Présentation générale et positionnement
2. Modèle économique et licensing
3. Architecture technique détaillée
4. Sécurité, RGPD et conformité
5. Authentification et gestion des rôles
6. Hébergement, sauvegardes et réversibilité

**Partie II — Modules métier**
7. Page d'accueil et navigation
8. CRM — Pipeline commercial
9. Gestion des prospects et clients
10. Workflow d'opportunité SPANCO
11. Gestion commerciale (Devis → Commande → BL → Facture)
12. Contrats et signature électronique
13. Planning commercial
14. Tickets et hotline 3CX
15. Projets et livrables
16. Temps et activités
17. Stock et catalogue produits
18. Comptabilité et trésorerie
19. Marketing et intelligence concurrentielle
20. Ressources humaines
21. Reporting et tableaux de bord

**Partie III — Administration et exploitation**
22. Administration utilisateurs et permissions
23. Paramétrage avancé
24. Intégrations externes (SIRENE, Pappers, BODACC, 3CX, Outlook, Teams)
25. Maintenance et évolutions
26. Support et SLA contractuels

**Partie IV — Annexes**
27. Glossaire métier
28. Grille tarifaire détaillée
29. Procédures opérationnelles
30. FAQ utilisateurs
31. Index des routes et raccourcis clavier

---

# PARTIE I — PRÉSENTATION ET ARCHITECTURE

## 1. PRÉSENTATION GÉNÉRALE ET POSITIONNEMENT

### 1.1 Qu'est-ce que le Hub Astorya ?

**Hub Astorya** est une suite logicielle CRM/ERP web complète, conçue par ASTORYA SGI pour gérer l'intégralité du cycle commercial et opérationnel d'une PME de services informatiques. Né de l'expérience terrain d'ASTORYA, le Hub couvre la prospection, la qualification, la négociation, la contractualisation, la facturation, la gestion de projet, le support technique et le pilotage par indicateurs.

### 1.2 Pour qui ?

Le Hub Astorya s'adresse principalement à :

- **PME du secteur IT** (infogérance, hébergement, télécoms, intégration)
- **Cabinets de conseil en transformation digitale**
- **Éditeurs et intégrateurs de solutions métier**
- **MSP (Managed Service Providers)** européens
- **Entreprises de services aux entreprises** (BtoB) ayant un cycle de vente long et un suivi de projet structuré

L'outil est utilisé quotidiennement par cinq types d'utilisateurs :

- **Dirigeants et managers** : vue 360° du business, KPI temps réel, tableaux de pilotage
- **Commerciaux** : pipeline, prospection, devis, contrats, signatures
- **Techniciens et support** : tickets, interventions, hotline 3CX, note interne projet
- **Comptables** : facturation, encaissements, relances, exports comptables
- **Administrateurs IT** : utilisateurs, droits, catalogue, paramètres, sauvegardes

### 1.3 Vision produit

Le Hub Astorya est pensé comme **l'outil unique** qui élimine la dispersion entre 5–10 logiciels disparates (Salesforce, Sage, Trello, Zendesk, etc.). Il vise la simplicité radicale : interface unifiée, navigation fluide, pas de plug-in à installer, pas de mise à jour bloquante, accès web universel.

La doctrine éditoriale repose sur :

- **Sentence case strict** sur tous les libellés (premier mot en majuscule, le reste en minuscule)
- **Couleurs sémantiques** : violet (décision/intelligence), bleu (action commerciale), vert (succès), orange (urgence), rouge (alerte/perte)
- **Workflow visuel** par pilules colorées rectangulaires (style ERP éditeurs majeurs)
- **Fluidité** : 90 % des actions accessibles en deux clics maximum depuis l'accueil

### 1.4 Différenciation concurrentielle

| Critère | Hub Astorya | Salesforce | Sage | Pega |
|---|---|---|---|---|
| Logiciel gratuit | ✓ | × (licence/mois) | × (licence) | × (licence) |
| Hébergement EU souverain | ✓ | × (US) | Partiel | × |
| Conformité RGPD article 20 | ✓ | Limité | Limité | Limité |
| Sauvegarde air-gap incluse | ✓ | × | × | × |
| Code source ouvert au client | Optionnel | × | × | × |
| Modèle TPE/PME 1–50 postes | ✓ | × | ✓ | × |
| Intégration native 3CX | ✓ | Plugin tiers | × | × |

---

## 2. MODÈLE ÉCONOMIQUE ET LICENSING

### 2.1 Principe de mise à disposition gratuite

Le **logiciel Hub Astorya** est mis à disposition gratuitement par ASTORYA SGI à ses clients sous forme de licence d'usage non-exclusive, non-transmissible, à durée indéterminée. Le code source reste la propriété intellectuelle exclusive d'ASTORYA SGI.

Cette mise à disposition gratuite est encadrée par le **Contrat de mise à disposition Hub Astorya** (18 articles + 5 annexes), garantissant à ASTORYA :

- L'exclusivité de l'hébergement et de l'exploitation
- L'interdiction de toute modification du code par le Client ou un tiers (art. 10 bis)
- L'obligation de souscription d'une assurance cyber (art. 8 bis)
- La sauvegarde air-gap mensuelle non-refusable (art. 8 bis)

### 2.2 Contrat de Services (modèle économique)

L'exploitation, l'hébergement et la maintenance du Hub sont facturés via un **Contrat de Services** distinct (16 articles + 5 annexes). Ce contrat couvre :

- **Hébergement** : serveurs, BDD, CDN, certificats SSL/TLS
- **Maintenance corrective** : correction des bugs sans surcoût
- **Maintenance évolutive** : nouvelles versions du produit
- **Sauvegardes** : automatiques quotidiennes + air-gap mensuel
- **Support utilisateurs** : hotline, tickets, formation
- **TMA (Tierce Maintenance Applicative)** : développements spécifiques sur devis

### 2.3 Grille tarifaire (formules standard)

#### Formule Essentiel — 49 à 89 € HT / mois

Pour TPE 1–10 utilisateurs avec besoins commerciaux simples.

- Hébergement mutualisé EU (Vercel + Supabase shared)
- Sauvegardes quotidiennes (rétention 7 jours)
- Support email J+2 ouvré
- 1 sauvegarde air-gap / trimestre
- SLA disponibilité 99,5 %
- Mises à jour gratuites

#### Formule Business — 129 à 199 € HT / mois

Pour PME 10–30 utilisateurs avec workflow projet structuré.

- Hébergement dédié EU
- Sauvegardes quotidiennes (rétention 30 jours) + point-in-time recovery 7 j
- Support hotline ouvré + email J+1
- 1 sauvegarde air-gap / mois
- SLA disponibilité 99,7 %
- 2h de TMA incluse par mois
- Formation utilisateur (1 session / an)

#### Formule Premium — 290 à 450 € HT / mois

Pour PME 30+ utilisateurs avec exigences cyber et continuité élevées.

- Hébergement dédié EU + DR (Disaster Recovery)
- Sauvegardes horaires + point-in-time recovery 30 j
- Support hotline 24/5 + astreinte critique
- 2 sauvegardes air-gap / mois (2 sites distincts)
- SLA disponibilité 99,9 %
- 5h de TMA incluse par mois
- Audits sécurité trimestriels
- Formation utilisateur (4 sessions / an)

### 2.4 Restauration après incident

| Niveau | Description | Tarif HT |
|---|---|---|
| Simple | Restauration PITR ≤ 2h | 690 € |
| Avec données | Restauration depuis snapshot + recette | 1 200 € |
| Catastrophe | Restauration air-gap + reconstruction infra | 1 500 € + temps technicien |

### 2.5 TMA et développements spécifiques

Devis sur étude. Tarif jour technicien senior : 750 € HT. Tarif architecte : 1 200 € HT.

---

## 3. ARCHITECTURE TECHNIQUE DÉTAILLÉE

### 3.1 Stack applicative

#### Front-end
- **React 18.3.1** (UMD via unpkg, pas de bundler) — chargement direct dans le navigateur
- **JSX pré-compilé** par Babel hors-ligne via script Node.js (`tools/build.js`)
- **Distribution** : fichiers `.js` produits dans `/dist/components/*.js`, chargés en `<script defer>` depuis les HTML statiques
- **CSS** : feuille `responsive.css` partagée, complétée par styles inline JSX par composant
- **Police** : Inter (Google Fonts), poids 400/500/600/700/800

#### Back-end
- **Supabase** (Postgres 15 + PostgREST + Realtime + Auth + Storage)
- **Row-Level Security (RLS)** activée sur toutes les tables sensibles
- **Edge Functions** Supabase pour les opérations sensibles (purge, exports)
- **Stockage objets** : Supabase Storage (PDF templates, exports ZIP, plaquettes)

#### Hébergement et distribution
- **Vercel** : front statique + Edge CDN (≤ 50ms latence Europe)
- **Supabase EU-West-3** (Paris) ou EU-West-1 (Irlande) selon la formule
- **Déploiement** : Git push sur `main` → déploiement Vercel automatique
- **Cache-busting** : `?v=YYYYMMDDHHMM` sur tous les assets statiques

#### Génération PDF
- **pdfmake** (UMD CDN cdnjs) avec polices Roboto embarquées
- Modules dédiés : `commercial-pdf.js` (devis/factures), `contract-pdf.js` (contrats)
- SVG logos via `astorya-assets.js`

### 3.2 APIs externes intégrées

| API | Usage | Authentification | Quota |
|---|---|---|---|
| `recherche-entreprises.api.gouv.fr` | SIRENE + dirigeants INPI | Aucune (gratuit) | 7 req/sec |
| `bodacc-datadila.opendatasoft.com` | Procédures collectives | Aucune (gratuit) | 5 req/sec |
| `api.pappers.fr/v2` | Données entreprise enrichies | Token (proxy serveur) | 1k/mois |
| `3CX Web Client` | Téléphonie (dial direct) | Session locale 3CX | n/a |
| `outlook.office.com/owa` | Compose mail (deep-link) | Compte O365 utilisateur | n/a |
| `outlook.office.com/calendar` | Création RDV | Compte O365 utilisateur | n/a |
| `Teams webhook` | Notifications canal | Webhook URL configurée | n/a |

### 3.3 Modélisation des données (principales tables)

#### Table `clients`
Stocke prospects et clients confirmés. Statut dans `data.statut` (`prospect`, `client`, `archive`).
- `id`, `raison_sociale`, `siren`, `siret`, `naf`, `tva_intracom`
- `address`, `cp`, `city`, `phone`, `email`, `website`, `linkedin`
- `effectif`, `tier`, `secteur`, `sous_secteur`
- `created_at`, `created_by`, `data` (jsonb pour BODACC check, secondary establishments, etc.)

#### Table `contacts`
Interlocuteurs liés à un client. Contrainte : un seul `is_principal=true` par client.
- `id`, `client_id`, `prenom`, `nom`, `fonction`, `email`, `phone`, `linkedin`
- `is_principal`, `created_at`

#### Table `opportunities`
Opportunités commerciales du pipeline SPANCO.
- `id`, `ref`, `client_id`, `name`, `stage`, `proba`, `amount_eur`
- `close_date` (date de décision potentielle)
- `contract_end` (échéance contrat concurrent)
- `besoin`, `concurrent`, `concurrent_amount`, `notes`
- `owner`, `created_at`, `data` (jsonb)

#### Table `commercial_docs`
Devis, commandes, BL, factures unifiés par `type`.
- `id`, `ref`, `type` (devis/commande/bl/facture), `status`, `parent_doc_id`
- `client_id`, `client_name`, `client_*` (snapshot)
- `opportunity_id`, `project_id`
- `lines` (jsonb array), `total_ht`, `total_tva`, `total_ttc`
- `notes` (visible client), `data.internal_notes` (visible techniciens uniquement)

#### Table `contracts`
Contrats clients (souscription, hébergement, maintenance, services).
- `id`, `client_id`, `opp_id`, `type`, `category`, `products`
- `duration`, `start`, `end`, `tacite`, `indexation`, `indexCap`
- `payment_delay`, `billing_period`, `currency`
- `annexes`, `clauses`, `articles_overrides` (jsonb)
- `signatory`, `sign_method`, `total_ht_y1`, `tcv`, `margin_pct`
- `status` (`draft`, `pending_signature`, `signed`, `expired`, `terminated`)

#### Table `actions`
Tâches commerciales à mener (relances, emails, RDV, brouillons IA).
- `id`, `client_id`, `opp_id`, `type`, `title`, `meta`
- `due_text`, `priority` (`haute`/`moyenne`/`basse`/`ai`)
- `assigned_to`, `tag`, `tag_color`, `icon`
- `status` (`todo`/`done`), `created_by`, `completed_at`

#### Table `tickets`
Tickets de support technique.
- `id`, `client_id`, `priority` (`p1`/`p2`/`p3`/`p4`), `status`
- `subject`, `description`, `category`
- `assigned_to`, `created_by`, `sla_due_at`, `closed_at`
- `events` (jsonb : timeline des échanges)

#### Table `projects`
Projets livrables (post-vente).
- `id`, `opportunity_id`, `client_id`, `name`, `status`
- `start_date`, `end_date`, `responsible`, `phases` (jsonb)
- `commercial_docs` (jsonb array de refs), `assets` (jsonb)

### 3.4 Performance et limites

- **Première charge** : ≤ 1,5s (cold) / ≤ 400ms (cached)
- **Latence API moyenne** : 80–150ms (Supabase EU-West)
- **Capacité** : testée jusqu'à 50 000 opportunités, 500 utilisateurs concurrents
- **Stockage** : 1 GB inclus dans toutes les formules, +1 GB = 9 € HT/mois

---

## 4. SÉCURITÉ, RGPD ET CONFORMITÉ

### 4.1 Conformité réglementaire

Le Hub Astorya est conforme avec :

- **RGPD (UE 2016/679)** — Règlement général sur la protection des données
- **Loi Informatique et Libertés** (France) modifiée
- **Directive ePrivacy** (UE 2002/58/CE)
- **DORA** (Digital Operational Resilience Act, applicable 17/01/2025) — modules sectoriels
- **NIS2** (Network and Information Security Directive 2) — modules sectoriels

### 4.2 Mesures techniques de sécurité

#### Chiffrement
- **TLS 1.3 obligatoire** sur tous les flux (HTTP/2 + HSTS preload list)
- **Chiffrement au repos** : AES-256 sur le stockage Supabase (managed)
- **Chiffrement des sauvegardes** : AES-256-GCM avec rotation de clés trimestrielle
- **Sauvegarde air-gap** : chiffrement immédiat par clé locale, support physique externalisé

#### Authentification
- **Supabase Auth** : email + mot de passe avec validation regex (12+ caractères, mixte)
- **JWT** : rotation 7 jours, signature HS256, claims minimisés
- **Refresh tokens** : 30 jours, révocables manuellement
- **Verrouillage** : 5 tentatives échouées → blocage 15 min
- **2FA optionnel** : TOTP (Google Authenticator, Authy) sur les comptes Admin

#### Autorisations
- **Row-Level Security (RLS)** Supabase sur toutes les tables sensibles
- **Policies par rôle** : `admin`, `commercial`, `technicien`, `comptable`, `lecture`
- **Audit log** centralisé : toute action sensible enregistrée avec horodatage + IP + user_id

#### Vulnérabilités
- **XSS** : encodage automatique React, pas d'`innerHTML`
- **CSRF** : tokens Supabase + SameSite=Lax sur les cookies
- **SQL injection** : impossible (PostgREST génère des prepared statements)
- **Rate limiting** : 100 req/sec/IP côté Vercel Edge + 50 req/sec côté Supabase

### 4.3 Droits des personnes (RGPD)

| Droit | Implémentation Hub Astorya |
|---|---|
| Information | Mention légale + politique de confidentialité accessibles depuis l'app |
| Accès | Bouton « Mes données » dans le menu utilisateur (export ZIP self-service) |
| Rectification | Édition libre de toutes les fiches client/contact |
| Effacement | Bouton « Supprimer » avec confirmation + log |
| Limitation | Champ `data.processing_restriction=true` arrête tous les traitements automatiques |
| Portabilité (art. 20) | Bouton « ⬇ Exporter les données » sur fiche client → ZIP CSV+JSON |
| Opposition | Désinscription des automations marketing en un clic |
| Décisions automatisées | Aucune décision juridique automatisée — toutes validées humainement |

### 4.4 Sous-traitants et registre

ASTORYA SGI conclut un DPA (Data Processing Agreement) avec chaque sous-traitant. Liste en annexe du Contrat de Services :

| Sous-traitant | Service | Localisation | Conformité |
|---|---|---|---|
| Vercel Inc. | Hébergement front + CDN | EU (Francfort) | SOC 2 Type II, ISO 27001, DPA UE |
| Supabase Inc. | BDD + Auth + Storage | EU (Paris/Irlande) | SOC 2 Type II, DPA UE, RLS native |
| OVHcloud | DNS + backup air-gap | France (Roubaix/Strasbourg) | HDS, ISO 27001, EU |
| Sendgrid (Twilio) | Envois transactionnels | EU (Dublin) | GDPR-compliant, DPA |
| Anthropic | LLM API (brouillons IA) | EU (option) | DPA, données non réutilisées pour entraînement |

### 4.5 Notification de violation

En cas de violation de données personnelles :
- **Détection** : monitoring 24/7 + alertes automatiques sur événements anormaux
- **Notification CNIL** : sous 72h via le portail dédié
- **Notification clients impactés** : sans délai injustifié, par email + courrier RAR
- **Registre interne** : conservé 5 ans

### 4.6 Cyber-assurance obligatoire

Conformément à l'**article 8 bis** du Contrat de mise à disposition, le Client souscrit obligatoirement une assurance cyber couvrant a minima :

- **RC professionnelle cyber** : 1 M€ minimum
- **Atteinte aux données** : 500 k€ minimum
- **Rançongiciel** : 500 k€ minimum + clause de non-paiement de rançon
- **Pertes d'exploitation** : 30 jours minimum

Justificatif d'assurance à fournir à la souscription et à chaque renouvellement annuel.

---

## 5. AUTHENTIFICATION ET GESTION DES RÔLES

### 5.1 Connexion

**Route** : `/login`

- Saisie email + mot de passe
- Validation côté front (regex email + longueur min)
- Soumission Supabase Auth → JWT
- Stockage sécurisé (localStorage + flag `secure`)
- Redirection vers `/accueil-simple` (ou `/` selon configuration)

**Mot de passe oublié** : lien email avec token à usage unique (TTL 1h).

### 5.2 Rôles disponibles

#### Administrateur (`admin`)
- Accès complet à toutes les pages et tables
- Gestion utilisateurs, rôles, permissions
- Configuration paramètres système
- Accès aux logs et exports admin
- Droit de purge (opportunités test, données obsolètes)

#### Commercial (`commercial`)
- Pipeline, opportunités, devis, contrats, fiche client
- Création prospects, contacts, opportunités
- Gestion documents commerciaux (CRUD complet)
- Accès lecture aux tickets (sans modification)
- Pas d'accès aux paramètres admin

#### Technicien (`technicien`)
- Tickets, hotline 3CX, interventions
- Fiche client en lecture (sauf notes internes éditables)
- Projets : modification du planning, ajout activités
- Saisie temps et activités
- Pas d'accès aux contrats ni facturation

#### Comptable (`comptable`)
- Factures, paiements, relances
- Comptabilité, trésorerie, export FEC
- Lecture fiche client (volet facturation)
- Pas d'accès au pipeline commercial

#### Lecture seule (`reader`)
- Vue d'ensemble (tous modules)
- Pas de création / modification / suppression
- Utilisé pour audits, direction, contrôleur de gestion

### 5.3 Matrice des droits

| Action | Admin | Commercial | Technicien | Comptable | Lecture |
|---|---|---|---|---|---|
| Créer un prospect | ✓ | ✓ | × | × | × |
| Créer une opportunité | ✓ | ✓ | × | × | × |
| Avancer une opp SPANCO | ✓ | ✓ | × | × | × |
| Créer un devis | ✓ | ✓ | × | × | × |
| Émettre une facture | ✓ | ✓ | × | ✓ | × |
| Enregistrer un paiement | ✓ | × | × | ✓ | × |
| Créer un ticket | ✓ | ✓ | ✓ | ✓ | × |
| Modifier note interne | ✓ | ✓ | ✓ | × | × |
| Purger des données | ✓ | × | × | × | × |
| Voir les logs | ✓ | × | × | × | × |

### 5.4 Sessions et déconnexion

- **Durée de session** : 7 jours (renouvellement glissant à chaque action)
- **Déconnexion forcée** après 30 jours d'inactivité
- **Multi-session** : possible (un même utilisateur peut être connecté sur plusieurs navigateurs)
- **Révocation** : l'admin peut révoquer toutes les sessions d'un utilisateur depuis `/administration-utilisateurs`

---

## 6. HÉBERGEMENT, SAUVEGARDES ET RÉVERSIBILITÉ

### 6.1 Architecture d'hébergement

#### Production
- **Front statique** : Vercel Edge Network (40+ POP dans le monde, principalement EU)
- **BDD applicative** : Supabase (Postgres 15 managed)
- **Stockage objets** : Supabase Storage (PDF, exports, plaquettes)
- **DNS** : OVH (FR) avec DNSSEC activé
- **Certificats SSL** : Let's Encrypt (renouvellement automatique 60j)

#### Environnements
- **Production** (`main` branch) : msp.astorya.fr
- **Staging** (`staging` branch) : staging.msp.astorya.fr (accès restreint)
- **Développement** (`develop` branch) : local + branches Claude

### 6.2 Stratégie de sauvegarde

#### Sauvegarde quotidienne (toutes formules)
- **Snapshot complet** Postgres + Storage à 02h00 UTC
- **Rétention** : 7 jours (Essentiel), 30 jours (Business/Premium)
- **Localisation** : EU-West (zone différente du primaire)

#### Point-in-time recovery
- **WAL streaming** continu (5 sec d'écart maximum)
- **Restauration** à n'importe quelle seconde des 7 derniers jours (Essentiel/Business)
- **Restauration** à n'importe quelle seconde des 30 derniers jours (Premium)

#### Sauvegarde air-gap (article 8 bis)
- **Fréquence** : trimestrielle (Essentiel), mensuelle (Business), bi-mensuelle (Premium)
- **Support** : disque dur externe chiffré + clé USB redondante
- **Stockage** : coffre-fort physique externalisé (Nantes + Paris)
- **Test de restauration** : annuel obligatoire

### 6.3 Réversibilité et export (article 20 RGPD)

#### Bouton « ⬇ Exporter les données »

Présent sur la fiche client. Génère un ZIP nommé `export-<slug-client>-<YYYY-MM-DD>.zip` contenant :

```
/data/
  clients.csv         — toutes les colonnes de la fiche
  contacts.csv        — interlocuteurs
  opportunities.csv   — pipeline historique
  commercial_docs.csv — devis, commandes, BL, factures
  contracts.csv       — contrats signés ou expirés
  tickets.csv         — tickets clos et ouverts
  actions.csv         — tâches commerciales historiques
  projects.csv        — projets livrables
  invoices.csv        — facturation détaillée
  payments.csv        — historique des règlements

/files/
  contracts/          — PDF des contrats signés
  invoices/           — PDF des factures
  attachments/        — pièces jointes diverses

data_complete.json    — dump JSON structuré (équivalent CSV mais navigable)
manifest.json         — versions des schémas, checksums SHA-256, horodatage
README.md             — schéma des données + exemple d'import
```

**Format CSV** : UTF-8 BOM, séparateur point-virgule (`;`), guillemets doubles d'échappement.
**Conformité RGPD article 20** : structuré, couramment utilisé, lisible par machine.

### 6.4 Procédure de réversibilité (fin de contrat)

1. **Préavis** : 90 jours avant fin de contrat
2. **J+30** : export ZIP automatique mis à disposition par ASTORYA
3. **J+60** : suppression complète des données du Client de tous les systèmes ASTORYA
4. **J+90** : certificat de destruction émis et envoyé au Client

Aucune donnée n'est conservée au-delà de J+90, sauf obligation légale (factures 10 ans).

### 6.5 Procédure post-incident

Niveaux de gravité et délais d'engagement :

| Niveau | Définition | Délai diagnostic | Délai restauration |
|---|---|---|---|
| Mineur | Bug fonctionnel sans perte de données | 4h | J+1 |
| Majeur | Perte partielle, dégradation service | 2h | J+0 (4h) |
| Critique | Perte totale ou indisponibilité prolongée | 1h | J+0 (2h) PITR / J+2 air-gap |
| Catastrophique | Datacenter détruit, corruption massive | 30 min | J+1 à J+5 (air-gap + reconstruction) |

---

# PARTIE II — MODULES MÉTIER

## 7. PAGE D'ACCUEIL ET NAVIGATION

### 7.1 Page d'accueil ERP

**Route** : `/accueil-simple` (ou `/`)

#### Composition
1. **Bandeau de bienvenue personnalisé** avec nom utilisateur + date du jour
2. **KPI strip** : pipeline total, pondéré, signées, total opportunités
3. **Grille de tuiles modules** : 12 tuiles cliquables vers chaque module
4. **Tuiles à KPI réels** : CRM (depuis `opportunities`), Devis & Factures (depuis `commercial_docs`), Temps & Activités (depuis `time_entries`)
5. **Tuiles placeholders** : Marketing, Support, Projets fournisseur, Compta, Trésorerie, RH, Rapports, Administration (KPI à 0 ou « — » par défaut)

#### Personnalisation
- Réorganisation drag-and-drop des tuiles (préférence par utilisateur, persistée localStorage)
- Masquage de tuiles non utilisées
- Choix du thème (clair par défaut, sombre disponible)

### 7.2 Navigation latérale

Sidebar persistante affichant :
- Logo Hub Astorya en haut
- 12 modules avec icône + libellé
- Recherche globale (Ctrl+K ou cliquer)
- Indicateur de présence (point vert si connecté)
- Menu utilisateur (en bas) : profil, paramètres, déconnexion

### 7.3 Recherche globale (Ctrl+K)

Recherche transversale dans :
- Clients (raison sociale, SIREN)
- Contacts (nom, prénom, email)
- Opportunités (référence, nom)
- Documents commerciaux (référence, libellé)
- Tickets (référence, sujet)
- Projets (référence, nom)

Résultats catégorisés, navigation au clavier (flèches + entrée).

### 7.4 Notifications

#### Pop-up hotline
- Apparaît automatiquement sur un ticket P1 entrant
- Son d'alerte (modifiable dans préférences)
- Acquittement obligatoire (clic pour confirmer)

#### Toasts
- En haut à droite, 3 secondes d'affichage par défaut
- Couleurs : vert (succès), rouge (erreur), orange (warning), bleu (info)
- Cliquable pour réafficher

#### Centre de notifications (à venir)
- Historique des 30 derniers événements
- Filtrage par type
- Marquage comme lu

---

## 8. CRM — PIPELINE COMMERCIAL

### 8.1 Vue d'ensemble

**Route** : `/crm`

Le module CRM est le cœur opérationnel du Hub. Il regroupe :
- Le **pipeline commercial** (kanban / liste / planning)
- La gestion des **prospects** et **clients**
- Les **actions à mener** (tâches commerciales priorisées)
- La **liste consolidée** comptes + contacts

### 8.2 KPI strip

Quatre indicateurs affichés en bandeau supérieur :

| KPI | Calcul | Couleur |
|---|---|---|
| Pipeline total | Somme `amount_eur` des opps actives | Bleu indigo |
| Pondéré (probabilité) | Somme `amount_eur × proba` des opps actives | Violet |
| Signées | Somme des opps en stage `won` | Vert |
| Total opportunités | Count des opps (toutes étapes sauf `lost`) | Bleu |

Mise à jour temps réel (Supabase Realtime).

### 8.3 Toggle vue : Kanban / Liste / Planning

#### Vue Kanban (par défaut)
- 5 colonnes SPANCO : Prospect, Approche, Négociation, Conclusion, Ordre
- Drag-and-drop entre colonnes (avec confirmation modale)
- Bouton ⇣ par colonne pour déployer (≈ 2 cartes visibles par défaut)
- Ascenseur vertical interne dans chaque colonne
- Persistance des préférences en localStorage

#### Vue Liste
- 8 colonnes : Opportunité, Client, Stage, Montant, Probabilité, Owner, Date de décision potentielle, Échéance contrat concurrent
- Tri par stage puis montant décroissant
- Code couleur d'urgence sur les échéances :
  - 🔴 Rouge : en retard
  - 🟠 Orange : J-7 (badge J-N)
  - 🟡 Jaune : J-30
  - ⚪ Gris : > 30 jours
- Cellule vide quand date non renseignée (plus de « — »)
- Clic sur ligne → ouvre `/avancer-opportunite`

#### Vue Planning (page séparée `/planning-commercial`)
- Calendrier mensuel style Outlook
- Grille 7 colonnes Lundi → Dimanche
- Navigation `‹ Aujourd'hui ›` (boutons mois)
- Événements en pilules colorées :
  - Violet : Date de décision potentielle
  - Cyan : Échéance contrat concurrent
- Pastille couleur stage SPANCO à gauche du nom
- Limite 3 événements par jour + lien « + N de plus » → popup détaillé
- Filtre : Toutes / Décision / Concurrent
- Numéro du jour cerclé rouge si aujourd'hui

### 8.4 Création d'opportunité

**Route** : `/nouvelle-opportunite` (ou modale)

#### Champs
- **Nom** (libre)
- **Client** (recherche + sélection ou création)
- **Montant estimé** (€ HT)
- **Stage initial** (Prospect par défaut)
- **Probabilité** (auto-renseignée selon le stage)
- **Date de décision potentielle**
- **Owner** (par défaut : utilisateur courant)
- **Besoin exprimé** (textarea libre)
- **Concurrent actuel** (si reconquête)
- **Notes internes**

#### Modale en pleine largeur
Toute la largeur de l'écran (au lieu d'une modale centrée étroite). Permet une saisie confortable, surtout pour le « besoin exprimé » et les notes.

#### Rattachement automatique
Si l'URL contient `?client=<id>`, le client est pré-rempli et verrouillé. Si `?opp=<ref>`, on bascule en édition.

---

## 9. GESTION DES PROSPECTS ET CLIENTS

### 9.1 Création d'un prospect

**Route** : `/nouveau-prospect`

#### Section 1 — Société
- **Raison sociale** : recherche temps réel via `recherche-entreprises.api.gouv.fr` (debounce 300ms)
- Au choix dans la liste : auto-remplissage de tous les champs
  - SIREN (formaté `XXX XXX XXX`)
  - SIRET du siège
  - Code NAF + libellé
  - Numéro TVA intracom (calculé à partir du SIREN)
  - Adresse complète siège
  - Code postal + ville
  - Tranche d'effectif (mappée sur 5 buckets : 1-50, 51-250, 251-1k, 1k-5k, 5k+)
  - Section et division NAF → secteur + sous-secteur
  - Slug Site web et LinkedIn estimés
- Bouton **× rouge** pour réinitialiser la sélection
- Vérification BODACC automatique (badge orange si redressement, rouge si liquidation)

#### Section 2 — Contact principal
**Auto-remplissage depuis les dirigeants** (open data INSEE/INPI) :
- **Premier dirigeant personne physique** → prénom (capitalisé), nom (UPPER), fonction (mappée via dictionnaire)
- **LinkedIn** : slug estimé `linkedin.com/in/<prenom-nom>`
- **Co-dirigeants** (jusqu'à 3) → ajoutés automatiquement comme co-contacts
- Bandeau bleu indigo « 🔍 Auto-complété depuis les dirigeants déclarés » avec bouton **Effacer**
- Email et téléphone laissés vides (données personnelles non publiques)

**Mapping qualité dirigeant → fonction** :
- Président / PDG / Directeur général → « CEO / Directeur général »
- Gérant / Co-gérant / Associé / Membre → « Gérant / Dirigeant »
- DAF / Directeur financier → « DAF / Directeur financier »
- Directeur général délégué → « COO / Directeur des opérations »
- Secrétaire général → « Secrétaire général »

#### Section 3 — Tier et établissements
- **Tier prospect** : A (compte tactique stratégique), B (cible standard), C (opportuniste)
- **Établissements secondaires** : ajout dynamique avec adresse + activité

#### Section 4 — Actions auto-créées
À la création, possibilité de générer automatiquement des actions :
- **Email d'introduction personnalisé** (priorité haute, J+5)
- **Appel de qualification** (priorité haute, J+3)
- **Invitation à un événement** (priorité moyenne, J+10)

### 9.2 Fiche client détaillée

**Route** : `/fiche-client?id=<client_id>`

#### Topbar
- Avatar initiales + raison sociale + statut
- SIREN + dernier check BODACC
- Boutons : **⬇ Exporter les données** (RGPD art. 20), **✎ Modifier**, **🗑 Supprimer**

#### Panneau « Informations compte » (3 cartes colorées)

##### Suivi commercial (fond indigo pâle)
- Owner attribué
- Dernière action commerciale + date
- Statut compte (Actif / Veille / Inactif)
- Score d'engagement (calculé)

##### Cycle de vie (fond vert pâle)
- Date de création de la fiche
- Ancienneté en années + mois
- Anniversaire compte (jour + mois)
- Date du dernier contact
- Date du dernier devis

##### Identité légale (fond gris pâle)
- SIRET du siège
- Code NAF + libellé
- TVA intracom
- Capital social (si renseigné)
- Forme juridique
- Adresse siège complète

#### Pipe contrats (kanban réduit)
- Vue compacte des opportunités du client (5 colonnes SPANCO)
- Drag-and-drop disponible
- Ascenseur vertical interne par colonne
- Bouton ⇣ pour déployer

#### Actions à mener (liste filtrée client)
- Affichage des actions liées à ce client uniquement
- Bouton « + Ajouter une action »
- Tri par priorité puis date d'échéance

#### Documents commerciaux liés
- Liste des devis, commandes, BL, factures de ce client
- Statut + total HT + lien d'ouverture

#### Contacts du client
- Liste des contacts (principal en premier)
- Bouton « + Ajouter un contact »
- Édition inline (nom, fonction, email, téléphone)

#### Historique (timeline)
- Toutes les actions, modifications de stage, créations de doc en chronologique inverse
- Filtres par type d'événement

### 9.3 Bouton mail → Outlook Web

Au clic sur l'icône email d'un contact :
- Téléchargement automatique de la plaquette Astorya PDF
- Ouverture d'**Outlook Web (OWA)** dans un nouvel onglet :
  `https://outlook.office.com/owa/?path=/mail/action/compose&to=<email>&subject=...&body=...`
- Pas de `mailto:` (qui nécessite un client mail local installé)
- Compose pré-rempli avec corps personnalisé selon le contact

---

## 10. WORKFLOW D'OPPORTUNITÉ SPANCO

### 10.1 Méthodologie SPANCO

**SPANCO** est une méthode de qualification commerciale en 5 étapes :
- **S**uspect → **P**rospect → **A**pproche → **N**égociation → **C**onclusion → **O**rdre

Dans Hub Astorya, on simplifie à 5 stages :
1. **Prospect** (Suspect/Prospect mergés) — 20 % probabilité
2. **Approche** — 35 %
3. **Négociation** — 55 %
4. **Conclusion** — 75 %
5. **Ordre** (gagné) — 100 %

Plus le stage `lost` (perdu, 0 %).

### 10.2 Page Avancer l'opportunité

**Route** : `/avancer-opportunite?opp=<ref>`

#### Stepper visuel (pilules rectangulaires)

5 pilules colorées style « workflow Sage Devis → Commande → BL → Facture » :

| Stage | Couleur | Letter | % Proba |
|---|---|---|---|
| Prospect | Gris #94a3b8 | P | 20 |
| Approche | Bleu #3b82f6 | A | 35 |
| Négociation | Violet #a855f7 | N | 55 |
| Conclusion | Orange #ea580c | C | 75 |
| Ordre | Vert #10b981 | O | 100 |

Pilules avec :
- Background coloré pleine pilule pour les étapes passées + courante
- Bordure colorée + fond clair pour la cible
- Halo coloré `box-shadow: 0 0 0 5px <color>33` sur l'étape courante
- Badge dynamique : **VALIDÉ** (passé), **ACTUELLE** (courant), **CIBLE** (sélectionné)
- Icône carrée à gauche (✓ ou Letter)
- Label + % sous chaque pilule
- Flèches **→** entre chaque pilule

Cliquables : étapes futures (avancement) et étape courante (retour).

#### Bloc Informations de l'opportunité

Champs éditables :
- Nom de l'opportunité (textarea 1 ligne)
- Montant estimé (€, numeric)
- Date de décision potentielle (date picker)
- Besoin exprimé (textarea 2 lignes)
- Concurrent actuel (input)
- Montant concurrent (k€/an, numeric)
- Échéance du contrat actuel chez le concurrent (date picker)
- Notes internes (textarea 2 lignes)

Tous éditables à tout moment, sauvegarde via le bouton **💾 Enregistrer** (sans changer d'étape).

#### Critères de passage

Pour chaque étape cible, une checklist de critères de sortie :

##### Critères pour passer en Approche
- [ ] SIREN renseigné
- [ ] Contact principal qualifié
- [ ] Besoin exprimé documenté
- [ ] Tier prospect défini

##### Critères pour passer en Négociation
- [ ] Rendez-vous client réalisé (présentiel ou visio)
- [ ] Cartographie des décideurs (≥ 3 personnes)
- [ ] Budget identifié (fourchette ou exact)
- [ ] Concurrent identifié + offre concurrente analysée

##### Critères pour passer en Conclusion
- [ ] Devis chiffré envoyé
- [ ] Présentation commerciale réalisée
- [ ] Objections principales traitées
- [ ] Date de décision validée

##### Critères pour passer en Ordre
- [ ] Conditions juridiques arrêtées
- [ ] Bon de commande / Contrat d'engagement / Dossier de financement signé
- [ ] Signataire confirmé
- [ ] Modalités de paiement validées

Si tous les critères ne sont pas validés, une modale de confirmation propose d'avancer malgré tout (avec log dans l'historique).

#### Panneau Santé de l'opportunité

Score sur 100 calculé à partir de :
- **Critères validés** (poids 50 %)
- **Probabilité du stage cible** (poids 50 %)

Libellé qualitatif :
- 🟢 **Saine** : score ≥ 70
- 🟡 **À surveiller** : score 40–69
- 🔴 **À risque** : score < 40

#### Panneau Impact si passage

Affichage Avant/Après :
- **Avant** : montant × probabilité actuelle (barré)
- **Après** : montant × probabilité du stage cible (en gras)
- **Gain pondéré** : différence (vert si positif, rouge si négatif)

### 10.3 Actions automatiques créées à chaque transition

| Transition | Action créée | Échéance | Priorité | Tag |
|---|---|---|---|---|
| Prospect → Approche | 📝 Préparation de la rédaction de l'offre commerciale | J+7 | Haute | Préparation offre (bleu) |
| Approche → Négociation | ✉ Envoi de l'offre commerciale | J+5 | Haute | Offre commerciale (violet) |
| Négociation → Conclusion | (À configurer) | | | |
| Conclusion → Ordre | Cascade automatique (cf. ci-dessous) | | | |

Chaque action est rattachée au client + à l'opportunité, et affichée dans le bloc « Actions à mener » du CRM Pipeline et de la fiche client.

### 10.4 Cascade automatique au passage en Ordre

Au passage en stage `won` (Ordre), le système déclenche automatiquement :

1. **Marquage de tous les devis non-transformés** de cette opp en statut `accepté`
2. **Transformation cascade** :
   - Chaque devis accepté → création d'une commande
   - Chaque commande → création d'un BL (bon de livraison)
3. **Création automatique d'un projet** dans le module Projets & Livrables (si aucun déjà lié)
4. **Toast de récap** : « ✓ Opp passée en Ordre · N devis → commande · N BL créés · projet PRJ-XXXX créé »

### 10.5 Boutons d'action

| Bouton | Couleur | Action |
|---|---|---|
| 💾 Enregistrer | Vert ghost | Sauvegarde les champs sans changer d'étape |
| 📄 Créer un devis | Orange ghost | Ouvre `/gestion-commerciale` pré-rempli |
| 📋 Devis en cours | Bleu ghost | Raccourci vers les devis liés au client |
| 🗑 Supprimer | Rouge ghost | Suppression définitive avec confirmation |
| ✕ Marquer comme perdu | Rouge plein | Passe à 0 % proba, stage `lost` |
| ✓ Confirmer le passage | Bleu indigo plein | Déclenche l'avancement SPANCO |

---

## 11. GESTION COMMERCIALE (DEVIS → COMMANDE → BL → FACTURE)

### 11.1 Workflow Sage-like

**Route** : `/gestion-commerciale`

Quatre types de documents reliés par une chaîne de transformation :

```
Devis (DEV-2026-NNNN) [Brouillon → Envoyé → Accepté → Transformé]
   ↓
Commande client (CMD-2026-NNNN) [Brouillon → Acceptée → En cours → Transformée]
   ↓
Bon de livraison (BL-2026-NNNN) [Brouillon → En préparation → Livré → Transformé]
   ↓
Facture (FAC-2026-NNNN) [Brouillon → Émise → Payée]
```

#### Règles de transformation
- Un **devis** doit être **Accepté** pour être transformé en commande
- Une **commande** doit être **Acceptée** pour générer un BL
- Un **BL** doit être **Livré** pour produire une facture
- **Lignes et champs restent éditables** après transformation (ajout / modification / suppression autorisés sauf si statut figé)

#### Devis figé
Dès qu'un devis est en statut **Accepté** ou **Transformé**, il bascule en lecture seule avec :
- Bandeau « Devis figé · Doc transformé — lignes & champs restent éditables »
- Pastilles cliquables BC / BL au bandeau pour ouvrir les documents enfants
- Boutons d'édition désactivés sauf pour les éditeurs ligne autorisés

#### Synchronisation bidirectionnelle Commande ↔ BL
Quand un utilisateur modifie une ligne sur la commande **ou** le BL, l'autre document est synchronisé automatiquement (dernière modification gagne). Toast d'information : « ↔ Commande et BL synchronisés ».

### 11.2 Layout de la page

#### Sidebar gauche
- Bouton proéminent **+ Nouveau devis**
- Onglets : Devis (compteur), Commandes client, Bons livraison, Factures
- Section Administration : Catalogue & paramètres → `/gestion-commerciale-admin`

#### Topbar
- Titre du module + nombre de documents + somme TTC
- Barre de recherche (raison sociale, référence, titre)
- Filtre par plage de dates
- Bouton **+ Nouveau**

#### KPI strip
- Total HT
- Total TTC
- En attente (compte des documents pending)
- Documents (compteur global)

#### Filtres
- Onglets : Tous / Brouillons
- Recherche : « raison sociale ou CLIxxx »
- Plage de dates : DATE [du] → [au]

#### Liste de documents (centre)

Colonnes :
- Référence (cliquable)
- Code raison sociale (CLI-XXXX)
- Date de la pièce
- Nom de la raison sociale + Titre du document
- Montant HT
- Statut (pastille colorée)

#### Panneau prévisualisation (droite, sticky)

Au clic sur un document, affichage live :
- Référence + statut + horloge mise à jour
- Workflow Sage en cours (D → C → B → F avec pastilles colorées)
- Client + date
- Lignes du document (libellé + SKU + qty × PU)
- Bouton **Ouvrir** plein écran
- Totaux HT / TVA / TTC

### 11.3 Édition d'un document

#### En-tête
- Référence (cliquable pour copier)
- Type (badge coloré)
- Client (recherche + sélection)
- Date de la pièce
- Validité (devis) ou Échéance (facture)
- Statut (sélecteur)

#### Section Conditions commerciales
- Délai de paiement (selecteur dropdown)
- Acompte demandé (% ou montant fixe)
- Pénalités de retard (taux standard 10 %)
- Conditions particulières (textarea libre)

#### Section Lignes

Pour chaque ligne :
- **N° ligne** (automatique)
- **N° article** (recherche catalogue ou libre)
- **Désignation** (auto-remplie depuis le catalogue, en lecture seule si article catalogue)
- **Description (champ libre)** : ajout d'un texte enrichi (gras, italique, souligné) repris à l'identique sur le PDF
- **Quantité** + **Unité**
- **Prix unitaire HT**
- **Remise %** (optionnelle)
- **Taux TVA** (sélecteur)
- **Total HT** (calculé)
- **Référence constructeur (interne — non imprimée)**
- **Fournisseur (interne)**
- **Prix d'achat indicatif (interne — non imprimé)** : marge calculée automatiquement

Lignes ajoutables via :
- Bouton **+ Ligne libre**
- Bouton **🔍 Rechercher un article…** (modale smart search avec IA)
- Sélecteur **+ Ajouter article du catalogue**

#### Section Note interne (visible techniciens uniquement)

Bloc jaune ocre sous les totaux avec :
- Badge 🔒 « Note interne — visible techniciens uniquement »
- Badge NON IMPRIMÉE (jamais affichée sur le PDF client)
- Textarea 5 lignes (configs techniques, accès admin, contraintes infra, contacts internes)
- Compteur caractères
- Propagation automatique de devis → commande → BL → facture lors des transformations

#### Section Totaux

Tableau récapitulatif HT / TVA / TTC en bas à droite.

#### Boutons d'action

- **💾 Enregistrer** (vert)
- **📄 Aperçu PDF** (rouge)
- **📧 Envoyer par email**
- **🖨 Imprimer**
- **🔄 Transformer en …** (selon le type courant)
- **🗑 Supprimer**

### 11.4 Génération PDF du devis

Layout détaillé du PDF :

#### Header
- Logo Astorya SVG (300 × 85 px) en haut à gauche
- Identité société émettrice (ASTORYA SGI + SIRET) à droite
- Bande rouge fine de séparation

#### Bloc identification (sous le header)
- Cadre société émettrice (gauche) : raison sociale, adresse, SIRET, contacts
- Cadre destinataire (droite) : raison sociale client, adresse, SIREN, contact principal
- Date de la pièce + Validité + Référence (centré)

#### Tableau lignes
- Colonnes : N°, Article, Désignation, Qté, PU HT, Montant HT
- Lignes texte-only en italique grisé
- Description champ libre reprise à l'identique
- Total HT en bas

#### Tableau récap TVA (gauche)
- Code (T20, T10, T5.5, T2.1, T0)
- Base HT
- Taux TVA (%)
- Montant TVA
- **Montant TTC** (par taux)

#### Bloc Totaux (droite)
- Total HT
- Total TVA
- **Total TTC**
- **NET A PAYER** (noir/blanc highlighté en bas)

#### Bloc signature (footer dernière page uniquement)
- « Devis suivi par : <nom commercial> · email · tel »
- « IBAN : FR76 XXXX · BIC : XXXX »
- « Bon pour accord · Date · Signature »

#### Footer (toutes pages)
- 3 colonnes contacts : Service Commercial / Administratif / Comptabilité
- Réserve de propriété (mention légale)
- Pagination « Page N / M »

#### Verso des devis : CGV ASTORYA 2025
- **Saut de page** automatique (`pageBreak: "before"`)
- Titre rouge centré « CONDITIONS GÉNÉRALES DE VENTE »
- Sous-titre identité Astorya SGI + SIRET
- **10 articles répartis en 2 colonnes** justifiées
- fontSize 7 pour tenir sur 1 page
- Articles : Acceptation de la commande, Réserve de propriété, Types et modèles, Prix et paiement, Litiges et retour, Service après-vente, Limitation de responsabilité, Loi applicable, Modification des CGV, Données personnelles

Uniquement pour les **devis** (pas pour les commandes, BL ou factures).

### 11.5 Catalogue articles

**Route** : `/gestion-commerciale-admin`

#### Familles uniformisées
- HUB (Astorya Hub)
- MAINT (Maintenance informatique)
- HEBE (Hébergement)
- TEL (Téléphonie)
- IMPR (Impression / Page Pack)
- LIC (Licences logicielles)
- MAT (Matériel)
- SVC (Services divers)

#### Codes au format `<FAMILLE>-<MARQUE>-<MODÈLE>`
Exemples :
- `AST-HUB-USR` (Astorya Hub utilisateur)
- `AST-CYBER` (Module Cyber)
- `MAINT-HP-EB840` (Maintenance HP EliteBook 840)
- `TEL-3CX-EXT` (Extension 3CX)

#### 95 articles dédupliqués (version 3)
Désignations en sentence case strict, pas d'all-caps. Champs annexes :
- Référence fournisseur (interne, jamais imprimée)
- Prix d'achat indicatif (interne, calcul marge)
- Stock disponible (si géré)

#### Smart search avec IA
- Recherche dans le catalogue par mots-clés
- Si aucun résultat : suggestion par LLM Anthropic (création de ligne libre pré-rempli)
- Possibilité de créer un nouvel article catalogue depuis la modale

---

## 12. CONTRATS ET SIGNATURE ÉLECTRONIQUE

### 12.1 Page Nouveau contrat

**Route** : `/nouveau-contrat`

5 sections successives avec stepper en pilules :

#### Stepper SPANCO contrat

| Stage | Couleur | Letter | % |
|---|---|---|---|
| Type & rattachement | Gris #94a3b8 | T | 15 |
| Client & contact | Bleu #3b82f6 | C | 35 |
| Produits & pricing | Violet #a855f7 | P | 60 |
| Conditions juridiques | Orange #ea580c | J | 85 |
| Signature & envoi | Vert #10b981 | S | 100 |

Calcul automatique de l'étape courante selon le remplissage du formulaire.

#### Section 1 — Type & rattachement
- **Type de contrat** : Abonnement SaaS / Licence perpétuelle / Prestation / Renouvellement
- **Catégorie** : Nouveau / Extension / Upsell
- **Opportunité d'origine** (auto-rattachement si `?opp=`)
- Reprise automatique des conditions négociées (montant, durée, etc.)

#### Section 2 — Client & contact signataire
- **Entité contractante** : auto-remplie depuis le client
- **Signataire habilité** :
  - Choix dans la liste des contacts existants (dropdown)
  - Ou création inline (prénom, nom, fonction, email, téléphone)
- Bouton **+ Ajouter un nouveau contact pour ce client**

#### Section 3 — Produits & pricing
- **Lignes catalogue éditables** : libellé, SKU, PU HT, Qté, périodicité (annuel/oneshot)
- **Conditions commerciales** :
  - Durée d'engagement (12 / 36 / 60 mois)
  - Tacite reconduction (préavis 90 j ou désactivée)
  - Indexation annuelle (Aucune / SYNTEC / INSEE IPC, plafonnée à N %)
  - Délai paiement (15 j / 30 j net / 45 j fdm / 60 j)
  - Périodicité facturation (Mensuel / Trim. / Trim. terme à échoir / Annuel avance)
- **Récapitulatif financier** : Sous-total abonnement / Sous-total services / Total HT année 1 / TVA / Total TTC année 1
- **Bloc TCV** (Total Contract Value sur la durée d'engagement) avec coûts estimés + marge nette

#### Section 4 — Conditions juridiques & dates
- **Date de début** (défaut : 1er du mois prochain)
- **Date de fin** (auto-calculée selon la durée)
- **Devise** : EUR verrouillée
- **Modèle juridique** (CGV PDF uploadé via administration)
- **Annexes** : SLA niveau Premium, DPA RGPD, RIB, autres (modifiables)
- **Clauses spécifiques** négociées (tag NÉGOCIÉ + texte libre)

##### Panneau « 📑 Articles du contrat » (16 articles éditables)

Ouvert par défaut, accessible aussi via raccourci topbar « 📑 Articles du contrat [16] ».

Liste des 16 articles pré-remplis depuis `window.HubContractArticles` (extraits du Contrat de Services Hub Astorya) :

1. Objet du contrat
2. Durée et reconduction
3. Description des prestations (hébergement, BDD, SSL, sauvegardes, maintenance, TMA, support)
4. Tarification et facturation
5. Niveaux de service (SLA) — P1, P2, P3
6. Obligations du Prestataire
7. Obligations du Client
8. Responsabilité (plafond 1× CA annuel)
9. Restauration et remise en fonctionnement (3 paliers tarifaires)
10. Propriété intellectuelle
11. Confidentialité
12. Assurances (cyber obligatoire)
13. Résiliation
14. Force majeure
15. Droit applicable et juridiction
16. Dispositions diverses

Chaque article :
- Header cliquable (badge violet « Art. N » + titre + badge MODIFIÉ si edited)
- **Textarea monospace** pleine largeur (`font-family: 'SF Mono', Consolas, monospace`)
- Hauteur auto : `Math.min(20, Math.max(6, body.split("\n").length + 1))` lignes
- Compteur caractères / mots
- Bouton **↺ Restaurer le texte original** si modifié

Les diffs (`articles_overrides`) sont sauvegardés avec le contrat. Le PDF généré utilise les versions modifiées au lieu du modèle standard.

#### Section 5 — Signature & workflow

Trois modes de signature :

| Mode | Description | Délai moyen | Valeur juridique |
|---|---|---|---|
| ✍ Signature électronique qualifiée | Via DocuSign (eIDAS) | 2 jours | Probante |
| 📧 Signature simple | Scan retour PDF | 5 jours | Acceptable < 50 k€ |
| 🖋 Signature manuscrite | Original papier, RDV physique | 10–15 jours | Probante |

**Bandeau d'aperçu PDF** rosé avec :
- Titre « 📄 Aperçu du contrat pré-rempli »
- Sous-titre dynamique selon mode choisi : « électronique qualifiée DocuSign » / « simple par scan retour » / « manuscrite — original papier »
- Bouton **📄 Voir l'aperçu PDF complet** (déclenche la génération)

### 12.2 Génération PDF du contrat

#### Détection automatique du modèle
6 types de contrats :
- **Hébergement** (hosting) : patterns SKU `HOST, HEBE, SERV, TSE, 365, EXCH, M365`
- **Téléphonie** (phone) : `TEL, PHONE, ABO, 4G, SDA, FIBRE, ADSL, VDSL, SDSL`
- **Maintenance** (maintenance) : `MAINT, HOTLINE, SUPPORT, ASSIST, INFOG, NAS`
- **Service** (service) : `SVC, SERV, PREST`
- **Page Pack** (page_pack) : `PAGE, PACK, PRINT, COPI, MFP, TONER`
- **Auto** : détection automatique selon les SKU des produits

#### Contenu PDF
- Header logo + titres (CONTRAT D'HÉBERGEMENT / TÉLÉPHONIQUE / etc.)
- Sous-titre « Conditions Particulières »
- Identification des parties (Prestataire ASTORYA + Client avec champs vides à remplir si non renseignés)
- Description de la prestation
- Tableau capacité (volume serveur / abonnements / parc / volume pages selon type)
- Conditions financières (coût mensuel + tableau facturation + périodicité + email facturation)
- Conditions particulières (sites couverts, durée + tacite, référent client, délai paiement, indexation)
- Bloc signature (Fait à / Le / Cachet et signature)
- **16 articles personnalisés** (depuis le panneau dépliable) — remplacent les CGV génériques quand `payload.articles` est fourni
- Mandat SEPA (selon type, pré-rempli)
- Footer pagination + identité Astorya

### 12.3 Workflow signature

1. **Aperçu PDF** par le commercial
2. **Envoi pour signature** via DocuSign (mode qualifiée) ou email PDF
3. **Création automatique d'une action de suivi** « Suivi signature contrat CTR-XXXX » (5 jours)
4. **Notification** au commercial quand signé
5. **Mise à jour du statut contrat** : `signed`
6. **Déclenchement de la cascade** : création projet, première facture, etc.

---

## 13. PLANNING COMMERCIAL

### 13.1 Vue calendrier mensuel

**Route** : `/planning-commercial`

#### Structure
- Grille 7 colonnes Lundi → Dimanche
- 5 à 6 lignes (semaines du mois)
- Cellules jour 110 px de haut

#### Navigation
- Bouton **‹** : mois précédent
- Bouton **Aujourd'hui** : retour au mois courant
- Bouton **›** : mois suivant
- Affichage du mois courant en grand à droite

#### Cellules
- Numéro du jour en haut à gauche
- Cerclé rouge si aujourd'hui
- Fond gris pâle pour les week-ends et jours hors-mois
- Compteur d'événements en haut à droite

#### Événements (pilules colorées)
- **Violet** : Date de décision potentielle (close_date)
- **Cyan** : Échéance contrat concurrent (contract_end)
- Bordure gauche colorée + fond pastel
- Pastille couleur stage SPANCO devant le nom
- Texte tronqué avec ellipsis si trop long
- Tooltip au survol : nom complet + client + type + montant

#### Limite et popup détaillé
- **3 événements max** affichés par cellule
- Lien **« + N de plus »** ouvre une popup centrée
- Popup : tous les événements du jour avec montant + stage + type, cliquables

#### Filtres
- **Toutes les échéances**
- **Décision potentielle uniquement**
- **Contrat concurrent uniquement**

#### Légende
- Pastille violet « Date de décision potentielle »
- Pastille cyan « Échéance contrat concurrent »

### 13.2 Source de données

- `api.opportunities.list()` (même flux que CRMPipeline)
- Opportunités perdues (stage `lost`) exclues
- Chaque opp génère 1 ou 2 entrées selon les dates renseignées
- Tri chronologique ascendant

### 13.3 Cas d'usage

- **Préparation de relances** : voir les fins de contrat concurrent à 30 jours et déclencher la relance
- **Pilotage du mois** : visualiser la charge des dates de décision potentielles
- **Reporting hebdomadaire** : compter les opps à conclure cette semaine
- **Anticipation creux** : identifier les périodes sans deal pour intensifier la prospection

---

## 14. TICKETS ET HOTLINE 3CX

### 14.1 Module Ticketing

**Route** : `/ticketing`

#### Liste des tickets
Filtres en bandeau :
- **Priorité** : P1 (critique), P2 (haute), P3 (normale), P4 (basse)
- **Statut** : Ouvert / En cours / En attente client / Résolu / Clos
- **Type** : Incident / Demande / Question / Bug / Suggestion
- **Owner** : assigné à
- **Client** : tous ou spécifique

#### Compteur P1
Badge clignotant rouge si > 0 ticket P1 ouvert. Visible depuis toutes les pages dans la sidebar.

#### Création d'un ticket
- **Sujet** (libre)
- **Client** (recherche + sélection)
- **Contact** (parmi les contacts du client)
- **Priorité** : selon impact (SLA déclenché automatiquement)
- **Type**
- **Description** (textarea avec rich-text)
- **Pièces jointes** (drag-and-drop)
- **Assigné à** (sélecteur technicien)

#### Détail d'un ticket

Layout 2 colonnes :

##### Gauche : Timeline
- Création du ticket (date + auteur)
- Échanges chronologiques (messages client, réponses technicien, modifications de statut)
- Pièces jointes embarquées
- Logs d'actions (escalade, réassignation, fermeture)

##### Droite : Méta
- Référence TKT-XXXX
- Statut + Priorité + SLA restant
- Client + contact (cliquables)
- Type + Catégorie
- Assigné à (modifiable)
- Date de création + Date de dernière maj
- Procédure standard (badge à appliquer)

#### Procédure badge

Sur chaque ticket, badge cliquable indiquant la procédure standard à suivre :
- **RAS** : pas d'intervention, qualification suffisante
- **Escalade N2** : remontée au technicien senior
- **Intervention sur site** : déplacement nécessaire
- **Devis nécessaire** : prestation hors contrat → bascule en gestion commerciale

Chaque badge déclenche une checklist de qualification.

### 14.2 Hotline 3CX

#### Hotline popup

Notification temps réel :
- **Pop-up clignotant rouge** sur P1 entrant
- **Toast bleu** sur P2
- Son d'alerte (configurable)
- Affichage de :
  - Numéro de téléphone appelant
  - Nom du client (si reconnu dans la base)
  - Sujet déclaré
  - Lien direct **« Ouvrir le ticket »**
- **Acquittement obligatoire** (clic pour confirmer prise en charge)

#### Intégration 3CX Web Client

- Au clic sur l'icône téléphone d'un contact : ouverture de 3CX Web Client dans un onglet séparé avec deep-link dialer
- URL : `https://telcomastorya.my3cx.fr:5001/webclient/#/dialer/<tel>`
- Configuration du serveur 3CX dans `app_settings` (clé `3cx_server_url`)
- Pas besoin d'installer un client local

### 14.3 SLA contractuel

Délais de réponse et de résolution par formule :

| Formule | P1 (critique) | P2 (haute) | P3 (normale) | P4 (basse) |
|---|---|---|---|---|
| Essentiel | Prise en compte 4h, résolution 8h | 8h ouvrées | 2 j ouvrés | 5 j ouvrés |
| Business | Prise en compte 2h, résolution 4h | 4h ouvrées | 1 j ouvré | 3 j ouvrés |
| Premium | Prise en compte 1h, résolution 2h | 2h ouvrées | 4h ouvrées | 1 j ouvré |

Le SLA est affiché en temps réel sur chaque ticket avec un compte à rebours. Dépassement → escalade automatique + notification manager.

### 14.4 Notifications Teams

Webhook Teams configurable pour recevoir les alertes critiques (P1 entrant, SLA dépassé, ticket fermé important) dans un canal dédié.

---

## 15. PROJETS ET LIVRABLES

### 15.1 Vues multiples

5 routes proposant différentes représentations :

| Route | Vue | Usage |
|---|---|---|
| `/projets` | Liste maîtresse | Gestion globale, tri / filtre |
| `/projets-tableau` | Table triable | Vue analytique avec colonnes paramétrables |
| `/projets-kanban` | Kanban par statut | Pilotage opérationnel par phase |
| `/projets-calendrier` | Calendrier mensuel | Planning de charge |
| `/projets-gantt` | Diagramme de Gantt | Dépendances et chemin critique |
| `/projet?id=<id>` | Détail projet | Fiche complète d'un projet |

### 15.2 Auto-création depuis opportunité

Quand une opportunité passe en stage `won` (Ordre), un projet est automatiquement créé avec :
- `name` = nom de l'opportunité
- `client_id` = client de l'opp
- `opportunity_id` = ref de l'opp
- `status` = "Prévu"
- `responsible` = owner de l'opp
- `start_date` = aujourd'hui
- `end_date` = aujourd'hui + 90 jours (configurable)
- `commercial_docs` = refs des devis/commandes/BL

### 15.3 Statuts de projet

| Statut | Couleur | Description |
|---|---|---|
| Prévu | Gris | Projet créé, pas encore démarré |
| En cours | Bleu | Travaux en cours |
| En pause | Orange | Suspendu (client en retard, blocage technique) |
| Terminé | Vert | Livraison validée |
| Annulé | Rouge | Abandon (avec motif obligatoire) |

### 15.4 Phases et jalons

Chaque projet contient des phases :
- **Nom de la phase**
- **Date de début + Date de fin**
- **Responsable**
- **Statut de phase**
- **Pourcentage d'avancement**
- **Dépendances** (autre phase à terminer avant)

Le diagramme de Gantt visualise toutes les phases avec leurs dépendances.

### 15.5 Modale AssetInventory

Pour rattacher du stock matériel à un projet :
- Sélection multiple d'actifs disponibles
- Affectation au projet (réservation)
- Sortie effective à la livraison
- Mise à jour automatique du stock

### 15.6 Compteur d'heures consommées

Liaison avec le module Temps & Activités :
- Total des heures saisies sur ce projet
- Répartition par technicien
- Comparaison heures vendues vs heures consommées
- Alerte si dépassement > 110 %

---

## 16. TEMPS ET ACTIVITÉS

### 16.1 Saisie temps

**Route** : `/temps-activites`

#### Vues
- **Jour** : grille horaire vue journée
- **Semaine** : 7 colonnes lundi → dimanche
- **Mois** : calendrier mensuel avec total par jour

#### Catégories de temps
- **Production** : intervention client facturable
- **Avant-vente** : démo, étude, devis
- **Support** : hotline, tickets non facturables
- **Administratif** : tâches internes
- **Formation** : montée en compétences
- **Congés / Absences**

### 16.2 Rattachement à un projet / ticket

Chaque entrée de temps peut être rattachée à :
- **Client** (obligatoire si production)
- **Projet** (optionnel)
- **Ticket** (optionnel)
- **Opportunité** (optionnel)

### 16.3 Validation manager

Workflow :
1. Saisie collaborateur (statut `draft`)
2. Soumission manager (statut `submitted`)
3. Validation ou refus avec motif (statut `validated` ou `rejected`)
4. Export pour paie (statut `paid`)

### 16.4 Exports

- **CSV** : compatible Sage, Cegid, etc.
- **PDF** : récap mensuel par collaborateur
- **XLSX** : tableau croisé dynamique

---

## 17. STOCK ET CATALOGUE PRODUITS

### 17.1 Inventaire des actifs

**Route** : `/stock`

#### Catégories d'actifs
- **Matériel** : PC, serveurs, périphériques, réseau
- **Licences logicielles** : Microsoft 365, Adobe, antivirus
- **Consommables** : toners, cartouches
- **Outils** : équipement technicien

#### Mouvements
- **Entrée** : réception fournisseur
- **Sortie** : livraison client / consommation interne
- **Transfert** : entre dépôts
- **Réservation** : pour un projet en cours
- **Retour** : matériel récupéré

### 17.2 Liaison fournisseur

Table `suppliers` avec :
- Raison sociale
- Coordonnées (adresse, tél, email, site)
- Conditions commerciales (délais paiement, remise)
- Contact privilégié

Combo dynamique sur les lignes catalogue pour associer un fournisseur à chaque article.

### 17.3 Catalogue (95 articles)

Comme détaillé en section 11.5 :
- Familles uniformisées
- Codes au format `<FAMILLE>-<MARQUE>-<MODÈLE>`
- Désignations en sentence case
- Référence fournisseur + prix d'achat indicatif (jamais imprimés)

---

## 18. COMPTABILITÉ ET TRÉSORERIE

### 18.1 Facturation

**Route** : `/facturation`

#### Émission de factures
- Génération automatique depuis BL livré
- Édition manuelle possible (rare)
- Numérotation continue FAC-YYYY-NNNN
- Statuts : Brouillon, Émise, Envoyée, Payée, Annulée

#### Mention obligatoires (auto-ajoutées)
- N° SIREN + APE + TVA intracom
- Mention « TVA non applicable, article 293 B du CGI » si applicable
- Mention « Pénalité de retard égale à 3 fois le taux d'intérêt légal en cas de retard de paiement »
- Indemnité forfaitaire de 40 € pour frais de recouvrement

### 18.2 Comptabilité

**Route** : `/comptabilite`

#### Export FEC (Fichier des Écritures Comptables)

Format normalisé (LF n°2013-1117) conforme aux exigences DGFIP :
- 1 ligne par écriture, séparateur pipe `|`
- Champs : Code journal, Date écriture, Libellé, etc.
- Période sélectionnable (exercice complet ou trimestre)
- Export téléchargeable .txt

#### Rapprochement bancaire
- Import OFX / CSV bancaire
- Matching automatique factures ↔ encaissements
- Validation manuelle des cas litigieux

### 18.3 Trésorerie

**Route** : `/tresorerie`

#### Tableau de bord ARC (Avenir Recouvrement Clients)
- **Encours total** : somme des factures non payées
- **Échu** : factures dépassant la date d'échéance
- **À échoir** : factures à venir
- **Vieillesse** : répartition par âge (0–30 j, 30–60 j, 60–90 j, > 90 j)

#### Relances automatiques
- **J+15** : relance amiable email
- **J+30** : relance ferme email + appel
- **J+45 fdm** : mise en demeure recommandée
- **J+60** : dossier contentieux (huissier ou ARC pro)

#### Graphes
- CA mensuel sur 12 mois glissants
- Marge brute par client
- Créances par âge (waterfall)
- Trésorerie prévisionnelle (3 mois)

---

## 19. MARKETING ET INTELLIGENCE CONCURRENTIELLE

### 19.1 Marketing

**Route** : `/marketing`

#### Campagnes
- **Email** : newsletters, prospection ciblée
- **Événements** : participation salons, webinars, ateliers
- **Contenu** : articles de blog, livres blancs, études de cas

#### Tracking des leads
- Source de chaque prospect (campagne, événement, recommandation, organique)
- Coût d'acquisition par canal
- Taux de transformation par source

#### Brouillons IA
Génération automatique d'emails d'introduction personnalisés par contact :
- Nom + fonction du contact intégrés
- Référence au besoin exprimé
- Ton adapté au tier (A = haut de gamme, B = standard, C = direct)
- Plaquette PDF Astorya en pièce jointe (téléchargement automatique avant ouverture OWA)

### 19.2 Intelligence concurrentielle

**Route** : `/intelligence-concurrentielle`

#### Battle cards
Une fiche par concurrent identifié (Salesforce, Pega, Sage, etc.) :
- **Forces** : ce qu'il fait bien
- **Faiblesses** : où il pèche
- **Pricing comparé** : grille tarifaire et écarts
- **Cas clients gagnés contre** ce concurrent
- **Discours commercial** : arguments à utiliser
- **Veille produit** : nouveautés à surveiller

### 19.3 Fins de contrats concurrents

**Route** : `/fins-contrats-concurrents`

Vue dédiée des opportunités avec le champ `contract_end` (échéance contrat actuel chez le concurrent) renseigné :
- Tri par urgence (échéance la plus proche en premier)
- Filtre par concurrent
- Action recommandée : relance 90 jours avant fin
- Bouton **+ Créer relance** → génère une action automatique

---

## 20. RESSOURCES HUMAINES

### 20.1 Annuaire collaborateurs

**Route** : `/ressources-humaines`

- Fiche par collaborateur :
  - Photo, nom, prénom, fonction
  - Date d'entrée, ancienneté
  - Manager hiérarchique
  - Équipe / Service
  - Coordonnées professionnelles
  - Coordonnées personnelles (confidentielles)

### 20.2 Onboarding / Offboarding

#### Onboarding (arrivée)
Checklist :
- [ ] Création compte Hub Astorya
- [ ] Attribution rôle
- [ ] Configuration poste de travail
- [ ] Création compte 3CX
- [ ] Création boîte mail @astorya.fr
- [ ] Formation au Hub (1 session)
- [ ] Présentation équipe
- [ ] Document de bienvenue remis

#### Offboarding (départ)
Checklist inverse :
- [ ] Désactivation compte Hub
- [ ] Récupération matériel
- [ ] Désactivation 3CX
- [ ] Transfert boîte mail au manager
- [ ] Entretien de sortie

### 20.3 Compétences et certifications

- Liste des compétences techniques (Microsoft, Cisco, AWS, etc.)
- Date d'obtention + Date d'expiration des certifications
- Alerte 90 jours avant expiration
- Plan de formation annuel

### 20.4 Équipe commerciale

**Route** : `/equipe-commerciale`

Vue dédiée des commerciaux avec leurs KPI individuels :
- **CA généré** sur la période
- **Taux de transformation** opportunités → clients
- **Panier moyen** des deals signés
- **Opportunités en cours** + montant pondéré
- **Activité** : appels passés, RDV réalisés, devis émis
- **Classement** mensuel et annuel

---

## 21. REPORTING ET TABLEAUX DE BORD

### 21.1 Rapports

**Route** : `/rapports`

#### Types de rapports
- **Hebdomadaire** : pipeline, deals signés, tickets, temps saisi
- **Mensuel** : CA, marge, ARC, performance équipe
- **Trimestriel** : forecast, taux de transformation, qualité service
- **Annuel** : bilan, prévisionnel N+1

#### Génération
- Choix de la période (date picker)
- Choix des sections (cases à cocher)
- Format de sortie : PDF, XLSX, PPTX

### 21.2 Indicateurs clés

| Indicateur | Calcul | Cible |
|---|---|---|
| Taux de transformation | Deals signés / Opps créées | > 25 % |
| Panier moyen | CA total / Nb deals | Variable selon BU |
| Délai moyen de vente | Date won - Date création | < 60 jours |
| Marge brute | (Prix vente - Coût) / Prix vente | > 35 % |
| Taux d'attrition annuel | Clients perdus / Total clients | < 8 % |
| NPS | Recommandation client | > 50 |

---

# PARTIE III — ADMINISTRATION ET EXPLOITATION

## 22. ADMINISTRATION UTILISATEURS

### 22.1 Page admin utilisateurs

**Route** : `/administration-utilisateurs`

#### Liste des utilisateurs
- Avatar + nom + email + rôle + statut
- Date de dernière connexion
- Actions : Modifier, Désactiver, Réinitialiser mot de passe, Révoquer sessions

#### Création d'utilisateur
- Email professionnel
- Prénom + Nom
- Rôle (admin / commercial / technicien / comptable / lecture)
- Manager hiérarchique (optionnel)
- Mot de passe initial (envoyé par email à l'utilisateur)
- Forcer changement à la première connexion

### 22.2 Templates CGV (contrats)

Upload de templates PDF de contrats. Pour chaque template :
- Nom (ex: « CGV Astorya Suite v4.2 — FR »)
- Version
- PDF source uploadé
- Extraction de texte automatique pour l'aperçu
- Flag `is_default` (un seul actif à la fois)

### 22.3 Bouton « 🧹 Purger opportunités »

Pour les admins uniquement. Supprime toutes les opportunités de la base + localStorage pour vider les données test.

Sécurités :
- Triple confirmation avec saisie de « SUPPRIMER » en majuscules
- Action irréversible
- Log audit créé

### 22.4 Mapping contrats

**Route** : `/administration-contrats-mapping`

Configuration des règles de détection automatique du modèle de contrat selon les SKU produits dans une opportunité.

Pour chaque règle :
- **Pattern SKU** (regex ou substring, ex: `HOST`, `M365`)
- **Modèle cible** (hosting, phone, maintenance, service, page_pack)
- **Score** (priorité si plusieurs règles matchent)

Permet d'éviter de choisir manuellement le modèle à chaque création de contrat.

---

## 23. PARAMÉTRAGE AVANCÉ

### 23.1 Paramètres système

Table `app_settings` (clé-valeur) :
- `3cx_server_url` : URL du serveur 3CX
- `teams_webhook_url` : Webhook Microsoft Teams
- `default_currency` : EUR
- `default_tva_rate` : 20.0
- `invoice_footer_text` : mention légale obligatoire
- `email_from` : adresse expéditrice
- `smtp_*` : configuration SMTP sortant

### 23.2 Paramétrage email

- Templates email (devis envoyé, facture émise, relance, etc.)
- Variables dynamiques `{client_name}`, `{doc_ref}`, `{amount}`, etc.
- Signature commerciale par utilisateur

### 23.3 Paramétrage workflow

- Probabilités par stage SPANCO (modifiables)
- Critères de passage par stage (ajout / suppression / modification)
- Actions auto-créées par transition (configurable)
- Couleurs et libellés des stages

---

## 24. INTÉGRATIONS EXTERNES

### 24.1 SIRENE / INPI

API `recherche-entreprises.api.gouv.fr` (gratuite, sans clé).

Usage : recherche entreprise + auto-fill de la fiche prospect + extraction des dirigeants pour pré-remplir le contact.

Endpoints utilisés :
- `/search?q=<nom>` : recherche par nom
- `/search?q=<siren>` : recherche par SIREN

### 24.2 Pappers

API `api.pappers.fr/v2/entreprise` (Token nécessaire, quota 1000 req/mois en gratuit).

Usage : enrichissement des données entreprise (procédures collectives, capital, dirigeants étendus, bilans).

Configuration : token côté proxy serveur (jamais en clair côté client).

### 24.3 BODACC

API `bodacc-datadila.opendatasoft.com` (gratuite, sans clé).

Usage : vérification procédures collectives (sauvegarde, redressement, liquidation).

Statuts retournés :
- `ok` : aucune procédure
- `warn` : procédure en cours (sauvegarde, redressement, conciliation)
- `danger` : liquidation judiciaire ou cessation
- `unknown` : SIREN invalide
- `error` : erreur réseau

### 24.4 3CX Web Client

Intégration deep-link sans plugin :
- Configuration du serveur 3CX dans `app_settings`
- Au clic sur téléphone : ouverture URL `https://<3cx>/webclient/#/dialer/<tel>`
- Authentification gérée par 3CX directement

### 24.5 Outlook Web

Deep-link compose pour les emails et calendrier :
- Email : `https://outlook.office.com/owa/?path=/mail/action/compose&to=...&subject=...&body=...`
- RDV : `https://outlook.office.com/calendar/0/deeplink/compose?subject=...&startdt=...&enddt=...`

Pas besoin de client local Outlook. Fonctionne sur Mac, Linux, Windows.

### 24.6 Microsoft Teams

Webhook entrant configurable pour recevoir les notifications dans un canal :
- P1 entrant
- SLA dépassé
- Deal signé > 50 k€
- Erreur système critique

---

## 25. MAINTENANCE ET ÉVOLUTIONS

### 25.1 Cycle de release

- **Patches** : déploiement continu (1 à 5 par semaine)
- **Mineures** : 1 par mois (nouvelles fonctionnalités non-disruptives)
- **Majeures** : 2 par an (refonte, nouveaux modules)

Toutes les releases sont :
- Documentées dans le changelog
- Testées en staging avant production
- Déployées sans interruption de service (rolling deployment Vercel)

### 25.2 Notification utilisateurs

- Bannière in-app pour les nouveautés majeures
- Email mensuel récapitulatif
- Page `/changelog` accessible publiquement

### 25.3 Rétrocompatibilité

Engagement de rétrocompatibilité **24 mois** sur :
- Schémas BDD
- Structure des exports
- API publique (si exposée)

Toute breaking change est annoncée 90 jours à l'avance.

---

## 26. SUPPORT ET SLA CONTRACTUELS

### 26.1 Canaux de support

1. **Hotline téléphonique** : 02 85 52 13 96 (option 1) — heures ouvrées
2. **Email support** : contact@astorya.fr (réponse selon SLA)
3. **Module tickets** : portail self-service dans le Hub
4. **Hotline 3CX** : appel direct depuis le Hub
5. **Support sur site** : intervention physique (Premium)

### 26.2 Heures ouvrées

- Lundi à vendredi : 9h00 – 18h00
- Hors week-ends et jours fériés français
- Premium : astreinte 24/5 sur P1

### 26.3 Escalade

Niveaux d'escalade en cas de blocage :
1. **N1** : hotline standard
2. **N2** : technicien senior (après 1h sans résolution)
3. **N3** : architecte / éditeur (après 4h sans résolution)
4. **Direction** : direction technique ASTORYA (cas critiques uniquement)

---

# PARTIE IV — ANNEXES

## 27. GLOSSAIRE MÉTIER

| Terme | Définition |
|---|---|
| **SPANCO** | Méthode commerciale en 5 étapes (Suspect, Prospect, Approche, Négociation, Conclusion, Ordre) |
| **TCV** | Total Contract Value : valeur totale d'un contrat sur sa durée d'engagement |
| **ARR** | Annual Recurring Revenue : chiffre d'affaires récurrent annuel |
| **MRR** | Monthly Recurring Revenue : chiffre d'affaires récurrent mensuel |
| **NPS** | Net Promoter Score : indicateur de recommandation client |
| **SLA** | Service Level Agreement : niveau de service contractuel |
| **TMA** | Tierce Maintenance Applicative : maintenance par un tiers |
| **PITR** | Point-In-Time Recovery : restauration à un instant T précis |
| **Air-gap** | Sauvegarde physiquement déconnectée d'internet |
| **RLS** | Row-Level Security : sécurité au niveau ligne en BDD |
| **DPA** | Data Processing Agreement : contrat de sous-traitance RGPD |
| **DORA** | Digital Operational Resilience Act : règlement européen résilience opérationnelle |
| **NIS2** | Directive cybersécurité européenne (2023) |
| **BODACC** | Bulletin Officiel des Annonces Civiles et Commerciales |
| **INPI** | Institut National de la Propriété Industrielle |
| **FEC** | Fichier des Écritures Comptables (norme française) |
| **eIDAS** | Règlement européen sur l'identité électronique et la signature |
| **OWA** | Outlook Web Access : version web d'Outlook |

## 28. GRILLE TARIFAIRE DÉTAILLÉE

Cf. section 2.3 et annexe 2 du Contrat de Services.

## 29. PROCÉDURES OPÉRATIONNELLES

### 29.1 Procédure de mise en service d'un nouveau client

1. Création de la fiche client + contact principal
2. Création du contrat (signature)
3. Création des accès utilisateur
4. Formation onboarding (1h en visio)
5. Première facture émise

### 29.2 Procédure de résiliation

1. Préavis 90 jours
2. Confirmation écrite
3. Export complet des données (J+30)
4. Suppression effective (J+60)
5. Certificat de destruction (J+90)

### 29.3 Procédure incident critique (P1)

1. Détection (monitoring ou hotline)
2. Acquittement < 30 minutes
3. Diagnostic initial < 1h
4. Communication client immédiate
5. Résolution selon SLA
6. Post-mortem dans les 48h

## 30. FAQ UTILISATEURS

**Q : Comment changer mon mot de passe ?**
R : Menu utilisateur (en bas de la sidebar) → Profil → Mot de passe.

**Q : Je ne reçois pas les emails de relance.**
R : Vérifier dans `/administration-utilisateurs` que votre email est correct et confirmé. Vérifier également les SPAM.

**Q : Mon devis n'apparaît pas en commande après transformation.**
R : Vérifier le statut du devis. Il doit être en `Accepté` avant transformation. Si le bug persiste, contacter le support.

**Q : Comment exporter mes données pour les transmettre à mon expert-comptable ?**
R : Aller dans `/comptabilite` → Exports → Choisir la période → Format FEC ou CSV.

**Q : L'historique d'un contact est-il consultable ?**
R : Oui, ouvrir la fiche client → onglet Historique → tous les événements liés à ce client.

## 31. INDEX DES ROUTES

| Route | Module |
|---|---|
| `/` ou `/accueil-simple` | Accueil ERP |
| `/login` | Connexion |
| `/crm` | CRM Pipeline |
| `/planning-commercial` | Planning calendrier |
| `/nouveau-prospect` | Création prospect |
| `/nouvelle-opportunite` | Création opportunité |
| `/avancer-opportunite?opp=...` | Workflow SPANCO |
| `/fiche-client?id=...` | Fiche client détaillée |
| `/gestion-commerciale` | Devis / commandes / BL / factures |
| `/gestion-commerciale-admin` | Catalogue articles |
| `/nouveau-contrat` | Création contrat |
| `/ticketing` | Tickets support |
| `/projets` | Liste projets |
| `/projets-tableau` | Vue tableau |
| `/projets-kanban` | Vue kanban |
| `/projets-calendrier` | Vue calendrier |
| `/projets-gantt` | Diagramme Gantt |
| `/temps-activites` | Saisie temps |
| `/stock` | Inventaire |
| `/facturation` | Factures |
| `/comptabilite` | Comptabilité |
| `/tresorerie` | Trésorerie |
| `/marketing` | Marketing |
| `/intelligence-concurrentielle` | Veille |
| `/fins-contrats-concurrents` | Reconquête |
| `/ressources-humaines` | RH |
| `/equipe-commerciale` | KPI commerciaux |
| `/rapports` | Reporting |
| `/administration-utilisateurs` | Admin users |
| `/administration-contrats-mapping` | Admin mapping contrats |

---

**Fin de la documentation**

Pour toute question ou suggestion d'amélioration de ce document, contacter contact@astorya.fr.
Version 2026.06 — Document interne ASTORYA SGI — Reproduction interdite sans autorisation.
