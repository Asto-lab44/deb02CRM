# Schéma de travail — tâches comptables ↔ tuiles du Hub

D'après le fichier `Taches_compta.xlsx` (34 tâches, 8 services, 3 sociétés
**Astorya / RD Participation / Octopus**, fréquences quotidienne → mensuelle).
Objectif : rattacher chaque tâche à une **tuile** du Hub et proposer une
**organisation de travail** pour la compta.

Légende couverture : ✅ couvert par le Hub · 🟡 partiel · 🔴 à créer / hors Hub.

---

## 1. Mapping tâche → tuile

### Trésorerie
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Saisir banques via Bankin | Comptabilité (journal Banque) | 🔴 import Bankin à connecter |
| Saisir banques via relevé | Comptabilité (journal Banque) | 🟡 saisie manuelle OD/BQ |
| Rapprochement bancaire | Comptabilité | 🟡 (lettrage oui ; rapprochement relevé à venir) |
| Lettrage | Comptabilité → Grand livre (lettrage auto + manuel) | ✅ |
| Prélèvements factures récurrentes (15 du mois) | Contrats & abonnements → **SEPA** | ✅ |
| Prélèvements factures ponctuelles | Gestion commerciale + SEPA | 🟡 |
| Contrôle prélèvements & rejets | Trésorerie / Comptabilité | 🔴 gestion des rejets à créer |

### Achats
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Vérification factures fournisseur à régler | Comptabilité (journal Achats) + Fournisseurs | 🟡 workflow « à régler » à créer |
| Règlement des factures fournisseur | Comptabilité / Trésorerie | 🟡 |
| Saisie des achats fournisseurs | Comptabilité (journal AC) | ✅ (génération depuis commandes d'achat) |
| Vérification et saisie des NDF | Comptabilité (OD) | 🟡 |

### Relances
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Relance clients (quinzaine) | Trésorerie (restes à recouvrer) + **Playbook relance** | 🟡 |
| Veille des retours des dossiers Agir | Comptabilité (recouvrement AGIR) / CRM | 🔴 suivi dossiers Agir à créer |

### Clients
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Traitement des mails clients | Ticketing / Demandes entrantes | 🟡 |
| Point résiliation (avec Laurent) | Contrats & abonnements | 🟡 |
| Résiliation des contrats | Contrats & abonnements (statut résilié) | ✅ |
| Envoi chez Agir des dossiers > 3 mois | Comptabilité / Recouvrement | 🔴 |
| Suivi clients en liquidation/redressement | Intelligence concurrentielle (**BODACC**) + Fiche client | 🟡 |

### Facturation
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Vérif abonnements CSP avant le 05 | Contrats & abonnements | ✅ |
| Facturation récurrente (Manatel / BE Cloud / ERP / ALSO) | Contrats & abonnements (génération) | ✅ (ALSO = connecteur externe) |
| Facturation récurrente SAGE | Contrats / export | 🟡 (Sage = externe) |
| Envoi des factures récurrentes | Gestion commerciale (envoi email/Outlook) | ✅ |
| Intégration en compta des écritures | Comptabilité (génération depuis ventes) | ✅ |
| Facturation ponctuelle | Gestion commerciale (Devis→Facture) | ✅ |
| Vérification factures ponctuelles | Gestion commerciale | ✅ |
| Facturation « Page Pack » | Contrats / Gestion commerciale | 🟡 |
| BL non passés en livrable | Projets & Livrables (BL→facture) | 🟡 |
| MAJ contrats selon envois techniciens | Contrats & abonnements | 🟡 |

### Salariés
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Envoi éléments de paie à Catherine | RH & Paie 🚧 | 🔴 (module à venir) |
| Saisie des écritures de paie | Comptabilité (OD paie) | 🟡 saisie manuelle |

### Suivi
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Point CA à Romain | Rapports & BI 🚧 / Trésorerie | 🟡 |
| Point trésorerie à Romain | Trésorerie | ✅ |
| Point relance | Trésorerie (restes à recouvrer) | ✅ |

### Fiscal
| Tâche | Tuile Hub | Couv. |
|---|---|---|
| Déclaration de TVA | Comptabilité → onglet **TVA** (+ écriture) | ✅ |

---

## 2. Ce que le Hub automatise déjà (à valoriser tout de suite)
- **Facturation récurrente** + envoi + intégration comptable → module **Contrats & abonnements** (génère 1 facture/client, PDF + écritures).
- **Prélèvements SEPA** (CSV + XML pain.008) → Contrats.
- **Déclaration de TVA** + écriture → Comptabilité.
- **Lettrage** (auto facture↔règlement + manuel), grand livre, balance, FEC.
- **Restes à recouvrer / trésorerie** → Trésorerie.
- **Résiliation de contrats**, **suivi BODACC** (redressement/liquidation).

## 3. Manques identifiés (backlog priorisé)
1. **Multi-société** : Astorya / RD Participation / Octopus ont des périodicités
   différentes. Le Hub est aujourd'hui **mono-société** → prévoir la notion de
   société (ou 3 instances) — **prérequis structurant**.
2. **Import bancaire** (Bankin / relevés) + **rapprochement automatique**.
3. **Gestion des rejets** de prélèvement (motif, relance, ré-émission).
4. **Workflow fournisseurs** « à vérifier / à régler / réglé » (échéancier achats).
5. **Suivi dossiers de recouvrement AGIR** (statut, retours).
6. **Paie** (module RH) + intégration OD paie.
7. **Connecteurs externes** (ALSO, SAGE) — refacturation / imports.

## 4. Organisation de travail proposée — tuile « Routines comptables »
Transformer ce fichier Excel en **plan de charge vivant** dans le Hub :
- Une tuile **« Routines & clôtures »** (catégorie Finance) : tableau des tâches
  **groupées par fréquence** (Quotidien · Hebdo · Quinzaine · Mensuel), filtrable
  par **société** et par **service**.
- Chaque tâche : **case à cocher** (fait / à faire sur la période), **responsable**,
  **échéance**, et un **lien direct vers la tuile** qui la réalise (ex. « Déclaration
  de TVA » → Comptabilité/TVA ; « Facturation récurrente » → Contrats).
- **Réinitialisation automatique** à chaque période (une routine hebdo se
  recoche chaque semaine), avec **historique** (qui a fait quoi, quand).
- **Tableau de clôture mensuelle** : checklist ordonnée (facturation → envoi →
  intégration compta → prélèvements → TVA → points Romain) avec avancement %.

### Cadence type du comptable (mono-vue)
- **Quotidien** : mails clients, résiliations, saisie achats, MAJ contrats
  techniciens.
- **Hebdo** : banques + rapprochement + lettrage, factures fournisseurs, veille
  Agir, facturation ponctuelle.
- **Quinzaine** : relances clients, prélèvements des factures ponctuelles.
- **Mensuel (clôture)** : vérif abonnements (avant le 05) → facturation
  récurrente → envoi → intégration compta → prélèvements (15) → **TVA** →
  points CA/tréso/relance à Romain → paie → contrôle rejets.

---

## 5. Proposition
Je peux **construire la tuile « Routines & clôtures »** (board multi-fréquence,
multi-société, cases à cocher + responsable + lien vers la tuile de chaque
tâche + réinitialisation périodique + suivi de clôture), **pré-remplie avec les
34 tâches** du fichier. C'est le meilleur point d'entrée pour ton collègue :
il retrouve son Excel, mais connecté aux modules qui font le travail.

Souhaites-tu que je la développe ? Et confirme-moi le point **multi-société**
(gère-t-on Astorya + RD Participation + Octopus dans le même Hub, ou séparément ?).
