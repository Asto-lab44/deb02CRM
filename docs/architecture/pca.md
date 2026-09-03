# Plan de Continuité d'Activité (PCA) — Hub Astorya

**Éditeur :** S.A.R.L. ASTORYA S.G.I. — 44300 Nantes — SIRET 523 625 804 00027
**Version :** 1.0 · **Date :** 2026-09-03 · **Responsable :** Gérant (R. Daviaud)
**Diffusion :** interne / confidentiel · **Révision :** annuelle.

> **Articulation PRA / PCA.** Le **PRA** (`pra.md`) décrit comment *restaurer la
> technique* (RTO/RPO, sauvegardes, procédures). Le **PCA** décrit comment
> *l'entreprise continue de fonctionner* pendant l'indisponibilité et jusqu'au
> retour à la normale : modes dégradés, priorités, organisation, communication.

---

## 1. Objet & seuils de déclenchement

Le PCA s'active lorsqu'un incident dépasse le simple aléa technique et affecte
l'activité. Seuils indicatifs :

| Niveau | Situation | Action |
|---|---|---|
| **Vert** | Ralentissement, incident mineur < 30 min | Suivi, pas d'activation. |
| **Orange** | Indisponibilité 30 min – 4 h d'un service vital | Activation partielle (mode dégradé du service concerné). |
| **Rouge** | Indisponibilité > 4 h, corruption ou compromission | Activation complète PCA + PRA, cellule de crise. |

## 2. Activités critiques & priorités de reprise

| Priorité | Activités | Justification |
|:---:|---|---|
| **P1** | Authentification/accès · **Facturation & encaissement** · **Support client (hotline)** · accès données clients/contrats | Impact direct chiffre d'affaires &amp; engagement client. |
| **P2** | CRM/pipeline · Devis · Comptabilité | Continuité commerciale et légale. |
| **P3** | Prospection · Marketing · BI/Rapports | Non bloquant à court terme. |

## 3. Modes de fonctionnement dégradé

Comment continuer **sans le Hub** pendant l'incident (les saisies seront
**réconciliées** au retour à la normale — cf. §6).

| Domaine | Mode dégradé pendant l'incident |
|---|---|
| **Accès / Auth** | Procédure d'accès de secours ; à défaut, travail hors-ligne sur gabarits locaux. |
| **Facturation** | Établir les factures sur **gabarit local** (modèle type Sage / tableur) ; numérotation réservée ; régularisation dans le Hub ensuite. |
| **Support / Hotline** | Renvoi d'appel opérateur + **registre papier/tableur** des tickets ; rappel clients prioritaires. |
| **Contrats** | Génération depuis **gabarits PDF locaux** (modèles d'hébergement, téléphonie, maintenance…). |
| **Comptabilité** | Conservation des pièces ; **saisie différée** dès rétablissement ; échéances TVA sécurisées. |
| **Trésorerie / SEPA** | Reporter la génération SEPA ; prévenir la banque si échéance critique. |
| **E-mail** | Envoi via **Outlook (poste)** en direct (le mode mailto reste opérant). |
| **Données de référence** | Utiliser la **dernière copie exportée** (Excel) en consultation. |

## 4. Organisation pendant la crise

- **Cellule de crise** : Responsable PCA (gérant), référent technique, communication.
- **Cadence** : point de situation toutes les **30 min** (rouge) / **2 h** (orange).
- **Main courante** : chaque décision et action est **horodatée et consignée** (annexe E).
- **Décision de bascule** : prise par le Responsable PCA sur avis du référent technique.

## 5. Communication

| Cible | Message | Canal |
|---|---|---|
| Équipe interne | Nature, consignes, mode dégradé applicable | Canal interne défini |
| Clients impactés | Fait, impact, délai estimé, point de contact | E-mail / téléphone |
| Fournisseurs | Ticket support (Vercel/Supabase/OVH/registrar/3CX) | Portail support |

## 6. Retour à la normale (réconciliation)

1. Confirmer le **rétablissement technique** (via PRA) et l'intégrité des données.
2. **Ressaisir / importer** dans le Hub les opérations faites en mode dégradé
   (factures, tickets, contrats), dans l'ordre **P1 → P2 → P3**.
3. **Contrôler la cohérence** (numérotation factures, doublons, séquences comptables).
4. Générer les **SEPA** reportés ; régulariser les échéances.
5. **Clôturer** la main courante ; réaliser un **post-mortem** (causes, actions correctives).

---

## Annexe C — Fiche contacts *(à compléter et tenir à jour)*

| Rôle / Fournisseur | Nom | Téléphone | E-mail / Portail | Notes |
|---|---|---|---|---|
| Responsable PCA/PRA |  |  |  |  |
| Référent technique |  |  |  |  |
| Suppléant technique |  |  |  |  |
| Communication |  |  |  |  |
| Hébergeur — Vercel |  |  |  | plan / support |
| Base — Supabase |  |  |  | projet cqdgecllzyqimfuovrpp |
| Serveur — OVH (cible) |  |  |  |  |
| Registrar DNS |  |  |  | domaine astorya.fr |
| E-mail — SendGrid |  |  |  |  |
| Téléphonie — 3CX / opérateur |  |  |  |  |
| Banque (SEPA) |  |  |  |  |

## Annexe D — Journal des tests PRA/PCA *(à tenir à jour)*

| Date | Test | Périmètre | Résultat | Temps réel (vs RTO) | Écarts / actions |
|---|---|---|---|---|---|
|  | Restauration BDD |  |  |  |  |
|  | Redéploiement app |  |  |  |  |
|  | Rotation secrets |  |  |  |  |
|  | Exercice complet (S8) |  |  |  |  |

## Annexe E — Main courante d'incident *(modèle)*

| Horodatage | Auteur | Constat / Décision / Action | Statut |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

---

*Document confidentiel — ASTORYA S.G.I. · Hub Astorya. Complément du PRA (`pra.md`).*
