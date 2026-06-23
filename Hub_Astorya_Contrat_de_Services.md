# CONTRAT DE SERVICES — HUB ASTORYA

**Hébergement · Administration · Sécurité · Maintenance · TMA**

> ⚠ **Avertissement** : ce document est un **modèle type** à faire valider par un avocat avant utilisation. Les montants indiqués (forfaits, pénalités, plafonds) sont des fourchettes indicatives marché TPE/PME à ajuster selon ta stratégie commerciale. Les clauses critiques sont marquées 🛡 pour révision prioritaire.

---

## ENTRE LES SOUSSIGNÉS

**ASTORYA SGI**, SARL au capital de 7 500,00 €, dont le siège social est sis 9 rue du Petit Châtelier, 44300 Nantes, immatriculée au RCS de Nantes sous le n° 523 625 804, représentée par M. Romain DAVIAUD en sa qualité de gérant, identifiée par le n° SIRET 523 625 804 00027 et le n° TVA intracommunautaire FR76 523625804,

ci-après dénommée **« le Prestataire »**,

**d'une part,**

**ET**

**[Raison sociale du Client]**, [forme juridique] au capital de [_______] €, dont le siège social est sis [adresse], immatriculée au RCS de [_____] sous le n° [______], représentée par M./Mme [Nom Prénom] en sa qualité de [fonction],

ci-après dénommé **« le Client »**,

**d'autre part,**

**Ensemble dénommés « les Parties ».**

---

## PRÉAMBULE

Le Prestataire a développé un logiciel applicatif métier dénommé **« Hub Astorya »** (ci-après « le Logiciel »), mis à disposition gratuitement aux clients sous contrat de services dans le cadre d'un *Contrat de mise à disposition gratuite du logiciel* signé entre les Parties.

Le présent **Contrat de Services** (ci-après « le Contrat ») a pour objet de définir les conditions techniques et financières dans lesquelles le Prestataire fournit au Client les **prestations d'exploitation** indispensables au fonctionnement du Logiciel : hébergement, administration de la base de données, sécurité, sauvegardes, maintenance corrective et évolutive, tierce maintenance applicative (TMA) et support.

Le Client, ayant pris connaissance des prestations proposées et de leurs conditions tarifaires, souhaite confier au Prestataire l'exploitation du Logiciel selon les modalités ci-après.

**CECI ÉTANT EXPOSÉ, IL A ÉTÉ CONVENU CE QUI SUIT :**

---

## ARTICLE 1 — OBJET DU CONTRAT

Le présent Contrat a pour objet la fourniture par le Prestataire au Client, à titre **onéreux**, des prestations suivantes :

1. **Hébergement** du Logiciel sur l'infrastructure du Prestataire ;
2. **Administration et supervision** de la base de données ;
3. **Gestion des certificats SSL/TLS** ;
4. **Sauvegardes** (production + sauvegarde déconnectée air-gap) ;
5. **Maintenance corrective** du Logiciel ;
6. **Maintenance évolutive** du Logiciel ;
7. **Tierce Maintenance Applicative (TMA)** sur demande ;
8. **Support utilisateurs**.

Le périmètre exact des prestations souscrites est défini dans le **Bon de commande** signé par le Client et son **Annexe tarifaire** (Annexe 2).

---

## ARTICLE 2 — DURÉE ET RECONDUCTION

**Article 2.1 — Durée initiale**
Le Contrat est conclu pour une durée initiale ferme de **douze (12) mois** à compter de sa date de signature (ou de la date de mise en service convenue dans le Bon de commande).

**Article 2.2 — Reconduction tacite**
À l'issue de la durée initiale, le Contrat est reconduit tacitement par périodes successives de **douze (12) mois**, sauf dénonciation par l'une des Parties dans les conditions de l'article 13.

**Article 2.3 — Durée des engagements pluriannuels**
Lorsque la formule souscrite (notamment Premium / TMA) emporte un engagement de **vingt-quatre (24) mois**, la durée initiale est portée à 24 mois et la reconduction s'opère par périodes de 12 mois.

---

## ARTICLE 3 — DESCRIPTION DES PRESTATIONS

### 3.1 Hébergement

Le Prestataire héberge le Logiciel et les données du Client sur son infrastructure technique propre ou auprès de ses sous-traitants de confiance (cf. Annexe 3 — Sous-traitants). L'hébergement est **exclusivement réalisé en Union Européenne**.

L'hébergement comprend :
- Mise à disposition de l'application (front-end + back-end serverless) ;
- Bande passante et trafic illimités dans le cadre d'un usage raisonnable ;
- Supervision 24/7 par sondes automatiques ;
- Mise à l'échelle (scaling) automatique des ressources.

### 3.2 Administration de la base de données

- Administration PostgreSQL (Supabase) : configuration, optimisation des index et requêtes ;
- Supervision des performances, alertes en cas de dégradation ;
- Gestion des accès et des règles de cloisonnement (Row Level Security) ;
- Application des correctifs de sécurité PostgreSQL.

### 3.3 Certificats SSL/TLS

- Émission automatisée des certificats (Let's Encrypt ou équivalent) ;
- Renouvellement automatique avant J-15 ;
- Monitoring d'expiration et alertes ;
- Chiffrement TLS 1.3 minimum.

### 3.4 Sauvegardes 🛡

Le Prestataire met en œuvre **deux niveaux de sauvegarde indépendants** :

**3.4.1 Sauvegarde de production**
- Snapshot complet de la base de données toutes les **24 heures** ;
- Rétention : **30 jours** sur production ;
- Stockage chiffré AES-256 ;
- Réplication géographique sur un second site UE.

🛡 **3.4.2 Sauvegarde déconnectée (air-gap) — obligatoire**
Conformément à l'article 8 bis.2 du *Contrat de mise à disposition*, une **sauvegarde hors-ligne externalisée** est opérée :
- Site de stockage **distinct** et **indépendant** de l'infrastructure de production ;
- Chiffrement de bout en bout avec clé maîtrisée par le Prestataire ;
- Test de restauration **trimestriel** documenté ;
- Rétention : **90 jours** glissants.

Cette sauvegarde air-gap **ne peut être refusée par le Client** et est facturée selon la grille de l'Annexe 2 (ou incluse selon la formule souscrite).

### 3.5 Maintenance corrective

- Correction des anomalies bloquantes (criticité 1) sous **8 heures ouvrées** ;
- Correction des anomalies majeures (criticité 2) sous **24 heures ouvrées** ;
- Correction des anomalies mineures (criticité 3) lors de la prochaine itération ;
- Application des patchs de sécurité du Logiciel sous **48 heures** après publication d'une vulnérabilité critique.

### 3.6 Maintenance évolutive

- Montées de version du Logiciel (mineures et majeures) ;
- Nouvelles fonctionnalités du socle commun mises à disposition de tous les clients ;
- Notification préalable des changements impactant l'interface utilisateur.

### 3.7 Tierce Maintenance Applicative (TMA)

Les développements spécifiques au Client (adaptations métier, intégrations sur mesure, rapports personnalisés) sont fournis :
- Soit dans le cadre d'une **enveloppe forfaitaire mensuelle** incluse dans la formule souscrite ;
- Soit à la demande, sur **devis** validé par le Client, en jours-homme.

Les livrables TMA sont la propriété du Client lorsqu'ils sont spécifiques à son activité ; la propriété du socle commun reste celle du Prestataire.

### 3.8 Support utilisateurs

- Canal principal : email à `support@astorya.fr` ;
- Canal secondaire : hotline 02 85 52 13 95 (heures ouvrées) ;
- Délais de prise en compte selon le niveau souscrit (cf. Annexe 1 — SLA).

---

## ARTICLE 4 — TARIFICATION ET FACTURATION 💼

**Article 4.1 — Tarification**
Les tarifs des prestations sont définis dans le Bon de commande signé par le Client et son **Annexe 2 — Annexe tarifaire**. Ils s'entendent **hors taxes**, la TVA en vigueur étant due en sus.

**Article 4.2 — Modalités de facturation**
- **Périodicité** : facturation **mensuelle**, **trimestrielle** ou **annuelle** selon ce qui est convenu dans le Bon de commande, à terme à échoir ;
- **Émission** : entre le 1er et le 5 du mois ;
- **Échéance** : **30 jours date de facture**, sauf accord contraire formalisé ;
- **Mode de règlement** : prélèvement SEPA ou virement bancaire.

**Article 4.3 — Révision tarifaire**
🛡 Les tarifs sont révisés chaque année au **1er janvier**, selon la formule :

> Nouveau tarif = Tarif précédent × ( S1 / S0 )

où S0 est l'indice Syntec du mois de signature du Contrat (ou de la dernière révision) et S1 l'indice Syntec du mois de novembre précédant la révision. La révision ne peut excéder **+5 % par an** sans accord exprès du Client.

**Article 4.4 — Pénalités de retard**
Toute somme non réglée à l'échéance porte intérêt de plein droit, sans mise en demeure préalable, au taux d'intérêt légal majoré de **5 points**, outre une indemnité forfaitaire de recouvrement de **40 €** (article L. 441-10 du Code de commerce).

🛡 **Article 4.5 — Suspension pour impayé**
En cas de non-règlement d'une facture **30 jours après l'envoi d'une mise en demeure** restée infructueuse, le Prestataire peut :
- Suspendre l'accès au Logiciel (sans préjudice du maintien des données et de la possibilité d'export) ;
- Suspendre toutes les prestations de maintenance et de support en cours.

La suspension d'accès n'emporte **pas** déchéance du droit à l'export des données du Client (clause de réversibilité de l'article 9 du *Contrat de mise à disposition*, intangible).

---

## ARTICLE 5 — NIVEAUX DE SERVICE (SLA) 🛡

**Article 5.1 — Disponibilité du Logiciel**

| Période | Engagement | Pénalité |
|---|---|---|
| Mensuelle (calendaire) | **99,5 %** minimum | Avoir proportionnel sur la facture du mois suivant |
| Hors maintenance planifiée annoncée 48 h à l'avance | — | — |

**Calcul** : Disponibilité = (Temps total – Indisponibilité) / Temps total

**Article 5.2 — Délais d'intervention**

| Criticité | Définition | Prise en compte | Résolution cible |
|---|---|---|---|
| **P1 — Critique** | Service indisponible, perte de données | **30 minutes** | **8 h ouvrées** |
| **P2 — Majeure** | Fonctionnalité métier essentielle inopérante | **2 h ouvrées** | **24 h ouvrées** |
| **P3 — Mineure** | Gêne, dégradation limitée | **8 h ouvrées** | Prochaine itération |
| **P4 — Demande** | Évolution, question, doc | **24 h ouvrées** | Selon planning |

**Heures ouvrées** : du lundi au vendredi, 9 h–18 h, hors jours fériés.

**Article 5.3 — Pénalités en cas de non-respect du SLA**

| Disponibilité mensuelle | Pénalité (% du forfait mensuel) |
|---|---|
| < 99,5 % | 5 % |
| < 99,0 % | 10 % |
| < 98,0 % | 20 % |
| < 95,0 % | 30 % |

**Plafond** : les pénalités cumulées sur un mois ne peuvent excéder **30 %** du forfait mensuel HT du mois concerné. Elles s'imputent par avoir sur la facture suivante, sur demande écrite du Client formulée dans les 30 jours.

**Article 5.4 — Exclusions du SLA**
Sont exclus du calcul de disponibilité :
- Les maintenances planifiées (annoncées 48 h à l'avance) ;
- Les indisponibilités causées par un sous-traitant tiers indispensable (Vercel, Supabase…) lorsqu'elles affectent simultanément l'ensemble de la zone d'hébergement ;
- Les indisponibilités résultant d'un cas de force majeure ;
- Les indisponibilités résultant d'une modification du code par le Client ou un tiers agissant pour son compte (cf. art. 10 bis du *Contrat de mise à disposition*) ;
- Les indisponibilités résultant d'une utilisation non conforme du Logiciel par le Client.

---

## ARTICLE 6 — OBLIGATIONS DU PRESTATAIRE

Le Prestataire s'engage à :
- Fournir les prestations avec diligence, professionnalisme et selon les règles de l'art ;
- Maintenir une équipe technique compétente et formée ;
- Notifier sans délai tout incident significatif affectant la disponibilité ou l'intégrité du service ;
- Tenir à jour la documentation d'exploitation ;
- Effectuer les tests de restauration et de continuité prévus ;
- Respecter ses engagements en matière de protection des données personnelles (cf. *Contrat de mise à disposition*, art. 7 et 8).

---

## ARTICLE 7 — OBLIGATIONS DU CLIENT

Le Client s'engage à :
- Régler les factures aux échéances prévues ;
- Utiliser le Logiciel conformément à sa documentation et aux conditions générales d'utilisation ;
- Désigner un **interlocuteur technique référent** (administrateur du Hub côté Client) ;
- Communiquer au Prestataire les informations nécessaires à l'exécution des prestations (accès, contacts, configurations métier) ;
- Souscrire et maintenir une **assurance cyber-risques** conforme à l'article 8 bis.1 du *Contrat de mise à disposition* ;
- Ne pas modifier le code du Logiciel via un tiers, une IA générative ou un développeur externe sans accord écrit (cf. art. 10 bis du *Contrat de mise à disposition*) ;
- Signaler sans délai tout incident de sécurité à `security@astorya.fr`.

---

## ARTICLE 8 — RESPONSABILITÉ

**Article 8.1 — Responsabilité du Prestataire**
Le Prestataire est tenu d'une **obligation de moyens** dans l'exécution des prestations. Sa responsabilité ne saurait être engagée qu'en cas de faute prouvée, dans la limite des dommages directs prévisibles à la date de signature.

🛡 **Article 8.2 — Plafond de responsabilité**
La responsabilité totale du Prestataire au titre du présent Contrat, toutes causes et tous préjudices confondus, est plafonnée, par année contractuelle, à **un (1) fois le montant des sommes hors taxes effectivement perçues** du Client au titre du Contrat sur les douze (12) mois précédant le fait générateur du dommage.

🛡 **Article 8.3 — Exclusion des dommages indirects**
Le Prestataire ne saurait être tenu responsable des dommages indirects, immatériels ou consécutifs subis par le Client, en ce compris notamment : perte d'exploitation, perte de chiffre d'affaires, perte de clientèle, atteinte à l'image, frais de reconstitution de données dès lors qu'une sauvegarde air-gap était disponible.

🛡 **Article 8.4 — Exonération en cas de violation par le Client**
Le Prestataire est intégralement déchargé de toute responsabilité dans les cas suivants :
- Modification non autorisée du code par le Client ou un tiers (cf. art. 10 bis du *Contrat de mise à disposition*) ;
- Défaut d'assurance cyber-risques (art. 8 bis.1 du *Contrat de mise à disposition*) ;
- Refus ou défaillance de la sauvegarde déconnectée imposée par le Prestataire (art. 8 bis.2 du *Contrat de mise à disposition*) ;
- Utilisation du Logiciel non conforme à sa documentation ;
- Compromission de comptes utilisateurs liée à un défaut de protection des identifiants côté Client.

**Article 8.5 — Cas spécifique des sous-traitants critiques**
La responsabilité du Prestataire est limitée aux engagements qu'il peut obtenir de ses sous-traitants critiques (Vercel, Supabase). En cas de défaillance d'un sous-traitant entraînant l'indisponibilité simultanée d'une zone d'hébergement, le Prestataire met en œuvre tous les moyens raisonnables pour rétablir le service mais ne saurait être tenu d'un délai inférieur à celui dudit sous-traitant.

---

## ARTICLE 9 — RESTAURATION ET REMISE EN FONCTIONNEMENT 🛡

**Article 9.1 — Restauration au titre de la maintenance corrective (gratuite)**
Les restaurations nécessaires consécutives à un **incident imputable au Prestataire** (défaillance d'infrastructure, bug du Logiciel, faute d'un agent du Prestataire) sont prises en charge sans frais et dans les délais des SLA (art. 5).

🛡 **Article 9.2 — Restauration facturée**
Les restaurations consécutives à un **incident imputable au Client** ou à un **tiers agissant pour son compte** sont facturées selon la grille tarifaire de l'Annexe 2 (section « Restauration »), notamment :

| Cas | Tarif HT (référence) | Délai |
|---|---|---|
| Restauration standard (heures ouvrées) | **690 €** forfait | sous 4 h ouvrées |
| Heure supplémentaire au-delà du forfait | **120 €/h** | — |
| Restauration d'urgence (hors heures ouvrées, week-end, férié) | **1 200 €** forfait | sous 2 h |
| Restauration après modification non autorisée (audit + remise en état) | **sur devis, à partir de 1 500 €** | selon ampleur |

🛡 **Article 9.3 — Mode opératoire**
- Le Prestataire émet un **devis chiffré et communiqué immédiatement** au Client dès qualification de l'incident ;
- En cas d'urgence vitale pour l'activité du Client et sur sa **demande écrite** (mail, SMS), le Prestataire peut intervenir **sans attendre la signature du devis** ; la prestation est alors due au tarif d'urgence applicable, et facturée à terme échu ;
- La restauration s'effectue depuis la dernière sauvegarde saine disponible (sauvegarde de production ou air-gap, selon le cas), avec une perte maximale de données correspondant à l'intervalle entre la dernière sauvegarde et l'incident (RPO indicatif : 24 h pour la production, 24-48 h pour l'air-gap).

**Article 9.4 — Garantie post-restauration**
Le Prestataire teste l'intégrité fonctionnelle après restauration et émet un rapport de remise en service signé électroniquement.

---

## ARTICLE 10 — PROPRIÉTÉ INTELLECTUELLE

**Article 10.1** — La propriété intellectuelle du Logiciel et de son code reste celle du Prestataire (cf. art. 10 du *Contrat de mise à disposition*).

**Article 10.2** — Les **développements spécifiques** réalisés au titre de la TMA, dès lors qu'ils sont strictement liés à l'activité du Client et n'enrichissent pas le socle commun, deviennent la propriété du Client à compter de leur paiement intégral.

**Article 10.3** — Les développements intégrant le **socle commun** (amélioration de modules existants utiles à l'ensemble des clients) demeurent la propriété du Prestataire, le Client conservant un droit d'usage perpétuel et gratuit.

---

## ARTICLE 11 — CONFIDENTIALITÉ

Chacune des Parties s'engage à conserver strictement confidentielles toutes informations à caractère commercial, technique, financier ou organisationnel communiquées par l'autre Partie. Cette obligation reste en vigueur pendant toute la durée du Contrat et **5 ans** à compter de sa résiliation.

---

## ARTICLE 12 — ASSURANCES

**Article 12.1 — Assurance RC professionnelle du Prestataire**
Le Prestataire déclare avoir souscrit auprès d'une compagnie notoirement solvable une assurance Responsabilité Civile Professionnelle couvrant les conséquences financières des dommages corporels, matériels et immatériels causés au Client et aux tiers dans l'exécution du présent Contrat. Une attestation est communiquée au Client sur demande.

🛡 **Article 12.2 — Assurance cyber-risques du Client (obligatoire)**
Conformément à l'article 8 bis.1 du *Contrat de mise à disposition*, le Client souscrit et maintient une assurance cyber-risques couvrant a minima les violations de données, les pertes d'exploitation, les frais de remédiation et la RC à l'égard des personnes concernées. Une attestation est communiquée au Prestataire sur demande, et au plus tard dans les 30 jours suivant la signature du présent Contrat.

---

## ARTICLE 13 — RÉSILIATION

**Article 13.1 — Résiliation à l'échéance**
Chacune des Parties peut s'opposer à la reconduction tacite (cf. art. 2.2) par lettre recommandée avec accusé de réception adressée à l'autre Partie au plus tard **3 mois avant l'échéance**.

**Article 13.2 — Résiliation pour faute**
En cas de manquement grave de l'une des Parties à ses obligations, l'autre Partie peut résilier le Contrat de plein droit, après mise en demeure restée infructueuse pendant **30 jours**. La résiliation est notifiée par lettre recommandée avec accusé de réception.

**Article 13.3 — Résiliation pour impayé**
🛡 En cas de non-règlement de **deux échéances consécutives** malgré mise en demeure, le Prestataire peut résilier le Contrat de plein droit, sans préjudice du recouvrement des sommes dues et des dommages-intérêts.

**Article 13.4 — Conséquences de la résiliation**
- Le droit d'usage du Logiciel (régi par le *Contrat de mise à disposition*) cesse selon le calendrier prévu à l'article 11.3 dudit contrat ;
- L'**export des données reste garanti** dans les conditions de l'article 9 du *Contrat de mise à disposition*, **indépendamment du règlement des sommes dues** ;
- Le Client demeure tenu de régler l'intégralité des sommes dues au titre des prestations exécutées jusqu'à la date effective de résiliation ;
- En cas de résiliation pour faute du Prestataire avant terme, ce dernier rembourse au Client le prorata des sommes versées d'avance correspondant à la période non exécutée.

---

## ARTICLE 14 — FORCE MAJEURE

Aucune des Parties ne pourra être tenue responsable d'un manquement à ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil. Sont notamment considérés comme tels : catastrophes naturelles, guerres, actes de terrorisme, grèves générales, pannes massives d'opérateurs télécoms, attaques par déni de service distribué (DDoS) de grande ampleur ciblant l'écosystème (et non spécifiquement le Logiciel).

Si l'événement de force majeure se prolonge au-delà de **60 jours**, chaque Partie peut résilier le Contrat sans indemnité.

---

## ARTICLE 15 — DROIT APPLICABLE ET JURIDICTION

Le présent Contrat est régi par le **droit français**.

Tout litige relatif à son interprétation, son exécution ou sa résiliation, non résolu à l'amiable dans un délai de **30 jours**, sera soumis à la compétence exclusive du **Tribunal de Commerce de Nantes**, nonobstant pluralité de défendeurs ou appel en garantie.

---

## ARTICLE 16 — DISPOSITIONS DIVERSES

**16.1 — Articulation contractuelle**
Le présent Contrat de Services s'articule avec le *Contrat de mise à disposition gratuite du Logiciel* signé entre les Parties. En cas de contradiction entre les deux documents, les dispositions du *Contrat de mise à disposition* relatives à la propriété des données (art. 5), à la sécurité (art. 7), au RGPD (art. 8 et 8 bis), à la réversibilité (art. 9), à la propriété intellectuelle (art. 10) et à l'exclusion de responsabilité en cas de modification par un tiers (art. 10 bis) prévalent.

**16.2 — Intégralité**
Le présent Contrat, son Bon de commande et ses annexes constituent l'intégralité de l'accord entre les Parties relativement à son objet.

**16.3 — Avenants**
Toute modification doit faire l'objet d'un avenant écrit signé par les deux Parties.

**16.4 — Cession**
Le Contrat ne peut être cédé sans l'accord écrit préalable de l'autre Partie, hormis dans le cadre d'une fusion-absorption ou cession totale d'activité.

**16.5 — Nullité partielle**
La nullité d'une clause n'entraîne pas la nullité du Contrat, les autres clauses restant en vigueur.

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

## ANNEXE 1 — SLA détaillé par formule

| Critère | Essentiel | Business | Premium / TMA |
|---|---|---|---|
| **Disponibilité mensuelle garantie** | 99,5 % | 99,5 % | 99,7 % |
| **Maintenance corrective** | ✅ | ✅ | ✅ |
| **Maintenance évolutive** | — | ✅ | ✅ |
| **TMA mensuelle incluse** | — | — | ½ jour/mois |
| **Prise en compte P1 (critique)** | 1 h ouvrée | 30 min | 30 min |
| **Résolution cible P1** | 8 h ouvrées | 6 h ouvrées | 4 h ouvrées |
| **Prise en compte P2 (majeure)** | 4 h ouvrées | 2 h ouvrées | 1 h ouvrée |
| **Résolution cible P2** | 24 h ouvrées | 16 h ouvrées | 8 h ouvrées |
| **Support email** | ✅ | ✅ | ✅ |
| **Support téléphonique (hotline 9h-18h)** | — | ✅ | ✅ |
| **Support prioritaire** | — | — | ✅ |
| **Sauvegarde air-gap** | ✅ | ✅ | ✅ |
| **Test de restauration documenté** | trimestriel | trimestriel | mensuel |
| **Rapport mensuel d'activité** | — | ✅ | ✅ |
| **Comité de pilotage** | — | semestriel | trimestriel |

---

## ANNEXE 2 — Annexe tarifaire (modèle)

> Tarifs HT, à compléter dans le Bon de commande signé.

### Formules d'abonnement

| Formule | Tarif mensuel HT | Engagement |
|---|---|---|
| **Essentiel** | **49 à 89 €/mois** | 12 mois |
| **Business** | **129 à 199 €/mois** | 12 mois |
| **Premium / TMA** | **290 à 450 €/mois** | 24 mois |

> Fourchettes indicatives marché TPE/PME — à caler selon nombre d'utilisateurs, volume de données et complexité métier.

### Options et prestations à l'unité

| Prestation | Tarif HT |
|---|---|
| Sauvegarde air-gap externalisée (incluse dans les formules) | inclus, ou **29 €/mois** si souscrite seule |
| Journée de TMA additionnelle (au-delà de l'enveloppe) | **650 €/jour** |
| Demi-journée de TMA additionnelle | **390 €** |
| Migration / mise en service initiale | **sur devis, à partir de 990 €** |
| Formation utilisateurs (½ journée à distance) | **490 €** |
| Formation administrateur (1 journée sur site) | **990 €** + frais de déplacement |

### Restauration / remise en fonctionnement (cf. art. 9)

| Cas | Tarif HT | Délai |
|---|---|---|
| Restauration standard (heures ouvrées, incident simple) | **690 €** forfait | sous 4 h ouvrées |
| Heure supplémentaire au-delà du forfait | **120 €/h** | — |
| Restauration d'urgence (hors heures ouvrées / week-end / férié) | **1 200 €** forfait | sous 2 h |
| Restauration après modification non autorisée (art. 10 bis du *Contrat de mise à disposition*) — audit + remise en état | **sur devis, à partir de 1 500 €** | selon ampleur |
| Récupération avant export sur sauvegarde air-gap (à la demande) | **390 €** par récupération ponctuelle | sous 24 h ouvrées |

### Conditions

- Tarifs valables à la signature ; révision annuelle au 1er janvier selon l'indice Syntec, plafonnée à +5 %/an (cf. art. 4.3).
- TVA en sus selon le taux en vigueur.
- Facturation à terme à échoir, paiement à 30 jours date de facture.

---

## ANNEXE 3 — Sous-traitants techniques

| Sous-traitant | Localisation | Service | Conformité |
|---|---|---|---|
| **Vercel Inc.** | UE (Pays-Bas / Allemagne) | Hébergement applicatif | RGPD (DPA), ISO 27001 |
| **Supabase Inc.** | UE (Irlande) | Base de données + Auth + Storage | RGPD (DPA), SOC 2 |
| **Let's Encrypt** | UE / global | Certificats SSL/TLS | CA/Browser Forum |
| **[Datacenter français]** | France métropolitaine | Sauvegardes air-gap | ISO 27001 |
| **Logitas** (ex-APP) | France | Séquestre code source | Tiers de confiance |

Toute modification de cette liste est notifiée au Client avec préavis de **30 jours**.

---

## ANNEXE 4 — Mode opératoire de support

### Canaux

| Canal | Adresse / Numéro | Disponibilité |
|---|---|---|
| **Email support** | `support@astorya.fr` | 24/7 — traitement en heures ouvrées |
| **Hotline (Business + Premium)** | 02 85 52 13 95 | Lun-Ven 9 h–18 h |
| **Signalement incident sécurité** | `security@astorya.fr` | 24/7 — réponse sous 24 h |
| **Demande RGPD / export** | `dpo@astorya.fr` | Réponse sous 5 j ouvrés |
| **Astreinte d'urgence (Premium uniquement)** | numéro communiqué à la signature | 24/7 |

### Process de qualification d'un ticket

1. Réception et accusé de réception automatique sous 5 minutes ;
2. Qualification de la criticité (P1 / P2 / P3 / P4) par un technicien ;
3. Affectation au bon niveau (N1 support, N2 développement, N3 architecte) ;
4. Communication régulière au Client sur l'avancement (au moins toutes les 4 h pour un P1) ;
5. Clôture avec rapport synthétique et confirmation client.

---

## ANNEXE 5 — Bon de commande type

```
BON DE COMMANDE — Contrat de Services Hub Astorya

Client : ______________________________________
SIRET  : ______________________________________
Adresse : _____________________________________

Formule souscrite : [ ] Essentiel  [ ] Business  [ ] Premium / TMA

Tarif mensuel HT : _________ €
Périodicité de facturation : [ ] Mensuelle  [ ] Trimestrielle  [ ] Annuelle
Date de mise en service souhaitée : ___ / ___ / 2026

Options souscrites :
[ ] Sauvegarde air-gap seule (29 €/mois)         — si formule Essentiel sans inclusion
[ ] Formation utilisateurs (½ j) — 490 €
[ ] Formation administrateur (1 j) — 990 € + frais
[ ] Migration / mise en service — devis joint

Engagement : [ ] 12 mois  [ ] 24 mois (Premium)

Total HT mensuel : _________ €
TVA 20 % :         _________ €
Total TTC mensuel : _________ €

Pour le Client                          Pour le Prestataire
Fait le : ___/___/2026                  Fait le : ___/___/2026

Signature :                             Signature :
```

---

*Fin du document — Contrat de Services + 5 annexes.*
