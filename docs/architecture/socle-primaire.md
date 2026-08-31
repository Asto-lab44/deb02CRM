# Socle primaire — Hub Astorya

> **Définition.** Le *socle primaire* est le noyau du Hub présent dans **toute**
> installation, quelle que soit l'entreprise et son secteur. Il regroupe les blocs
> et fonctions **obligatoires** — non désactivables. Tout le reste (« modules
> métier ») s'active selon l'activité de l'entreprise.
>
> **Principe directeur.** Est dans le socle ce qui répond à : *« toute entreprise
> doit se connecter en sécurité, gérer ses tiers, facturer, tenir sa comptabilité
> et se piloter »*. Est hors socle ce qui dépend du **modèle d'activité**
> (support, projet, stock, récurrent, marketing…).

---

## 1. Bloc Sécurité & Conformité *(transversal, toujours actif)*

La sécurité n'est pas un module optionnel : c'est la **couche englobante** qui
protège tous les autres blocs (défense en profondeur). 10 domaines obligatoires :

| # | Domaine | Fonctions obligatoires |
|---|---|---|
| 1 | Authentification & SSO | Connexion sécurisée (JWT), MFA, SSO Microsoft 365 / OAuth, sessions expirantes, déconnexion auto |
| 2 | Gestion des accès (RBAC) | Groupes, rôles, permissions granulaires par module/action, moindre privilège |
| 3 | Chiffrement | TLS/HTTPS de bout en bout, chiffrement au repos, secrets côté serveur |
| 4 | Durcissement web | HSTS, CSP stricte, X-Frame DENY, nosniff, COOP, Permissions-Policy |
| 5 | Protection des données | RLS par ligne, cloisonnement, soft-delete, validation des saisies |
| 6 | Sauvegarde & versioning | Sauvegardes auto (point-in-time), **hors-ligne ANSSI 3-2-1**, versioning Git |
| 7 | Continuité d'activité | Extrait PRA/PCA, RTO/RPO, procédure de bascule, tests de restauration |
| 8 | Journalisation & traçabilité | Journal horodaté, traçabilité des accès et modifications |
| 9 | Tests & supervision | Audits de code, veille CVE, supervision disponibilité/erreurs |
| 10 | RGPD & souveraineté | Hébergement 100 % France, registre des traitements, minimisation, FEC conforme DGFiP |

---

## 2. Bloc Fondations techniques & Hub

| Fonction | Détail |
|---|---|
| Base de données | Supabase, fonctionnement dégradé (aucune perte de saisie hors-ligne) |
| Accueil / tableau de bord | Tuiles, KPI live, actions à mener |
| Navigation & recherche | Navigation transversale, recherche globale |
| Présence & activité temps réel | Sessions du jour, utilisateurs en ligne, verrouillages |
| Notifications | Alertes internes |
| Import Excel généralisé | Brique commune à la plupart des modules |

## 3. Bloc Référentiel Tiers

| Fonction | Détail |
|---|---|
| Comptes & contacts | Fiche client 360° minimale |
| Fournisseurs | Annuaire |
| Veille légale entreprises | SIREN/SIRET, Pappers/BODACC (contexte France) |
| E-mail & téléphonie | Ouverture Outlook pré-rempli, modèles d'e-mails |

## 4. Bloc Chaîne financière

| Fonction | Détail |
|---|---|
| Devis & Factures | Documents commerciaux, numérotation, TVA, PDF |
| Catalogue | Articles & prestations |
| Comptabilité | Plan comptable, journaux, écritures, balance, grand livre, TVA, **export FEC DGFiP** |
| Trésorerie | Encaissements, rapprochement, relances |

## 5. Bloc Pilotage & Administration

| Fonction | Détail |
|---|---|
| Rapports & BI | Tableaux de bord, KPI/SLA consolidés |
| Administration | Paramétrage, gestion des accès, SSO O365 |
| Espace documentaire | Bibliothèque SharePoint / Microsoft 365 |

---

## 6. Hors socle — modules métier *(activés selon l'activité)*

| Module | S'active si… |
|---|---|
| Support technique + téléphonie 3CX | l'entreprise fait du support / hotline |
| Projets & Livrables | activité en mode projet |
| Commande fournisseur & Stock | gestion d'inventaire / matériel |
| Contrats & abonnements + SEPA | revenus récurrents / prélèvements |
| Intelligence concurrentielle / Prospection | démarche de conquête commerciale |
| Marketing & Campagnes | acquisition marketing |
| RH & Paie | paie internalisée (sinon externalisée) |
| Modules verticaux (ex. hébergement web) | métier spécifique |

---

## 7. Matrice de déploiement *(quoi activer selon l'entreprise)*

Le **socle primaire** (les 5 blocs + sécurité) est toujours inclus (✓). Les
modules métier s'activent selon l'archétype d'entreprise.

| Bloc / module | Services & conseil | Négoce & distribution | IT & infogérance | Industrie & atelier | Agence & communication |
|---|:---:|:---:|:---:|:---:|:---:|
| **Socle primaire (5 blocs + sécurité)** | ✓ | ✓ | ✓ | ✓ | ✓ |
| Support technique + 3CX | ○ | ○ | ● | ○ | — |
| Projets & Livrables | ● | — | ● | ● | ● |
| Commande fournisseur & Stock | — | ● | ● | ● | — |
| Contrats & abonnements + SEPA | ● | ○ | ● | ○ | ● |
| Intelligence concurrentielle | ○ | ○ | ● | ○ | ● |
| Marketing & Campagnes | ○ | ○ | ○ | — | ● |
| RH & Paie | ○ | ● | ● | ● | ○ |

**Légende :** ✓ Socle, toujours inclus · ● Activé recommandé · ○ Optionnel selon besoin · — Rarement utile.

*Les archétypes sont indicatifs : chaque déploiement se paramètre au cas par cas.*

---

## Schéma

Représentation : la **Sécurité & Conformité** englobe le **socle primaire**
(Fondations/Hub · Tiers · Finance · Pilotage) ; les **modules métier** se
greffent en couronne, activés à la carte.

Schéma visuel : `docs/architecture/socle-primaire.html` (+ PDF).

---

*Document d'architecture — ASTORYA S.G.I. · Hub Astorya.*
