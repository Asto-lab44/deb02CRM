// ════════════════════════════════════════════════════════════════════
// contract-pdf.js — Génération PDF des contrats Astorya (multi-templates)
// ════════════════════════════════════════════════════════════════════
//
// Templates supportés :
//   - hosting       : Contrat d'Hébergement Externalisé
//   - phone         : Contrat d'Abonnement Téléphonique
//   - maintenance   : Contrat de Maintenance Informatique
//   - service       : Contrat de Service
//   - page_pack     : Contrat Page Pack (impression au volume)
//
// Architecture :
//   Un objet CONTRACT_KINDS décrit chaque template (titre, terminologie,
//   patterns SKU pour matching auto). La structure du PDF est partagée :
//   header → identification → description → tableaux → conditions
//   particulières → signature → CGV → mandat SEPA.
//
// Usage :
//   HubHostingContractPdf.preview(payload)
//   HubHostingContractPdf.download(payload, filename)
//   const blob = await HubHostingContractPdf.toBlob(payload)
//
// payload.kind = "hosting" | "phone" | "maintenance" | "service" | "page_pack"
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

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT_KINDS — registre des templates
  // ─────────────────────────────────────────────────────────────────
  const CONTRACT_KINDS = {
    hosting: {
      label: "Contrat d'Hébergement Externalisé",
      titleL1: "CONTRAT D'HÉBERGEMENT", titleL2: "EXTERNALISÉ",
      cgvTitle: "CONDITIONS GÉNÉRALES D'HÉBERGEMENT EXTERNALISÉ",
      objet: "Le présent contrat a pour objet la fourniture d'une prestation d'hébergement externalisé par ASTORYA S.G.I. à la demande du Client.",
      prestaIntro: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique sous forme d'hébergement externalisé.",
      durationOnset: "à la date d'installation de l'hébergement externalisé",
      durationPrise: "Le présent contrat est conclu pour une durée de {DUR} mois et prend effet dès sa signature ou au plus tard à la date d'installation de l'hébergement externalisé.",
      tableTitle: "Capacité du serveur souscrit",
      tableNote: "Toute augmentation du nombre d'utilisateurs ou tout ajout de licence supplémentaire à la demande du Client dans le contrat d'hébergement sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique. À défaut, et en cas de paiement par le Client des factures résultant des prestations supplémentaires, il est réputé les avoir acceptées.",
      patterns: ["HOST", "HEBE", "SERV", "TSE", "365", "EXCH", "M365"],
    },
    phone: {
      label: "Contrat d'Abonnement Téléphonique",
      titleL1: "CONTRAT D'ABONNEMENT", titleL2: "TÉLÉPHONIQUE & INTERNET",
      cgvTitle: "CONDITIONS GÉNÉRALES DE SERVICES DE TÉLÉPHONIE",
      objet: "Les présentes conditions ont pour objet de définir les obligations de chacune des Parties et les conditions dans lesquelles ASTORYA S.G.I. fournit au Client la prestation d'abonnement téléphonique souscrite par ce dernier.",
      prestaIntro: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique sous forme d'abonnement téléphonique et/ou internet à la demande du Client.",
      durationOnset: "à la date d'installation",
      durationPrise: "Le présent contrat est conclu pour une durée de {DUR} mois et prend effet dès sa signature ou au plus tard à la date d'installation.",
      tableTitle: "Abonnement(s) souscrit(s)",
      tableNote: "Tout abonnement supplémentaire à la demande du Client dans le contrat d'abonnement téléphonique sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique. À défaut, et en cas de paiement par le Client des factures résultant des prestations supplémentaires, il est réputé les avoir acceptées.",
      patterns: ["TEL", "PHONE", "ABO", "4G", "SDA", "FIBRE", "ADSL", "VDSL", "SDSL", "ANALOG", "PATTON", "FAX"],
    },
    maintenance: {
      label: "Contrat de Maintenance Informatique",
      titleL1: "CONTRAT DE MAINTENANCE", titleL2: "INFORMATIQUE",
      cgvTitle: "CONDITIONS GÉNÉRALES DE SERVICES DE MAINTENANCE INFORMATIQUE",
      objet: "Le présent contrat a pour objet la fourniture d'une prestation d'Assistance Technique par ASTORYA S.G.I. à la demande du Client.",
      prestaIntro: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique correspondant au(x) service(s) souscrit(s).",
      durationOnset: "à la date de prise en main du parc",
      durationPrise: "Le présent contrat est conclu pour une durée de {DUR} mois et prend effet dès sa signature ou au plus tard à la date de prise en main du parc.",
      tableTitle: "Niveau d'Assistance souscrit",
      tableNote: "Tout ajout de postes supplémentaires à la demande du Client dans le contrat de maintenance sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique. À défaut, et en cas de paiement par le Client des factures résultant des prestations supplémentaires, il est réputé les avoir acceptées.",
      patterns: ["MAINT", "HOTLINE", "SUPPORT", "ASSIST", "INFOG", "NAS"],
    },
    service: {
      label: "Contrat de Service",
      titleL1: "CONTRAT DE", titleL2: "SERVICE",
      cgvTitle: "CONDITIONS GÉNÉRALES DE SERVICES",
      objet: "Le présent contrat a pour objet la fourniture d'une prestation d'Assistance Technique par ASTORYA S.G.I. à la demande du Client.",
      prestaIntro: "ASTORYA S.G.I. s'engage à exécuter une prestation spécifique et technique correspondant au(x) service(s) souscrit(s).",
      durationOnset: "à la date de prise en main du parc",
      durationPrise: "Le contrat est conclu pour une durée de {DUR} mois et prend effet dès sa signature ou au plus tard à la date de prise en main du parc.",
      tableTitle: "Niveau d'Assistance souscrit",
      tableNote: "Tout ajout supplémentaire à la demande du Client sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Le Client devra adresser sa demande à ASTORYA S.G.I. par courrier électronique. À défaut, et en cas de paiement par le Client des factures résultant des prestations supplémentaires, il est réputé les avoir acceptées.",
      patterns: ["SVC", "SERV", "PREST"],
    },
    page_pack: {
      label: "Contrat Page Pack (Impression)",
      titleL1: "CONTRAT PAGE PACK", titleL2: "IMPRESSION & VOLUME",
      cgvTitle: "CONDITIONS GÉNÉRALES — CONTRAT PAGE PACK",
      objet: "Le présent contrat a pour objet la fourniture d'une prestation d'impression au coût par page (Pack), incluant la maintenance des matériels et la fourniture des consommables, à l'exception du papier.",
      prestaIntro: "ASTORYA S.G.I. s'engage à fournir au Client une prestation d'impression facturée au coût par page (Page Pack), incluant la maintenance préventive et curative des matériels désignés ainsi que la fourniture des consommables (toners, tambours, kits de maintenance), à l'exclusion du papier.",
      durationOnset: "à la date d'effet du contrat",
      durationPrise: "Le présent contrat est conclu pour une durée de {DUR} mois et prend effet à la date d'effet ci-dessus, ou au plus tard à la date d'installation des matériels.",
      tableTitle: "Matériels couverts & volume page",
      tableNote: "Tout matériel ou volume supplémentaire à la demande du Client sera facturé au prorata sans nécessité de signature d'un nouveau contrat. Toute prestation hors périmètre (changement de pièce non couvert, papier, etc.) fera l'objet d'un devis spécifique.",
      patterns: ["PAGE", "PACK", "PRINT", "COPI", "MFP", "TONER"],
      pagePackMode: true, // affiche le tableau spécial volume pages
    },
  };

  // Logo SVG fallback (commercial-pdf utilise window.AstoryaAssets.logoSvg si dispo)
  const ASTORYA_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1900 600" font-family="Helvetica, Arial, sans-serif"><circle cx="270" cy="300" r="200" fill="none" stroke="#1f2942" stroke-width="34"/><circle cx="400" cy="178" r="40" fill="#c91c45"/><text x="560" y="380" font-size="320" font-weight="900" fill="#1f2942">astorya</text></svg>';

  // ─────────────────────────────────────────────────────────────────
  // Détection automatique du template depuis la liste de produits
  // ─────────────────────────────────────────────────────────────────
  function detectKind(products) {
    if (!products || !products.length) return "service";
    // Mapping utilisateur configuré via le back office (localStorage)
    let userRules = [];
    try { userRules = JSON.parse(localStorage.getItem("hubAstorya.contract_kind_rules.v1") || "[]"); } catch (e) {}
    const scoreByKind = {};
    products.forEach((p) => {
      const hay = ((p.sku || "") + " " + (p.name || "")).toUpperCase();
      // 1. règles utilisateur
      userRules.forEach((r) => {
        if (!r.pattern || !r.kind) return;
        if (hay.indexOf(String(r.pattern).toUpperCase()) !== -1) {
          scoreByKind[r.kind] = (scoreByKind[r.kind] || 0) + 10;
        }
      });
      // 2. patterns par défaut de chaque template
      Object.keys(CONTRACT_KINDS).forEach((kind) => {
        const pats = CONTRACT_KINDS[kind].patterns || [];
        pats.forEach((pat) => {
          if (hay.indexOf(pat.toUpperCase()) !== -1) {
            scoreByKind[kind] = (scoreByKind[kind] || 0) + 1;
          }
        });
      });
    });
    const ordered = Object.keys(scoreByKind).sort((a, b) => scoreByKind[b] - scoreByKind[a]);
    return ordered[0] || "hosting";
  }

  // ─────────────────────────────────────────────────────────────────
  // Builder du docDefinition
  // ─────────────────────────────────────────────────────────────────
  function buildDocDefinition(p) {
    const client = p.client || {};
    const products = p.products || [];
    const sums = p.sums || {};
    const referent = p.referent || {};
    const signatory = p.signatory || {};
    const checked = (k) => p.billingPeriod === k ? "☒" : "☐";
    const kindKey = p.kind || detectKind(products);
    const K = CONTRACT_KINDS[kindKey] || CONTRACT_KINDS.hosting;

    // ── HEADER
    const logoBlock = (window.AstoryaAssets && window.AstoryaAssets.logoSvg)
      ? { svg: window.AstoryaAssets.logoSvg, width: 150, fit: [150, 50], border: [false, false, false, false] }
      : { svg: ASTORYA_LOGO_SVG, width: 150, fit: [150, 50], border: [false, false, false, false] };
    const headerBand = {
      table: {
        widths: [160, "*"],
        body: [[
          logoBlock,
          { stack: [
            { text: K.titleL1, fontSize: 16, bold: true, alignment: "right", color: "#0f172a" },
            { text: K.titleL2, fontSize: 16, bold: true, alignment: "right", color: "#c91c45", margin: [0, 2, 0, 0] },
            { text: "Conditions Particulières", fontSize: 9, alignment: "right", color: "#475569", margin: [0, 4, 0, 0] },
          ], border: [false, false, false, false] },
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
        { text: "Ci-après désignés ensemble « les Parties ». Les Parties sont convenues de ce qui suit.", fontSize: 8.5, italics: true, color: "#64748b", margin: [0, 10, 0, 0] },
      ],
      margin: [0, 0, 0, 12],
    };

    // ── DESCRIPTION
    const prestaBlock = {
      stack: [
        { text: "DESCRIPTION DE LA PRESTATION", style: "h1", margin: [0, 4, 0, 6] },
        { text: "Description de la prestation", style: "h2" },
        { text: K.prestaIntro, fontSize: 9.5, alignment: "justify", margin: [0, 2, 0, 6] },
        { text: K.tableTitle, style: "h2" },
        { text: "Seules les prestations mentionnées ci-dessous font partie de la prestation. Toute tâche supplémentaire devra faire l'objet d'une revalidation et d'un devis spécifique par ASTORYA S.G.I.", fontSize: 9, alignment: "justify", margin: [0, 2, 0, 4] },
        { text: K.tableNote, fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Le Client souscrit le volume suivant :", fontSize: 9.5, bold: true, margin: [0, 4, 0, 6] },
      ],
    };

    // ── TABLE PRODUITS (Page Pack a un tableau spécifique)
    let coutTable;
    if (K.pagePackMode) {
      // Page pack : tableau orienté volume pages par compteur
      const ppHeader = [
        { text: "Compteur", style: "th" },
        { text: "Volume\nannuel estimé", style: "th", alignment: "right" },
        { text: "Coût\npage HT", style: "th", alignment: "right" },
        { text: "Montant\nannuel HT", style: "th", alignment: "right" },
      ];
      const ppRows = products.map((prod) => {
        const vol = Number(prod.qty) || 0;
        const pu = Number(prod.unit) || 0;
        return [
          { stack: [
            { text: prod.name || "—", bold: true, fontSize: 9 },
            prod.sku ? { text: prod.sku, style: "tdMono", margin: [0, 1, 0, 0] } : null,
          ].filter(Boolean) },
          { text: vol.toLocaleString("fr-FR") + " pages", style: "td", alignment: "right" },
          { text: fmtEUR(pu), style: "td", alignment: "right" },
          { text: fmtEUR(vol * pu), style: "td", alignment: "right", bold: true },
        ];
      });
      coutTable = {
        table: { widths: ["*", 100, 60, 80], headerRows: 1, body: [ppHeader, ...ppRows] },
        layout: tableLayout(true),
      };
    } else {
      // Tableau classique mensuel
      const coutHeader = [
        { text: "Référence", style: "th" },
        { text: "Désignation", style: "th" },
        { text: "Qté", style: "th", alignment: "right" },
        { text: "PU mensuel HT", style: "th", alignment: "right" },
        { text: "Total mensuel HT", style: "th", alignment: "right" },
      ];
      const coutRows = products.map((prod) => {
        const gross = (Number(prod.unit) || 0) * (Number(prod.qty) || 0);
        const disc = gross * (Number(prod.discount) || 0) / 100;
        const net = gross - disc;
        const isOneshot = prod.periodicity === "oneshot";
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
      coutTable = {
        table: { widths: [60, "*", 40, 70, 70], headerRows: 1, body: [coutHeader, ...coutRows] },
        layout: tableLayout(true),
      };
    }

    // ── TABLE FACTURATION
    const factHeader = [
      { text: "Nombre", style: "th", alignment: "center" },
      { text: "Montant HT €", style: "th", alignment: "right" },
      { text: "Montant TTC €", style: "th", alignment: "right" },
      { text: "Périodicité", style: "th", alignment: "center" },
      { text: "Engagement (mois)", style: "th", alignment: "center" },
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
      layout: tableLayout(true),
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
          { width: "auto", text: checked("quarterly_due") + " Trim. terme à échoir", fontSize: 10 },
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
        { text: K.pagePackMode ? "Coût par page & volume" : "Coût mensuel", style: "h2" },
        coutTable,
        { text: "Facturation et paiement", style: "h2", margin: [0, 10, 0, 4] },
        factTable,
        periodicityBlock,
      ],
    };

    // ── CONDITIONS PARTICULIÈRES
    const condPartBlock = {
      stack: [
        { text: "CONDITIONS PARTICULIÈRES", style: "h1", margin: [0, 12, 0, 6], pageBreak: "before" },
        { text: "Site(s) couvert(s) par la prestation", style: "h2" },
        { text: "Adresse : " + (client.address || "_______________________________"), fontSize: 9.5, margin: [0, 2, 0, 2] },
        { text: ((client.cp || "______") + " " + (client.city || "______________")), fontSize: 9.5, margin: [0, 0, 0, 4] },
        { text: "Les frais de déplacement générés dans le cadre de l'exécution de la prestation sont inclus dans le contrat pour le ou les site(s) mentionné(s) ci-dessus.", fontSize: 9, italics: true, color: "#475569", alignment: "justify" },
        { text: "Durée du contrat", style: "h2", margin: [0, 12, 0, 4] },
        { text: K.durationPrise.replace("{DUR}", NUM_WORD(p.duration)) + " Échéance prévisionnelle : " + fmtDate(p.endDate) + ".", fontSize: 9.5, alignment: "justify", margin: [0, 2, 0, 4] },
        p.tacite
          ? { text: "À l'expiration de la durée d'engagement initiale, le contrat est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties trois (3) mois avant l'échéance, par lettre recommandée avec accusé de réception.", fontSize: 9.5, italics: true, color: "#475569", alignment: "justify" }
          : { text: "Tacite reconduction désactivée : le contrat prend fin de plein droit à son échéance.", fontSize: 9.5, italics: true, color: "#9a3412", alignment: "justify" },
        { text: "Personnel référent du Client", style: "h2", margin: [0, 12, 0, 4] },
        { text: "Désignation d'une ou plusieurs personnes habilitées à contacter le support ASTORYA S.G.I. et à prendre les décisions nécessaires au bon déroulement des opérations.", fontSize: 9.5, alignment: "justify", margin: [0, 0, 0, 4] },
        { text: "Nom / Prénom / Mail : " + (referent.name || "_______________________________") + "  ·  " + (referent.email || "_______________________________"), fontSize: 10, bold: true, margin: [0, 4, 0, 0] },
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

    // ── CONDITIONS GÉNÉRALES (texte commun + titre adapté au template)
    const cgvBlock = buildCgvBlock(K, kindKey);

    // ── MANDAT SEPA
    const sepaBlock = buildSepaBlock(client, signatory);

    return {
      pageSize: "A4",
      pageMargins: [32, 32, 32, 36],
      defaultStyle: { font: "Roboto", fontSize: 9.5, color: "#0f172a" },
      info: {
        title: K.label + " — " + (client.name || "Client"),
        author: ASTORYA.raison_sociale,
        subject: K.label,
      },
      content: [
        headerBand, identBlock, prestaBlock, coutTable,
        { text: "Facturation et paiement", style: "h2", margin: [0, 10, 0, 4] },
        factTable, periodicityBlock,
        condPartBlock, signBlock, cgvBlock, sepaBlock,
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

  function tableLayout(headerFill) {
    return {
      hLineWidth: (i) => i <= 1 ? 0.6 : 0.2, vLineWidth: () => 0.2,
      hLineColor: () => "#cbd5e1", vLineColor: () => "#e2e8f0",
      fillColor: (row) => headerFill && row === 0 ? "#f8fafc" : null,
      paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 6, paddingRight: () => 6,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CGV — texte intégral, partagé entre templates (titre adapté)
  // ─────────────────────────────────────────────────────────────────
  function buildCgvBlock(K, kindKey) {
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

    // Documents contractuels : titre adapté au template
    const cgvShortName = ({
      hosting: "Conditions Générales d'hébergement externalisé",
      phone: "Conditions Générales de services de Téléphonie",
      maintenance: "Conditions Générales de services de Maintenance Informatique",
      service: "Conditions Générales de services",
      page_pack: "Conditions Générales — Contrat Page Pack",
    })[kindKey] || "Conditions Générales";

    return {
      stack: [
        { text: K.cgvTitle, style: "h1", margin: [0, 0, 0, 8], pageBreak: "before" },
        article("1", "OBJET", [
          "Le Client reconnaît avoir vérifié l'adéquation du service à ses besoins et avoir reçu d'ASTORYA S.G.I. toutes les informations et conseils qui lui étaient nécessaires pour souscrire au présent engagement en connaissance de cause. En conséquence, les deux Parties ont convenu de collaborer dans les conditions ci-après définies.",
          K.objet,
          "Les présentes " + cgvShortName + " complétées par les Conditions Particulières, la proposition commerciale et éventuellement les Annexes proposées par ASTORYA S.G.I. sont applicables, à l'exclusion de toutes autres conditions et notamment celles du Client. La signature de la proposition commerciale et/ou des Conditions Particulières emporte acceptation des présentes Conditions Générales.",
        ]),
        article("2", "DOCUMENTS CONTRACTUELS", [
          "L'accord entre les Parties est constitué des documents contractuels suivants, énumérés par ordre hiérarchique décroissant :",
        ]),
        bullet([
          "Les " + cgvShortName + " (ci-après Conditions Générales)",
          "Les Conditions Particulières (ci-après Conditions Particulières) et ses éventuels avenants",
          "Les Conditions Générales de Vente",
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
          "Informer par email le Prestataire dans les 48 heures de toute modification concernant sa situation, notamment la modification de son équipement ;",
          "Fournir plus généralement à ASTORYA S.G.I. tout moyen et information nécessaires à la bonne exécution des prestations.",
        ]),
        para("ASTORYA S.G.I. se réserve le droit de vérifier si toutes les conditions nécessaires à la bonne exécution de la prestation sont réunies. Tout retard de la part du Client ou d'un tiers pourra entraîner un décalage du calendrier de réalisation des prestations. Toutes les notifications, mises en demeure et autres avis signifiés au titre du présent contrat doivent à peine de nullité être dressés par une personne habilitée et adressés aux interlocuteurs désignés de l'une ou de l'autre Partie."),
        article("4", "DURÉE", [
          "Le présent contrat entre en vigueur à la date et pour une durée prévue dans les Conditions Particulières.",
          "À l'expiration de la durée d'engagement initiale, il est renouvelé par tacite reconduction, sauf dénonciation par l'une ou l'autre des Parties, trois (3) mois avant son échéance, par lettre recommandée avec accusé de réception.",
        ]),
        article("5", "CONFIDENTIALITÉ / PROPRIÉTÉ INTELLECTUELLE / DONNÉES PERSONNELLES", [
          "Chaque Partie s'engage à tenir confidentielles les informations dont le caractère confidentiel aura été communiqué comme tel par l'autre Partie pour l'exécution du présent contrat.",
          "ASTORYA S.G.I. ne saurait être tenue pour responsable d'aucune divulgation si les éléments divulgués étaient dans le domaine public à la date de la divulgation, ou s'il en avait connaissance, ou les obtenait de tiers par des moyens légitimes.",
          "Toute révélation et/ou divulgation non autorisée par écrit pourra donner lieu à des dommages et intérêts à charge de la Partie l'ayant commise.",
          "Chacune des Parties s'engage à respecter les obligations résultant du présent article pendant toute la durée du contrat ainsi que pendant les cinq (5) ans suivant son expiration ou sa résiliation pour quelque motif que ce soit.",
          "Chacune des Parties garantit l'autre Partie du respect des obligations légales et réglementaires lui incombant au titre de la protection des données à caractère personnel, en particulier de la loi n° 78-17 du 6 janvier 1978 modifiée et du RGPD.",
        ]),
        article("6", "PERSONNEL", [
          "Le personnel d'ASTORYA S.G.I. affecté pour la réalisation des prestations, objet du présent contrat, reste sous son autorité hiérarchique et disciplinaire. ASTORYA S.G.I. assure la gestion administrative, comptable et sociale de son personnel.",
          "Toutefois, le personnel d'ASTORYA S.G.I. intervenant dans les locaux du Client est soumis à l'ensemble des règles relatives à l'hygiène et la sécurité en vigueur dans les locaux du Client.",
        ]),
        article("7", "NON SOLLICITATION DU PERSONNEL", [
          "Sauf accord donné au préalable et par écrit par l'autre Partie, chaque Partie renonce à engager ou à faire travailler, soit directement, soit indirectement, tout collaborateur d'une autre Partie, qu'il soit salarié ou non. Cette renonciation est valable pendant toute la durée des relations contractuelles augmentée de trente-six (36) mois.",
          "Dans le cas où l'une des Parties ne respecterait pas cette clause de non débauchage, elle s'engage irrévocablement à verser à la Partie ayant subi ce préjudice une indemnité forfaitaire égale à dix mille (10 000) euros par salarié concerné.",
        ]),
        article("8", "MODALITÉS DE FACTURATION ET DE PAIEMENT", []),
        subart("8.1. Tarif", [
          "Les tarifs en vigueur pour les différentes prestations proposées par ASTORYA S.G.I. sont disponibles sur les propositions commerciales. Les prix du présent contrat sont fermes pendant la durée d'engagement initiale. Sauf stipulations contraires mentionnées dans les Conditions Particulières, ce prix pourra être automatiquement réévalué entre 0,5 % et 2 %, à la date anniversaire du contrat et ce, chaque année.",
          "Toute prestation supplémentaire effectuée par ASTORYA S.G.I. à la demande du Client ne pourra être exigée gratuitement, mais devra faire l'objet d'une revalidation et d'un devis spécifique par le Prestataire, après accord des Parties. Tarif horaire : 79 € HT par heure pour une intervention sur site non justifiée.",
          "Les frais de déplacement et d'hébergement générés dans le cadre de l'exécution de la prestation sont inclus dans le contrat pour les sites mentionnés. Sauf stipulation contraire, lorsque la prestation est réalisée à plus de 25 km de Nantes, des frais de déplacement de 49 euros seront facturés au Client ; hors Loire-Atlantique la facturation des frais de déplacement se fait au réel.",
        ]),
        subart("8.2. Facturation", [
          "Afin de participer à la protection de l'environnement, ASTORYA S.G.I. adressera la ou les facture(s) relative(s) à la prestation souscrite par voie électronique exclusivement, à l'adresse mail fournie par le Client lors de la création de son compte. Au cas où le Client souhaiterait recevoir la ou les facture(s) par voie postale, il devra s'acquitter des frais de dossier et d'expédition, à hauteur de 19 € HT par trimestre.",
          "La facturation s'établit mensuellement, trimestriellement ou annuellement selon les termes définis aux Conditions Particulières.",
        ]),
        subart("8.3. Paiement", [
          "Le paiement s'effectue par prélèvement automatique à réception de la facture. Tout désaccord concernant la facturation devra être exprimé par courrier électronique à service.comptabilite@astorya.fr dans un délai de sept (7) jours calendaires.",
          "En cas d'incident de paiement, ASTORYA S.G.I. se réserve le droit de facturer au Client les frais bancaires relatifs à l'incident, dès le premier rejet de prélèvement.",
          "Le défaut total ou partiel de paiement à l'échéance entraîne de plein droit et sans mise en demeure préalable :",
        ]),
        bullet([
          "L'exigibilité immédiate de toutes les sommes restantes dues par le Client au titre du contrat ;",
          "L'application des pénalités de retard correspondant au taux directeur BCE majoré, sans que celui-ci ne puisse être inférieur à trois fois le taux d'intérêt légal en vigueur en France ;",
          "L'application d'une indemnité forfaitaire pour frais de recouvrement à hauteur de 40 € HT par facture (décret 2012-1115 du 02/10/2012) ;",
          "La suspension totale ou partielle du ou des services du Client ;",
          "Le refus de nouvelle commande ou de renouvellement de services.",
        ]),
        article("9", "RESPONSABILITÉ / ASSURANCE", []),
        subart("9.1. Responsabilité", [
          "ASTORYA S.G.I. s'engage à mettre tous les moyens en œuvre pour la réalisation de la prestation décrite dans le présent contrat.",
          "La responsabilité d'ASTORYA S.G.I. ne peut être retenue qu'en cas de faute commise par cette dernière et prouvée par le Client. Elle ne peut être recherchée si l'exécution des présentes est empêchée, limitée ou dérangée en raison de conflits sociaux, de cas fortuits, de force majeure telle que définie par l'article 1218 du Code civil, ou de fait imputable au Client ou à un tiers.",
          "Les réparations dues par ASTORYA S.G.I. correspondront au préjudice direct, personnel et certain lié à la défaillance en cause, à l'exclusion expresse de tout dommage indirect.",
          "En tout état de cause, le montant des dommages et intérêts qui pourrait être mis à la charge d'ASTORYA S.G.I. sera limité au montant total des sommes versées par le Client au titre du présent contrat.",
        ]),
        subart("9.2. Assurance", [
          "Chacune des Parties déclare être titulaire de polices d'assurance auprès d'un organisme notoirement solvable couvrant sa responsabilité civile dans le cadre du présent contrat.",
          "ASTORYA S.G.I. a notamment souscrit, en plus de l'assurance Responsabilité Civile Professionnelle obligatoire, une assurance « Data Risks ».",
        ]),
        article("10", "RÉSILIATION / SUSPENSION / LIMITATION DE SERVICE", [
          "Le Client s'engage pour la durée initiale définie au contrat. Lorsque le Client ne souhaite pas reconduire le contrat, il doit le notifier à ASTORYA S.G.I. par lettre recommandée avec accusé de réception au minimum trois (3) mois avant sa date d'échéance.",
        ]),
        subart("10.1. Résiliation par tacite reconduction", [
          "Le contrat en tacite reconduction peut être résilié par lettre recommandée avec accusé de réception en respectant un délai de préavis de trois (3) mois avant la prochaine échéance du contrat. Toute période débutée est due dans son intégralité et renouvelle le contrat pour une durée d'un an.",
        ]),
        subart("10.2. Résiliation pour faute", [
          "Si l'une des Parties n'exécute pas l'une quelconque de ses obligations contractuelles découlant du contrat pour des motifs autres qu'un cas de force majeure ou un défaut de paiement sans y remédier dans un délai de huit (8) jours calendaires suivant la réception d'une mise en demeure, la Partie non défaillante pourra résilier le contrat sans responsabilité envers la Partie défaillante.",
        ]),
        subart("10.3. Suspension de services pour défaut de paiement", [
          "En cas de non-paiement total ou partiel, ASTORYA S.G.I. se réserve le droit de suspendre l'intégralité des Services du Client, dès lors que l'encours échu du Client atteint mille euros hors taxe (1 000,00 € HT). ASTORYA S.G.I. s'engage à effectuer au préalable au minimum deux relances auprès du Client par mail ou téléphone.",
          "À l'expiration d'un délai d'un (1) mois faisant suite à cette suspension restée sans effet, le contrat est résilié de plein droit et sans formalité préalable.",
        ]),
        subart("10.4. Révision des prix", [
          "Les prix sont indexés sur l'indice Syntec selon la formule suivante : P = P0 × Sn / S0, où P = nouveau prix, P0 = ancien prix, Sn = indice Syntec connu au mois « n » de la révision, S0 = indice Syntec en vigueur à la date de signature du Contrat ou lors de la révision précédente.",
        ]),
        article("11", "GÉNÉRALITÉS", []),
        subart("11.1. Divisibilité", [
          "La nullité d'une des clauses du contrat n'entraînera pas la nullité des autres clauses qui garderont leur plein effet et portée.",
        ]),
        subart("11.2. Tolérance", [
          "Toute tolérance ou renonciation de l'une des Parties dans l'application de tout ou partie des engagements prévus au contrat ne peut être interprétée comme une renonciation à faire valoir les droits en cause.",
        ]),
        subart("11.3. Référence publicité", [
          "ASTORYA S.G.I. pourra se prévaloir des services fournis au Client sur ses documents commerciaux et/ou sa plaquette.",
        ]),
        article("12", "LOI ET ATTRIBUTION DE COMPÉTENCE", [
          "Le présent contrat est soumis au droit français.",
          "Les Parties conviennent de rechercher une solution amiable à toute difficulté qui pourrait intervenir à propos de l'application ou de l'interprétation des clauses contractuelles. Dans l'hypothèse où les différends persisteraient, les litiges seront portés devant le Tribunal de Commerce de Nantes.",
        ]),
        article("13", "TRAITEMENT DES DONNÉES À CARACTÈRE PERSONNEL", [
          "Les Parties s'engagent à respecter les dispositions légales et réglementaires en vigueur relatives à l'informatique, aux fichiers et aux libertés, notamment la loi n° 78-17 du 6 janvier 1978 modifiée et le RGPD.",
          "Le Client demeure seul responsable des traitements de données à caractère personnel réalisés pour son propre compte. ASTORYA S.G.I. agit en qualité de sous-traitant sur seules instructions du Client.",
          "L'ensemble des données d'hébergement de la société ASTORYA S.G.I. sont situées en France. Les données traitées sont conservées par ASTORYA S.G.I. pendant toute la durée du Contrat et les trente-six (36) mois suivants.",
          "Conformément à la loi « Informatique et Libertés », le Client bénéficie d'un droit d'accès, de rectification et de suppression des informations le concernant. Il peut exercer ce droit par courriel à hotline@astorya.fr.",
        ]),
        { text: "— Fin des Conditions Générales —", fontSize: 9, italics: true, color: "#94a3b8", alignment: "center", margin: [0, 10, 0, 0] },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // MANDAT SEPA
  // ─────────────────────────────────────────────────────────────────
  function buildSepaBlock(client, signatory) {
    const sepaField = (label, value, width) => ({
      width: width || "*",
      stack: [
        { text: label, fontSize: 8.5, color: "#64748b", margin: [0, 0, 0, 2] },
        { text: value || "_______________________________", fontSize: 10, bold: true },
        { canvas: [{ type: "line", x1: 0, y1: 2, x2: 200, y2: 2, lineWidth: 0.4, lineColor: "#cbd5e1" }] },
      ],
    });
    return {
      stack: [
        { text: "MANDAT DE PRÉLÈVEMENT SEPA", style: "h1", margin: [0, 0, 0, 8], pageBreak: "before", alignment: "center" },
        { text: "Référence Unique du Mandat (RUM) : __________________________________     Type : ☒ Récurrent   ☐ Ponctuel",
          fontSize: 9, color: "#475569", margin: [0, 0, 0, 10], alignment: "center" },
        { text: "En signant ce formulaire de mandat, vous autorisez le créancier à envoyer des instructions à votre banque pour débiter votre compte et vous autorisez votre banque à débiter votre compte conformément aux instructions du créancier.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 4] },
        { text: "Vous bénéficiez du droit d'être remboursé par votre banque selon les conditions décrites dans la convention que vous avez passée avec elle. Une demande de remboursement doit être présentée dans les 8 semaines suivant la date de débit de votre compte pour un prélèvement autorisé.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 14] },

        { text: "VOS COORDONNÉES (DÉBITEUR)", style: "h2", margin: [0, 6, 0, 6] },
        { columns: [ sepaField("Raison sociale", client.name) ], margin: [0, 0, 0, 10] },
        { columns: [ sepaField("SIREN", client.siren), { width: 14, text: "" }, sepaField("Téléphone", client.tel) ], margin: [0, 0, 0, 10] },
        { columns: [ sepaField("Adresse", client.address) ], margin: [0, 0, 0, 10] },
        { columns: [ sepaField("Code postal", client.cp, 140), { width: 14, text: "" }, sepaField("Ville", client.city) ], margin: [0, 0, 0, 14] },

        { text: "LES COORDONNÉES DE VOTRE COMPTE", style: "h2", margin: [0, 6, 0, 6] },
        { columns: [ sepaField("IBAN", client.iban) ], margin: [0, 0, 0, 10] },
        { columns: [ sepaField("BIC", client.bic, 220) ], margin: [0, 0, 0, 6] },
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
            { text: ASTORYA.ics, fontSize: 10, bold: true, margin: [0, 1, 0, 0] },
            { text: "SIRET : " + ASTORYA.siret, fontSize: 9, color: "#475569" },
          ]},
        ], margin: [0, 0, 0, 14] },

        { text: "Je reconnais que l'établissement teneur du compte à débiter ne sera pas tenu de m'aviser de l'exécution de ces opérations. En cas de litige, je devrais régler le différend avec l'organisme encaisseur.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Toute révocation du présent mandat devra impérativement être adressée au créancier par courrier recommandé avec accusé de réception.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 6] },
        { text: "Le signataire atteste être habilité à l'effet d'engager le débiteur au titre du présent mandat ; à défaut, il sera personnellement tenu des obligations afférentes.", fontSize: 9, alignment: "justify", margin: [0, 0, 0, 14] },

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
  }

  // ─────────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────────
  async function _getPdf(payload) {
    await loadPdfMake();
    return window.pdfMake.createPdf(buildDocDefinition(payload || {}));
  }

  window.HubHostingContractPdf = {
    KINDS: CONTRACT_KINDS,
    detectKind,
    async preview(payload) { const pdf = await _getPdf(payload); pdf.open(); },
    async download(payload, filename) {
      const pdf = await _getPdf(payload);
      const k = (payload && payload.kind) || detectKind(payload && payload.products);
      const lbl = (CONTRACT_KINDS[k] && CONTRACT_KINDS[k].label) || "Contrat";
      // Format : « <Type contrat> <Réf> <Nom client>.pdf »
      // ex. « Contrat d'Hébergement Externalisé CTR-2026-0042 ASTORYA SGI.pdf »
      const clean = (s) => String(s || "").trim().replace(/[\/\\:*?"<>|]+/g, "_").replace(/\s+/g, " ");
      const ref = clean((payload && payload.ref) || (payload && payload.id) || "");
      const client = clean((payload && payload.client && payload.client.name) || "client");
      const name = filename || (clean(lbl) + (ref ? " " + ref : "") + " " + client + ".pdf");
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
  // Alias plus explicite
  window.HubContractPdf = window.HubHostingContractPdf;
})();
