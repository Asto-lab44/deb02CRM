// ════════════════════════════════════════════════════════════════════
// contract-pdf.js — Génération PDF du Contrat d'Hébergement Externalisé
// ════════════════════════════════════════════════════════════════════
//
// Reproduit fidèlement la maquette Word « Contrat_Hébergement_Externalisé.docx »
// en pdfmake :
//   1. En-tête
//   2. Identification des Parties (Prestataire + Client)
//   3. Description de la prestation + tableau Capacité
//   4. Conditions financières : Coût mensuel + Facturation et paiement
//   5. Conditions particulières : Durée + Personnel référent
//   6. Signature
//   7. Conditions Générales (Articles 1 à 14 — texte intégral)
//   8. Mandat de Prélèvement SEPA
//
// Usage :
//   HubHostingContractPdf.preview(payload)
//   HubHostingContractPdf.download(payload, filename)
//   const blob = await HubHostingContractPdf.toBlob(payload)
//
// payload = {
//   client: { name, address, cp, city, siren, billing_email, tel, iban, bic },
//   products: [{ name, sku, desc, unit, qty, discount, periodicity }],
//   duration: 36,
//   billingPeriod: "monthly"|"quarterly"|"quarterly_due"|"annual",
//   tacite, paymentDelay, indexation, indexCap,
//   startDate, endDate,
//   signatory: { name, role },
//   referent: { name, email },             // personne référente du client
//   sums: { totalY1HT, tva, totalY1TTC, tcv, oneshotHT, recurringHT },
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
      const s1 = document.createElement("script"); s1.src = PDFMAKE_URL;
      s1.onload = () => {
        const s2 = document.createElement("script"); s2.src = PDFMAKE_FONTS_URL;
        s2.onload = () => resolve(window.pdfMake);
        s2.onerror = () => reject(new Error("Échec chargement vfs_fonts"));
        document.head.appendChild(s2);
      };
      s1.onerror = () => reject(new Error("Échec chargement pdfmake"));
      document.head.appendChild(s1);
    });
    return _pdfmakeReady;
  }

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
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
    ics: "FR42ZZZ123456",
  };

  const ASTORYA_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" font-family="Helvetica, Arial, sans-serif"><defs><radialGradient id="aSphere" cx="35%" cy="32%" r="68%"><stop offset="0%" stop-color="#f5d1d8"/><stop offset="22%" stop-color="#e8a5b2"/><stop offset="55%" stop-color="#c91c45"/><stop offset="100%" stop-color="#7a1126"/></radialGradient></defs><circle cx="165" cy="165" r="148" fill="url(#aSphere)"/><ellipse cx="120" cy="105" rx="55" ry="35" fill="#ffffff" opacity="0.45"/><text x="390" y="200" font-size="220" font-weight="500" font-style="italic" fill="#c91c45" letter-spacing="-4">astorya</text><text x="400" y="280" font-size="44" font-weight="700" fill="#252e44" letter-spacing="1">solution globale informatique</text></svg>';

  // ─────────────────────────────────────────────────────────────────
  // Construction
  // ─────────────────────────────────────────────────────────────────
  function buildDocDefinition(p) {
    const client = p.client || {};
    const products = p.products || [];
    const sums = p.sums || {};
    const referent = p.referent || {};
    const signatory = p.signatory || {};
    const checked = (k) => p.billingPeriod === k ? "☒" : "☐";
    const monthlyHT = (sums.recurringHT || 0) / 12;

    // ── HEADER (logo officiel + titre)
    const logoBlock = (window.AstoryaAssets && window.AstoryaAssets.logoSvg)
      ? { svg: window.AstoryaAssets.logoSvg, width: 150, fit: [150, 50], border: [false, false, false, false] }
      : { svg: ASTORYA_LOGO_SVG, width: 130, fit: [130, 50], border: [false, false, false, false] };
    const headerBand = {
      table: {
        widths: [150, "*"],
        body: [[
          logoBlock,
          { stack: [
            { text: "CONTRAT D'HÉBERGEMENT", fontSize: 16, bold: true, alignment: "right", color: "#0f172a" },
            { text: "EXTERNALISÉ", fontSize: 16, bold: true, alignment: "right", color: "#c91c45", margin: [0, 2, 0, 0] },
            { text: "Conditions Particulières", fontSize: 9, alignment: "right", color: "#475569", margin: [0, 4, 0, 0] },
          ], border: [false, false, false, false], alignment: "right" },
        ]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 14],
    };

    // ── IDENTIFICATION DES PARTIES
    const identBlock = {
      stack: [
        { text: "ENTRE LES SOUSSIGNÉS", style: "h1", margin: [0, 4, 0, 8] },
        { columns: [
          { width: "*", stack: [
            { text: "Le Prestataire", bold: true, fontSize: 10, color: "#c91c45" },
            { text: ASTORYA.raison_sociale, bold: true, fontSize: 10.5, margin: [0, 4, 0, 0] },
            { text: ASTORYA.adresse, fontSize: 9.5 },
            { text: ASTORYA.cp + " " + ASTORYA.ville, fontSize: 9.5 },
            { text: "SIRET : " + ASTORYA.siret, fontSize: 9, color: "#475569", margin: [0, 3, 0, 0] },
            { text: "Tél : " + ASTORYA.tel, fontSize: 9, color: "#475569" },
            { text: "Email : " + ASTORYA.email, fontSize: 9, color: "#475569" },
          ]},
          { width: 20, text: "" },
          { width: "*", stack: [
            { text: "Le Client", bold: true, fontSize: 10, color: "#c91c45" },
            { text: "Raison sociale ou Nom, Prénom :", fontSize: 8.5, color: "#64748b", margin: [0, 4, 0, 1] },
            { text: client.name || "_______________________________", fontSize: 10.5, bold: true },
            { text: "Adresse :", fontSize: 8.5, color: "#64748b", margin: [0, 4, 0, 1] },
            { text: client.address || "_______________________________", fontSize: 9.5 },
            { text: "Code postal : " + (client.cp || "______") + "          Ville : " + (client.city || "______________"), fontSize: 9.5, margin: [0, 3, 0, 0] },
            { text: "SIREN : " + (client.siren || "—"), fontSize: 9, color: "#475569", margin: [0, 3, 0, 0] },
            { text: "Tél : " + (client.tel || "—"), fontSize: 9, color: "#475569" },
          ]},
        ]},
        { text: "Ci-après désignés ensemble « les Parties » ou individuellement « la Partie ». Les Parties sont convenues de ce qui suit.", fontSize: 8.5, italics: true, color: "#64748b", margin: [0, 10, 0, 0] },
      ],
      margin: [0, 0, 0, 12],
    };

    // ── DESCRIPTION DE LA PRESTATION
    const prestaBlock = {
      stack: [
        { text: "DESCRIPTION DE LA PRESTATION", style: "h1", margin: [0, 4, 0, 6] },
        { text: "Description de la prestation", style: "h2" },
        { text: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique sous forme d'hébergement externalisé.", fontSize: 9.5, alignment: "justify", margin: [0, 2, 0, 6] },
        { text: "Capacité du serveur souscrit", style: "h2" },
        { text: "Seules les prestations mentionnées ci-dessous font partie de la prestation. Par conséquent, toute tâche supplémentaire devra faire l'objet d'une revalidation et d'un devis spécifique par ASTORYA S.G.I.", fontSize: 9, alignment: "justify", margin: [0, 2, 0, 4] },
        { text: "Toute augmentation du nombre d'utilisateurs ou tout ajout de licence supplémentaire à la demande du Client dans le contrat d'hébergement sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique. À défaut, et en cas de paiement par le Client des factures résultant des prestations supplémentaires, il est réputé les avoir acceptées.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Le Client souscrit le volume suivant :", fontSize: 9.5, bold: true, margin: [0, 4, 0, 6] },
      ],
    };

    // ── TABLE COÛT MENSUEL (depuis products)
    const coutHeader = [
      { text: "Référence", style: "th" },
      { text: "Désignation", style: "th" },
      { text: "Qté / Capacité", style: "th", alignment: "right" },
      { text: "Prix unitaire\nmensuel HT", style: "th", alignment: "right" },
      { text: "Prix total\nmensuel HT", style: "th", alignment: "right" },
    ];
    const coutRows = products.map((prod) => {
      const gross = (Number(prod.unit) || 0) * (Number(prod.qty) || 0);
      const disc = gross * (Number(prod.discount) || 0) / 100;
      const net = gross - disc;
      const isOneshot = prod.periodicity === "oneshot";
      // Prix mensuel : si annuel récurrent on divise par 12, sinon on affiche tel quel
      const unitMonthly = isOneshot ? prod.unit : (Number(prod.unit) || 0) / 12;
      const totalMonthly = isOneshot ? net : net / 12;
      return [
        { text: prod.sku || "—", style: "tdMono" },
        { stack: [
          { text: prod.name || "—", bold: true, fontSize: 9 },
          prod.desc ? { text: prod.desc, fontSize: 8, color: "#64748b", margin: [0, 1, 0, 0] } : null,
          isOneshot ? { text: "(prestation one-shot)", fontSize: 8, italics: true, color: "#9a3412", margin: [0, 1, 0, 0] } : null,
        ].filter(Boolean) },
        { text: String(prod.qty || 0), style: "td", alignment: "right" },
        { text: fmtEUR(unitMonthly), style: "td", alignment: "right" },
        { text: fmtEUR(totalMonthly), style: "td", alignment: "right", bold: true },
      ];
    });
    const coutTable = {
      table: { widths: [60, "*", 50, 70, 70], headerRows: 1, body: [coutHeader, ...coutRows] },
      layout: {
        hLineWidth: (i) => i <= 1 ? 0.6 : 0.2, vLineWidth: () => 0.2,
        hLineColor: () => "#cbd5e1", vLineColor: () => "#e2e8f0",
        fillColor: (row) => row === 0 ? "#f8fafc" : null,
        paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 6, paddingRight: () => 6,
      },
    };

    const licSupp = {
      text: "Le prix mensuel hors taxe pour une licence supplémentaire est calculé au prorata, selon les références figurant ci-dessus.",
      fontSize: 9, italics: true, color: "#475569", margin: [0, 6, 0, 10],
    };

    // ── FACTURATION ET PAIEMENT (table récap)
    const factHeader = [
      { text: "Nombre", style: "th", alignment: "center" },
      { text: "Montant HT €", style: "th", alignment: "right" },
      { text: "Montant TTC €", style: "th", alignment: "right" },
      { text: "Périodicité de la redevance", style: "th", alignment: "center" },
      { text: "Facturation (mois)", style: "th", alignment: "center" },
    ];
    const factBody = [factHeader, [
      { text: String((products || []).length || 1), style: "td", alignment: "center" },
      { text: fmtEUR(sums.totalY1HT), style: "td", alignment: "right", bold: true },
      { text: fmtEUR(sums.totalY1TTC), style: "td", alignment: "right", bold: true },
      { text: PERIOD_LABEL[p.billingPeriod] || "—", style: "td", alignment: "center" },
      { text: String(p.duration || 36), style: "td", alignment: "center" },
    ]];
    const factTable = {
      table: { widths: ["*", "*", "*", "*", "*"], headerRows: 1, body: factBody },
      layout: {
        hLineWidth: (i) => i <= 1 ? 0.6 : 0.2, vLineWidth: () => 0.2,
        hLineColor: () => "#cbd5e1", vLineColor: () => "#e2e8f0",
        fillColor: (row) => row === 0 ? "#f8fafc" : null,
        paddingTop: () => 6, paddingBottom: () => 6, paddingLeft: () => 6, paddingRight: () => 6,
      },
      margin: [0, 6, 0, 8],
    };

    const periodicityBlock = {
      stack: [
        { text: "Périodicité retenue :", fontSize: 10, bold: true, margin: [0, 4, 0, 4] },
        { columns: [
          { width: "auto", text: checked("monthly") + " Mensuel", fontSize: 10 },
          { width: 16, text: "" },
          { width: "auto", text: checked("quarterly") + " Trimestriel", fontSize: 10 },
          { width: 16, text: "" },
          { width: "auto", text: checked("quarterly_due") + " Trimestriel — terme à échoir", fontSize: 10 },
          { width: 16, text: "" },
          { width: "auto", text: checked("annual") + " Annuel (avance)", fontSize: 10 },
        ]},
        { text: "Le paiement s'effectue terme à échoir par Prélèvement automatique (le Client fournit à ASTORYA S.G.I. le mandat SEPA dûment renseigné et un relevé d'identité bancaire).", fontSize: 9, italics: true, color: "#475569", margin: [0, 8, 0, 4], alignment: "justify" },
        { text: "Email de contact pour la facturation : " + (client.billing_email || "_______________________________"), fontSize: 9.5, bold: true, margin: [0, 4, 0, 0] },
      ],
    };

    const condFiBlock = {
      stack: [
        { text: "CONDITIONS FINANCIÈRES", style: "h1", margin: [0, 10, 0, 6] },
        { text: "Coût mensuel", style: "h2" },
        coutTable,
        licSupp,
        { text: "Facturation et paiement", style: "h2" },
        factTable,
        periodicityBlock,
      ],
    };

    // ── CONDITIONS PARTICULIÈRES
    const condPartBlock = {
      stack: [
        { text: "CONDITIONS PARTICULIÈRES", style: "h1", margin: [0, 12, 0, 6], pageBreak: "before" },
        { text: "Durée du contrat", style: "h2" },
        { text: "Le présent contrat est conclu pour une durée de " + NUM_WORD(p.duration) + " mois et prend effet dès sa signature ou au plus tard à la date d'installation de l'hébergement externalisé prévue le " + fmtDate(p.startDate) + ". Échéance prévisionnelle : " + fmtDate(p.endDate) + ".", fontSize: 9.5, alignment: "justify", margin: [0, 2, 0, 4] },
        p.tacite
          ? { text: "À l'expiration de la durée d'engagement initiale, le contrat est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties trois (3) mois avant l'échéance, par lettre recommandée avec accusé de réception.", fontSize: 9.5, italics: true, color: "#475569", alignment: "justify" }
          : { text: "Tacite reconduction désactivée : le contrat prend fin de plein droit à son échéance.", fontSize: 9.5, italics: true, color: "#9a3412", alignment: "justify" },
        { text: "Personnel référent du Client", style: "h2", margin: [0, 12, 0, 4] },
        { text: "Désignation d'une ou plusieurs personnes habilitées à contacter le support ASTORYA S.G.I. et à prendre les décisions nécessaires au bon déroulement des opérations.", fontSize: 9.5, alignment: "justify", margin: [0, 0, 0, 4] },
        { text: "Nom / Prénom / Mail : " + (referent.name || "_______________________________") + (referent.email ? "  ·  " + referent.email : "  ·  _______________________________"), fontSize: 10, bold: true, margin: [0, 4, 0, 0] },
        { text: "Délai de paiement", style: "h2", margin: [0, 12, 0, 4] },
        { text: "Délai retenu : " + (p.paymentDelay || "30j") + " · Paiement par prélèvement automatique à réception de facture.", fontSize: 9.5 },
        { text: "Indexation annuelle", style: "h2", margin: [0, 10, 0, 4] },
        { text: p.indexation === "Aucune"
            ? "Les prix sont fermes pour toute la durée d'engagement (aucune indexation appliquée)."
            : "Les prix sont indexés sur l'indice " + (p.indexation || "SYNTEC") + ", plafonné à " + (p.indexCap || 3) + " % par an, selon la formule P = P0 × Sn / S0 (cf. article 11.4 des Conditions Générales).",
          fontSize: 9.5, alignment: "justify" },
      ],
    };

    // ── SIGNATURE
    const signBlock = {
      stack: [
        { text: "SIGNATURE", style: "h1", margin: [0, 16, 0, 8] },
        { columns: [
          { width: "*", text: "Fait à : ____________________", fontSize: 10 },
          { width: "*", text: "Le : ____________________", fontSize: 10, alignment: "right" },
        ], margin: [0, 0, 0, 14] },
        { text: "☐ Le Client accepte les conditions de la présente offre.", fontSize: 10, margin: [0, 0, 0, 10] },
        { columns: [
          { width: "*", stack: [
            { text: "Je soussigné : " + (signatory.name || "_______________________________"), fontSize: 10 },
            { text: "Agissant en qualité de : " + (signatory.role || "_______________________________"), fontSize: 10, margin: [0, 4, 0, 12] },
            { text: "« Bon pour accord »", fontSize: 10.5, bold: true, margin: [0, 0, 0, 6] },
            { text: "Cachet et signature du Client", fontSize: 9, color: "#475569" },
            { text: " ", fontSize: 30 },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: "#cbd5e1" }] },
          ]},
          { width: 20, text: "" },
          { width: "*", stack: [
            { text: " ", fontSize: 60 },
            { text: "Cachet et signature du Prestataire", fontSize: 9, color: "#475569" },
            { text: ASTORYA.raison_sociale, fontSize: 10, bold: true, margin: [0, 4, 0, 0] },
            { text: " ", fontSize: 20 },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: "#cbd5e1" }] },
          ]},
        ]},
      ],
      unbreakable: true,
    };

    // ─────────────────────────────────────────────────────────────────
    // CONDITIONS GÉNÉRALES — texte intégral
    // ─────────────────────────────────────────────────────────────────
    const para = (t) => ({ text: t, fontSize: 9, alignment: "justify", margin: [0, 0, 0, 4] });
    const article = (num, title, paragraphs) => ({
      stack: [
        { text: "ARTICLE " + num + " — " + title, style: "h2", margin: [0, 10, 0, 4] },
        ...paragraphs.map(para),
      ],
    });
    const subart = (title, paragraphs) => ({
      stack: [
        { text: title, fontSize: 10, bold: true, color: "#0f172a", margin: [0, 6, 0, 3] },
        ...paragraphs.map(para),
      ],
    });
    const bullet = (items) => ({ ul: items.map((t) => ({ text: t, fontSize: 9, alignment: "justify" })), margin: [0, 0, 0, 4] });

    const cgvBlock = {
      stack: [
        { text: "CONDITIONS GÉNÉRALES D'HÉBERGEMENT EXTERNALISÉ", style: "h1", margin: [0, 0, 0, 8], pageBreak: "before" },
        article("1", "OBJET", [
          "Le Client reconnaît avoir vérifié l'adéquation du service à ses besoins et avoir reçu d'ASTORYA S.G.I. toutes les informations et conseils qui lui étaient nécessaires pour souscrire au présent engagement en connaissance de cause. En conséquence, les deux Parties ont convenu de collaborer dans les conditions ci-après définies.",
          "Le présent contrat a pour objet la fourniture d'une prestation d'hébergement externalisé par ASTORYA S.G.I. à la demande du Client. Cette prestation est décrite dans les Conditions Particulières.",
          "Les présentes Conditions Générales d'hébergement externalisé complétées par les Conditions Particulières, la proposition commerciale et éventuellement les Annexes proposées par ASTORYA S.G.I. sont applicables, à l'exclusion de toutes autres conditions et notamment celles du Client. La signature de la proposition commerciale et/ou des Conditions Particulières emporte acceptation des présentes Conditions Générales.",
        ]),
        article("2", "DOCUMENTS CONTRACTUELS", [
          "L'accord entre les Parties est constitué des documents contractuels suivants, énumérés par ordre hiérarchique décroissant (du plus important au moins important) :",
        ]),
        bullet([
          "Les Conditions Générales de services d'hébergement externalisé (ci-après Conditions Générales)",
          "Les Conditions Particulières (ci-après Conditions Particulières) et ses éventuels avenants",
          "Les Conditions générales de vente",
          "La proposition ou offre commerciale du Prestataire",
        ]),
        para("Il sera fait application de cet ordre de priorité en cas de contradiction entre une et/ou plusieurs dispositions mentionnées dans l'un des documents listés ci-dessus."),
        article("3", "OBLIGATIONS DES PARTIES", [
          "Les Parties s'engagent à exécuter loyalement et de bonne foi et à s'apporter mutuellement collaboration et assistance.",
          "ASTORYA S.G.I. s'engage à apporter tout le soin et toute la diligence nécessaire à la fourniture d'un service de qualité conformément aux usages de la profession.",
          "Le Client s'engage à fournir à ASTORYA S.G.I. les moyens nécessaires à la bonne exécution des prestations décrites dans les Conditions Particulières. À ce titre, le Client s'engage à :",
        ]),
        bullet([
          "Désigner un interlocuteur unique, compétent et décisionnaire pendant toute la durée du contrat ;",
          "Communiquer, lors de la création de son compte client et à chaque modification de celui-ci, ses coordonnées et informations bancaires exactes et mises à jour à ASTORYA S.G.I. pour un règlement par prélèvement bancaire ;",
          "Informer par email le Prestataire dans les 48 heures de toute modification concernant sa situation, notamment la modification de son équipement ; à défaut ASTORYA S.G.I. dégage toute responsabilité quant aux conséquences dommageables qui pourraient résulter de cette absence d'information ;",
          "Fournir plus généralement à ASTORYA S.G.I. tout moyen et information nécessaires à la bonne exécution des prestations.",
        ]),
        para("Le Client assure ASTORYA S.G.I. qu'il est titulaire de tous les droits de propriété intellectuelle sur l'intégralité des pages et données qu'il fait héberger."),
        para("ASTORYA S.G.I. se réserve le droit de vérifier si toutes les conditions nécessaires à la bonne exécution de la prestation sont réunies. Tout retard de la part du Client ou d'un tiers pourra entraîner un décalage du calendrier de réalisation des prestations. Toutes les notifications, mises en demeure et autres avis signifiés au titre du présent contrat doivent à peine de nullité être dressés par une personne habilitée et adressés aux interlocuteurs désignés de l'une ou de l'autre Partie."),
        para("ASTORYA S.G.I. peut suspendre exceptionnellement et brièvement l'accessibilité aux serveurs pour d'éventuelles interventions de maintenance ou d'amélioration afin d'assurer le bon fonctionnement de ses services."),
        article("4", "DURÉE", [
          "Le présent contrat entre en vigueur à la date et pour une durée prévue dans les Conditions Particulières.",
          "À l'expiration de la durée d'engagement initiale, il est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties, trois (3) mois avant son échéance, par lettre recommandée avec accusé de réception.",
        ]),
        article("5", "CONFIDENTIALITÉ / PROPRIÉTÉ INTELLECTUELLE / DONNÉES PERSONNELLES", [
          "Chaque Partie s'engage à tenir confidentielles les informations dont le caractère confidentiel aura été communiqué comme tel par l'autre Partie pour l'exécution du présent contrat.",
          "ASTORYA S.G.I. ne saurait être tenue pour responsable d'aucune divulgation si les éléments divulgués étaient dans le domaine public à la date de la divulgation, ou s'il en avait connaissance, ou les obtenait de tiers par des moyens légitimes.",
          "Toute révélation et/ou divulgation non autorisée par écrit pourra donner lieu à des dommages et intérêts à charge de la Partie l'ayant commise.",
          "Chacune des Parties s'engage à respecter les obligations résultant du présent article pendant toute la durée du contrat ainsi que pendant les cinq (5) ans suivant son expiration ou sa résiliation pour quelque motif que ce soit.",
          "Chacune des Parties garantit l'autre Partie du respect des obligations légales et réglementaires lui incombant au titre de la protection des données à caractère personnel, en particulier de la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique aux fichiers et aux libertés.",
        ]),
        article("6", "PERSONNEL", [
          "Le personnel d'ASTORYA S.G.I. affecté pour la réalisation des prestations, objet du présent contrat, reste sous son autorité hiérarchique et disciplinaire. Il ne reste soumis qu'au règlement intérieur d'ASTORYA S.G.I. En effet, ASTORYA S.G.I. assure la gestion administrative, comptable et sociale de son personnel.",
          "Toutefois, le personnel d'ASTORYA S.G.I. intervenant dans les locaux du Client est soumis à l'ensemble des règles relatives à l'hygiène et la sécurité en vigueur dans les locaux du Client.",
        ]),
        article("7", "NON SOLLICITATION DU PERSONNEL", [
          "Sauf accord donné au préalable et par écrit par l'autre Partie, chaque Partie renonce à engager ou à faire travailler, soit directement, soit indirectement, tout collaborateur d'une autre Partie, qu'il soit salarié ou non et même si la sollicitation initiale émane du collaborateur concerné. Cette renonciation est valable pendant toute la durée des relations contractuelles augmentée de trente-six (36) mois.",
          "Dans le cas où l'une des Parties ne respecterait pas cette clause de non débauchage, elle s'engage irrévocablement à verser à la Partie ayant subi ce préjudice une indemnité forfaitaire égale à dix mille (10 000) euros par salarié concerné.",
        ]),
        article("8", "CLAUSES DES SERVICES", []),
        subart("Service antispam", [
          "Les adresses mails créées au cours du contrat sont automatiquement ajoutées dans le service antispam. Une régularisation s'effectue annuellement afin d'ajuster la facturation suite à l'ajout d'une adresse mail. La suppression d'une adresse mail ne donne pas lieu à régularisation pour la période en cours et sera prise en compte pour la reconduction à date anniversaire.",
          "Le service antispam filtre les mails à leur arrivée sur le serveur de messagerie et bloque les emails sur le serveur avant leur distribution dans la boîte mail de destination. Lorsque le système antispam identifie un mail comme spam, le Client se verra proposer de supprimer le mail, le libérer et l'ajouter sur la liste blanche. Le Client est informé qu'une fois un mail supprimé via ce système il n'est pas possible de le récupérer.",
        ]),
        subart("Service SMTP transactionnel", [
          "Cette solution d'emailing professionnel offre la possibilité d'adresser des emailings depuis un environnement sécurisé sans blocage du domaine. Le pack contient 100 000 mails d'envois et est valable 36 mois. Si l'utilisation du pack est utilisée avant la date d'échéance, le Client a la possibilité de commander un pack supplémentaire. Les mails restant non utilisés durant la période sont perdus à l'échéance.",
        ]),
        subart("Solution Exchange", [
          "Le Client dispose de 50 Go d'espace par boîte mail souscrite. Les boîtes mails supplémentaires ajoutées durant le contrat ne nécessitent pas la signature d'un nouveau contrat ; la facturation est ajustée en fonction de l'ajout d'adresses supplémentaires. L'engagement du service Exchange est de trente-six (36) mois pour chaque boîte mail. Le service est ensuite reconduit tacitement selon la périodicité de facturation souscrite initialement. La suppression d'un compte Exchange durant la période initiale d'engagement ne donne pas lieu à régularisation : la période est due dans son intégralité.",
        ]),
        subart("Solution Office 365", [
          "Les licences supplémentaires ajoutées durant le contrat ne nécessitent pas la signature d'un nouveau contrat ; la facturation est ajustée en fonction de l'ajout de licences. L'engagement du service Office 365 est de 36 mois pour chaque licence. Le service est ensuite reconduit tacitement selon la périodicité de facturation souscrite initialement. La suppression d'une licence durant la période initiale d'engagement ne donne pas lieu à régularisation : la période est due dans son intégralité.",
        ]),
        article("9", "MODALITÉS DE FACTURATION ET DE PAIEMENT", []),
        subart("9.1. Tarif", [
          "Les tarifs en vigueur pour les différentes prestations proposées par ASTORYA S.G.I. sont disponibles sur les propositions commerciales. Les prix du présent contrat sont fermes pendant les trente-six (36) premiers mois. Sauf stipulations contraires mentionnées dans les Conditions Particulières afférentes à la prestation commandée, ce prix pourra être automatiquement réévalué entre 0,5 % et 2 %, à la date anniversaire du contrat et ce, chaque année.",
          "Toute prestation supplémentaire effectuée par ASTORYA S.G.I. à la demande du Client ne pourra être exigée gratuitement, mais devra faire l'objet d'une revalidation et d'un devis spécifique par le Prestataire, après accord des Parties. Un appel au service résultant d'une intervention sur site, non justifié, sera facturé par ASTORYA S.G.I. au Client au tarif horaire en vigueur de 79 € HT par heure. Ce service ne comprend pas les applications, installations ou configurations logicielles autres que celles spécifiquement notifiées.",
          "Les services ou prestations commandés sont mentionnés dans le bon de commande ; ils s'entendent hors taxes sauf indication contraire et sont payables en euros.",
          "Les frais de déplacement et d'hébergement générés dans le cadre de l'exécution de la prestation sont inclus dans le contrat. Sauf stipulation contraire dans les Conditions Particulières, lorsque la prestation est réalisée à plus de 25 km de Nantes, des frais de déplacement de 49 euros seront facturés au Client et lorsqu'elle a lieu hors Loire-Atlantique la facturation des frais de déplacement se fait au réel.",
          "ASTORYA S.G.I. se réserve le droit de répercuter, sans délai, toute nouvelle taxe ou toute augmentation de taux des taxes existantes.",
        ]),
        subart("9.2. Facturation", [
          "Afin de participer à la protection de l'environnement, ASTORYA S.G.I. adressera la ou les facture(s) relative(s) à la prestation souscrite par voie électronique exclusivement, à l'adresse mail fournie par le Client lors de la création de son compte. Le Client accepte expressément que la ou les facture(s) lui soit transmise(s) par voie électronique. Il appartient au Client de s'assurer de la bonne réception des factures électroniques et d'informer le service comptable de tout changement de correspondant à l'adresse service.comptabilite@astorya.fr. Il appartient au Client de conserver une copie de la facture conformément à la réglementation en vigueur. Au cas où le Client souhaiterait recevoir la ou les facture(s) par voie postale, il devra s'acquitter des frais de dossier et d'expédition, à hauteur de 19 € HT par trimestre.",
          "La facturation s'établit mensuellement, trimestriellement ou annuellement selon les termes définis aux Conditions Particulières.",
        ]),
        subart("9.3. Paiement", [
          "Le paiement s'effectue par prélèvement automatique à réception de la facture. Tout désaccord concernant la facturation et la nature des services devra être exprimé par courrier électronique à l'adresse service.comptabilite@astorya.fr dans un délai de sept (7) jours calendaires après émission de la facture.",
          "En cas d'incident de paiement, ASTORYA S.G.I. s'engage à prendre contact avec le Client pour lui faire part du défaut de paiement. ASTORYA S.G.I. se réserve le droit de facturer au Client les frais bancaires relatifs à l'incident de paiement et ce, dès le premier rejet de prélèvement.",
          "Le Client est seul responsable de l'ensemble des sommes dues au titre du présent contrat. De convention expresse et sauf report sollicité à temps et accordé par ASTORYA S.G.I. de manière particulière et écrite, le défaut total ou partiel de paiement à l'échéance de toute somme due au titre du/des contrats entraînera de plein droit et sans mise en demeure préalable :",
        ]),
        bullet([
          "L'exigibilité immédiate de toutes les sommes restantes dues par le Client au titre du contrat, quel que soit le mode de paiement prévu ;",
          "L'application des pénalités de retard correspondant au taux directeur de la Banque Centrale Européenne majoré, sans que celui-ci ne puisse être inférieur à trois fois le taux d'intérêt légal en vigueur en France ;",
          "L'application d'une indemnité forfaitaire pour frais de recouvrement à hauteur de 40 € hors taxe par facture conformément au décret 2012-1115 du 02/10/2012 ;",
          "La suspension totale ou partielle du ou des services du Client. Les éventuels frais de reconnexion du ou des services seront à la charge du Client ;",
          "Le refus de nouvelle commande ou de renouvellement de services.",
        ]),
        para("Dans l'hypothèse où des frais seraient engagés par ASTORYA S.G.I., cette dernière en informera le Client et lui communiquera les justificatifs et la facture correspondants. Le Client devra alors régler la somme due en euros."),
        para("En outre, ASTORYA S.G.I. se réserve la faculté de suspendre l'exécution du contrat huit (8) jours calendaires après l'envoi d'une mise en demeure adressée au Client par lettre recommandée avec accusé de réception restée infructueuse, sans préjudice de tous dommages-intérêts et indemnités auxquels elle pourrait prétendre. ASTORYA S.G.I. ne pourra pas être tenue pour responsable de tout dommage subi par le Client du fait de cette suspension."),
        para("À l'expiration d'un délai de trois (3) mois faisant suite à cette suspension restée sans effet, le contrat est résilié de plein droit et sans formalité préalable. Cette résiliation pourrait entraîner une impossibilité pour le Client de souscrire de nouvelles prestations."),
        article("10", "RESPONSABILITÉ / ASSURANCE", []),
        subart("10.1. Responsabilité", [
          "Au regard de l'équilibre économique du Contrat, les Parties conviennent de ce qui suit.",
          "ASTORYA S.G.I. s'engage à mettre tous les moyens en œuvre pour la réalisation de la prestation décrite dans le présent contrat.",
          "La responsabilité d'ASTORYA S.G.I. ne peut être retenue qu'en cas de faute commise par cette dernière et prouvée par le Client. Elle ne peut être recherchée si l'exécution des présentes est empêchée, limitée ou dérangée en raison de conflits sociaux, de cas fortuits, de force majeure telle que définie par l'article 1218 du Code civil, ou de fait imputable au Client ou à un tiers.",
          "Les réparations dues par ASTORYA S.G.I., en cas de défaillance du service qui résulterait d'une faute établie à son encontre, correspondront au préjudice direct, personnel et certain lié à la défaillance en cause, à l'exclusion expresse de tout dommage indirect tel que, notamment, préjudice commercial, perte de commandes, atteinte à l'image de marque, trouble commercial quelconque, perte de bénéfices ou de clients (par exemple, divulgation inopportune d'informations confidentielles les concernant par suite de défectuosité ou de piratage du système, action d'un tiers contre le Client, etc.).",
          "La responsabilité d'ASTORYA S.G.I. ne saurait être engagée :",
        ]),
        bullet([
          "Les difficultés d'accès au site hébergé du fait de la saturation des réseaux à certaines périodes ;",
          "Les contenus des informations, du son, des images, du texte, éléments de formes, données accessibles sur les sites hébergés sur le service du Client, transmises ou mises en ligne par le Client ;",
          "En cas de transmission de virus, des données et/ou logiciels du Client dont la protection incombe au Client, ou autres éléments nuisibles ;",
          "En cas d'intrusions malveillantes de tiers sur internet et/ou l'espace Client du Client ;",
          "En cas de détournements éventuels des mots de passe, codes confidentiels, et plus généralement de toute information à caractère sensible pour le Client et dont il serait fait une utilisation frauduleuse par un tiers ;",
          "En cas de non-respect des recommandations émises par ASTORYA S.G.I. et relatives à l'utilisation du service.",
        ]),
        para("En tout état de cause, le montant des dommages et intérêts qui pourrait être mis à la charge d'ASTORYA S.G.I. si sa responsabilité était engagée, sera limité au montant total des sommes versées par le Client à ASTORYA S.G.I. au titre du présent contrat."),
        para("Le Client reconnaît qu'aucune stipulation des présentes ne le dégagera de l'obligation de payer toutes les sommes dues à ASTORYA S.G.I. au titre des prestations réalisées."),
        para("La société ASTORYA S.G.I. ne peut en aucun cas être tenue pour responsable des conséquences d'une attaque virale informatique impactant le service informationnel du Client, ainsi que les infrastructures informatiques associées et la perte de production résultant de cette défaillance ; en tout état de cause les éventuelles solutions antivirales, anti-spam revendues par la société ASTORYA S.G.I. ne garantissent pas la protection totale."),
        subart("10.2. Assurance", [
          "Chacune des Parties déclare être titulaire de polices d'assurance auprès d'un organisme notoirement solvable couvrant sa responsabilité civile dans le cadre du présent contrat.",
          "ASTORYA S.G.I. a notamment souscrit, en plus de l'assurance Responsabilité Civile Professionnelle obligatoire, une assurance « Data Risks » visant à couvrir les dommages subis ou causés à des tiers dans le cadre de cyber-attaques.",
        ]),
        article("11", "RÉSILIATION / SUSPENSION / LIMITATION DE SERVICE", [
          "Le Client s'engage pour la durée initiale définie au contrat. Lorsque le Client ne souhaite pas reconduire le contrat, il doit le notifier à ASTORYA S.G.I. par lettre recommandée avec accusé de réception au minimum trois (3) mois avant sa date d'échéance.",
        ]),
        subart("11.1. Résiliation par tacite reconduction", [
          "Le contrat en tacite reconduction peut être résilié par lettre recommandée avec accusé de réception adressée à ASTORYA S.G.I. en respectant un délai de préavis de trois (3) mois avant la prochaine échéance du contrat. Toute période débutée est due dans son intégralité et renouvelle le contrat pour une durée d'un an (tacite reconduction annuelle).",
        ]),
        subart("11.2. Résiliation pour faute", [
          "Si l'une des Parties n'exécute pas l'une quelconque de ses obligations contractuelles découlant du contrat pour des motifs autres qu'un cas de force majeure ou un défaut de paiement sans y remédier dans un délai de huit (8) jours calendaires suivant la réception d'une mise en demeure, la Partie non défaillante pourra, sans autre avis ni intervention judiciaire préalable, résilier le contrat sans responsabilité envers la Partie défaillante et sans préjudice de son droit de réclamer des dommages et intérêts pour le préjudice subi.",
        ]),
        subart("11.3. Suspension de services pour défaut de paiement", [
          "En cas de non-paiement total ou partiel, ASTORYA S.G.I. se réserve le droit de suspendre l'intégralité des Services du Client (y compris des services ayant été réglés), dès lors que l'encours échu du Client atteint mille euros hors taxe (1 000,00 € HT). ASTORYA S.G.I. s'engage à effectuer au préalable au minimum deux relances auprès du Client par mail ou téléphone, sans nécessité d'avoir préalablement adressé une mise en demeure par voie recommandée au Client.",
          "ASTORYA S.G.I. ne pourra pas être tenue pour responsable de tout dommage subi par le Client du fait de cette suspension. En cas de non-exécution de ses obligations contractuelles par ASTORYA S.G.I. résultant de la période de suspension suite au retard ou défaut de paiement du Client, celui-ci ne pourra pas exiger de dommages-intérêts ou pénalités à l'encontre d'ASTORYA S.G.I.",
          "À l'expiration d'un délai d'un (1) mois faisant suite à cette suspension restée sans effet, le contrat est résilié de plein droit et sans formalité préalable. Cette résiliation pourrait entraîner une impossibilité pour le Client de souscrire de nouvelles prestations.",
        ]),
        subart("11.4. Révision des prix", [
          "Les prix sont indexés sur l'indice Syntec selon la formule suivante : P = P0 × Sn / S0, où P = nouveau prix, P0 = ancien prix, Sn = indice Syntec connu au mois « n » de la révision, S0 = indice Syntec en vigueur à la date de signature du Contrat ou lors de la révision précédente.",
        ]),
        article("12", "GÉNÉRALITÉS", []),
        subart("12.1. Divisibilité", [
          "La nullité d'une des clauses du contrat souscrit auprès d'ASTORYA S.G.I. en application, notamment, d'une loi, d'un règlement ou à la suite d'une décision de juridiction compétente passée en force de chose jugée n'entraînera pas la nullité des autres clauses du contrat qui garderont leur plein effet et portée.",
        ]),
        subart("12.2. Tolérance", [
          "Il est convenu que toute tolérance ou renonciation de l'une des Parties, dans l'application de tout ou partie des engagements prévus au contrat, ne peut être interprétée comme une renonciation à faire valoir les droits en cause.",
        ]),
        subart("12.3. Référence publicité", [
          "ASTORYA S.G.I. pourra à l'occasion de publicités, manifestations, dans les colloques et publications spécialisées sur les marchés professionnels, se prévaloir des services fournis au Client ainsi que sur ses documents commerciaux et/ou sa plaquette.",
        ]),
        article("13", "LOI ET ATTRIBUTION DE COMPÉTENCE", [
          "Le présent contrat est soumis au droit français.",
          "Les Parties conviennent de rechercher une solution amiable à toute difficulté qui pourrait intervenir à propos de l'application ou de l'interprétation des clauses contractuelles. Dans l'hypothèse où les différends persisteraient, les litiges seront portés devant le Tribunal de Commerce de Nantes, à qui est donnée compétence territoriale et ceci même en cas de référé.",
        ]),
        article("14", "TRAITEMENT DES DONNÉES À CARACTÈRE PERSONNEL", []),
        subart("14.1. Respect de la réglementation applicable", [
          "Les Parties s'engagent à respecter les dispositions légales et réglementaires en vigueur relatives à l'informatique, aux fichiers et aux libertés, notamment la loi n° 78-17 du 6 janvier 1978 modifiée par la loi n° 2004-801 du 6 août 2004, ainsi que le Règlement (UE) 2016/679 du Parlement européen et du Conseil relatif à la protection des personnes physiques à l'égard du traitement des données à caractère personnel et à la libre circulation de ces données (RGPD), à compter de sa date d'application.",
          "Chacune des Parties s'engage notamment, concernant les traitements de données à caractère personnel dont elle est responsable, à effectuer toutes les formalités requises (déclarations, demandes d'autorisation, etc.) auprès de la CNIL ou de tout autre organisme compétent, et à respecter les droits des personnes concernées (notamment droit d'information, d'accès, de rectification et de suppression des données).",
          "Le Client, qui demeure seul responsable du choix des Services, s'assure que les Services présentent les caractéristiques et conditions requises pour pouvoir procéder aux traitements de données à caractère personnel envisagés dans le cadre de l'utilisation des Services, compte tenu de la réglementation en vigueur, notamment lorsque les Services sont utilisés pour traiter des données sensibles (par exemple, données de santé).",
        ]),
        subart("14.2. Traitements réalisés par ou pour le compte du Client", [
          "Le Client demeure seul responsable des traitements de données à caractère personnel réalisés pour son propre compte dans le cadre des Services, que ce soit par lui-même, par ASTORYA S.G.I. ou par des tiers. Concernant les traitements de données à caractère personnel réalisés par ASTORYA S.G.I. pour le compte du Client dans le cadre de l'exécution des Services (notamment des prestations de support), ASTORYA S.G.I. agit en qualité de sous-traitant sur seules instructions du Client.",
        ]),
        subart("14.3. Sécurité", [
          "ASTORYA S.G.I. prend, dans les conditions prévues au Contrat, toutes précautions utiles pour préserver la sécurité et la confidentialité des données à caractère personnel auxquelles elle a accès, et notamment empêcher qu'elles soient déformées, endommagées, ou que des tiers non autorisés y aient accès.",
          "ASTORYA S.G.I. peut toutefois être amenée à devoir communiquer lesdites données à des autorités judiciaires et/ou administratives, notamment dans le cadre de réquisitions. En ce cas, et sauf disposition légale ou injonction de l'autorité compétente l'en empêchant, ASTORYA S.G.I. s'engage à en informer le Client et à limiter la communication de données à celles expressément requises par lesdites autorités.",
          "ASTORYA S.G.I. s'engage à mettre en place :",
        ]),
        bullet([
          "Des mesures de sécurité physique visant à empêcher l'accès aux infrastructures sur lesquelles sont stockées les données du Client par des personnes non autorisées ;",
          "Des contrôles d'identité et d'accès via un système d'authentification ainsi qu'une politique de mots de passe ;",
          "Un système d'isolation physique et logique des Clients entre eux ;",
          "Des processus d'authentification des utilisateurs et administrateurs, ainsi que des mesures de protection des fonctions d'administration ;",
          "Dans le cadre d'opérations de support et de maintenance, un système de gestion des habilitations mettant en œuvre les principes du moindre privilège et du besoin d'en connaître ;",
          "Des processus et dispositifs permettant de tracer l'ensemble des actions réalisées sur son système d'information, et d'effectuer conformément à la réglementation en vigueur, des actions de reporting en cas d'incident impactant les données du Client.",
        ]),
        para("Le Client assure la sécurité des ressources, systèmes et applications qu'il déploie dans le cadre de l'utilisation des Services, et demeure notamment responsable de la mise en place de systèmes de filtrage des flux tels que pare-feu, la mise à jour des systèmes et logiciels déployés, la gestion des droits d'accès, la configuration des ressources, etc. ASTORYA S.G.I. ne sera en aucun cas responsable des incidents de sécurité liés à l'utilisation d'Internet, notamment en cas de perte, altération, destruction, divulgation ou accès non-autorisé à des données ou informations du Client."),
        para("Le Client assure la bonne tenue et mise à jour de ses logiciels métiers afin d'éviter toute obsolescence logicielle pouvant nuire à la sécurité globale du système d'information."),
        subart("14.4. Localisation et transferts de données", [
          "L'ensemble des données d'hébergement de la société ASTORYA S.G.I. sont situées en France. Cependant plusieurs régions sont sollicitées pour assurer la sécurité et la redondance des données.",
          "Sous réserve de ce qui précède concernant la localisation des Centres de Données, le Client est responsable de toutes les formalités et demandes d'autorisations nécessaires aux transferts de données à caractère personnel prévus dans le cadre du Contrat, auprès des personnes concernées et autorités compétentes.",
        ]),
        subart("14.5. Traitements ASTORYA S.G.I.", [
          "Dans le cadre des Services, ASTORYA S.G.I. collecte les données à caractère personnel du Client, qui font l'objet d'un traitement automatisé dans les conditions prévues par la loi n° 78-17 précitée, à des fins :",
        ]),
        bullet([
          "De gestion de la relation Client ASTORYA S.G.I. (facturation, assistance et maintenance des Services, gestion commerciale, archivage, téléphonie, amélioration de la qualité, de la sécurité et de la performance des services, recouvrement, etc.) ;",
          "De respect de la réglementation applicable à ASTORYA S.G.I. (notamment obligations légales de conservation des données de connexion et d'identification des utilisateurs).",
        ]),
        para("ASTORYA S.G.I. s'engage à ne pas utiliser les données ainsi collectées à d'autres fins que celles susmentionnées."),
        para("Les données traitées à des fins de gestion de la relation entre le Client et ASTORYA S.G.I. sont constituées d'informations telles que nom, prénom, adresse postale, adresse électronique, téléphones des collaborateurs du Client et sont conservées par ASTORYA S.G.I. pendant toute la durée du Contrat et les trente-six (36) mois suivants. Les données de connexion et d'identification des utilisateurs sont conservées par ASTORYA S.G.I. pendant un (1) mois."),
        para("Conformément à la loi « Informatique et Libertés » du 6 janvier 1978, le Client bénéficie d'un droit d'accès, de rectification et de suppression des informations le concernant. Il peut exercer ce droit et obtenir communication desdites informations auprès du Correspondant Informatique et Libertés (CIL) d'ASTORYA S.G.I. par courriel à l'adresse électronique : hotline@astorya.fr ou par courrier postal à : ASTORYA S.G.I. — Correspondant Informatique et Libertés, 9 rue du Petit Châtelier, 44300 Nantes, France, en justifiant de son identité. Il y sera répondu dans un délai de trente (30) jours suivant réception."),
        { text: "— Fin des Conditions Générales —", fontSize: 9, italics: true, color: "#94a3b8", alignment: "center", margin: [0, 10, 0, 0] },
      ],
    };

    // ─────────────────────────────────────────────────────────────────
    // MANDAT DE PRÉLÈVEMENT SEPA
    // ─────────────────────────────────────────────────────────────────
    const sepaField = (label, value, width) => ({
      width: width || "*",
      stack: [
        { text: label, fontSize: 8.5, color: "#64748b", margin: [0, 0, 0, 2] },
        { text: value || "_______________________________", fontSize: 10, bold: true, margin: [0, 0, 0, 0] },
        { canvas: [{ type: "line", x1: 0, y1: 2, x2: 200, y2: 2, lineWidth: 0.4, lineColor: "#cbd5e1" }] },
      ],
    });
    const sepaBlock = {
      stack: [
        { text: "MANDAT DE PRÉLÈVEMENT SEPA", style: "h1", margin: [0, 0, 0, 8], pageBreak: "before", alignment: "center" },
        { text: "Référence Unique du Mandat (RUM) : __________________________________     Type : ☒ Récurrent   ☐ Ponctuel",
          fontSize: 9, color: "#475569", margin: [0, 0, 0, 10], alignment: "center" },
        { text: "En signant ce formulaire de mandat, vous autorisez le créancier à envoyer des instructions à votre banque pour débiter votre compte et vous autorisez votre banque à débiter votre compte conformément aux instructions du créancier.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 4] },
        { text: "Vous bénéficiez du droit d'être remboursé par votre banque selon les conditions décrites dans la convention que vous avez passée avec elle. Une demande de remboursement doit être présentée dans les 8 semaines suivant la date de débit de votre compte pour un prélèvement autorisé.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 14] },

        { text: "VOS COORDONNÉES (DÉBITEUR)", style: "h2", margin: [0, 6, 0, 6] },
        { columns: [
          sepaField("Raison sociale", client.name),
        ], margin: [0, 0, 0, 10] },
        { columns: [
          sepaField("SIREN", client.siren),
          { width: 14, text: "" },
          sepaField("Téléphone", client.tel),
        ], margin: [0, 0, 0, 10] },
        { columns: [
          sepaField("Adresse", client.address),
        ], margin: [0, 0, 0, 10] },
        { columns: [
          sepaField("Code postal", client.cp, 140),
          { width: 14, text: "" },
          sepaField("Ville", client.city),
        ], margin: [0, 0, 0, 14] },

        { text: "LES COORDONNÉES DE VOTRE COMPTE", style: "h2", margin: [0, 6, 0, 6] },
        { columns: [
          sepaField("IBAN", client.iban),
        ], margin: [0, 0, 0, 10] },
        { columns: [
          sepaField("BIC", client.bic, 220),
        ], margin: [0, 0, 0, 6] },
        { text: "▸ Joindre un relevé d'identité bancaire (RIB).", fontSize: 9, italics: true, color: "#9a3412", margin: [0, 0, 0, 14] },

        { text: "ORGANISME ENCAISSEUR (CRÉANCIER)", style: "h2", margin: [0, 6, 0, 6] },
        { columns: [
          { width: "*", stack: [
            { text: "Nom du créancier", fontSize: 8.5, color: "#64748b" },
            { text: ASTORYA.raison_sociale, fontSize: 10, bold: true, margin: [0, 1, 0, 0] },
            { text: ASTORYA.adresse + " — " + ASTORYA.cp + " " + ASTORYA.ville, fontSize: 9 },
          ]},
          { width: 200, stack: [
            { text: "Identifiant Créancier SEPA (ICS)", fontSize: 8.5, color: "#64748b" },
            { text: ASTORYA.ics, fontSize: 10, bold: true, fontFamily: "Roboto", margin: [0, 1, 0, 0] },
            { text: "SIRET : " + ASTORYA.siret, fontSize: 9, color: "#475569" },
          ]},
        ], margin: [0, 0, 0, 14] },

        { text: "Je reconnais que l'établissement teneur du compte à débiter ne sera pas tenu de m'aviser de l'exécution de ces opérations. En cas de litige, je devrais régler le différend avec l'organisme encaisseur. Je ne peux refuser l'encaissement d'un prélèvement isolé.",
          fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Toute révocation du présent mandat devra impérativement être adressée au créancier par courrier recommandé avec accusé de réception.",
          fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Le signataire atteste être habilité à l'effet d'engager le débiteur au titre du présent mandat ; à défaut, il sera personnellement tenu des obligations afférentes.",
          fontSize: 9, alignment: "justify", margin: [0, 0, 0, 14] },

        { text: "SIGNATURE DU TITULAIRE DU COMPTE", style: "h2", margin: [0, 8, 0, 6] },
        { columns: [
          { width: "*", stack: [
            { text: "Nom du signataire : " + (signatory.name || "_______________________________"), fontSize: 10 },
            { text: "Qualité : " + (signatory.role || "_______________________________"), fontSize: 10, margin: [0, 4, 0, 0] },
            { text: "Fait à : __________________     Le : __________________", fontSize: 10, margin: [0, 8, 0, 12] },
            { text: "Signature et cachet :", fontSize: 9, color: "#475569" },
            { text: " ", fontSize: 36 },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.8, lineColor: "#cbd5e1" }] },
          ]},
          { width: 20, text: "" },
          { width: 200, stack: [
            { text: "Note importante", fontSize: 9.5, bold: true, color: "#c91c45" },
            { text: "Vos droits concernant le présent mandat sont expliqués dans un document que vous pouvez obtenir auprès de votre banque.",
              fontSize: 8.5, italics: true, color: "#475569", margin: [0, 4, 0, 0], alignment: "justify" },
          ]},
        ]},
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
        coutTable,
        licSupp,
        { text: "Facturation et paiement", style: "h2", margin: [0, 4, 0, 4] },
        factTable,
        periodicityBlock,
        condPartBlock,
        signBlock,
        cgvBlock,
        sepaBlock,
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
            { text: ASTORYA.raison_sociale + " · " + ASTORYA.adresse + " · " + ASTORYA.cp + " " + ASTORYA.ville + " · SIRET " + ASTORYA.siret, fontSize: 7.5, color: "#94a3b8", margin: [32, 0, 0, 8] },
            { text: "Page " + currentPage + " / " + pageCount, fontSize: 7.5, color: "#94a3b8", alignment: "right", margin: [0, 0, 32, 8] },
          ],
        };
      },
    };
  }

  async function _getPdf(payload) {
    await loadPdfMake();
    return window.pdfMake.createPdf(buildDocDefinition(payload || {}));
  }

  window.HubHostingContractPdf = {
    async preview(payload) { const pdf = await _getPdf(payload); pdf.open(); },
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
