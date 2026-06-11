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
    // Direction
    "CEO / Directeur général",
    "Gérant / Dirigeant",
    "COO / Directeur des opérations",
    "Directeur de la transformation digitale",
    "Directeur de site / d'agence",
    "Secrétaire général",
    // Finance & Comptabilité
    "CFO / Directeur financier",
    "Directeur administratif et financier (DAF)",
    "Chef comptable",
    "Comptable",
    "Contrôleur de gestion",
    "Responsable trésorerie",
    "Crédit manager",
    // IT & Tech
    "CTO / Directeur technique",
    "CIO / DSI",
    "CISO / RSSI",
    "Responsable IT / Manager SI",
    "Responsable infrastructure",
    "Architecte SI",
    "Chef de projet IT",
    "DevOps / SRE",
    "Administrateur système / réseaux",
    "Technicien support / Helpdesk",
    // Marketing & Communication
    "CMO / Directeur marketing",
    "Responsable marketing",
    "Chargé de marketing",
    "Brand manager",
    "Responsable digital / SEO",
    "Community / Social media manager",
    "Chargé de communication",
    "Directeur de la communication",
    // Commercial & Ventes
    "Directeur commercial / Sales Director",
    "VP Sales",
    "Account Executive",
    "Business Developer",
    "Commercial terrain",
    "Key Account Manager",
    "Customer Success Manager",
    // RH & Paie
    "CHRO / DRH",
    "Responsable RH",
    "Chargé de recrutement",
    "Responsable paie",
    "Gestionnaire de paie",
    // Opérations & Production
    "Directeur des opérations",
    "Directeur d'usine / Site manager",
    "Responsable production",
    "Responsable qualité / QHSE",
    "Responsable logistique / Supply chain",
    "Responsable maintenance",
    // Achats & Juridique
    "Directeur des achats",
    "Responsable achats",
    "Acheteur",
    "Directeur juridique",
    "Juriste / DPO",
    // Autre
    "Assistant(e) de direction",
    "Office manager",
    "Consultant / Expert",
    "Chef de projet",
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
