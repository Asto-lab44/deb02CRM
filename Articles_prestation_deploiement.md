# Articles de prestation — Déploiement Hub / application web

> Catalogue prêt à poser dans un devis. **Prix HT indicatifs — à ajuster selon
> vos tarifs.** TVA 20 % (sauf régime particulier). Unité « forfait » sauf
> mention. Réfs proposées (préfixe `AST-`).

## Phase 1 — Mise en ligne (Git + Vercel + SSL)

| Réf | Désignation | Description | Unité | Qté | PU HT | TVA |
|---|---|---|---|---|---|---|
| AST-DOMAINE | Nom de domaine (achat + paramétrage) | Achat/enregistrement du domaine **au nom du client** (1 an) et configuration initiale. | forfait | 1 | **45,00 €** | 20 % |
| AST-GIT-INIT | Mise en place du dépôt Git | Création/initialisation du dépôt, structuration des branches, premier push, gestion des accès collaborateurs. | forfait | 1 | **150,00 €** | 20 % |
| AST-DEPLOY-VERCEL | Déploiement sur Vercel | Connexion du dépôt à Vercel, configuration du build et des **variables d'environnement**, réglage des en-têtes de sécurité (HSTS, CSP), déploiement en production. | forfait | 1 | **350,00 €** | 20 % |
| AST-DNS | Configuration du nom de domaine (DNS) | Paramétrage des enregistrements DNS (A/CNAME), rattachement du domaine à l'hébergement, vérification de propagation. | forfait | 1 | **90,00 €** | 20 % |
| AST-SSL | Certificat SSL / HTTPS | Émission et installation du certificat SSL, forçage HTTPS, redirection http→https, vérification de la chaîne de confiance. | forfait | 1 | **120,00 €** | 20 % |
| AST-ENV-CONF | Configuration environnement applicatif | Paramétrage des clés de service, connexion base de données/API, réglages applicatifs de mise en production. | forfait | 1 | **220,00 €** | 20 % |
| AST-RECETTE | Recette & mise en production | Tests de bout en bout (connexion, parcours principaux), validation avec le client, bascule en production. | forfait | 1 | **250,00 €** | 20 % |
| AST-FORM-2H | Formation / prise en main (2 h) | Session de prise en main à distance ou sur site (2 heures). | heure | 2 | **90,00 €** | 20 % |

**Sous-total Phase 1 (indicatif)** : 150 + 350 + 90 + 120 + 220 + 250 + (2×90) = **1 360,00 € HT** · TVA 272,00 € · **TTC 1 632,00 €**.

## Phase 2 — Transfert vers hébergement OVH (à réaliser après validation client)

| Réf | Désignation | Description | Unité | Qté | PU HT | TVA |
|---|---|---|---|---|---|---|
| AST-MIG-OVH | Transfert du code sur hébergement OVH | Provisionnement de l'hébergement OVH, transfert du code et des assets, configuration serveur web (en-têtes, réécritures), mise en service. | forfait | 1 | **600,00 €** | 20 % |
| AST-DNS-OVH | Repointage DNS vers OVH | Mise à jour des enregistrements DNS vers OVH, gestion de la bascule sans coupure, renouvellement/installation du certificat SSL sur OVH. | forfait | 1 | **150,00 €** | 20 % |
| AST-RECETTE-OVH | Recette post-migration | Contrôle de fonctionnement complet après bascule OVH, corrections d'adaptation éventuelles. | forfait | 1 | **200,00 €** | 20 % |

**Sous-total Phase 2 (indicatif)** : **950,00 € HT** · TVA 190,00 € · **TTC 1 140,00 €**.

## Qualité, sécurité & audit (à la demande)

| Réf | Désignation | Description | Unité | PU HT | TVA |
|---|---|---|---|---|---|
| AST-BUG-UNIT | Correction de bug (à l'heure) | Diagnostic + correction d'une anomalie, tests de non-régression. | heure | **95,00 €** | 20 % |
| AST-BUG-PACK5 | Pack correction de bugs (5 h) | Forfait de 5 h de corrections priorisées. | forfait | **430,00 €** | 20 % |
| AST-SUPPORT-J | Intervention corrective (journée) | Journée dédiée de corrections/ajustements. | jour | **650,00 €** | 20 % |
| AST-AUDIT-CODE | Audit de code & revue qualité | Dette technique, duplication, robustesse, gestion d'erreurs + rapport priorisé. | forfait | **900,00 €** | 20 % |
| AST-AUDIT-SEC | Audit de sécurité applicative (OWASP) | Vulnérabilités (auth, XSS, injections, secrets, en-têtes) + plan de remédiation. | forfait | **1 200,00 €** | 20 % |
| AST-AUDIT-RLS | Audit sécurité base de données & RLS | Politiques d'accès, isolation des données, accès anonymes. | forfait | **700,00 €** | 20 % |
| AST-AUDIT-FONC | Audit fonctionnel & intégrité | Flux, champs persistés, boutons/actions, cohérence des données. | forfait | **650,00 €** | 20 % |
| AST-AUDIT-PERF | Audit de performance & optimisation | Temps de chargement, requêtes, bundles + optimisations. | forfait | **750,00 €** | 20 % |
| AST-AUDIT-RGPD | Audit de conformité RGPD | Registre, bases légales, conservation, droits, sous-traitants. | forfait | **800,00 €** | 20 % |
| AST-PENTEST | Test d'intrusion léger (pentest) | Tests offensifs ciblés (environnement autorisé) + findings. | forfait | **1 500,00 €** | 20 % |
| AST-SEC-HARDEN | Durcissement du code & configuration | En-têtes (HSTS/CSP), secrets, gardes d'auth, anti-XSS. | forfait | **850,00 €** | 20 % |
| AST-SEC-RLS-FIX | Mise en conformité RLS / policies | Correction et durcissement des politiques d'accès. | forfait | **500,00 €** | 20 % |
| AST-SEC-PATCH | Application de correctifs de sécurité | Application + vérification (à l'heure). | heure | **95,00 €** | 20 % |
| AST-DEP-UPDATE | Mise à jour des dépendances & socle | Montée de version + non-régression. | forfait | **350,00 €** | 20 % |
| AST-TESTS | Mise en place de tests automatisés | Tests métier / non-régression + intégration. | jour | **650,00 €** | 20 % |
| AST-MONITOR | Supervision / alerting | Monitoring disponibilité, alertes, tableau de bord. | forfait | **400,00 €** | 20 % |

## Options / récurrent (facturation d'abonnement)

| Réf | Désignation | Description | Unité | PU HT | Périodicité |
|---|---|---|---|---|---|
| AST-TMA | Maintenance & supervision | Suivi de disponibilité, mises à jour de sécurité, sauvegardes, support. | mensuel | **90,00 €** | mensuel |
| AST-SEC-VEILLE | Veille & correctifs de sécurité | Veille continue + application des correctifs et mises à jour critiques. | mensuel | **120,00 €** | mensuel |
| AST-DOMAINE-RENEW | Renouvellement nom de domaine | Renouvellement annuel du domaine (refacturation). | annuel | **25,00 €** | annuel |
| AST-HEB-OVH | Hébergement OVH (refacturation) | Coût d'hébergement OVH refacturé (ou inclus selon offre). | mensuel | *selon offre OVH* | mensuel |
| AST-SSL-RENEW | Renouvellement SSL annuel | Renouvellement et réinstallation du certificat (si non auto-renouvelé). | annuel | **80,00 €** | annuel |

---

## Notes pour le devis
- **Découpage recommandé** : vendre la **Phase 1** maintenant, mettre la **Phase 2 (OVH)** en **option** ou lot séparé « déclenché après validation client » (ligne à part, non additionnée au total si optionnelle).
- **Acompte** : possibilité de « Règlement à la commande d'un acompte de 40 % » (déjà géré par vos devis).
- **Récurrent** : les lignes « mensuel/annuel » se posent dans le module **Contrats & abonnements** (facturation périodique + prélèvement SEPA), pas dans le devis ponctuel.
- **Hébergement/OVH** : si vous refacturez l'hébergement, indiquez-le en ligne récurrente ; sinon précisez « hébergement à la charge du client ».
- Adaptez les **prix**, l'**unité** (forfait vs heure) et le **taux de TVA** à votre grille.
