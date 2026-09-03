# Plan de Reprise d'Activité (PRA) — Hub Astorya

**Éditeur :** S.A.R.L. ASTORYA S.G.I. — 9 rue du Petit Châtelier, 44300 Nantes — SIRET 523 625 804 00027
**Objet :** Hub Astorya (ERP/CRM) — application web, base de données et services associés.
**Version :** 1.0 · **Date :** 2026-09-03 · **Responsable du plan :** Gérant (Romain Daviaud)
**Diffusion :** interne / confidentiel · **Révision :** annuelle (ou après tout incident majeur).

---

## 1. Objet & périmètre

Ce document décrit les mesures de **sauvegarde**, de **continuité** et de **reprise**
du Hub Astorya en cas d'incident majeur (indisponibilité, corruption, compromission,
sinistre). Il couvre :

- l'**application** (front statique + fonctions serverless) hébergée sur Vercel ;
- la **base de données** Supabase (PostgreSQL) ;
- le **code source** (GitHub) et la **chaîne de déploiement** ;
- les **secrets & configurations** ;
- les **services tiers** (Pappers, Dropcontact, Brave, SendGrid, Google Calendar, 3CX, IA) ;
- la **téléphonie 3CX**.

Hors périmètre : postes de travail individuels, réseau local du client, opérateurs télécom.

## 2. Définitions

| Terme | Définition |
|---|---|
| **RTO** (Recovery Time Objective) | Durée maximale d'interruption admissible avant reprise. |
| **RPO** (Recovery Point Objective) | Perte de données maximale admissible (fenêtre de sauvegarde). |
| **Sinistre** | Événement rendant un service indisponible au-delà du seuil toléré. |
| **Bascule** | Reprise du service sur une infrastructure/copie de secours. |
| **Règle 3-2-1** | 3 copies des données, sur 2 supports, dont 1 hors-ligne/hors-site. |

## 3. Rôles & cellule de crise

| Rôle | Responsable | Missions |
|---|---|---|
| **Responsable PRA (RPCA)** | Gérant — R. Daviaud | Déclenche le plan, décide de la bascule, communique. |
| **Référent technique** | *(à désigner)* | Exécute les restaurations, redéploiements, rotations de secrets. |
| **Suppléant** | *(à désigner)* | Continuité si le référent est indisponible. |
| **Communication** | Gérant | Informe clients & équipe. |

**Contacts fournisseurs** *(à compléter)* : Vercel (support/plan), Supabase (support projet
`cqdgecllzyqimfuovrpp`), Registrar DNS, OVH (serveur cible), Opérateur 3CX, SendGrid.

## 4. Objectifs de reprise (RTO / RPO) par composant

| Composant | Criticité | RTO cible | RPO cible | Moyen de reprise |
|---|:---:|:---:|:---:|---|
| Application (front + `/api`) | Vitale | **≤ 1 h** | **0** (code en Git) | Redéploiement Git → Vercel (stateless) |
| Base de données Supabase | Vitale | **≤ 4 h** | **≤ 5 min** (PITR) | Restauration PITR ; copie froide ≤ 24 h |
| Secrets & configuration | Vitale | **≤ 1 h** | 0 | Coffre-fort + variables d'env documentées |
| DNS / domaine | Vitale | **≤ 2 h** | 0 | Modification zone chez le registrar |
| Envoi d'e-mails (SendGrid) | Importante | **≤ 2 h** | 0 | Clé de secours ; mode dégradé (Outlook/mailto) |
| Téléphonie 3CX | Importante | **≤ 4 h** | n/a | Renvoi opérateur ; hotline en mode dégradé |
| Services d'enrichissement (Pappers, Dropcontact, Brave) | Secondaire | **≤ 48 h** | n/a | Fonctionnement dégradé, non bloquant |

**Objectifs globaux :** RTO ≤ 4 h · RPO ≤ 1 h pour le socle vital.

## 5. Dispositif de sauvegarde

- **Base de données :** sauvegardes automatiques Supabase avec **restauration point-in-time (PITR)** ;
  **export logique** régulier (`pg_dump`) stocké **hors-ligne / hors-site** (règle **3-2-1**, conforme ANSSI).
- **Code source :** **GitHub** = source de vérité (historique Git complet, branches protégées) ;
  le front est pré-compilé (`dist/`) et versionné → reconstruction sans dépendance externe.
- **Secrets :** conservés dans un **gestionnaire de mots de passe / coffre-fort** + variables
  d'environnement Vercel ; **liste des variables** maintenue (cf. `infrastructure.md`).
- **Documents comptables :** exports **FEC** et pièces archivés périodiquement (conformité DGFiP).
- **Configuration d'infrastructure :** `vercel.json`, scripts, mappings — versionnés dans Git.

## 6. Scénarios de sinistre & procédures de reprise

### S1 — Indisponibilité de l'hébergeur edge (Vercel)
- **Détection :** supervision de disponibilité / retours utilisateurs.
- **Impact :** application inaccessible.
- **Reprise :** 1) vérifier l'état Vercel ; 2) si panne prolongée, **redéployer** le dépôt Git
  sur une instance de secours (nouveau projet Vercel ou **serveur OVH dédié**) ; 3) repointer le **DNS**.
- **RTO ≤ 1 h · Responsable :** référent technique.

### S2 — Indisponibilité ou corruption de la base (Supabase)
- **Détection :** erreurs d'accès, incohérences.
- **Reprise :** 1) **PITR** vers l'instant précédant l'incident ; 2) si le projet est perdu,
  recréer un projet Supabase et **restaurer l'export logique** ; 3) mettre à jour `SUPABASE_URL`/clés.
- **RTO ≤ 4 h · RPO ≤ 5 min (PITR).**

### S3 — Rançongiciel / compromission de données
- **Reprise :** 1) **isoler** (révoquer clés & sessions, couper les accès) ; 2) restaurer depuis la
  **copie hors-ligne** (non chiffrable par l'attaquant) ; 3) **rotation complète des secrets** ;
  4) analyse post-incident. **La copie hors-ligne 3-2-1 est la garantie clé.**
- **RTO ≤ 8 h · RPO ≤ 24 h (copie froide).**

### S4 — Perte / fuite de secrets
- **Reprise :** **rotation** immédiate des clés concernées (Supabase service_role, Pappers,
  Dropcontact, Brave, SendGrid, Google SA, secret 3CX) ; mise à jour des variables d'env ; redéploiement.
- **RTO ≤ 1 h.**

### S5 — Panne DNS / domaine
- **Reprise :** vérifier la zone chez le registrar ; recréer les enregistrements A/CNAME vers l'edge ;
  attendre la propagation (TTL). **Prévoir un TTL court** avant opération planifiée.
- **RTO ≤ 2 h.**

### S6 — Indisponibilité de GitHub (source)
- **Impact :** déploiements bloqués (service en ligne non impacté).
- **Reprise :** utiliser un **miroir** du dépôt (clone local à jour) ; déployer manuellement si besoin.
- **RTO ≤ 4 h (déploiement) ; service courant non interrompu.**

### S7 — Panne de téléphonie (3CX)
- **Reprise :** renvoi d'appel opérateur ; hotline en **mode dégradé** (e-mail/ticket) ;
  le webhook `/api/3cx-webhook` reprend au rétablissement.
- **RTO ≤ 4 h.**

### S8 — Sinistre majeur → bascule vers serveur OVH dédié (cible)
- **Reprise :** déployer le dépôt sur le **serveur OVH (France)** ; restaurer la base (PITR/export) ;
  injecter les secrets ; repointer le DNS ; valider.
- **RTO ≤ 8 h · RPO ≤ 1 h.**

## 7. Procédure générale de reprise (synthèse)

1. **Qualifier** l'incident (composant, gravité) et **déclencher** le PRA.
2. **Isoler** si compromission (révocation clés/sessions).
3. **Restaurer** la donnée (PITR ou export hors-ligne) sur l'infra saine.
4. **Redéployer** l'application depuis Git.
5. **Réinjecter** les secrets (rotation si nécessaire).
6. **Repointer le DNS** vers l'infra de reprise.
7. **Vérifier** (connexion, données, flux critiques : facturation, contrats, e-mail).
8. **Communiquer** aux utilisateurs ; **documenter** l'incident (post-mortem).

## 8. Tests du plan

| Test | Fréquence | Objet |
|---|---|---|
| Restauration BDD (sandbox) | **Trimestrielle** | Vérifier PITR + export ; mesurer le temps réel. |
| Redéploiement application | **Semestrielle** | Reconstruire depuis Git sur instance neuve. |
| Rotation de secrets | **Semestrielle** | Vérifier la procédure et l'absence d'interruption. |
| Exercice PRA complet | **Annuelle** | Scénario S8 (bascule OVH) de bout en bout. |

Chaque test est **daté et consigné** (résultat, écarts, actions correctives).

## 9. Communication de crise

- **Interne :** information immédiate de l'équipe (canal défini).
- **Clients :** message factuel (nature, impact, délai estimé) ; point de rétablissement.
- **Fournisseurs :** ouverture de ticket support (Vercel/Supabase/OVH/registrar) si nécessaire.

## 10. Annexes

- **A.** Inventaire des composants & régions → `infrastructure.md` / `infrastructure-ops.html`.
- **B.** Liste des variables d'environnement (secrets) → `infrastructure.md`.
- **C.** Fiche contacts (RPCA, référent, fournisseurs) — *à compléter et tenir à jour*.
- **D.** Journal des tests PRA — *à tenir à jour*.

---

*Document confidentiel — ASTORYA S.G.I. · Hub Astorya. À réviser annuellement.*
