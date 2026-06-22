// ════════════════════════════════════════════════════════════════════
// commercial-pdf.js — Renderer PDF pour les documents commerciaux
// Reproduit la maquette du devis Astorya (DF4949) avec pdfmake.
// ════════════════════════════════════════════════════════════════════
//
// Usage :
//   await HubCommercialPdf.preview(doc)              // ouvre l'aperçu dans un onglet
//   const blob = await HubCommercialPdf.toBlob(doc)  // → Blob pour upload/email
//   await HubCommercialPdf.download(doc)             // déclenche un téléchargement
//
// Le `doc` est l'objet retourné par api.commercialDocs.getById() (avec lines).
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ───── HTML → pdfmake inlines (gras, italique, souligné, couleurs)
  function htmlDescToInlines(html) {
    if (html == null) return "";
    const s = String(html);
    if (!/<[a-z][\s\S]*?>/i.test(s)) return s; // texte brut, pas de balises
    const root = document.createElement("div");
    root.innerHTML = s;
    const out = [];
    function pushNewlineIfNeeded(style) {
      if (out.length === 0) return;
      const prev = out[out.length - 1];
      if (typeof prev === "object" && prev.text === "\n") return;
      out.push({ text: "\n", ...(style || {}) });
    }
    function walk(node, style) {
      if (node.nodeType === 3) {
        const t = node.nodeValue;
        if (t == null || t === "") return;
        out.push({ text: t.replace(/ /g, " "), ...style });
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (tag === "br") { out.push({ text: "\n", ...style }); return; }
      const s2 = { ...style };
      if (tag === "b" || tag === "strong") s2.bold = true;
      if (tag === "i" || tag === "em") s2.italics = true;
      if (tag === "u") s2.decoration = "underline";
      const inlineColor = node.style && node.style.color;
      if (inlineColor) {
        const rgb = inlineColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgb) {
          s2.color = "#" + [rgb[1], rgb[2], rgb[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
        } else {
          s2.color = inlineColor;
        }
      }
      const attrColor = node.getAttribute && node.getAttribute("color");
      if (attrColor) s2.color = attrColor;
      const isBlock = (tag === "div" || tag === "p" || tag === "li");
      if (isBlock) pushNewlineIfNeeded(style);
      for (const c of node.childNodes) walk(c, s2);
      if (isBlock) pushNewlineIfNeeded(style);
    }
    for (const c of root.childNodes) walk(c, {});
    while (out.length && typeof out[0] === "object" && out[0].text === "\n") out.shift();
    while (out.length && typeof out[out.length - 1] === "object" && out[out.length - 1].text === "\n") out.pop();
    return out.length === 1 && typeof out[0] === "object" && !out[0].bold && !out[0].italics && !out[0].decoration && !out[0].color
      ? out[0].text
      : out;
  }

  // ───── Logo Astorya — SVG inline, embarqué dans l'en-tête des PDFs.
  // Sphère 3D rouge + "astorya" italique + "solution globale informatique".
  const ASTORYA_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" font-family="Helvetica, Arial, sans-serif"><defs><radialGradient id="aSphere" cx="35%" cy="32%" r="68%"><stop offset="0%" stop-color="#f5d1d8"/><stop offset="22%" stop-color="#e8a5b2"/><stop offset="55%" stop-color="#c91c45"/><stop offset="100%" stop-color="#7a1126"/></radialGradient></defs><circle cx="165" cy="165" r="148" fill="url(#aSphere)"/><ellipse cx="120" cy="105" rx="55" ry="35" fill="#ffffff" opacity="0.45"/><text x="390" y="200" font-size="220" font-weight="500" font-style="italic" fill="#c91c45" letter-spacing="-4">astorya</text><text x="400" y="280" font-size="44" font-weight="700" fill="#252e44" letter-spacing="1">solution globale informatique</text></svg>';

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

  // Format euro 2 décimales en locale fr-FR (séparateur décimal = virgule).
  // Construit le nom de fichier au format : « <numéro pièce> <nom client>.pdf »
  // ex. « DEV-2026-0018 ASTORYA SGI.pdf »
  // Remplace les caractères interdits par OS (/, \, :, *, ?, ", <, >, |) par "_".
  function buildFilename(d) {
    const cleanPart = (s) => String(s || "").trim().replace(/[\/\\:*?"<>|]+/g, "_").replace(/\s+/g, " ");
    const docNum = cleanPart(d.id || "DOC");
    const client = cleanPart(d.client_name || (d.data && d.data.client_name) || "");
    const base = client ? (docNum + " " + client) : docNum;
    return base + ".pdf";
  }

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (s) => {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const TYPE_LABEL = { devis: "DEVIS", commande: "COMMANDE", bl: "BON DE LIVRAISON", facture: "FACTURE", avoir: "AVOIR", commande_achat: "COMMANDE D'ACHAT" };
  const TYPE_PREFIX_LABEL = { devis: "Devis", commande: "Commande", bl: "Bon de livraison", facture: "Facture", avoir: "Avoir", commande_achat: "Commande d'achat" };

  /** Construit le docDefinition pdfmake à partir du doc + settings société. */
  function buildDocDefinition(doc, company) {
    const typeLabel = TYPE_LABEL[doc.type] || "DOCUMENT";
    const typePrefixLabel = TYPE_PREFIX_LABEL[doc.type] || "Document";
    // BL : le bon de livraison reprend la mise en forme du devis SANS les
    // informations tarifaires (pas de PU, pas de montant, pas de TVA, pas de net à payer).
    const isBL = doc.type === "bl";

    // ───── Lignes du tableau
    // Si AUCUNE ligne n'a de référence article (ref), on masque la colonne
    // « Article » et on récupère sa place pour la désignation. Évite d'avoir
    // une colonne de « — » sur toute la hauteur du tableau.
    const hasAnyRef = (doc.lines || []).some((l) => l.ref && String(l.ref).trim() && String(l.ref).trim() !== "—");
    const tableBody = [];
    // Colonne « N° » TOUJOURS présente en tête : numéro de ligne (position).
    if (isBL) {
      const header = hasAnyRef
        ? [
            { text: "N°", style: "tableHeader", alignment: "center" },
            { text: "Article", style: "tableHeader" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "N° de série", style: "tableHeader" },
          ]
        : [
            { text: "N°", style: "tableHeader", alignment: "center" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "N° de série", style: "tableHeader" },
          ];
      tableBody.push(header);
    } else {
      const header = hasAnyRef
        ? [
            { text: "N°", style: "tableHeader", alignment: "center" },
            { text: "Article", style: "tableHeader" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "P.U. HT", style: "tableHeader", alignment: "right" },
            { text: "Montant\nHT", style: "tableHeader", alignment: "right" },
          ]
        : [
            { text: "N°", style: "tableHeader", alignment: "center" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "P.U. HT", style: "tableHeader", alignment: "right" },
            { text: "Montant\nHT", style: "tableHeader", alignment: "right" },
          ];
      tableBody.push(header);
    }
    let position = 0;
    (doc.lines || []).forEach((l) => {
      if (l.is_text_only) {
        // colSpan = nombre total de colonnes - 1 (laisse la 1ʳᵉ vide)
        const totalCols = 1 /*N°*/ + (hasAnyRef ? 1 : 0) + 1 + 1 + (isBL ? 1 : 2);
        const span = totalCols - 1;
        const row = [
          { text: "", style: "tableCell" },
          { text: l.designation || "", style: "tableCell", colSpan: span, italics: true, color: "#666" },
        ];
        for (let i = 1; i < span; i++) row.push({});
        tableBody.push(row);
        return;
      }
      position++;
      const numCell = { text: String(position), style: "tableCellMono", alignment: "center", bold: true };
      const desStack = [];
      desStack.push({ text: l.designation || "", style: "tableCell", bold: true });
      if (l.description && String(l.description).replace(/<[^>]*>/g, "").trim()) {
        desStack.push({ text: htmlDescToInlines(l.description), style: "tableCellSm", margin: [0, 2, 0, 0] });
      }
      // Si la colonne Article est masquée, on injecte la ref EN HEAD de la désignation.
      if (!hasAnyRef && l.ref && String(l.ref).trim() && String(l.ref).trim() !== "—") {
        desStack.unshift({ text: l.ref, style: "tableCellMono", margin: [0, 0, 0, 1] });
      }
      const qtyCell = { text: (Number(l.quantity) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }), style: "tableCell", alignment: "right" };
      if (isBL) {
        const row = hasAnyRef
          ? [numCell, { text: l.ref || "—", style: "tableCellMono" }, { stack: desStack }, qtyCell, { text: (l.serial_number || l.sn || ""), style: "tableCellMono" }]
          : [numCell, { stack: desStack }, qtyCell, { text: (l.serial_number || l.sn || ""), style: "tableCellMono" }];
        tableBody.push(row);
      } else {
        const row = hasAnyRef
          ? [
              numCell,
              { text: l.ref || "—", style: "tableCellMono" },
              { stack: desStack },
              qtyCell,
              { text: fmtEUR(l.unit_price_ht), style: "tableCell", alignment: "right" },
              { text: fmtEUR(l.total_ht), style: "tableCell", alignment: "right", bold: true },
            ]
          : [
              numCell,
              { stack: desStack },
              qtyCell,
              { text: fmtEUR(l.unit_price_ht), style: "tableCell", alignment: "right" },
              { text: fmtEUR(l.total_ht), style: "tableCell", alignment: "right", bold: true },
            ];
        tableBody.push(row);
      }
    });

    // ───── Récap TVA par taux
    const tvaMap = {};
    (doc.lines || []).forEach((l) => {
      if (l.is_text_only) return;
      const rate = Number(l.tva_rate) || 0;
      const ht = Number(l.total_ht) || 0;
      const tva = Number(l.total_tva) || 0;
      if (!tvaMap[rate]) tvaMap[rate] = { rate, ht: 0, tva: 0 };
      tvaMap[rate].ht += ht;
      tvaMap[rate].tva += tva;
    });
    const tvaRows = Object.values(tvaMap).map((t, i) => [
      { text: String(i + 1), style: "tvaCell" },
      { text: fmtEUR(t.ht), style: "tvaCell", alignment: "right" },
      { text: fmtEUR(t.rate), style: "tvaCell", alignment: "right" },
      { text: fmtEUR(t.tva), style: "tvaCell", alignment: "right" },
    ]);
    if (tvaRows.length === 0) {
      tvaRows.push([{ text: "—", colSpan: 4, alignment: "center", style: "tvaCell", color: "#999" }, {}, {}, {}]);
    }

    // ───── Bloc client (haut droite)
    const clientLines = [];
    if (doc.client_name) clientLines.push({ text: doc.client_name, bold: true, fontSize: 12 });
    if (doc.client_address) clientLines.push({ text: doc.client_address, fontSize: 9 });
    if (doc.client_cp || doc.client_city) clientLines.push({ text: (doc.client_cp || "") + " " + (doc.client_city || ""), fontSize: 9 });
    if (doc.client_siren) clientLines.push({ text: "SIREN : " + doc.client_siren, fontSize: 8, color: "#666", margin: [0, 4, 0, 0] });
    if (doc.client_tva) clientLines.push({ text: "TVA : " + doc.client_tva, fontSize: 8, color: "#666" });

    // ───── Bloc société émettrice (gauche, sous le bandeau)
    const companyBlock = {
      columns: [
        {
          width: "*",
          stack: [
            { text: company.raison_sociale || "ASTORYA", bold: true, fontSize: 10 },
            { text: company.adresse || "", fontSize: 8.5 },
            { text: ((company.cp || "") + " " + (company.ville || "")).trim(), fontSize: 8.5 },
            { text: company.email || "", fontSize: 8.5, margin: [0, 2, 0, 0] },
          ],
        },
        {
          width: "auto",
          stack: [
            { text: "Tel             : " + (company.tel || ""), fontSize: 8.5 },
            { text: "Site internet   : " + (company.site_web || ""), fontSize: 8.5 },
            { text: "Siret           : " + (company.siret || ""), fontSize: 8.5 },
            { text: "Capital         : " + fmtEUR(company.capital_eur || 0) + "€", fontSize: 8.5 },
          ],
        },
      ],
      margin: [0, 18, 0, 14],
    };

    // ───── Bandeau header : logo Astorya à gauche, titre type à droite
    // Logo : fit augmenté à [300, 85] pour éviter la coupe de "informatique".
    const logoCell = (window.AstoryaAssets && window.AstoryaAssets.logoSvg)
      ? { svg: window.AstoryaAssets.logoSvg, fit: [240, 55], margin: [4, 4, 0, 4], alignment: "left" }
      : { svg: ASTORYA_LOGO_SVG, fit: [240, 55], margin: [4, 4, 0, 4], alignment: "left" };
    const headerBand = {
      table: {
        widths: ["*", 140],
        body: [
          [
            logoCell,
            {
              text: typeLabel,
              fontSize: 22, bold: true, color: "#c91c45",
              alignment: "right",
              margin: [0, 16, 4, 4],
            },
          ],
        ],
      },
      layout: {
        fillColor: () => "#ffffff",
        hLineWidth: (i, node) => (i === node.table.body.length ? 2 : 0),
        vLineWidth: () => 0,
        hLineColor: () => "#c91c45",
        paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
      },
    };

    // ───── Bloc Date / N° / Validité
    const metaRow = {
      columns: [
        { text: "Date : " + fmtDate(doc.doc_date), fontSize: 10, bold: true },
        { text: typePrefixLabel + " N° " + doc.id, fontSize: 11, bold: true, alignment: "center" },
        {
          text: doc.type === "devis" ? ("Validité : " + (doc.valid_until ? fmtDate(doc.valid_until) : "—"))
              : doc.type === "facture" ? ("Échéance : " + (doc.payment_due ? fmtDate(doc.payment_due) : "—"))
              : "",
          fontSize: 10, bold: true, alignment: "right",
        },
      ],
      margin: [0, 0, 0, 12],
    };

    // ───── Tableau lignes
    // Widths adaptés à la présence ou non de la colonne Article
    const linesWidths = isBL
      ? (hasAnyRef ? [25, 60, "*", 40, 110] : [25, "*", 40, 120])
      : (hasAnyRef ? [25, 60, "*", 40, 65, 65] : [25, "*", 40, 65, 65]);
    const linesTable = {
      table: {
        headerRows: 1,
        widths: linesWidths,
        body: tableBody,
      },
      layout: {
        hLineWidth: (i) => (i === 0 || i === 1 ? 0.5 : 0.2),
        vLineWidth: () => 0,
        hLineColor: () => "#cbd5e1",
        fillColor: (row) => (row === 0 ? "#f8fafc" : null),
        paddingTop: () => 6, paddingBottom: () => 6,
        paddingLeft: () => 6, paddingRight: () => 6,
      },
    };

    // ───── Totaux (récap TVA + Total HT/TVA/NET A PAYER)
    // unbreakable : pdfmake garde tout le bloc sur la même page (évite que
    // le « NET A PAYER » se retrouve seul sur la page suivante).
    const totalsBlock = {
      unbreakable: true,
      columns: [
        {
          width: "*",
          margin: [0, 18, 0, 0],
          table: {
            widths: [25, 60, 50, 60],
            body: [
              [
                { text: "Code", style: "tvaHead" },
                { text: "Base HT", style: "tvaHead", alignment: "right" },
                { text: "Taux TVA", style: "tvaHead", alignment: "right" },
                { text: "Montant TVA", style: "tvaHead", alignment: "right" },
              ],
              ...tvaRows,
            ],
          },
          layout: {
            hLineWidth: (i) => (i === 0 ? 0.6 : 0.2),
            vLineWidth: () => 0.2,
            hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1",
            fillColor: (row) => (row === 0 ? "#f1f5f9" : null),
            paddingTop: () => 4, paddingBottom: () => 4,
            paddingLeft: () => 5, paddingRight: () => 5,
          },
        },
        {
          width: 180,
          margin: [12, 18, 0, 0],
          table: {
            widths: ["*", 72],
            body: [
              [
                { text: "Total HT", bold: true, fontSize: 9, margin: [3, 3, 0, 3] },
                { text: fmtEUR(doc.total_ht), bold: true, fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
              ],
              [
                { text: "Total TVA", bold: true, fontSize: 9, margin: [3, 3, 0, 3] },
                { text: fmtEUR(doc.total_tva), bold: true, fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
              ],
              [
                { text: "NET A PAYER", bold: true, fontSize: 10.5, color: "#fff", margin: [3, 5, 0, 5], fillColor: "#0f172a" },
                { text: fmtEUR(doc.total_ttc), bold: true, fontSize: 10.5, alignment: "right", color: "#fff", margin: [0, 5, 4, 5], fillColor: "#0f172a" },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.3, vLineWidth: () => 0.3,
            hLineColor: () => "#0f172a", vLineColor: () => "#0f172a",
            fillColor: (row) => (row === 2 ? "#0f172a" : null),
          },
        },
      ],
    };

    // ───── Bloc bas : signature + coordonnées bancaires (selon type)
    const signatureBlock = isBL ? {
      margin: [0, 0, 0, 8],
      columns: [
        {
          width: "*",
          stack: [
            { text: "Livraison effectuée par : " + (doc.owner || "—"), bold: true, fontSize: 10, margin: [0, 0, 0, 12] },
            { text: "Lieu de livraison", bold: true, fontSize: 9 },
            { text: (doc.delivery_address || doc.client_address || "—"), fontSize: 8.5 },
            { text: ((doc.delivery_cp || doc.client_cp || "") + " " + (doc.delivery_city || doc.client_city || "")).trim(), fontSize: 8.5 },
          ],
        },
        {
          width: 240,
          stack: [
            { text: "Reçu et vérifié par le client :", bold: true, fontSize: 10 },
            { text: " ", fontSize: 16 },
            { text: "Nom :", fontSize: 9, margin: [0, 8, 0, 0] },
            { text: " ", fontSize: 14 },
            { text: "Date :", fontSize: 9 },
            { text: " ", fontSize: 14 },
            { text: "Signature :", fontSize: 9 },
          ],
        },
      ],
    } : {
      margin: [0, 0, 0, 8],
      columns: [
        {
          width: "*",
          stack: [
            { text: typePrefixLabel + " suivi par : " + (doc.owner || "—"), bold: true, fontSize: 10, margin: [0, 0, 0, 12] },
            { text: "Nos coordonnées bancaires", bold: true, fontSize: 9 },
            { text: "IBAN  : " + (company.iban || "—"), fontSize: 8.5 },
            { text: "BIC   : " + (company.bic || "—"), fontSize: 8.5 },
          ],
        },
        {
          width: 240,
          stack: [
            { text: doc.payment_terms_label || company.conditions_paiement_default || "", fontSize: 9, italics: true, margin: [0, 0, 0, 10] },
            { text: "Bon pour accord :", bold: true, fontSize: 10 },
            { text: " ", fontSize: 16 },
            { text: "Le :", bold: true, fontSize: 10, margin: [0, 14, 0, 0] },
          ],
        },
      ],
    };

    // ───── Bas de page : 3 contacts (Commercial / Admin / Compta)
    const contactsBlock = {
      margin: [0, 24, 0, 0],
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            { text: "Service Commercial", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
            { text: "Administratif", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
            { text: "Comptabilité", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
          ],
          [
            { text: company.contact_commercial_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
            { text: company.contact_admin_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
            { text: company.contact_compta_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
          ],
          [
            { text: company.contact_commercial_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
            { text: company.contact_admin_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
            { text: company.contact_compta_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
          ],
          [
            { text: company.contact_commercial_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
            { text: company.contact_admin_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
            { text: company.contact_compta_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
          ],
        ],
      },
    };

    // ───── Mention bas de page (réserve de propriété)
    const reserveBlock = {
      text: company.mention_reserve_propriete || "",
      fontSize: 6.5,
      color: "#555",
      italics: true,
      margin: [0, 14, 0, 0],
    };

    // ───── Notes du document (si présentes)
    const notesBlock = doc.notes ? {
      margin: [0, 14, 0, 0],
      stack: [
        { text: doc.notes, fontSize: 9, italics: true, color: "#333" },
      ],
    } : null;

    // ─────────────────────────────────────────────────────────────────
    // Assemblage final — body contient l'en-tête + lignes + totaux + signature.
    // Le footer (contacts + réserve de propriété + n° de page) s'affiche
    // automatiquement en bas de chaque page : c'est pdfmake qui gère le
    // positionnement, donc le bandeau de bas de page suit toujours le
    // contenu, quel que soit le nombre d'articles.
    // ─────────────────────────────────────────────────────────────────
    const content = [
      headerBand,
      // Bloc client en haut droite (positionné absolu via colonnes)
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 230,
            stack: clientLines,
            margin: [0, 8, 0, 0],
          },
        ],
      },
      companyBlock,
      metaRow,
      linesTable,
      notesBlock || { text: " " },
      isBL ? null : totalsBlock,
      // signatureBlock retiré du body → maintenant dans le footer
      // uniquement sur la dernière page (voir footer callback).
    ].filter(Boolean);

    // Hauteur réservée au footer :
    //  - Pages intermédiaires : contacts (~70) + réserve (~25) + pagination ≈ 110px
    //  - Dernière page : + signature block (~95px) ≈ 205px
    // On dimensionne au max pour que pdfmake ne tronque pas la dernière page.
    const FOOTER_HEIGHT = 210;

    return {
      pageSize: "A4",
      pageMargins: [28, 28, 28, FOOTER_HEIGHT],
      defaultStyle: { font: "Roboto", fontSize: 9, color: "#0f172a" },
      content,
      styles: {
        tableHeader:  { bold: true, fontSize: 9, color: "#0f172a" },
        tableCell:    { fontSize: 9 },
        tableCellSm:  { fontSize: 8, color: "#475569" },
        tableCellMono:{ fontSize: 8, color: "#3730a3" },
        tvaHead:      { bold: true, fontSize: 8.5, color: "#475569" },
        tvaCell:      { fontSize: 8.5 },
      },
      footer: function (currentPage, pageCount) {
        // Footer = signature (dernière page uniquement) + contacts + réserve
        // + pagination → rendu en bas de chaque page. Sur la dernière page on
        // ajoute le bloc "<type> suivi par + coordonnées bancaires / Bon pour
        // accord" pour le coller en bas de page (au lieu de flotter au milieu
        // sur les docs courts).
        const isLastPage = currentPage === pageCount;
        return {
          margin: [28, 0, 28, 8],
          stack: [
            // Bloc signature (seulement dernière page)
            isLastPage ? signatureBlock : null,
            // Contacts : 3 colonnes Commercial / Admin / Compta (sans bordures
            // gauche/droite, séparateur fin en haut)
            {
              table: {
                widths: ["*", "*", "*"],
                body: [
                  [
                    { text: "Service Commercial", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
                    { text: "Administratif", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
                    { text: "Comptabilité", bold: true, fontSize: 9, alignment: "center", border: [false, true, false, false], borderColor: "#0f172a" },
                  ],
                  [
                    { text: company.contact_commercial_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
                    { text: company.contact_admin_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
                    { text: company.contact_compta_nom || "—", fontSize: 9, alignment: "center", border: [false, false, false, false] },
                  ],
                  [
                    { text: company.contact_commercial_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
                    { text: company.contact_admin_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
                    { text: company.contact_compta_tel || "", fontSize: 8.5, alignment: "center", color: "#555", border: [false, false, false, false] },
                  ],
                  [
                    { text: company.contact_commercial_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
                    { text: company.contact_admin_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
                    { text: company.contact_compta_email || "", fontSize: 8.5, alignment: "center", color: "#3730a3", border: [false, false, false, false] },
                  ],
                ],
              },
              layout: {
                paddingTop: () => 2, paddingBottom: () => 2,
                paddingLeft: () => 4, paddingRight: () => 4,
              },
            },
            // Mention réserve de propriété (chiquotée si présente)
            company.mention_reserve_propriete ? {
              text: company.mention_reserve_propriete,
              fontSize: 6.5,
              color: "#555",
              italics: true,
              margin: [0, 6, 0, 0],
            } : null,
            // Pagination
            {
              columns: [
                { text: "", width: "*" },
                { text: "Page " + currentPage + " / " + pageCount, fontSize: 7.5, color: "#888", alignment: "right", margin: [0, 4, 0, 0] },
              ],
            },
          ].filter(Boolean),
        };
      },
      info: {
        title: doc.id,
        author: company.raison_sociale || "Astorya",
        subject: typePrefixLabel + " " + doc.id,
      },
    };
  }

  async function _resolveDoc(doc) {
    let resolved = doc;
    if (typeof doc === "string") {
      resolved = await window.api.commercialDocs.getById(doc);
      if (!resolved) throw new Error("Document introuvable");
    }
    const company = await window.api.commercialCompany.get();
    // Résolution du libellé conditions de paiement (depuis payment_terms_id)
    if (resolved.payment_terms_id && !resolved.payment_terms_label) {
      try {
        const terms = await window.api.commercialRefs.paymentTerms();
        const found = (terms || []).find((t) => t.id === resolved.payment_terms_id);
        if (found) resolved = { ...resolved, payment_terms_label: found.label };
      } catch (e) {}
    }
    return { doc: resolved, company };
  }

  const HubCommercialPdf = {
    async preview(doc) {
      const pm = await loadPdfMake();
      const { doc: d, company } = await _resolveDoc(doc);
      pm.createPdf(buildDocDefinition(d, company)).open();
    },
    async download(doc) {
      const pm = await loadPdfMake();
      const { doc: d, company } = await _resolveDoc(doc);
      pm.createPdf(buildDocDefinition(d, company)).download(buildFilename(d));
    },
    async toBlob(doc) {
      const pm = await loadPdfMake();
      const { doc: d, company } = await _resolveDoc(doc);
      return new Promise((resolve) => {
        pm.createPdf(buildDocDefinition(d, company)).getBlob(resolve);
      });
    },
    async toBase64(doc) {
      const pm = await loadPdfMake();
      const { doc: d, company } = await _resolveDoc(doc);
      return new Promise((resolve) => {
        pm.createPdf(buildDocDefinition(d, company)).getBase64(resolve);
      });
    },
  };

  window.HubCommercialPdf = HubCommercialPdf;
})();
