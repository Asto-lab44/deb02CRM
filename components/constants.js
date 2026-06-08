// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Constantes métier partagées
// ════════════════════════════════════════════════════════════════════
//
// Centralise les listes d'options utilisées dans plusieurs formulaires
// pour éviter la duplication.
//
// Usage :
//   <select>
//     {window.HubConstants.FONCTIONS.map(f => <option key={f}>{f}</option>)}
//   </select>
//
//   {window.HubConstants.SECTEURS.map(...)}
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  /** Fonctions / intitulés de poste pour les contacts client.
   *  Utilisé dans : NewProspect (contact principal + co-contacts),
   *  ClientPage (édition fiche + modal Ajouter contact). */
  const FONCTIONS = [
    "CEO / Directeur général",
    "COO / Directeur des opérations",
    "CFO / Directeur financier",
    "CTO / Directeur technique",
    "CIO / DSI",
    "CISO / RSSI",
    "CMO / Directeur marketing",
    "CHRO / DRH",
    "Directeur des achats",
    "Directeur de la transformation digitale",
    "Responsable IT / Manager SI",
    "Responsable infrastructure",
    "Chef de projet",
    "Architecte SI",
    "Consultant / Expert",
    "Acheteur",
    "Juriste / DPO",
    "Autre — préciser dans notes",
  ];

  /** Rôles dans la décision d'achat (champ "Rôle dans le projet"). */
  const ROLES_DECISION = [
    "Décideur",
    "Prescripteur",
    "Utilisateur",
    "Sponsor",
    "Influenceur",
    "Bloqueur potentiel",
  ];

  /** Effectifs d'entreprise (tranches INSEE simplifiées). */
  const EFFECTIFS = ["1-50", "51-250", "251-1k", "1k-5k", "5k+"];

  /** Tiers client (segmentation interne). */
  const TIERS = [
    { v: "A", label: "Tier A — grand compte stratégique" },
    { v: "B", label: "Tier B — mid-market" },
    { v: "C", label: "Tier C — petit compte" },
  ];

  /** Sources d'acquisition d'un prospect. */
  const SOURCES = [
    "Cold email sortant",
    "Cold call sortant",
    "LinkedIn / Sales Navigator",
    "Inbound site web",
    "Demande de devis",
    "Salon / Conférence",
    "Recommandation client",
    "Recommandation partenaire",
    "Référence interne",
    "Autre",
  ];

  /** Concurrents principaux (référencés pour radar). */
  const CONCURRENTS = [
    "Salesforce",
    "HubSpot",
    "Pipedrive",
    "Microsoft Dynamics",
    "Pega",
    "Guidewire",
    "Sellsy",
    "Zoho",
    "Aucun (greenfield)",
    "Autre",
  ];

  window.HubConstants = {
    FONCTIONS,
    ROLES_DECISION,
    EFFECTIFS,
    TIERS,
    SOURCES,
    CONCURRENTS,
  };
})();
