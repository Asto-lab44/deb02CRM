// ════════════════════════════════════════════════════════════════════
// Comptabilite — Module comptable (partie double) : Balance, Écritures,
// Grand livre, Plan comptable, génération auto depuis les ventes, export FEC.
//
// S'appuie sur window.api.accounting (voir components/api.js, §Comptabilité).
// Les écritures sont générées depuis les factures / avoirs / règlements, ou
// saisies à la main. Le FEC (Fichier des Écritures Comptables, format DGFiP)
// est exporté en .txt (18 colonnes, tabulations).
// ════════════════════════════════════════════════════════════════════
var Comptabilite = () => {
  var fmtEUR = window.HubConstants && window.HubConstants.fmtEUR || (n => (Number(n) || 0).toFixed(2) + " €");
  var A = window.api && window.api.accounting;
  var thisYear = new Date().getFullYear();
  var [tab, setTab] = React.useState("balance");
  var [from, setFrom] = React.useState(thisYear + "-01-01");
  var [to, setTo] = React.useState(thisYear + "-12-31");
  var [loading, setLoading] = React.useState(true);
  var [busy, setBusy] = React.useState("");
  var [entries, setEntries] = React.useState([]);
  var [balance, setBalance] = React.useState([]);
  var [accounts, setAccounts] = React.useState([]);
  var [journals, setJournals] = React.useState([]);
  var [ledgerAcc, setLedgerAcc] = React.useState("411000");
  var [ledger, setLedger] = React.useState([]);
  var [vat, setVat] = React.useState(null);
  var reload = React.useCallback(async () => {
    if (!A) return;
    setLoading(true);
    try {
      var [e, b, acc, j] = await Promise.all([A.entries({
        from,
        to
      }), A.balance({
        from,
        to
      }), A.accounts(), A.journals()]);
      setEntries(e || []);
      setBalance(b || []);
      setAccounts(acc || []);
      setJournals(j || []);
    } catch (err) {
      console.warn(err);
    }
    setLoading(false);
  }, [from, to]);
  React.useEffect(() => {
    reload();
  }, [reload]);
  React.useEffect(() => {
    if (!A || tab !== "grandlivre") return;
    A.ledger(ledgerAcc, {
      from,
      to
    }).then(l => setLedger(l || [])).catch(() => setLedger([]));
  }, [tab, ledgerAcc, from, to]);
  React.useEffect(() => {
    if (!A || tab !== "tva") return;
    A.vatReport({
      from,
      to
    }).then(r => setVat(r)).catch(() => setVat(null));
  }, [tab, from, to, entries]);
  var totDebit = balance.reduce((s, a) => s + a.debit, 0);
  var totCredit = balance.reduce((s, a) => s + a.credit, 0);
  var equilibre = Math.abs(totDebit - totCredit) < 0.01;
  var genSales = async () => {
    setBusy("gen");
    try {
      var r = await A.generateFromSales({
        from,
        to
      });
      await reload();
      (window.HubToast ? window.HubToast.success : alert)((r.created || 0) + " écriture(s) générée(s).");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setBusy("");
  };
  var validate = async () => {
    if (!(window.HubModal ? await window.HubModal.confirm({
      title: "Valider la période ?",
      message: "Les écritures du " + from + " au " + to + " seront figées (date de validation = aujourd'hui). Action conservée dans le FEC."
    }) : confirm("Valider (figer) les écritures de la période ?"))) return;
    setBusy("val");
    try {
      var r = await A.validate({
        from,
        to
      });
      await reload();
      (window.HubToast ? window.HubToast.success : alert)((r.validated || 0) + " écriture(s) validée(s).");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setBusy("");
  };
  var genVat = async () => {
    if (!(window.HubModal ? await window.HubModal.confirm({
      title: "Générer l'écriture de TVA ?",
      message: "Solde les comptes de TVA de la période vers 44551 (à décaisser) / 44567 (crédit). Journal OD."
    }) : confirm("Générer l'écriture de TVA de la période ?"))) return;
    setBusy("genvat");
    try {
      var r = await A.generateVatEntry({
        from,
        to
      });
      await reload();
      (window.HubToast ? window.HubToast.success : alert)(r.already ? "Écriture de TVA déjà générée pour cette période." : r.created ? "Écriture de TVA générée." : "Rien à générer.");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setBusy("");
  };
  var exportFEC = async () => {
    setBusy("fec");
    try {
      var {
        filename,
        content
      } = await A.exportFEC({
        from,
        to
      });
      var blob = new Blob(["﻿" + content], {
        type: "text/plain;charset=utf-8"
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur FEC : " + (e.message || e));
    }
    setBusy("");
  };
  var jLabel = code => {
    var j = journals.find(x => x.code === code);
    return j ? j.label : code;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, "Accueil"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Comptabilit\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b"
    }
  }, "Du"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: from,
    onChange: e => setFrom(e.target.value),
    style: S.date
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b"
    }
  }, "au"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: to,
    onChange: e => setTo(e.target.value),
    style: S.date
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "\uD83D\uDCD2 Comptabilit\xE9"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, "\xC9critures en partie double \xB7 Grand livre \xB7 Balance \xB7 Export FEC (DGFiP).")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: genSales,
    disabled: busy === "gen",
    style: S.btnGhost
  }, busy === "gen" ? "Génération…" : "↻ Générer les écritures (ventes + achats)"), /*#__PURE__*/React.createElement("button", {
    onClick: validate,
    disabled: busy === "val",
    style: S.btnGhost
  }, busy === "val" ? "Validation…" : "🔒 Valider la période"), /*#__PURE__*/React.createElement("button", {
    onClick: exportFEC,
    disabled: busy === "fec",
    style: S.btnPrimary
  }, busy === "fec" ? "Export…" : "⇩ Export FEC"))), /*#__PURE__*/React.createElement("div", {
    style: S.tabs
  }, [["balance", "Balance"], ["ecritures", "Écritures"], ["grandlivre", "Grand livre"], ["tva", "TVA"], ["plan", "Plan comptable"]].map(([k, lbl]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      ...S.tab,
      ...(tab === k ? S.tabOn : {})
    }
  }, lbl))), loading ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, tab === "balance" && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.rowH
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90
    }
  }, "Compte"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Libell\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120,
      textAlign: "right"
    }
  }, "D\xE9bit"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120,
      textAlign: "right"
    }
  }, "Cr\xE9dit"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120,
      textAlign: "right"
    }
  }, "Solde")), balance.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucune \xE9criture sur la p\xE9riode. Cliquez \xAB G\xE9n\xE9rer depuis les ventes \xBB.") : balance.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.account_id,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      fontVariantNumeric: "tabular-nums",
      color: "#3730a3"
    }
  }, a.account_id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, a.account_label), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, a.debit ? fmtEUR(a.debit) : "—"), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, a.credit ? fmtEUR(a.credit) : "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.num,
      fontWeight: 700,
      color: a.solde >= 0 ? "#0f172a" : "#dc2626"
    }
  }, fmtEUR(a.solde)))), balance.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      borderTop: "2px solid #e2e8f0",
      fontWeight: 800
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Totaux ", equilibre ? "✓ équilibrés" : "⚠ déséquilibrés"), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, fmtEUR(totDebit)), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, fmtEUR(totCredit)), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }))), tab === "ecritures" && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, entries.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucune \xE9criture sur la p\xE9riode.") : entries.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    style: {
      borderBottom: "1px solid #eef1f5",
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#eef2ff",
      color: "#3730a3",
      padding: "1px 6px",
      borderRadius: 4
    }
  }, e.journal_code), /*#__PURE__*/React.createElement("span", null, "N\xB0 ", e.num), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      fontWeight: 500
    }
  }, (e.entry_date || "").split("-").reverse().join("/")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: "#475569",
      fontWeight: 500
    }
  }, e.label, e.piece_ref ? " · " + e.piece_ref : "")), (e.data && e.data.lines || []).map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      fontSize: 12,
      padding: "2px 0 2px 12px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 80,
      color: "#3730a3",
      fontVariantNumeric: "tabular-nums"
    }
  }, l.account_id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: "#64748b"
    }
  }, l.account_label, l.aux_num ? " · " + l.aux_num : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, l.debit ? fmtEUR(l.debit) : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, l.credit ? fmtEUR(l.credit) : "")))))), tab === "grandlivre" && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: ledgerAcc,
    onChange: e => setLedgerAcc(e.target.value),
    style: S.select
  }, accounts.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.id, " \u2014 ", a.label)))), /*#__PURE__*/React.createElement("div", {
    style: S.rowH
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 80
    }
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 50
    }
  }, "Jal"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Libell\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right"
    }
  }, "D\xE9bit"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right"
    }
  }, "Cr\xE9dit"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right"
    }
  }, "Solde")), ledger.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun mouvement.") : ledger.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 80,
      fontVariantNumeric: "tabular-nums"
    }
  }, (l.date || "").split("-").reverse().join("/")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 50,
      color: "#3730a3"
    }
  }, l.journal), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, l.label, l.piece_ref ? " · " + l.piece_ref : ""), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, l.debit ? fmtEUR(l.debit) : ""), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, l.credit ? fmtEUR(l.credit) : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.num,
      fontWeight: 700
    }
  }, fmtEUR(l.solde))))), tab === "tva" && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      margin: 0
    }
  }, "D\xE9claration de TVA \u2014 p\xE9riode du ", from, " au ", to), /*#__PURE__*/React.createElement("button", {
    onClick: genVat,
    disabled: busy === "genvat",
    style: S.btnGhost
  }, busy === "genvat" ? "…" : "Générer l'écriture de TVA (OD)")), !vat ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Calcul\u2026") : /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 520
    }
  }, vat.byAccount.length > 0 && vat.byAccount.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.account_id,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      color: "#3730a3",
      fontVariantNumeric: "tabular-nums"
    }
  }, a.account_id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "TVA collect\xE9e"), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, fmtEUR(a.montant)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "TVA collect\xE9e (total)"), /*#__PURE__*/React.createElement("span", {
    style: S.num
  }, fmtEUR(vat.collectee))), /*#__PURE__*/React.createElement("div", {
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "TVA d\xE9ductible (44566)"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.num,
      color: "#dc2626"
    }
  }, "\u2212 ", fmtEUR(vat.deductible))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      borderTop: "2px solid #e2e8f0",
      fontWeight: 800,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, vat.aDecaisser >= 0 ? "TVA à décaisser (44551)" : "Crédit de TVA à reporter (44567)"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.num,
      color: vat.aDecaisser >= 0 ? "#0f172a" : "#047857"
    }
  }, fmtEUR(Math.abs(vat.aDecaisser)))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      marginTop: 12
    }
  }, "Calcul indicatif bas\xE9 sur les \xE9critures de la p\xE9riode (comptes 4457* et 44566). \xC0 valider par votre expert-comptable avant t\xE9l\xE9d\xE9claration."))), tab === "plan" && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.rowH
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110
    }
  }, "Compte"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Libell\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120
    }
  }, "Type")), accounts.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      fontVariantNumeric: "tabular-nums",
      color: "#3730a3",
      fontWeight: 600
    }
  }, a.id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, a.label), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120,
      color: "#64748b"
    }
  }, a.kind || "—"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      marginTop: 10
    }
  }, "Plan comptable simplifi\xE9 (PCG). Les comptes manquants peuvent \xEAtre ajout\xE9s en base (table ", /*#__PURE__*/React.createElement("code", null, "accounting_accounts"), ")."))));
};
var S = {
  frame: {
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  topbar: {
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  date: {
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    padding: "5px 8px",
    fontSize: 12.5
  },
  titleRow: {
    padding: "20px 28px 12px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    letterSpacing: -0.5
  },
  h1sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0"
  },
  btnGhost: {
    padding: "8px 14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "8px 14px",
    border: 0,
    background: "#3730a3",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  tabs: {
    display: "flex",
    gap: 4,
    padding: "0 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5"
  },
  tab: {
    padding: "10px 16px",
    border: 0,
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "2px solid transparent"
  },
  tabOn: {
    color: "#3730a3",
    borderBottom: "2px solid #3730a3"
  },
  body: {
    padding: "20px 28px 60px"
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 16
  },
  rowH: {
    display: "flex",
    gap: 10,
    padding: "6px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid #e2e8f0"
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 6px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 12.5
  },
  num: {
    width: 120,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums"
  },
  select: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    minWidth: 320
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    fontStyle: "italic"
  }
};
window.Comptabilite = Comptabilite;