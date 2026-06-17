// ════════════════════════════════════════════════════════════════════
// projects-workflows.js — Référentiel détaillé des workflows par sous-famille
// ════════════════════════════════════════════════════════════════════
//
// Source : Astorya_Workflows_par_sousfamille_v7_2.xlsx
// 10 familles × ~45 sous-catégories — workflow complet pour chaque
//
// Structure : window.HubProjectWorkflows = {
//   "<famille>": {
//     "<sous-catégorie>": [
//       { etape, role, intervenant, action, validation, board, automation },
//       ...
//     ]
//   }
// }
//
// Helpers exposés :
//   listFamilies()                                  → ["Connectivité", …]
//   listCategories(family)                          → ["Fibre OVH / Fibre Unyc", …]
//   getWorkflow(family, category)                   → [{etape, …}]
//   detect(productNames) → {family, category, score} (heuristique)
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const WORKFLOWS = {
  "Connectivité": {
    "Fibre OVH / Fibre Unyc": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande opérateur",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande accès auprès de l'opérateur (OVH ou Unyc)",
        "validation": "RS valide avant envoi",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Notif opérateur ; suivi réf commande ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Suivi production",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Suivi délai opérateur, info client de la date",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte si délai opérateur dépassé"
      },
      {
        "etape": "Planif raccordement",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Affecter technicien + créneau, vérifier ONT/routeur",
        "validation": "DT valide faisabilité",
        "board": "1.0 ADV Astorya",
        "automation": "Notif technicien + agenda Outlook"
      },
      {
        "etape": "Raccordement & MES",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation site, config, tests débit",
        "validation": "Client signe BL",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention mobile + photo"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "ADSL / VDSL / 4G": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande lien",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande ligne / SIM 4G",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Notif fournisseur ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Config & envoi",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage routeur/box, envoi ou pose",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Suivi colis si envoi"
      },
      {
        "etape": "Mise en service",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation, bascule, test",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "VPN": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Config VPN",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Configuration tunnel VPN, accès serveurs",
        "validation": "RS valide sécurité",
        "board": "1.0 ADV Astorya",
        "automation": "Checklist sécurité"
      },
      {
        "etape": "Tests & livraison",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Tests d'accès, doc remise client",
        "validation": "Client confirme accès",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Téléphonie": {
    "3CX": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande licences/postes",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licence 3CX + postes/casques",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Notif fournisseur 3CX ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Config serveur 3CX",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage PBX, trunks, extensions",
        "validation": "RS valide config",
        "board": "1.0 ADV Astorya",
        "automation": "Checklist config"
      },
      {
        "etape": "Portabilité numéros",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Demande de portabilité opérateur",
        "validation": "ADV suit la date",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte date portabilité"
      },
      {
        "etape": "Déploiement & formation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose postes, tests, prise en main client",
        "validation": "Client signe BL",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention + facturation 3CX (board dédié)"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Téléphonie OVH": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande lignes/forfaits OVH",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Config & portabilité",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config SDA, portabilité",
        "validation": "ADV suit",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte portabilité"
      },
      {
        "etape": "Mise en service",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose et tests",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Maj 3CX": [
      {
        "etape": "Demande / planif",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Identifier version, planifier la maj",
        "validation": "RS valide créneau",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket support"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Mise à jour",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Maj serveur 3CX, tests post-maj",
        "validation": "Tests OK",
        "board": "1.0 ADV Astorya",
        "automation": "Sauvegarde config avant maj"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Message vocal": [
      {
        "etape": "Demande",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Recueil du besoin (annonce, routage)",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket"
      },
      {
        "etape": "Config",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage messagerie/annonce",
        "validation": "Client valide annonce",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Poste & matériel": {
    "Poste": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande matériel (HEBDO JEUDI)",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Le commercial liste ses besoins de la semaine ; Dorian arbitre et passe la commande groupée fournisseurs le JEUDI",
        "validation": "RS valide ; passage au jeudi",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Rappel récurrent jeudi matin : 'X dossiers à commander' ; alerter si un dossier loupe le créneau hebdo"
      },
      {
        "etape": "Réception matériel",
        "role": "RS",
        "intervenant": "Dorian (réception physique)",
        "action": "Dorian contrôle physiquement le matériel reçu, valide la conformité, met en stock",
        "validation": "Dorian valide conformité",
        "board": "1.0 ADV Astorya",
        "automation": "Notifier technicien terrain affecté + DÉCLENCHER étape 'Prise RDV' en parallèle de la prépa"
      },
      {
        "etape": "Préparation matériel",
        "role": "TECH terrain",
        "intervenant": "Thierry / Olivier / Mathis B. (celui qui fera l'intervention)",
        "action": "Le technicien terrain affecté au dossier fait la prépa : OS, logiciels, antivirus, config, intégration GLPI",
        "validation": "RS valide prépa",
        "board": "1.0 ADV Astorya",
        "automation": "Checklist de préparation poste (sous-éléments) ; à la fin -> statut 'Matériel prêt'"
      },
      {
        "etape": "Prise de RDV client (parallèle)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception matériel, Lucie contacte le client pour caler la date d'intervention — en parallèle de la prépa, pas après",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Livraison / installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose sur site, migration données, tests",
        "validation": "Client signe BL",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention mobile"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Imprimante": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande imprimante/copieur",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Réception & prépa",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config réseau, drivers",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Identification GLPI",
        "role": "ADV / TECH",
        "intervenant": "Lucie Leblanc / technicien terrain",
        "action": "Inventorier l'imprimante dans GLPI (modèle, n° série, IP réseau, garantie, client)",
        "validation": "Fiche GLPI créée",
        "board": "GLPI (référentiel d'inventaire)",
        "automation": "À faire au moment de la réception, avant remise au client"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose, test impression, formation",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Onduleur": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande onduleur (UPS)",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Réception + Identification GLPI",
        "role": "ADV / TECH",
        "intervenant": "Lucie Leblanc / technicien terrain",
        "action": "À la réception : contrôler le matériel ET inventorier l'onduleur dans GLPI (modèle, n° série, capacité, garantie, client)",
        "validation": "Matériel reçu + fiche GLPI créée",
        "board": "GLPI (référentiel d'inventaire)",
        "automation": "À faire avant l'intervention sur site"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Installation",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Matériel (divers) / Garantie": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande / RMA",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande matériel ou demande garantie/RMA",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Suivi RMA fournisseur ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Réception / remise",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Contrôle, remise ou installation",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Identification GLPI",
        "role": "ADV / TECH",
        "intervenant": "Lucie Leblanc / technicien terrain",
        "action": "Inventorier le matériel dans GLPI si applicable (modèle, n° série, garantie, client)",
        "validation": "Fiche GLPI créée",
        "board": "GLPI (référentiel d'inventaire)",
        "automation": "À faire au moment de la réception, avant remise au client"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Serveur & infra": {
    "Serveur cloud": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Provisioning",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Création VM/instance cloud, dimensionnement",
        "validation": "RS valide archi ; Laurent (DT) valide faisabilité",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Config & migration",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation rôles, migration données",
        "validation": "RS valide recette ; Laurent (DT) valide faisabilité",
        "board": "1.0 ADV Astorya",
        "automation": "Sauvegarde avant migration"
      },
      {
        "etape": "Recette",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Vérification conformité, perfs",
        "validation": "RS valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Augmentation serveur": [
      {
        "etape": "Demande",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Constat besoin (RAM/disque/CPU)",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte supervision (Zabbix)"
      },
      {
        "etape": "Commande ressources",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande extension",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Mise en œuvre",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Ajout ressources, redémarrage planifié",
        "validation": "Tests OK",
        "board": "1.0 ADV Astorya",
        "automation": "Sauvegarde avant"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "NAS": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande NAS + disques",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Config",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "RAID, partages, droits",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose, intégration réseau, tests",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Pfsense": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande boîtier/licence",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Config sécurité",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Règles firewall, VPN, VLAN",
        "validation": "RS valide sécurité ; Laurent (DT) valide faisabilité",
        "board": "1.0 ADV Astorya",
        "automation": "Checklist sécurité"
      },
      {
        "etape": "Déploiement",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose, bascule, tests",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Wifi": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Étude / commande",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Étude couverture, commande bornes",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "—"
      },
      {
        "etape": "Config",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config contrôleur, SSID, VLAN",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose bornes, tests couverture",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Sécurité": {
    "Antivirus Eset / Withsecure": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande licences",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licences antivirus",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Notif fournisseur (Eset/Withsecure) ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Déploiement à distance",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Déploiement console, push agents",
        "validation": "Tests OK",
        "board": "1.0 ADV Astorya",
        "automation": "Déploiement auto via console"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Re-antivirus": [
      {
        "etape": "Détection échéance",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Licence à échéance détectée",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte auto J-30 avant échéance"
      },
      {
        "etape": "Devis renouvellement",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Proposition de renouvellement",
        "validation": "Client valide",
        "board": "1 - Suivi devis",
        "automation": "Devis auto + relance"
      },
      {
        "etape": "Renouvellement licence",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Commande + activation",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Activation auto"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "SSL": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande certificat",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande SSL (GlobalSign...)",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Alerte expiration J-30 ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Génération CSR, pose, test HTTPS",
        "validation": "Tests OK",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Antispam / Mailinblack": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande solution antispam",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Config",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage MX, règles, quarantaine",
        "validation": "Client valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Passbolt": [
      {
        "etape": "Demande",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Recueil besoin coffre-fort numérique",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket"
      },
      {
        "etape": "Mise en place",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation, création comptes, formation",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Logiciels & licences": {
    "O365 / Office": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande licences",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande abonnements O365/Office",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Notif fournisseur (ALSO/Be-Cloud) ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Provisioning",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Création comptes, attribution licences",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Migration / config",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Migration boîtes mail, OneDrive, Teams",
        "validation": "Client valide",
        "board": "1.0 ADV Astorya",
        "automation": "Facturation comptes (board dédié)"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Adobe / Autocad / Archicad": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande licence",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licence éditeur",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Activation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation, activation, tests",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte renouvellement annuel"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "EBP / Sage": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licence/maj comptable",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation, paramétrage, reprise données",
        "validation": "Client valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Licence": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licence",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Activation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Activation, intégration",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Renouvellement logiciel": [
      {
        "etape": "Détection",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "Échéance licence détectée",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte auto J-30"
      },
      {
        "etape": "Devis & renouvellement",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Proposition + commande",
        "validation": "Client valide",
        "board": "1 - Suivi devis",
        "automation": "Devis auto"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Cloud & hébergement": {
    "Domaine / Nom de domaine": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande/transfert",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Achat ou transfert de domaine",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "Alerte expiration domaine ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Config DNS",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage zone DNS",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Hébergement web": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande hébergement",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Mise en ligne",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Déploiement site, config",
        "validation": "Client valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Teams / Mail": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande/Config",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licences, création comptes",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Déploiement",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config, formation utilisateurs",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Owncloud": [
      {
        "etape": "Demande",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Recueil besoin partage de fichiers",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket"
      },
      {
        "etape": "Mise en place",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Installation, comptes, quotas",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Sauvegarde": {
    "DAT": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Étude",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Définition stratégie 3-2-1",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande solution/licence sauvegarde",
        "validation": "RS valide",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Mise en place",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config jobs sauvegarde, tests restauration",
        "validation": "Tests restauration OK",
        "board": "1.0 ADV Astorya",
        "automation": "Alerte échec sauvegarde (supervision)"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Sauvegarde": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande licence/espace",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Config & vérif",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Paramétrage, test de restauration",
        "validation": "Tests OK",
        "board": "1.0 ADV Astorya",
        "automation": "Rapport sauvegarde auto"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Disque": [
      {
        "etape": "Commande",
        "role": "COM + RS",
        "intervenant": "Commercial + Dorian",
        "action": "Commande disque(s)",
        "validation": "—",
        "board": "1.0 Achat hebdomadaire",
        "automation": "— ; Lot hebdo du jeudi (commande groupée) ; rappel jeudi matin"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Installation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Pose, formatage, intégration",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Web": {
    "Web": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Cahier des charges",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Recueil besoin, maquette",
        "validation": "Client valide maquette",
        "board": "1 - Suivi devis",
        "automation": "—"
      },
      {
        "etape": "Conception",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B. / prestataire",
        "action": "Développement / intégration",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Mise en ligne",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Déploiement, tests, formation",
        "validation": "Client recette",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Visio": [
      {
        "etape": "Demande",
        "role": "SUPPORT",
        "intervenant": "Hotline 1",
        "action": "Recueil besoin visio",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket"
      },
      {
        "etape": "Mise en place",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Config matériel/logiciel visio",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  },
  "Services & contrats": {
    "Infogérance": [
      {
        "etape": "Demande / devis",
        "role": "COM",
        "intervenant": "JC / Romain / Augustin",
        "action": "Réception demande, chiffrage, envoi devis",
        "validation": "RS si gros montant",
        "board": "1 - Suivi devis",
        "automation": "Création auto depuis mail ; relance auto J+7"
      },
      {
        "etape": "Signature",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Devis signé reçu, classé en GED",
        "validation": "—",
        "board": "6 - Devis signés",
        "automation": "Classement auto depuis mail ged.astorya"
      },
      {
        "etape": "Contractualisation",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Définition périmètre, contrat",
        "validation": "RS valide périmètre",
        "board": "6 - Devis signés",
        "automation": "—"
      },
      {
        "etape": "Mise en place",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Inventaire, supervision, doc",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "Mise sous supervision Zabbix"
      },
      {
        "etape": "Run récurrent",
        "role": "SUPPORT",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Tickets, maintenance, reporting",
        "validation": "—",
        "board": "(contrat)",
        "automation": "Facturation récurrente"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Maintenance": [
      {
        "etape": "Planif",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Planification maintenance préventive",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "Récurrence planifiée"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Intervention",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Maintenance sur site/à distance",
        "validation": "Compte-rendu",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      }
    ],
    "Dépannage": [
      {
        "etape": "Ticket",
        "role": "SUPPORT",
        "intervenant": "Hotline 1 / Hotline 2",
        "action": "Réception incident, qualification",
        "validation": "—",
        "board": "1.0 ADV Astorya",
        "automation": "Ticket auto depuis mail/appel"
      },
      {
        "etape": "Prise de RDV client (si intervention sur site)",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après. Si l'intervention est 100% distante, étape non requise.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Résolution",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Diagnostic, résolution",
        "validation": "Client confirme",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Formation": [
      {
        "etape": "Planif",
        "role": "COM",
        "intervenant": "Commercial",
        "action": "Définition programme, date",
        "validation": "Client valide",
        "board": "6 - Devis signés",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Animation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Session de formation",
        "validation": "Émargement",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "",
        "intervenant": "",
        "action": "",
        "validation": "",
        "board": "",
        "automation": ""
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ],
    "Régie / Déménagement / Paramétrage": [
      {
        "etape": "Planif",
        "role": "RS",
        "intervenant": "Dorian",
        "action": "Cadrage de la prestation ponctuelle",
        "validation": "RS valide",
        "board": "1.0 ADV Astorya",
        "automation": "—"
      },
      {
        "etape": "Prise de RDV client",
        "role": "ADV",
        "intervenant": "Lucie Leblanc",
        "action": "DÈS la réception du matériel, contacter le client pour caler la date d'intervention — en parallèle de la prépa, pas après.",
        "validation": "Client confirme date",
        "board": "1.0 ADV Astorya",
        "automation": "Date confirmé + Rendez-vous='RDV confirmé 💪' -> création événement Outlook + notif technicien"
      },
      {
        "etape": "Réalisation",
        "role": "TECH",
        "intervenant": "Thierry / Olivier / Mathis B.",
        "action": "Intervention sur site",
        "validation": "Compte-rendu",
        "board": "1.0 ADV Astorya",
        "automation": "Fiche intervention"
      },
      {
        "etape": "Validation dossier technique",
        "role": "ADV/RS",
        "intervenant": "Lucie Leblanc / Dorian",
        "action": "Contrôle du dossier réalisé par le technicien (BL, fiche inter, conformité)",
        "validation": "Dorian ou Lucie valide",
        "board": "2.0 Dossiers à facturer",
        "automation": "Vérif complétude -> statut 'Comptabilité'"
      },
      {
        "etape": "Passage en comptabilité",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Le dossier validé bascule dans le groupe/statut 'Comptabilité'",
        "validation": "—",
        "board": "2.0 (groupe Comptabilité)",
        "automation": "Statut 'Comptabilité' -> déplace vers groupe Comptabilité + notifie Louise"
      },
      {
        "etape": "Facturation Sage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Édition de la facture dans Sage, report du n° de facture dans le nom du dossier",
        "validation": "—",
        "board": "2.0 Dossiers à facturer",
        "automation": "Rappel si en Comptabilité depuis > X jours"
      },
      {
        "etape": "Clôture & archivage",
        "role": "COMPTA",
        "intervenant": "Louise",
        "action": "Passe le statut à 'Facturé' -> dossier classé en archivage, MAJ Base client",
        "validation": "RS contrôle a posteriori",
        "board": "3.0 Archivage",
        "automation": "Statut 'Facturé' -> déplace auto vers 3.0 + MAJ inventaire client"
      }
    ]
  }
};

  // Mots-clés par famille pour la détection automatique depuis les produits sélectionnés
  const FAMILY_KEYWORDS = {
    "Connectivité":         ["fibre", "vdsl", "adsl", "sdsl", "4g", "vpn", "internet", "ovh", "unyc"],
    "Téléphonie":           ["téléphon", "telephon", "3cx", "sda", "tel", "tÉlÉphon", "tÉlÉphon", "fax", "patton"],
    "Poste & matériel":     ["poste", "pc", "portable", "écran", "ecran", "imprimante", "copieur", "onduleur", "ups", "casque", "lenovo", "hp"],
    "Serveur & infra":      ["serveur", "server", "nas", "switch", "rack", "vmware", "hyperv", "tse", "rds"],
    "Sécurité":             ["antivirus", "eset", "withsecure", "firewall", "pare-feu", "spam", "mailinblack", "altospam", "vpn pro"],
    "Logiciels & licences": ["office", "365", "exchange", "outlook", "windows", "sage", "ebp", "logiciel", "licence", "autodesk"],
    "Cloud & hébergement":  ["cloud", "hébergement", "hebergement", "azure", "aws", "ovh cloud"],
    "Sauvegarde":           ["sauvegarde", "backup", "altaro", "veeam", "synology"],
    "Web":                  ["site", "web", "wordpress", "vitrine", "wix"],
    "Services & contrats":  ["maintenance", "hotline", "support", "service", "contrat"]
  };

  function listFamilies() { return Object.keys(WORKFLOWS); }
  function listCategories(family) {
    const f = WORKFLOWS[family]; return f ? Object.keys(f) : [];
  }
  function getWorkflow(family, category) {
    if (!family || !category) return [];
    const f = WORKFLOWS[family];
    if (!f) return [];
    return f[category] || [];
  }
  // Détection auto à partir de la liste de produits sélectionnés (SKU + nom)
  function detect(productNames) {
    const txt = (productNames || []).map((s) => String(s || "")).join(" ").toLowerCase();
    if (!txt.trim()) return { family: null, category: null, score: 0 };
    let bestFamily = null, bestScore = 0;
    Object.keys(FAMILY_KEYWORDS).forEach((fam) => {
      const kws = FAMILY_KEYWORDS[fam];
      let s = 0;
      kws.forEach((k) => { if (txt.indexOf(k.toLowerCase()) !== -1) s++; });
      if (s > bestScore) { bestScore = s; bestFamily = fam; }
    });
    if (!bestFamily) return { family: null, category: null, score: 0 };
    // Sous-catégorie : on cherche celle dont le nom apparaît le plus dans le texte
    const cats = Object.keys(WORKFLOWS[bestFamily]);
    let bestCat = cats[0], bestCatScore = 0;
    cats.forEach((c) => {
      // Tokenise le nom de catégorie : "Fibre OVH / Fibre Unyc" → ["fibre", "ovh", "unyc"]
      const tokens = c.toLowerCase().split(/[\s\/,]+/).filter((t) => t.length > 2);
      let s = 0;
      tokens.forEach((t) => { if (txt.indexOf(t) !== -1) s++; });
      if (s > bestCatScore) { bestCatScore = s; bestCat = c; }
    });
    return { family: bestFamily, category: bestCat, score: bestScore };
  }

  window.HubProjectWorkflows = { WORKFLOWS, FAMILY_KEYWORDS, listFamilies, listCategories, getWorkflow, detect };
})();
