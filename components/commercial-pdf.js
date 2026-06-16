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
    if (isBL) {
      const header = hasAnyRef
        ? [
            { text: "Article", style: "tableHeader" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "N° de série", style: "tableHeader" },
          ]
        : [
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "N° de série", style: "tableHeader" },
          ];
      tableBody.push(header);
    } else {
      const header = hasAnyRef
        ? [
            { text: "Article", style: "tableHeader" },
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "P.U. HT", style: "tableHeader", alignment: "right" },
            { text: "Montant\nHT", style: "tableHeader", alignment: "right" },
          ]
        : [
            { text: "Désignation", style: "tableHeader" },
            { text: "Qté", style: "tableHeader", alignment: "right" },
            { text: "P.U. HT", style: "tableHeader", alignment: "right" },
            { text: "Montant\nHT", style: "tableHeader", alignment: "right" },
          ];
      tableBody.push(header);
    }
    (doc.lines || []).forEach((l) => {
      if (l.is_text_only) {
        // colSpan = nombre total de colonnes - 1 (toujours laisser la première vide)
        const totalCols = (hasAnyRef ? 1 : 0) + 1 + 1 + (isBL ? 1 : 2);
        const span = totalCols - 1;
        const row = [
          { text: "", style: "tableCell" },
          { text: l.designation || "", style: "tableCell", colSpan: span, italics: true, color: "#666" },
        ];
        for (let i = 1; i < span; i++) row.push({});
        tableBody.push(row);
        return;
      }
      const desStack = [];
      desStack.push({ text: l.designation || "", style: "tableCell", bold: true });
      if (l.description && String(l.description).trim()) {
        desStack.push({ text: l.description, style: "tableCellSm", margin: [0, 2, 0, 0] });
      }
      // Si la colonne Article est masquée, on injecte la ref EN HEAD de la
      // désignation (en monospace petit, gris) pour ne pas perdre l'info.
      if (!hasAnyRef && l.ref && String(l.ref).trim() && String(l.ref).trim() !== "—") {
        desStack.unshift({ text: l.ref, style: "tableCellMono", margin: [0, 0, 0, 1] });
      }
      const qtyCell = { text: (Number(l.quantity) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }), style: "tableCell", alignment: "right" };
      if (isBL) {
        const row = hasAnyRef
          ? [{ text: l.ref || "—", style: "tableCellMono" }, { stack: desStack }, qtyCell, { text: (l.serial_number || l.sn || ""), style: "tableCellMono" }]
          : [{ stack: desStack }, qtyCell, { text: (l.serial_number || l.sn || ""), style: "tableCellMono" }];
        tableBody.push(row);
      } else {
        const row = hasAnyRef
          ? [
              { text: l.ref || "—", style: "tableCellMono" },
              { stack: desStack },
              qtyCell,
              { text: fmtEUR(l.unit_price_ht), style: "tableCell", alignment: "right" },
              { text: fmtEUR(l.total_ht), style: "tableCell", alignment: "right", bold: true },
            ]
          : [
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
    // Le logo SVG est embarqué inline (pas de dépendance asset externe).
    const logoCell = (window.AstoryaAssets && window.AstoryaAssets.logoSvg)
      ? { svg: window.AstoryaAssets.logoSvg, width: 220, fit: [220, 70], margin: [4, 8, 0, 8], alignment: "left" }
      : { svg: ASTORYA_LOGO_SVG, width: 220, height: 60, margin: [4, 8, 0, 8], alignment: "left" };
    const headerBand = {
      table: {
        widths: ["*", 220],
        body: [
          [
            logoCell,
            {
              text: typeLabel,
              fontSize: 26, bold: true, color: "#c91c45",
              alignment: "right",
              margin: [0, 24, 8, 8],
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
      ? (hasAnyRef ? [60, "*", 40, 120] : ["*", 40, 130])
      : (hasAnyRef ? [60, "*", 40, 65, 65] : ["*", 40, 65, 65]);
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
          width: 220,
          margin: [12, 18, 0, 0],
          table: {
            widths: ["*", 90],
            body: [
              [
                { text: "Total HT", bold: true, fontSize: 10, margin: [4, 6, 0, 6] },
                { text: fmtEUR(doc.total_ht), bold: true, fontSize: 10, alignment: "right", margin: [0, 6, 6, 6] },
              ],
              [
                { text: "Total TVA", bold: true, fontSize: 10, margin: [4, 6, 0, 6] },
                { text: fmtEUR(doc.total_tva), bold: true, fontSize: 10, alignment: "right", margin: [0, 6, 6, 6] },
              ],
              [
                { text: "NET A PAYER", bold: true, fontSize: 12, color: "#fff", margin: [4, 8, 0, 8], fillColor: "#0f172a" },
                { text: fmtEUR(doc.total_ttc), bold: true, fontSize: 12, alignment: "right", color: "#fff", margin: [0, 8, 6, 8], fillColor: "#0f172a" },
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
      margin: [0, 16, 0, 0],
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
      margin: [0, 16, 0, 0],
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
    // Assemblage final
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
      signatureBlock,
      contactsBlock,
      reserveBlock,
    ].filter(Boolean);

    return {
      pageSize: "A4",
      pageMargins: [28, 28, 28, 28],
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
        return {
          columns: [
            { text: "", width: "*" },
            { text: "Page " + currentPage + " / " + pageCount, fontSize: 7.5, color: "#888", alignment: "right", margin: [0, 0, 28, 8] },
          ],
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
      pm.createPdf(buildDocDefinition(d, company)).download(d.id + ".pdf");
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
