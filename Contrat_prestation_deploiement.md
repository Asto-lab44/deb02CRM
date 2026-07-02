# CONTRAT DE PRESTATION DE DÉPLOIEMENT ET DE MISE EN LIGNE

## ENTRE LES SOUSSIGNÉS

**LE PRESTATAIRE**
S.A.R.L. ASTORYA SGI — 9 rue du Petit Châtelier, 44300 Nantes
SIRET : 523 625 804 00027 — Capital social : 7 500,00 €
Représentée par son gérant, dûment habilité.
Ci-après « le Prestataire ».

**LE CLIENT**
Raison sociale : ________________________  ·  SIREN/SIRET : ________________
Adresse : ______________________________________________________
Représenté par : ______________________  ·  Qualité : __________________
Ci-après « le Client ».

Ci-après ensemble « les Parties ».

---

## PRÉAMBULE
Le Prestataire réalise pour le Client la **mise en ligne** d'une application web
(le « Logiciel ») : mise en place du dépôt de code, déploiement sur la
plateforme d'hébergement, sécurisation (HTTPS/SSL) et raccordement au nom de
domaine, puis, en phase optionnelle, le **transfert vers un hébergement OVH**.
Le détail chiffré des prestations figure au **devis annexé**, qui fait partie
intégrante du présent Contrat.

---

## ARTICLE 1 — OBJET
Le présent Contrat a pour objet de définir les conditions dans lesquelles le
Prestataire réalise les prestations de déploiement et de mise en ligne décrites
à l'article 2, ainsi que les responsabilités respectives des Parties.

## ARTICLE 2 — DESCRIPTION DES PRESTATIONS

**2.1 — Phase 1 : mise en ligne**
- Mise en place du **dépôt Git** (initialisation, branches, accès) ;
- **Déploiement** de l'application sur la plateforme (build, variables
  d'environnement, en-têtes de sécurité) ;
- Configuration du **nom de domaine (DNS)** ;
- Émission et installation du **certificat SSL** (HTTPS, redirection, chaîne de
  confiance) ;
- Configuration de l'**environnement applicatif** (clés de service, connexions) ;
- **Recette** et mise en production ; **formation** à la prise en main.

**2.2 — Phase 2 (optionnelle) : transfert vers OVH**
Déclenchée sur demande écrite du Client après validation : provisionnement de
l'hébergement OVH, transfert du code et des assets, configuration serveur,
repointage DNS, réinstallation du certificat SSL, recette post-migration.

**2.3 — Périmètre**
Les prestations sont limitées aux tâches listées au devis. Toute demande hors
périmètre fait l'objet d'un devis complémentaire.

## ARTICLE 3 — MODALITÉS ET PLANNING
Les prestations débutent après signature du Contrat, acceptation du devis et
mise à disposition par le Client des accès nécessaires (art. 6). Un **planning
prévisionnel** et des **jalons** sont convenus entre les Parties. Les délais
sont donnés à titre indicatif et courent à compter de la réception de
l'ensemble des éléments et accès requis.

## ARTICLE 4 — PRIX ET FACTURATION
**4.1** Les prix sont ceux du devis annexé, exprimés **hors taxes**, TVA en sus
au taux en vigueur.
**4.2** Modalités : **acompte de 40 %** à la commande, solde à la **recette**
(mise en production). La Phase 2 (OVH) est facturée séparément à son
déclenchement.
**4.3 — Pénalités de retard** : toute somme non réglée à l'échéance porte
intérêt, sans mise en demeure préalable, au taux d'intérêt légal majoré, sans
pouvoir être inférieur à **trois fois le taux d'intérêt légal** (loi 2008-776 du
04/08/2008), outre une **indemnité forfaitaire de recouvrement de 40 €**.

## ARTICLE 5 — OBLIGATIONS DU PRESTATAIRE (RESPONSABILITÉS)
Le Prestataire s'engage à :
- Exécuter les prestations avec **diligence, professionnalisme et selon les
  règles de l'art** (obligation de moyens) ;
- Mettre en œuvre une configuration **sécurisée** (HTTPS/SSL, en-têtes de
  sécurité) conforme à l'état de l'art à la date d'intervention ;
- **Documenter** la configuration livrée (accès, paramètres, procédure de
  déploiement) et la remettre au Client ;
- **Notifier sans délai** tout incident significatif affectant la mise en ligne ;
- Restituer au Client la **pleine maîtrise** de ses comptes tiers (dépôt,
  hébergement, domaine) — voir art. 8 ;
- Respecter ses obligations en matière de **protection des données** (art. 9).

## ARTICLE 6 — OBLIGATIONS DU CLIENT
Le Client s'engage à :
- Régler les factures aux échéances prévues (art. 4) ;
- Désigner un **interlocuteur référent** ;
- Fournir en temps utile les **accès et éléments** nécessaires : compte/plateforme
  d'hébergement, **nom de domaine et accès DNS**, compte OVH (Phase 2), clés et
  paramètres applicatifs, contacts techniques ;
- Être **titulaire** (ou le devenir) des comptes tiers (hébergeur, domaine,
  services) à son nom ;
- Utiliser l'application conformément à sa documentation ;
- Signaler sans délai tout incident de sécurité.
Tout retard ou défaut de fourniture des accès suspend d'autant les délais et
peut donner lieu à refacturation du temps improductif.

## ARTICLE 7 — RÉCEPTION / RECETTE
À l'issue de la Phase 1, le Client procède à la **recette** (vérification du bon
fonctionnement : accès, HTTPS, parcours principaux). À défaut de réserve écrite
et motivée dans un délai de **cinq (5) jours ouvrés**, la recette est réputée
**acceptée** et les prestations réputées conformes. La mise en production vaut
présomption de bon fonctionnement.

## ARTICLE 8 — RESPONSABILITÉ
**8.1** Le Prestataire est tenu d'une **obligation de moyens**. Sa
responsabilité ne peut être engagée qu'en cas de **faute prouvée**, dans la
limite des **dommages directs** prévisibles à la date de signature.
**8.2 — Plafond** : la responsabilité totale du Prestataire, toutes causes
confondues, est **plafonnée au montant HT effectivement perçu** au titre des
prestations concernées.
**8.3 — Dommages indirects exclus** : perte d'exploitation, de chiffre
d'affaires, de données (dès lors qu'une sauvegarde était disponible), atteinte à
l'image, etc.
**8.4 — Exonération** : le Prestataire est déchargé de toute responsabilité en
cas de modification du code/configuration par le Client ou un tiers après
livraison, d'utilisation non conforme, de défaut d'accès/d'assurance côté
Client, ou de compromission d'identifiants côté Client.
**8.5 — Sous-traitants et tiers** : les plateformes tierces (dépôt, hébergeur
Vercel/OVH, base de données, autorité de certification, registrar) sont hors du
contrôle du Prestataire ; sa responsabilité se limite aux engagements qu'il peut
obtenir d'eux. Une indisponibilité imputable à l'un de ces tiers ne peut engager
le Prestataire au-delà des garanties dudit tiers.

## ARTICLE 9 — PROPRIÉTÉ, COMPTES TIERS ET DONNÉES
**9.1** Les **comptes tiers** (dépôt, hébergement, domaine, base de données)
sont ou deviennent la **propriété du Client**, à son nom ; le Prestataire n'y
dispose que d'accès nécessaires à la prestation, révocables à la livraison.
**9.2** La propriété intellectuelle du code applicatif demeure régie par le(s)
contrat(s) de licence/mise à disposition applicable(s) ; la présente prestation
porte sur le **déploiement**, non sur la cession du Logiciel.
**9.3 — RGPD** : chaque Partie respecte la réglementation applicable aux données
personnelles. Le Prestataire agit en sous-traitant pour les seuls traitements
strictement nécessaires au déploiement et ne conserve aucun accès au-delà.

## ARTICLE 10 — CONFIDENTIALITÉ
Les Parties s'engagent à garder confidentielles les informations échangées
(accès, clés, configurations, données) pendant la durée du Contrat et **deux (2)
ans** après son terme.

## ARTICLE 11 — GARANTIE DE PARFAIT ACHÈVEMENT
Le Prestataire corrige gratuitement, pendant **trente (30) jours** après la
recette, toute non-conformité de la mise en ligne qui lui serait imputable
(hors modification par un tiers et hors évolutions/demandes nouvelles).

## ARTICLE 12 — RÉVERSIBILITÉ / TRANSFERT
Le Client conservant la maîtrise de ses comptes tiers, la **réversibilité** est
assurée nativement. La Phase 2 organise le **transfert vers OVH** dans les mêmes
conditions de sécurité ; un contrôle de bon fonctionnement clôt la migration.

## ARTICLE 13 — RÉSILIATION
En cas de manquement grave d'une Partie non réparé **quinze (15) jours** après
mise en demeure, l'autre Partie peut résilier de plein droit. Les prestations
réalisées et les frais engagés jusqu'à la date d'effet restent dus.

## ARTICLE 14 — DROIT APPLICABLE ET JURIDICTION
Le présent Contrat est régi par le **droit français**. À défaut d'accord
amiable, compétence est attribuée aux **tribunaux du ressort du siège du
Prestataire**.

---

Fait à ______________________, le ______________, en deux exemplaires.

| Le Prestataire (ASTORYA SGI) | Le Client |
|---|---|
| Nom / qualité : | Nom / qualité : |
| Signature (précédée de « Bon pour accord ») : | Signature (précédée de « Lu et approuvé, bon pour accord ») : |

*Annexe : devis n° __________ du __________ (prestations et prix détaillés).*
