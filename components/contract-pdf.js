// ════════════════════════════════════════════════════════════════════
// contract-pdf.js — Génération PDF du Contrat d'Hébergement Externalisé
// ════════════════════════════════════════════════════════════════════
//
// Reproduit la maquette du contrat Word (Contrat_Hébergement_Externalisé.docx)
// en pdfmake, en remplaçant automatiquement les champs depuis le formulaire
// NewContract.jsx.
//
// Usage :
//   HubHostingContractPdf.preview(payload)      // ouvre l'aperçu dans un onglet
//   HubHostingContractPdf.download(payload)     // déclenche le téléchargement
//   const blob = await HubHostingContractPdf.toBlob(payload)
//
// payload = {
//   client:    { name, address, cp, city, siren, billing_email },
//   products:  [{ name, sku, desc, unit, qty, discount, periodicity }],
//   duration:  36,                       // mois (12 / 36 / 60)
//   billingPeriod: "monthly"|"quarterly"|"quarterly_due"|"annual",
//   tacite:    true,
//   paymentDelay: "30j",
//   indexation: "Aucune"|"SYNTEC"|"INSEE IPC",
//   indexCap: 3,
//   startDate, endDate,                  // YYYY-MM-DD
//   signatory: { name, role },           // signataire client
//   sums: { totalY1HT, tva, totalY1TTC, tcv, ... },
// }
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const PDFMAKE_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js";
  const PDFMAKE_FONTS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js";
  let _pdfmakeReady = null;
  function loadPdfMake() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve(window.pdfMake);
    if (_pdfmakeReady) return _pdfmakeReady;
    _pdfmakeReady = new Promise((resolve, reject) => {
      const s1 = document.createElement("script");
      s1.src = PDFMAKE_URL;
      s1.onload = () => {
        const s2 = document.createElement("script");
        s2.src = PDFMAKE_FONTS_URL;
        s2.onload = () => resolve(window.pdfMake);
        s2.onerror = () => reject(new Error("Échec chargement vfs_fonts"));
        document.head.appendChild(s2);
      };
      s1.onerror = () => reject(new Error("Échec chargement pdfmake"));
      document.head.appendChild(s1);
    });
    return _pdfmakeReady;
  }

  // ───── Helpers
  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const fmtEUR0 = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  };
  const PERIOD_LABEL = { monthly: "Mensuel", quarterly: "Trimestriel", quarterly_due: "Trimestriel — terme à échoir", annual: "Annuel (avance)" };
  const NUM_WORD = (n) => ({ 12: "douze (12)", 24: "vingt-quatre (24)", 36: "trente-six (36)", 48: "quarante-huit (48)", 60: "soixante (60)" }[n] || (n + " (" + n + ")"));
  const ASTORYA = {
    raison_sociale: "ASTORYA S.G.I.",
    adresse: "9 rue du Petit Châtelier",
    cp: "44300",
    ville: "Nantes",
    siret: "523 625 804 00027",
    siren: "523 625 804",
    capital: 7500,
    tel: "02 85 52 13 96",
    email: "contact@astorya.fr",
    site: "www.astorya.fr",
  };

  // ───── Logo Astorya (SVG inline — voir commercial-pdf.js)
  const ASTORYA_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" font-family="Helvetica, Arial, sans-serif"><defs><radialGradient id="aSphere" cx="35%" cy="32%" r="68%"><stop offset="0%" stop-color="#f5d1d8"/><stop offset="22%" stop-color="#e8a5b2"/><stop offset="55%" stop-color="#c91c45"/><stop offset="100%" stop-color="#7a1126"/></radialGradient></defs><circle cx="165" cy="165" r="148" fill="url(#aSphere)"/><ellipse cx="120" cy="105" rx="55" ry="35" fill="#ffffff" opacity="0.45"/><text x="390" y="200" font-size="220" font-weight="500" font-style="italic" fill="#c91c45" letter-spacing="-4">astorya</text><text x="400" y="280" font-size="44" font-weight="700" fill="#252e44" letter-spacing="1">solution globale informatique</text></svg>';

  // ─────────────────────────────────────────────────────────────────
  // Construction du docDefinition pdfmake
  // ─────────────────────────────────────────────────────────────────
  function buildDocDefinition(p) {
    const client = p.client || {};
    const products = p.products || [];
    const sums = p.sums || {};
    const billingLabel = PERIOD_LABEL[p.billingPeriod] || "—";
    const checked = (k) => p.billingPeriod === k ? "☒" : "☐";

    // ── En-tête : logo Astorya + titre contrat
    const headerBand = {
      table: {
        widths: [150, "*"],
        body: [[
          { svg: ASTORYA_LOGO_SVG, width: 140, fit: [140, 50], border: [false, false, false, false] },
          { stack: [
            { text: "CONTRAT D'HÉBERGEMENT", fontSize: 16, bold: true, alignment: "right", color: "#0f172a" },
            { text: "EXTERNALISÉ", fontSize: 16, bold: true, alignment: "right", color: "#c91c45", margin: [0, 2, 0, 0] },
            { text: "Conditions Particulières & Conditions Générales", fontSize: 9, alignment: "right", color: "#475569", margin: [0, 4, 0, 0] },
          ], border: [false, false, false, false], alignment: "right" },
        ]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 14],
    };

    // ── Identification des parties
    const identBlock = {
      stack: [
        { text: "ENTRE LES PARTIES", style: "h1", margin: [0, 6, 0, 8] },
        { columns: [
          { width: "*", stack: [
            { text: "Le Prestataire", bold: true, fontSize: 10, color: "#c91c45" },
            { text: ASTORYA.raison_sociale, bold: true, fontSize: 10.5, margin: [0, 4, 0, 0] },
            { text: ASTORYA.adresse, fontSize: 9.5 },
            { text: ASTORYA.cp + " " + ASTORYA.ville, fontSize: 9.5 },
            { text: "SIRET : " + ASTORYA.siret, fontSize: 9, color: "#475569", margin: [0, 3, 0, 0] },
            { text: "Tél : " + ASTORYA.tel + " · " + ASTORYA.email, fontSize: 9, color: "#475569" },
          ]},
          { width: 20, text: "" },
          { width: "*", stack: [
            { text: "Le Client", bold: true, fontSize: 10, color: "#c91c45" },
            { text: client.name || "—", bold: true, fontSize: 10.5, margin: [0, 4, 0, 0] },
            { text: client.address || "—", fontSize: 9.5 },
            { text: ((client.cp || "") + " " + (client.city || "")).trim() || "—", fontSize: 9.5 },
            { text: "SIREN : " + (client.siren || "—"), fontSize: 9, color: "#475569", margin: [0, 3, 0, 0] },
            { text: "Représenté par : " + ((p.signatory && p.signatory.name) || "—") + ((p.signatory && p.signatory.role) ? " (" + p.signatory.role + ")" : ""), fontSize: 9, color: "#475569" },
          ]},
        ]},
        { text: "Ci-après désignés ensemble « les Parties » ou individuellement « la Partie ».", fontSize: 8.5, italics: true, color: "#64748b", margin: [0, 10, 0, 0] },
      ],
      margin: [0, 0, 0, 14],
    };

    // ── Description de la prestation
    const prestaBlock = {
      stack: [
        { text: "DESCRIPTION DE LA PRESTATION", style: "h1", margin: [0, 6, 0, 8] },
        { text: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique sous forme d'hébergement externalisé. Seules les prestations mentionnées ci-dessous font partie de la prestation. Toute tâche supplémentaire devra faire l'objet d'une revalidation et d'un devis spécifique par ASTORYA S.G.I.", fontSize: 9, alignment: "justify" },
        { text: "Toute augmentation du nombre d'utilisateurs ou tout ajout de licence supplémentaire à la demande du Client sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique.", fontSize: 9, alignment: "justify", margin: [0, 4, 0, 0] },
        { text: "Le Client souscrit le volume suivant :", fontSize: 9.5, bold: true, margin: [0, 8, 0, 6] },
      ],
      margin: [0, 0, 0, 6],
    };

    // ── Tableau des prestations (produits)
    const linesHeader = [
      { text: "Référence", style: "th" },
      { text: "Désignation", style: "th" },
      { text: "Qté", style: "th", alignment: "right" },
      { text: "P.U. HT", style: "th", alignment: "right" },
      { text: "Périodicité", style: "th", alignment: "center" },
      { text: "Total HT", style: "th", alignment: "right" },
    ];
    const linesRows = products.map((prod) => {
      const gross = (Number(prod.unit) || 0) * (Number(prod.qty) || 0);
      const disc = gross * (Number(prod.discount) || 0) / 100;
      const net = gross - disc;
      return [
        { text: prod.sku || "—", style: "tdMono" },
        { stack: [
          { text: prod.name || "—", bold: true, fontSize: 9 },
          prod.desc ? { text: prod.desc, fontSize: 8, color: "#64748b", margin: [0, 1, 0, 0] } : null,
        ].filter(Boolean) },
        { text: String(prod.qty || 0), style: "td", alignment: "right" },
        { text: fmtEUR(prod.unit), style: "td", alignment: "right" },
        { text: prod.periodicity === "oneshot" ? "One-shot" : "Annuel", style: "td", alignment: "center" },
        { text: fmtEUR(net), style: "td", alignment: "right", bold: true },
      ];
    });
    const productsTable = {
      table: { widths: [60, "*", 30, 60, 55, 65], headerRows: 1, body: [linesHeader, ...linesRows] },
      layout: {
        hLineWidth: (i) => i <= 1 ? 0.6 : 0.2,
        vLineWidth: () => 0, hLineColor: () => "#cbd5e1",
        fillColor: (row) => row === 0 ? "#f8fafc" : null,
        paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 6, paddingRight: () => 6,
      },
    };

    // ── Conditions financières — récap
    const condFiBlock = {
      stack: [
        { text: "CONDITIONS FINANCIÈRES", style: "h1", margin: [0, 12, 0, 8] },
        { columns: [
          { width: "*", stack: [
            { text: "Récapitulatif financier", bold: true, fontSize: 9.5, margin: [0, 0, 0, 6] },
            { table: {
              widths: ["*", "auto"],
              body: [
                [{ text: "Total HT (année 1)", style: "td" }, { text: fmtEUR(sums.totalY1HT), style: "td", alignment: "right", bold: true }],
                [{ text: "TVA 20 %", style: "td" }, { text: fmtEUR(sums.tva), style: "td", alignment: "right" }],
                [{ text: "Total TTC (année 1)", style: "td", bold: true, fillColor: "#0f172a", color: "#fff" }, { text: fmtEUR(sums.totalY1TTC), style: "td", alignment: "right", bold: true, fillColor: "#0f172a", color: "#fff" }],
                [{ text: "TCV sur " + p.duration + " mois (HT)", style: "td" }, { text: fmtEUR(sums.tcv), style: "td", alignment: "right" }],
              ],
            }, layout: { hLineWidth: () => 0.3, vLineWidth: () => 0.3, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1", paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 6, paddingRight: () => 6 }},
          ]},
          { width: 14, text: "" },
          { width: "*", stack: [
            { text: "Périodicité de la redevance", bold: true, fontSize: 9.5, margin: [0, 0, 0, 6] },
            { text: checked("monthly") + " Mensuel", fontSize: 10 },
            { text: checked("quarterly") + " Trimestriel", fontSize: 10, margin: [0, 3, 0, 0] },
            { text: checked("quarterly_due") + " Trimestriel — terme à échoir", fontSize: 10, margin: [0, 3, 0, 0] },
            { text: checked("annual") + " Annuel (avance)", fontSize: 10, margin: [0, 3, 0, 0] },
            { text: "Le paiement s'effectue par prélèvement automatique (le Client fournit le mandat SEPA dûment renseigné et un RIB).", fontSize: 8.5, italics: true, color: "#475569", margin: [0, 8, 0, 0] },
            { text: "Email de facturation : " + (client.billing_email || "—"), fontSize: 9, bold: true, margin: [0, 6, 0, 0] },
          ]},
        ]},
      ],
    };

    // ── Conditions particulières
    const condPartBlock = {
      stack: [
        { text: "CONDITIONS PARTICULIÈRES", style: "h1", margin: [0, 14, 0, 8] },
        { text: "Durée du contrat", style: "h2" },
        { text: "Le présent contrat est conclu pour une durée de " + NUM_WORD(p.duration) + " mois et prend effet dès sa signature, ou au plus tard à la date d'installation de l'hébergement externalisé prévue le " + fmtDate(p.startDate) + ". Échéance prévisionnelle : " + fmtDate(p.endDate) + ".", fontSize: 9.5, alignment: "justify", margin: [0, 3, 0, 6] },
        p.tacite
          ? { text: "À l'expiration de la durée d'engagement initiale, le contrat est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties trois (3) mois avant l'échéance, par lettre recommandée avec accusé de réception.", fontSize: 9.5, italics: true, color: "#475569", alignment: "justify" }
          : { text: "Tacite reconduction désactivée : le contrat prend fin de plein droit à son échéance.", fontSize: 9.5, italics: true, color: "#9a3412", alignment: "justify" },
        { text: "Délai de paiement", style: "h2", margin: [0, 10, 0, 3] },
        { text: "Délai retenu : " + (p.paymentDelay || "30j") + " · Paiement par prélèvement automatique à réception de facture.", fontSize: 9.5 },
        { text: "Indexation annuelle", style: "h2", margin: [0, 10, 0, 3] },
        { text: p.indexation === "Aucune"
            ? "Les prix sont fermes pour toute la durée d'engagement (aucune indexation appliquée)."
            : "Les prix sont indexés sur l'indice " + (p.indexation || "SYNTEC") + ", plafonné à " + (p.indexCap || 3) + " % par an, selon la formule P = P0 × Sn / S0 (cf. article 11.4 des Conditions Générales).",
          fontSize: 9.5, alignment: "justify" },
      ],
    };

    // ── Bloc signature
    const signBlock = {
      stack: [
        { text: "SIGNATURE", style: "h1", margin: [0, 16, 0, 8] },
        { text: "Fait à : ____________________     Le : ____________________", fontSize: 10, margin: [0, 0, 0, 14] },
        { columns: [
          { width: "*", stack: [
            { text: "☐ Le Client accepte les conditions de la présente offre.", fontSize: 10, margin: [0, 0, 0, 8] },
            { text: "Je soussigné : " + ((p.signatory && p.signatory.name) || "____________________"), fontSize: 10 },
            { text: "Agissant en qualité de : " + ((p.signatory && p.signatory.role) || "____________________"), fontSize: 10, margin: [0, 4, 0, 12] },
            { text: "« Bon pour accord »", fontSize: 10.5, bold: true, margin: [0, 0, 0, 6] },
            { text: "Cachet et signature du Client", fontSize: 9, color: "#475569" },
            { text: " ", fontSize: 22 },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: "#cbd5e1" }] },
          ]},
          { width: 20, text: "" },
          { width: "*", stack: [
            { text: " ", fontSize: 22 },
            { text: "Cachet et signature du Prestataire", fontSize: 9, color: "#475569" },
            { text: ASTORYA.raison_sociale, fontSize: 10, bold: true, margin: [0, 4, 0, 0] },
            { text: " ", fontSize: 22 },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: "#cbd5e1" }] },
          ]},
        ]},
      ],
      unbreakable: true,
    };

    // ─────────────────────────────────────────────────────────────────
    // CONDITIONS GÉNÉRALES — texte statique (résumé synthétique)
    // ─────────────────────────────────────────────────────────────────
    const article = (num, title, paragraphs) => ({
      stack: [
        { text: "ARTICLE " + num + " — " + title, style: "h2", margin: [0, 10, 0, 4] },
        ...paragraphs.map((t) => ({ text: t, fontSize: 9, alignment: "justify", margin: [0, 0, 0, 4] })),
      ],
    });
    const cgvBlock = {
      stack: [
        { text: "CONDITIONS GÉNÉRALES D'HÉBERGEMENT EXTERNALISÉ", style: "h1", margin: [0, 20, 0, 8], pageBreak: "before" },
        article("1", "OBJET", [
          "Le Client reconnaît avoir vérifié l'adéquation du service à ses besoins et avoir reçu d'ASTORYA S.G.I. toutes les informations et conseils qui lui étaient nécessaires pour souscrire au présent engagement en connaissance de cause.",
          "Le présent contrat a pour objet la fourniture d'une prestation d'hébergement externalisé par ASTORYA S.G.I. à la demande du Client. Cette prestation est décrite dans les Conditions Particulières.",
          "Les présentes Conditions Générales d'hébergement externalisé complétées par les Conditions Particulières, la proposition commerciale et éventuellement les Annexes proposées par ASTORYA S.G.I. sont applicables, à l'exclusion de toutes autres conditions et notamment celles du Client.",
        ]),
        article("2", "DOCUMENTS CONTRACTUELS", [
          "L'accord entre les Parties est constitué des documents contractuels suivants, énumérés par ordre hiérarchique décroissant : (1) les Conditions Générales de services d'hébergement externalisé, (2) les Conditions Particulières et ses avenants, (3) les Conditions générales de vente, (4) la proposition ou offre commerciale du Prestataire.",
          "Il sera fait application de cet ordre de priorité en cas de contradiction entre une et/ou plusieurs dispositions mentionnées dans l'un des documents listés ci-dessus.",
        ]),
        article("3", "OBLIGATIONS DES PARTIES", [
          "Les Parties s'engagent à exécuter loyalement et de bonne foi et à s'apporter mutuellement collaboration et assistance.",
          "ASTORYA S.G.I. s'engage à apporter tout le soin et toute la diligence nécessaire à la fourniture d'un service de qualité conformément aux usages de la profession.",
          "Le Client s'engage à : désigner un interlocuteur unique, compétent et décisionnaire pendant toute la durée du contrat ; communiquer ses coordonnées et informations bancaires exactes ; informer par email le Prestataire dans les 48 heures de toute modification concernant sa situation ; fournir tout moyen et information nécessaires à la bonne exécution des prestations.",
          "ASTORYA S.G.I. peut suspendre exceptionnellement et brièvement l'accessibilité aux serveurs pour d'éventuelles interventions de maintenance ou d'amélioration.",
        ]),
        article("4", "DURÉE", [
          "Le présent contrat entre en vigueur à la date et pour une durée prévue dans les Conditions Particulières.",
          "À l'expiration de la durée d'engagement initiale, il est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties, trois (3) mois avant son échéance, par lettre recommandée avec accusé de réception.",
        ]),
        article("5", "CONFIDENTIALITÉ / PROPRIÉTÉ INTELLECTUELLE / DONNÉES PERSONNELLES", [
          "Chaque Partie s'engage à tenir confidentielles les informations dont le caractère confidentiel aura été communiqué comme tel par l'autre Partie pour l'exécution du présent contrat.",
          "Chacune des Parties s'engage à respecter les obligations résultant du présent article pendant toute la durée du contrat ainsi que pendant les cinq (5) ans suivant son expiration.",
          "Chacune des Parties garantit l'autre Partie du respect des obligations légales et réglementaires lui incombant au titre de la protection des données à caractère personnel, en particulier de la loi n° 78-17 du 6 janvier 1978 modifiée et du RGPD.",
        ]),
        article("6", "PERSONNEL", [
          "Le personnel d'ASTORYA S.G.I. affecté pour la réalisation des prestations reste sous son autorité hiérarchique et disciplinaire. Toutefois, le personnel intervenant dans les locaux du Client est soumis à l'ensemble des règles relatives à l'hygiène et la sécurité en vigueur dans ces locaux.",
        ]),
        article("7", "NON SOLLICITATION DU PERSONNEL", [
          "Sauf accord préalable et écrit de l'autre Partie, chaque Partie renonce à engager ou faire travailler tout collaborateur de l'autre, qu'il soit salarié ou non. Cette renonciation est valable pendant toute la durée des relations contractuelles augmentée de trente-six (36) mois.",
          "Dans le cas où l'une des Parties ne respecterait pas cette clause, elle s'engage irrévocablement à verser à la Partie ayant subi ce préjudice une indemnité forfaitaire égale à dix mille (10 000) euros par salarié concerné.",
        ]),
        article("8", "CLAUSES DES SERVICES", [
          "Service antispam : les adresses mails créées au cours du contrat sont automatiquement ajoutées dans le service antispam. Une régularisation s'effectue annuellement afin d'ajuster la facturation suite à l'ajout d'une adresse mail. La suppression d'une adresse mail ne donne pas lieu à régularisation pour la période en cours.",
          "Service SMTP transactionnel : cette solution d'emailing professionnel offre la possibilité d'adresser des emailings depuis un environnement sécurisé sans blocage du domaine. Le pack contient 100 000 mails d'envois et est valable 36 mois.",
          "Solution Exchange : 50 Go d'espace par boîte mail souscrite. Les boîtes mails supplémentaires ajoutées durant le contrat ne nécessitent pas la signature d'un nouveau contrat ; la facturation est ajustée. L'engagement du service Exchange est de trente-six (36) mois pour chaque boîte mail.",
          "Solution Office 365 : les licences supplémentaires ajoutées durant le contrat ne nécessitent pas la signature d'un nouveau contrat. L'engagement du service Office 365 est de 36 mois pour chaque licence. La suppression d'une licence durant la période initiale d'engagement ne donne pas lieu à régularisation.",
        ]),
        article("9", "MODALITÉS DE FACTURATION ET DE PAIEMENT", [
          "9.1. Tarif — Les prix sont fermes pendant les trente-six (36) premiers mois. Sauf stipulations contraires, ce prix pourra être automatiquement réévalué entre 0,5 % et 2 %, à la date anniversaire du contrat. Tarif horaire en vigueur : 79 € HT par heure pour une intervention sur site non justifiée. Frais de déplacement : 49 € au-delà de 25 km de Nantes (hors Loire Atlantique : facturation au réel).",
          "9.2. Facturation — Les factures sont adressées par voie électronique exclusivement, à l'adresse mail fournie par le Client. En cas de demande de facturation papier, frais de dossier de 19 € HT par trimestre.",
          "9.3. Paiement — Le paiement s'effectue par prélèvement automatique à réception de la facture. Tout désaccord doit être exprimé à service.comptabilite@astorya.fr dans un délai de sept (7) jours calendaires. En cas d'incident de paiement, ASTORYA S.G.I. se réserve le droit de facturer les frais bancaires.",
          "Le défaut total ou partiel de paiement à échéance entraîne : l'exigibilité immédiate de toutes les sommes restantes dues ; l'application de pénalités de retard (taux directeur BCE majoré, plancher de 3× le taux d'intérêt légal) ; une indemnité forfaitaire pour frais de recouvrement de 40 € HT par facture ; la suspension totale ou partielle du ou des services ; le refus de nouvelle commande.",
        ]),
        article("10", "RESPONSABILITÉ / ASSURANCE", [
          "10.1. Responsabilité — ASTORYA S.G.I. s'engage à mettre tous les moyens en œuvre pour la réalisation de la prestation. Sa responsabilité ne peut être retenue qu'en cas de faute commise et prouvée par le Client.",
          "Les réparations dues par ASTORYA S.G.I. correspondront au préjudice direct, personnel et certain lié à la défaillance en cause, à l'exclusion expresse de tout dommage indirect.",
          "Le montant des dommages et intérêts pouvant être mis à la charge d'ASTORYA S.G.I. est limité au montant total des sommes versées par le Client au titre du présent contrat.",
          "10.2. Assurance — ASTORYA S.G.I. a souscrit, en plus de l'assurance Responsabilité Civile Professionnelle obligatoire, une assurance « Data Risks » visant à couvrir les dommages subis ou causés à des tiers dans le cadre de cyber attaques.",
        ]),
        article("11", "RÉSILIATION / SUSPENSION / LIMITATION DE SERVICE", [
          "Le Client s'engage pour la durée initiale définie au contrat. Pour ne pas reconduire, il doit le notifier à ASTORYA S.G.I. par lettre recommandée avec accusé de réception au minimum trois (3) mois avant la date d'échéance.",
          "11.1. Résiliation par tacite reconduction — Préavis de trois (3) mois avant la prochaine échéance. Toute période débutée est due dans son intégralité et renouvelle le contrat pour une durée d'un an.",
          "11.2. Résiliation pour faute — Délai de 8 jours calendaires suivant la réception d'une mise en demeure restée sans effet.",
          "11.3. Suspension de services pour défaut de paiement — Suspension de l'intégralité des services dès lors que l'encours échu du client atteint 1 000 € HT. ASTORYA S.G.I. s'engage à effectuer au préalable au minimum deux relances par mail ou téléphone.",
          "11.4. Révision des prix — Les prix sont indexés sur l'indice Syntec selon la formule P = P0 × Sn / S0.",
        ]),
        article("12", "GÉNÉRALITÉS", [
          "12.1. Divisibilité — La nullité d'une des clauses du contrat n'entraînera pas la nullité des autres clauses qui garderont leur plein effet et portée.",
          "12.2. Tolérance — Toute tolérance ou renonciation de l'une des Parties dans l'application de tout ou partie des engagements prévus au contrat ne peut être interprétée comme une renonciation à faire valoir les droits en cause.",
          "12.3. Référence publicité — ASTORYA S.G.I. pourra se prévaloir des services fournis au Client sur ses documents commerciaux et/ou sa plaquette.",
        ]),
        article("13", "LOI ET ATTRIBUTION DE COMPÉTENCE", [
          "Le présent contrat est soumis au droit français.",
          "Les Parties conviennent de rechercher une solution amiable à toute difficulté qui pourrait intervenir à propos de l'application ou de l'interprétation des clauses contractuelles. Dans l'hypothèse où les différends persisteraient, les litiges seront portés devant le Tribunal de Commerce de Nantes.",
        ]),
        article("14", "TRAITEMENT DES DONNÉES À CARACTÈRE PERSONNEL", [
          "14.1. Respect de la réglementation applicable — Les Parties s'engagent à respecter les dispositions légales et réglementaires en vigueur relatives à l'informatique, aux fichiers et aux libertés (loi n° 78-17 du 6 janvier 1978 modifiée et RGPD).",
          "14.2. Traitements réalisés par ou pour le compte du Client — Le Client demeure seul responsable des traitements de données à caractère personnel réalisés pour son propre compte. ASTORYA S.G.I. agit en qualité de sous-traitant sur seules instructions du Client.",
          "14.3. Sécurité — ASTORYA S.G.I. prend toutes précautions utiles pour préserver la sécurité et la confidentialité des données : mesures de sécurité physique, contrôles d'identité et d'accès, isolation physique et logique des Clients, processus d'authentification, gestion des habilitations (moindre privilège, besoin d'en connaître), traçabilité des actions.",
          "14.4. Localisation et Transferts de données — L'ensemble des données d'hébergement de la société ASTORYA S.G.I. sont situées en France. Plusieurs régions sont sollicitées pour assurer la sécurité et la redondance des données.",
          "14.5. Traitements ASTORYA S.G.I. — Données conservées pendant toute la durée du Contrat et les trente-six (36) mois suivants. Données de connexion : 1 mois. Pour exercer ses droits, le Client peut écrire à hotline@astorya.fr.",
        ]),
      ],
    };

    return {
      pageSize: "A4",
      pageMargins: [32, 32, 32, 36],
      defaultStyle: { font: "Roboto", fontSize: 9.5, color: "#0f172a" },
      info: {
        title: "Contrat d'hébergement externalisé — " + (client.name || "Client"),
        author: ASTORYA.raison_sociale,
        subject: "Contrat hébergement externalisé",
      },
      content: [
        headerBand,
        identBlock,
        prestaBlock,
        productsTable,
        condFiBlock,
        condPartBlock,
        signBlock,
        cgvBlock,
      ],
      styles: {
        h1: { fontSize: 12, bold: true, color: "#c91c45", letterSpacing: 0.4 },
        h2: { fontSize: 10.5, bold: true, color: "#0f172a", margin: [0, 4, 0, 2] },
        th: { fontSize: 9, bold: true, color: "#0f172a" },
        td: { fontSize: 9 },
        tdMono: { fontSize: 8.5, color: "#3730a3" },
      },
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            { text: "ASTORYA S.G.I. · " + ASTORYA.adresse + " · " + ASTORYA.cp + " " + ASTORYA.ville + " · SIRET " + ASTORYA.siret, fontSize: 7.5, color: "#94a3b8", margin: [32, 0, 0, 8] },
            { text: "Page " + currentPage + " / " + pageCount, fontSize: 7.5, color: "#94a3b8", alignment: "right", margin: [0, 0, 32, 8] },
          ],
        };
      },
    };
  }

  // ───── API publique
  async function _getPdf(payload) {
    await loadPdfMake();
    return window.pdfMake.createPdf(buildDocDefinition(payload || {}));
  }

  window.HubHostingContractPdf = {
    async preview(payload) {
      const pdf = await _getPdf(payload);
      pdf.open();
    },
    async download(payload, filename) {
      const pdf = await _getPdf(payload);
      const name = filename || ("Contrat-hebergement-" + ((payload && payload.client && payload.client.name) || "client").replace(/[^A-Za-z0-9-_]+/g, "_") + ".pdf");
      pdf.download(name);
    },
    async toBlob(payload) {
      const pdf = await _getPdf(payload);
      return new Promise((resolve) => pdf.getBlob((blob) => resolve(blob)));
    },
    async toBase64(payload) {
      const pdf = await _getPdf(payload);
      return new Promise((resolve) => pdf.getBase64((b64) => resolve(b64)));
    },
  };
})();
