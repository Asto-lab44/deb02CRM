# Hub Astorya — Documents de mise à disposition gratuite

> **Avertissement légal** : ces documents sont des **modèles types** à faire valider par un avocat avant utilisation. Ils intègrent les bonnes pratiques RGPD, propriété intellectuelle et sécurité, mais doivent être adaptés à ta structure juridique (SARL ASTORYA SGI), à ton SIRET (523 625 804 00027) et au régime fiscal applicable. Les clauses critiques sont surlignées 🛡 pour révision prioritaire.

---

## 📄 Article 1 — Présentation publique (landing page / plaquette)

# Hub Astorya — l'ERP nouvelle génération, **offert** à nos clients

Vous êtes client Astorya SGI ? Profitez **gratuitement** de notre plateforme métier tout-en-un, conçue par et pour les TPE/PME françaises.

## Ce que vous gagnez

✅ **CRM commercial** — comptes, contacts, pipeline opportunités, kanban SPANCO
✅ **Gestion commerciale Sage-like** — devis, commandes, BL, factures avec cascade automatique
✅ **Projets & livrables** — roadmap, jalons, ressources, kanban
✅ **Stock & catalogue produits** — instances, traçabilité, achats fournisseurs
✅ **Intelligence concurrentielle** — radar fin de contrat, battle cards, leasing
✅ **Support technique / Ticketing** — SLA, MTTR, file d'attente
✅ **Module technique IT** — état du parc client en temps réel
✅ **Trésorerie, RH, Rapports BI** — pilotage 360°

## Comment c'est possible ?

Astorya SGI **héberge intégralement** le Hub sur son infrastructure souveraine française :
- Serveurs propriétaires en datacenter français certifié ISO 27001
- Base de données PostgreSQL Supabase hébergée UE (RGPD natif)
- Certificats SSL/TLS gérés et renouvelés automatiquement
- Sauvegardes quotidiennes chiffrées (rétention 30 jours)
- Code source maîtrisé sur dépôt privé Astorya
- Cellule sécurité 24/7

Vous n'avez **rien à installer**, **rien à maintenir**, **rien à payer**.

## Et si vous partez ?

C'est votre droit le plus strict — et nous le respectons.

🎁 À tout moment, vous pouvez demander **l'export complet de vos données** en formats ouverts (CSV, JSON, PDF) **sous 5 jours ouvrés maximum**. Aucun verrouillage, aucun frais, aucune limitation.

Vous repartez avec vos comptes, contacts, opportunités, devis, factures, tickets, projets — **dans un format que vous pouvez importer dans n'importe quel autre outil**.

## Conditions

L'accès gratuit au Hub Astorya est strictement réservé aux **clients sous contrat actif** avec Astorya SGI (maintenance, infogérance, services managés ou abonnement logiciel). L'accès cesse 30 jours après la fin du contrat client, période pendant laquelle l'export des données reste possible.

L'utilisation du Hub est encadrée par un contrat de mise à disposition à signer en amont (cf. CGU et contrat de service).

---

## 📄 Article 2 — FAQ détaillée (à publier sur le site)

# Hub Astorya gratuit — Questions fréquentes

## Pourquoi c'est gratuit ?

Le Hub Astorya est un produit que nous avons développé pour **nos propres besoins de pilotage interne**. Nous avons choisi d'en faire bénéficier nos clients sous contrat, pour deux raisons :

1. **Un client mieux outillé est un client plus efficace** — moins de tickets, des process plus clairs, des décisions plus rapides.
2. **C'est notre signature** — proposer une plateforme moderne là où la concurrence vend des modules à 50 €/utilisateur/mois est notre manière de prouver que nous comprenons le métier de la TPE/PME.

Il n'y a pas de modèle freemium caché, pas de licence à upgrader, pas de surcoût futur. **Le Hub est et restera gratuit pour les clients sous contrat actif.**

## Qui peut en bénéficier ?

Tout **client Astorya SGI sous contrat actif** :
- Contrat de maintenance / infogérance
- Contrat d'hébergement / cloud privé
- Contrat de support technique annuel
- Abonnement licence Microsoft 365 NCE via Astorya
- Tout autre service récurrent facturé par Astorya

Le bénéfice du Hub est attaché au compte client, non aux utilisateurs individuels. Vous pouvez ouvrir autant de comptes utilisateurs que nécessaire dans votre entreprise (selon vos besoins).

## Où sont mes données ?

🇫🇷 **Exclusivement en France**, sur infrastructure souveraine.

- Code applicatif : serveur Vercel (région UE, conforme RGPD)
- Base de données : PostgreSQL Supabase (région UE-West, conforme RGPD)
- Sauvegardes : datacenter français certifié ISO 27001, chiffrement AES-256
- Certificats SSL : Let's Encrypt + monitoring automatique (renouvellement avant J-15)

Aucune donnée ne transite ni n'est stockée hors UE.

## Mes données m'appartiennent-elles ?

**Oui, intégralement et sans restriction.** Voir l'article 5 du contrat de mise à disposition :

> *"Le Client demeure seul propriétaire des données qu'il saisit, importe ou génère via le Hub Astorya. Le Prestataire dispose d'un droit d'usage strictement limité à l'exécution du service, à l'exclusion de toute commercialisation, cession, location, communication à des tiers ou usage à des fins de profilage publicitaire."*

## Comment je récupère mes données si je pars ?

Sur simple demande écrite (mail à `dpo@astorya.fr`), nous vous livrons sous **5 jours ouvrés maximum** un export complet de vos données dans un fichier ZIP contenant :

- `clients.csv` — tous vos comptes / prospects
- `contacts.csv` — tous vos contacts
- `opportunities.csv` — opportunités commerciales
- `commercial_docs.csv` + `commercial_doc_lines.csv` — devis, commandes, BL, factures et leurs lignes
- `projects.csv` + `project_items.csv` — projets et livrables
- `tickets.csv` — tickets support
- `contracts.csv` — contrats actifs
- `pdfs/` — tous vos PDFs générés (devis, factures, contrats signés)
- `attachments/` — toutes les pièces jointes
- `README.md` — schéma des données + correspondance des champs

**Aucun frais, aucun délai supplémentaire, aucune obligation de justifier** votre demande. C'est votre droit RGPD article 20 (portabilité), et nous l'appliquons en lettre et en esprit.

## Et après mon départ ?

Conformément au RGPD :
- **J+30 après fin de contrat** : verrouillage de l'accès en écriture (vos données restent lisibles le temps de l'export)
- **J+60** : suppression définitive de vos données de la base de production
- **J+90** : suppression des sauvegardes de rétention

Un **certificat de destruction** signé numériquement vous est adressé.

## Quelles sont les garanties de sécurité ?

🛡 Le Hub Astorya bénéficie de l'ensemble des bonnes pratiques sécurité Astorya SGI :

- **Authentification** : OAuth2 + 2FA disponible
- **Chiffrement** : TLS 1.3 en transit, AES-256 au repos
- **Isolation** : chaque client est cloisonné via Row Level Security (RLS) PostgreSQL
- **Audit** : logs d'accès conservés 12 mois
- **Sauvegarde** : snapshots quotidiens + réplication géographique
- **Disponibilité** : 99,5 % garantie contractuellement
- **Mises à jour** : déploiement continu, correctifs de sécurité sous 48 h
- **Tests d'intrusion** : audit annuel par un cabinet externe agréé

## Que se passe-t-il si Astorya disparaît ?

Scénario peu probable mais légitimement préoccupant. Le contrat de mise à disposition prévoit une **clause de séquestre** :

🛡 Une copie du code source du Hub Astorya est déposée trimestriellement chez **Logitas** (anciennement APP, agence pour la protection des programmes). En cas de cessation d'activité d'Astorya SGI, le code est mis à la disposition des clients sous licence MIT pour qu'ils puissent continuer à utiliser et faire évoluer la plateforme. Vous repartez avec votre Hub.

---

## 📄 Article 3 — Email type pour annoncer le Hub à vos clients existants

**Objet** : 🎁 Nouveau pour vous : Hub Astorya — votre plateforme métier offerte

Bonjour [Prénom],

Chez Astorya SGI, nous croyons que **le meilleur prestataire est celui qui rend ses clients autonomes**.

C'est pourquoi nous avons développé pour vous le **Hub Astorya**, une plateforme métier complète (CRM, gestion commerciale, projets, support, stock, BI…) que nous avons décidé d'offrir gratuitement à tous nos clients sous contrat actif.

## Ce que vous y trouverez

- 📊 CRM avec pipeline opportunités SPANCO
- 📋 Gestion commerciale Sage-like (devis → commande → BL → facture)
- 🚀 Projets & livrables avec workflow automatisé
- 🎯 Support technique avec ticketing SLA
- 📦 Stock & catalogue produits
- 💰 Trésorerie, RH, rapports BI
- … et plus encore

## Conditions

✅ **Gratuit** — aucun frais d'accès, aucun surcoût caché
✅ **Hébergé chez nous** — serveurs français, sauvegardes quotidiennes, certificats SSL gérés
✅ **Vos données vous appartiennent** — export complet sur simple demande
✅ **Aucun engagement** — vous arrêtez quand vous voulez, vous repartez avec tout

## Comment commencer ?

Répondez à ce mail ou prenez rendez-vous via [lien Calendly] pour une démo personnalisée de 30 minutes. Nous vous ouvrons un compte et vous accompagnons sur la prise en main.

Cordialement,

**Romain Daviaud**
Directeur — Astorya SGI
📞 02 85 52 13 95 — ✉ r.daviaud@astorya.fr

*P.S. — La mise à disposition du Hub fait l'objet d'un contrat type que je vous adresserai pour signature en amont. Toutes les garanties de sécurité, de propriété de vos données et de réversibilité y sont formalisées.*

---

---

# 📑 CONTRAT DE MISE À DISPOSITION GRATUITE — HUB ASTORYA

**Entre les soussignés :**

**ASTORYA SGI**, SARL au capital de 7 500,00 €, dont le siège social est sis 9 rue du Petit Châtelier, 44300 Nantes, immatriculée au RCS de Nantes sous le n° 523 625 804, représentée par M. Romain DAVIAUD en sa qualité de gérant, identifiée par le n° SIRET 523 625 804 00027 et le n° TVA intracommunautaire FR76 523625804,

ci-après dénommée **« le Prestataire »**,

**d'une part,**

**ET**

**[Raison sociale du Client]**, [forme juridique] au capital de [_______] €, dont le siège social est sis [adresse], immatriculée au RCS de [_____] sous le n° [______], représentée par M./Mme [Nom Prénom] en sa qualité de [fonction],

ci-après dénommé **« le Client »**,

**d'autre part,**

**Ensemble dénommés « les Parties »,**

---

## PRÉAMBULE

Le Prestataire a développé un logiciel applicatif métier dénommé **« Hub Astorya »** (ci-après « le Logiciel »), comprenant notamment des fonctionnalités de gestion de la relation client (CRM), de gestion commerciale (devis, commandes, bons de livraison, factures), de gestion de projets, de support technique, de gestion de stock et catalogue, et de pilotage (BI).

Le Logiciel est hébergé exclusivement sur l'infrastructure technique du Prestataire (ci-après « la Plateforme »).

Le Prestataire souhaite mettre à disposition le Logiciel à titre **gracieux** au profit de ses clients sous contrat de service actif, dans le cadre strictement défini par le présent contrat.

Le Client, lié au Prestataire par un ou plusieurs contrats de service en cours d'exécution, souhaite bénéficier de cette mise à disposition.

**CECI ÉTANT EXPOSÉ, IL A ÉTÉ CONVENU CE QUI SUIT :**

---

## ARTICLE 1 — OBJET DU CONTRAT

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire met à disposition du Client, **à titre gratuit**, un droit d'accès et d'utilisation non exclusif et non transférable du Logiciel Hub Astorya, hébergé sur la Plateforme du Prestataire.

Ce droit d'usage est **strictement personnel au Client** et limité aux fonctionnalités décrites en Annexe 1.

---

## ARTICLE 2 — CONDITIONS D'ÉLIGIBILITÉ

L'accès au Logiciel est conditionné à l'existence d'au moins un **contrat de service actif** entre le Client et le Prestataire, parmi les catégories suivantes :

- Contrat de maintenance / infogérance informatique
- Contrat d'hébergement / cloud privé / serveur dédié
- Contrat de support technique annuel ou pluriannuel
- Abonnement licence Microsoft 365 NCE, Eset, WithSecure, ou autre licence éditeur revendue par le Prestataire
- Contrat de prestations récurrentes facturées par le Prestataire

🛡 **Article 2.1 — Cessation automatique** : la résiliation, la non-reconduction ou la rupture pour quelque motif que ce soit du dernier contrat de service actif entraîne, **de plein droit et sans formalité**, la suspension de l'accès au Logiciel à l'issue du préavis défini à l'article 11.

---

## ARTICLE 3 — DURÉE

Le présent contrat est conclu pour une durée **indéterminée**, à compter de sa signature par les deux Parties.

Il pourra être résilié par l'une ou l'autre des Parties dans les conditions définies à l'article 11.

---

## ARTICLE 4 — GRATUITÉ ET ABSENCE DE CONTREPARTIE FINANCIÈRE

L'accès au Logiciel est **strictement gratuit**. Aucune redevance, abonnement, licence, frais de mise en service, frais de support, frais de stockage, frais d'utilisateur supplémentaire ou frais d'aucune autre nature ne pourra être réclamé par le Prestataire au Client au titre de la présente mise à disposition.

🛡 Le Prestataire s'engage à maintenir cette gratuité pendant toute la durée du contrat. Toute modification ultérieure du modèle économique du Logiciel (notamment passage à un modèle payant) ne pourra être imposée au Client qu'après signature d'un avenant explicite, et donnera lieu, en cas de refus du Client, à une période transitoire d'utilisation gratuite minimale de **12 mois** afin de permettre au Client de migrer vers une solution alternative.

---

## ARTICLE 5 — PROPRIÉTÉ DES DONNÉES 🛡

**Article 5.1** — Le Client demeure **seul et unique propriétaire** de l'ensemble des données qu'il saisit, importe ou génère via le Logiciel, incluant sans limitation : comptes clients/prospects, contacts, opportunités commerciales, devis, commandes, bons de livraison, factures, projets, tickets, contrats, articles, fichiers PDF et pièces jointes.

**Article 5.2** — Le Prestataire dispose d'un **droit d'usage strictement limité** à l'exécution technique du service (hébergement, sauvegarde, traitement) et aux finalités strictement nécessaires à la fourniture du service.

🛡 **Article 5.3 — Interdictions formelles** : le Prestataire s'interdit expressément :
- Toute commercialisation, location, cession ou mise à disposition de tout ou partie des données à des tiers, à titre gratuit ou onéreux
- Tout usage à des fins de profilage publicitaire, marketing direct ou indirect au profit de tiers
- Toute exploitation statistique nominative
- Tout transfert hors de l'Union Européenne, sauf accord écrit préalable du Client
- Toute fusion avec des données d'autres clients à des fins de constitution d'une base de données mutualisée

🛡 **Article 5.4** — En cas de violation avérée de l'une de ces interdictions, le Client pourra obtenir la résiliation immédiate du présent contrat et le versement de **dommages et intérêts forfaitaires de 100 000 €** sans préjudice de toute action en réparation du préjudice réel et complémentaire.

---

## ARTICLE 6 — HÉBERGEMENT ET INFRASTRUCTURE

**Article 6.1** — Le Logiciel et les données du Client sont hébergés **exclusivement** sur les infrastructures techniques suivantes :
- Application : serveur Vercel, région Union Européenne (Pays-Bas / Allemagne)
- Base de données : PostgreSQL Supabase, région EU-West (Irlande / France)
- Sauvegardes : datacenter français certifié ISO 27001, opéré par le Prestataire ou son sous-traitant
- Certificats SSL/TLS : Let's Encrypt avec monitoring automatique

**Article 6.2** — Le Prestataire s'engage à ne pas modifier la zone géographique d'hébergement sans en informer le Client par écrit avec un préavis de **3 mois**.

🛡 **Article 6.3** — Aucune donnée du Client ne pourra être transférée, copiée ou répliquée hors de l'Union Européenne, ni hébergée chez un sous-traitant soumis à une législation extra-européenne incompatible avec le RGPD (notamment : Cloud Act américain, Patriot Act).

---

## ARTICLE 7 — SÉCURITÉ ET CONFIDENTIALITÉ 🛡

Le Prestataire met en œuvre les mesures techniques et organisationnelles suivantes :

**Article 7.1 — Chiffrement**
- TLS 1.3 minimum pour toutes les communications réseau
- AES-256 pour le chiffrement au repos des sauvegardes
- Chiffrement de bout en bout des fichiers PDF générés

**Article 7.2 — Contrôle d'accès**
- Authentification par mot de passe avec politique de complexité (12 caractères minimum, mixité)
- Double authentification (2FA) disponible et activable par utilisateur
- Cloisonnement strict des données via Row Level Security PostgreSQL
- Journalisation horodatée de toute connexion (rétention 12 mois)

**Article 7.3 — Sauvegarde et restauration**
- Snapshot complet de la base de données toutes les 24 heures
- Rétention 30 jours sur la production, 90 jours sur la sauvegarde froide
- Réplication sur un second site géographique distinct
- Test de restauration trimestriel documenté

**Article 7.4 — Tests d'intrusion**
- Audit de sécurité externe annuel par un cabinet agréé ANSSI
- Tests d'intrusion biannuels (white box + black box)
- Communication du rapport synthétique aux clients sur demande

🛡 **Article 7.5 — Notification d'incident**
En cas de **violation de données personnelles** au sens du RGPD, le Prestataire s'engage à :
- Notifier la CNIL dans les **72 heures** de la découverte (article 33 RGPD)
- Notifier le Client par mail et appel téléphonique **dans les 24 heures** de la découverte
- Fournir un rapport d'incident détaillé sous 7 jours ouvrés
- Mettre en œuvre toutes les mesures correctives nécessaires à ses frais
- En cas d'incident majeur, indemniser le Client des frais raisonnables engagés (notification clients finaux, audit de remédiation, etc.) à hauteur de **50 000 € maximum**

**Article 7.6 — Confidentialité des intervenants**
Tout personnel du Prestataire ayant accès aux données du Client est lié par une **clause de confidentialité contractuelle** opposable. La liste des intervenants ayant un accès administrateur à la production est tenue à jour et communicable au Client sur demande.

---

## ARTICLE 8 — RGPD ET PROTECTION DES DONNÉES PERSONNELLES

**Article 8.1 — Qualifications**
- Le **Client** agit en qualité de **responsable de traitement** pour les données personnelles de ses propres clients, prospects et contacts, qu'il saisit dans le Logiciel
- Le **Prestataire** agit en qualité de **sous-traitant** au sens de l'article 28 du RGPD pour le compte du Client

**Article 8.2 — Engagements du Prestataire en tant que sous-traitant**

Conformément à l'article 28 du RGPD, le Prestataire s'engage à :
- Ne traiter les données que sur instruction documentée du Client
- Garantir la confidentialité de toute personne autorisée à traiter les données
- Prendre toutes les mesures de sécurité requises (article 32 RGPD)
- Ne pas recourir à un sous-traitant ultérieur sans autorisation écrite préalable
- Assister le Client dans l'exercice des droits des personnes concernées (accès, rectification, effacement, portabilité, limitation, opposition)
- Participer aux audits du Client sur préavis raisonnable

🛡 **Article 8.3 — Réponse aux demandes d'exercice de droits**
Le Prestataire s'engage à répondre aux demandes du Client liées à l'exercice des droits des personnes concernées dans un délai de **5 jours ouvrés maximum**.

**Article 8.4 — DPO du Prestataire** : `dpo@astorya.fr`

---

## ARTICLE 9 — RÉVERSIBILITÉ ET PORTABILITÉ DES DONNÉES 🛡

**Article 9.1 — Droit d'export permanent**
À tout moment, et sans avoir à justifier sa demande, le Client peut demander l'export complet de ses données.

**Article 9.2 — Format et délai**
Le Prestataire s'engage à livrer l'export dans un délai de **5 jours ouvrés maximum** à compter de la demande écrite, dans un format ouvert et ré-importable :
- Données structurées : fichiers CSV (UTF-8 avec BOM, séparateur point-virgule) et JSON (RFC 8259)
- Documents générés : PDF (PDF/A-2)
- Pièces jointes : format d'origine
- Schéma de données : fichier README.md décrivant l'organisation, les champs et leur signification

**Article 9.3 — Périmètre de l'export**
L'export inclut **l'intégralité** des données du Client, sans exception ni rétention :
- Toutes les tables métier (clients, contacts, opportunités, contrats, devis, commandes, BL, factures, projets, tickets, articles…)
- Tous les fichiers générés (PDF, exports précédents)
- Toutes les pièces jointes
- Tous les logs d'activité utilisateur du Client (12 derniers mois)

🛡 **Article 9.4 — Gratuité absolue**
L'export est **strictement gratuit**, quelle qu'en soit la taille. Aucun frais de service, de support ou de stockage ne peut être facturé. Cette gratuité est **non négociable** et reste due même en cas de litige entre les Parties.

**Article 9.5 — Format d'archivage long terme**
Sur demande expresse, le Prestataire fournit une version supplémentaire de l'export en archive ZIP signée numériquement (signature SHA-256) avec horodatage qualifié, permettant au Client de prouver à des tiers (administration fiscale, commissaire aux comptes, juge) la date et l'intégrité de ses données à un instant T.

---

## ARTICLE 10 — PROPRIÉTÉ INTELLECTUELLE DU LOGICIEL 🛡

**Article 10.1** — Le Prestataire demeure seul titulaire des droits de propriété intellectuelle sur le Logiciel (code source, interface, marque « Hub Astorya », documentation).

**Article 10.2** — Le Client se voit concéder un **droit d'usage personnel, non exclusif, non transférable, non cessible** et limité à la durée du présent contrat.

🛡 **Article 10.3 — Interdictions formelles** : le Client s'interdit expressément :
- Toute reproduction, décompilation, désassemblage, ingénierie inverse du Logiciel ou de ses composants
- Toute extraction du code source par tout moyen technique
- Toute commercialisation, location, sous-licence à un tiers, même à titre gratuit
- Toute mise à disposition du Logiciel à un tiers autre que ses propres collaborateurs salariés
- Toute publication ou divulgation publique des fonctionnalités internes, choix d'architecture ou éléments distinctifs du Logiciel à des fins compétitives
- Toute reproduction de la marque « Hub Astorya », du logo Astorya ou des éléments graphiques associés
- Toute utilisation du Logiciel à des fins illicites, contraires aux lois et règlements en vigueur

🛡 **Article 10.4 — Sanctions**
En cas de violation de l'une de ces interdictions, le Client est passible :
- D'une résiliation immédiate du contrat sans préavis ni indemnité
- Du versement de dommages et intérêts forfaitaires de **150 000 €** par infraction constatée
- De poursuites judiciaires sur le fondement de la contrefaçon (article L. 335-2 du Code de la propriété intellectuelle)

🛡 **Article 10.5 — Clause de séquestre du code source**
Afin de garantir la continuité du service en cas de défaillance du Prestataire, une copie du code source du Logiciel est déposée trimestriellement chez **Logitas** (ex-APP, Agence pour la Protection des Programmes, www.logitas.fr).

En cas de :
- Cessation d'activité du Prestataire (liquidation judiciaire, dissolution, etc.)
- Arrêt définitif d'exploitation du Logiciel non remplacé par une solution équivalente sous 90 jours

le code source est mis à la disposition des clients sous contrat actif au moment de l'événement, sous licence MIT, leur permettant de continuer à utiliser et faire évoluer le Logiciel à leurs frais.

---

## ARTICLE 11 — RÉSILIATION 🛡

**Article 11.1 — Résiliation à l'initiative du Client**
Le Client peut résilier le présent contrat **à tout moment, sans préavis et sans avoir à justifier sa décision**, par simple notification écrite (lettre recommandée avec accusé de réception ou email avec accusé de lecture à `r.daviaud@astorya.fr`).

**Article 11.2 — Résiliation à l'initiative du Prestataire**
Le Prestataire peut résilier le présent contrat dans les cas suivants :
- Cessation du dernier contrat de service actif (cf. article 2)
- Violation par le Client de l'une des interdictions de l'article 10
- Non-respect des conditions générales d'utilisation par le Client
- Cessation d'exploitation du Logiciel (avec préavis de 6 mois et fourniture de l'export final)

Dans tous les cas, le Prestataire notifie sa décision par lettre recommandée avec accusé de réception, avec un préavis minimum de **30 jours** sauf en cas de violation grave et caractérisée.

**Article 11.3 — Conséquences de la résiliation**

🛡 Quelle que soit l'origine de la résiliation :

| Délai après notification | Évènement |
|---|---|
| **Immédiat** | Notification écrite à toutes les Parties prenantes |
| **J+0 à J+30** | Période de transition — accès au Logiciel maintenu en lecture seule, export possible |
| **J+30** | Verrouillage de l'accès au Logiciel — l'export reste possible sur demande écrite |
| **J+30** | Livraison automatique d'un export complet au Client (sans avoir à le demander) |
| **J+60** | Suppression définitive des données du Client de la base de production |
| **J+90** | Suppression des données du Client des sauvegardes de rétention |
| **J+91** | Émission et envoi d'un **certificat de destruction signé numériquement** par le Prestataire au Client |

🛡 **Article 11.4 — Aucun frais de sortie**
Aucun frais de résiliation, de sortie, de migration ou de service ne peut être facturé au Client. Cette gratuité est **absolue et non négociable**.

---

## ARTICLE 12 — RESPONSABILITÉ ET GARANTIE DE SERVICE

**Article 12.1 — Disponibilité**
Le Prestataire s'engage à un taux de disponibilité du Logiciel de **99,5 % par mois civil** (hors maintenance planifiée annoncée 48 heures à l'avance).

**Article 12.2 — Maintenance**
La maintenance corrective est assurée gratuitement. La maintenance évolutive (nouvelles fonctionnalités) est à la discrétion du Prestataire.

**Article 12.3 — Limitation de responsabilité**
Le Logiciel étant fourni à titre gratuit, la responsabilité du Prestataire est limitée aux cas de **faute lourde, dol ou manquement caractérisé** aux obligations essentielles définies aux articles 5, 7, 8 et 9 du présent contrat.

🛡 **Article 12.4 — Exclusion d'application aux clauses sécurité**
Cette limitation de responsabilité **ne s'applique pas** aux engagements pris au titre de :
- La protection et la propriété des données du Client (article 5)
- La sécurité et la confidentialité (article 7)
- La conformité RGPD (article 8)
- La réversibilité (article 9)

Pour ces engagements, la responsabilité du Prestataire reste pleine et entière.

---

## ARTICLE 13 — CONFIDENTIALITÉ MUTUELLE

Chacune des Parties s'engage à conserver strictement confidentielles toutes les informations à caractère commercial, technique, financier ou organisationnel qui lui seraient communiquées par l'autre Partie dans le cadre de l'exécution du présent contrat, et ce pendant toute sa durée et **5 ans** à compter de sa résiliation.

---

## ARTICLE 14 — DROIT APPLICABLE ET JURIDICTION

Le présent contrat est régi par le **droit français**.

Tout litige relatif à son interprétation, son exécution ou sa résiliation, qui ne pourrait être résolu à l'amiable dans un délai de 30 jours à compter de sa notification par lettre recommandée, sera soumis à la compétence exclusive du **Tribunal de Commerce de Nantes**, nonobstant pluralité de défendeurs ou appel en garantie.

---

## ARTICLE 15 — DISPOSITIONS DIVERSES

**Article 15.1 — Intégralité**
Le présent contrat, y compris ses annexes, constitue l'intégralité de l'accord entre les Parties relativement à son objet et annule tout accord antérieur portant sur le même objet.

**Article 15.2 — Modifications**
Toute modification du présent contrat doit faire l'objet d'un avenant écrit signé par les deux Parties.

**Article 15.3 — Indivisibilité des clauses sécurité**
🛡 Les articles 5 (Propriété des données), 7 (Sécurité), 8 (RGPD) et 9 (Réversibilité) sont considérés comme **substantiels et indivisibles**. Leur remise en cause par avenant nécessite l'accord exprès et écrit du Client, et celui-ci pourra à défaut résilier le contrat immédiatement et sans préavis.

**Article 15.4 — Cession**
Le présent contrat ne peut être cédé par le Prestataire sans l'accord écrit du Client, hormis dans le cadre d'une opération de fusion-absorption ou de cession totale d'activité, et sous réserve que le cessionnaire reprenne intégralement l'ensemble des obligations.

---

## SIGNATURES

Fait à Nantes, le ___ / ___ / 2026

En deux exemplaires originaux.

| **Pour le Prestataire — ASTORYA SGI** | **Pour le Client — [Raison sociale]** |
|---|---|
| | |
| | |
| | |
| Romain DAVIAUD | [Nom Prénom du signataire] |
| Gérant | [Fonction du signataire] |

---

## ANNEXE 1 — Périmètre fonctionnel du Logiciel

Le Hub Astorya inclut à la date de signature les modules suivants :

| Module | Fonctionnalités |
|---|---|
| **CRM** | Comptes, contacts, opportunités, pipeline SPANCO, actions à mener |
| **Gestion commerciale** | Devis, commandes client, bons de livraison, factures, génération PDF |
| **Stock & Catalogue** | Articles, fournisseurs, achats hebdomadaires, instances/SN |
| **Projets & Livrables** | Roadmap, kanban, jalons, ressources |
| **Support / Ticketing** | Tickets SLA, file d'attente, MTTR |
| **Intelligence concurrentielle** | Fin de contrats concurrents, battle cards, leasing |
| **Pilotage** | KPIs, rapports, dashboards |

L'ajout, la modification ou la suppression de modules ne nécessite pas d'avenant tant que les engagements de l'article 11.4 (gratuité, réversibilité) sont préservés.

---

## ANNEXE 2 — Schéma de l'export de données (réversibilité)

L'export livré au Client en cas de résiliation ou sur demande contient :

```
export-<client-id>-<YYYYMMDD>.zip
├── README.md              ← schéma des données et glossaire des champs
├── manifest.json          ← liste des fichiers + checksum SHA-256 de chacun
├── data/
│   ├── clients.csv
│   ├── contacts.csv
│   ├── opportunities.csv
│   ├── contracts.csv
│   ├── commercial_docs.csv
│   ├── commercial_doc_lines.csv
│   ├── commercial_articles.csv
│   ├── projects.csv
│   ├── project_items.csv
│   ├── project_events.csv
│   ├── tickets.csv
│   ├── actions.csv
│   ├── leasing_contracts.csv
│   ├── warranties.csv
│   ├── user_activity.csv
│   └── audit_log.csv
├── pdfs/
│   ├── devis/
│   ├── factures/
│   ├── bl/
│   └── contrats/
├── attachments/
│   └── ...
└── certificat_export.pdf  ← daté, signé numériquement
```

Format de chaque CSV : UTF-8 BOM, séparateur point-virgule, première ligne = en-têtes, échappement par double-quote, format de date ISO 8601.

---

## ANNEXE 3 — Liste des sous-traitants techniques

| Sous-traitant | Localisation | Service rendu | Conformité |
|---|---|---|---|
| **Vercel Inc.** | UE (Pays-Bas / Allemagne) | Hébergement applicatif (front-end + serverless) | RGPD (DPA signé), ISO 27001 |
| **Supabase Inc.** | UE (Irlande) | Base de données PostgreSQL + Auth + Storage | RGPD (DPA signé), SOC 2 |
| **Let's Encrypt** | UE / global | Émission de certificats SSL/TLS | Standard CA/Browser Forum |
| **Logitas** (ex-APP) | France | Séquestre trimestriel du code source | Tiers de confiance reconnu |
| **[Datacenter français]** | France métropolitaine | Sauvegardes longue durée | ISO 27001 |

Toute modification de cette liste fait l'objet d'une notification écrite au Client avec préavis de 30 jours.

---

## ANNEXE 4 — Coordonnées DPO et contact sécurité

- **Délégué à la protection des données (DPO)** : `dpo@astorya.fr`
- **Signalement d'incident de sécurité** : `security@astorya.fr` (réponse sous 24 h ouvrées)
- **Demande d'export RGPD** : `dpo@astorya.fr` (réponse sous 5 jours ouvrés)
- **Téléphone d'urgence sécurité** : 02 85 52 13 95 (heures ouvrées)

---

*Fin du document — Total : 3 articles + 1 contrat + 4 annexes.*
