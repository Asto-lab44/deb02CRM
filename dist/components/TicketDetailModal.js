// Modale plein écran pour la fiche détail d'un ticket. Charge les données
// depuis Supabase si dispo, sinon affiche un message clair. Permet l'édition
// inline du statut, de la priorité, de la catégorie et de l'assignation.

var TicketDetailModal = ({
  ticketId,
  onClose
}) => {
  var [ticket, setTicket] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [profiles, setProfiles] = React.useState([]);
  var [saving, setSaving] = React.useState(false);
  var [flash, setFlash] = React.useState(null);
  var dataOn = typeof window !== "undefined" && window.HubData && window.HubData.enabled();

  // Charger ticket + profils à l'ouverture
  React.useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    var cancelled = false;
    (async () => {
      if (dataOn) {
        var [{
          data: t
        }, {
          data: p
        }] = await Promise.all([window.HubData.fetchTicketById(ticketId), window.HubData.fetchProfiles()]);
        if (!cancelled) {
          setTicket(t);
          setProfiles(p || []);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setTicket(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, dataOn]);
  React.useEffect(() => {
    var onKey = e => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!ticketId) return null;
  var portalTarget = typeof document !== "undefined" ? document.body : null;
  var showFlash = (msg, tone = "ok") => {
    setFlash({
      msg,
      tone
    });
    setTimeout(() => setFlash(null), 2500);
  };
  var patch = async changes => {
    if (!dataOn || !ticket) return;
    setSaving(true);
    var {
      data,
      error
    } = await window.HubData.updateTicket(ticket.id, changes);
    setSaving(false);
    if (error) {
      showFlash("Erreur : " + error.message, "err");
      return;
    }
    setTicket({
      ...ticket,
      ...changes
    });
    showFlash("✓ Enregistré");
  };
  var escalate = async () => {
    var reason = window.HubModal ? await window.HubModal.prompt({
      title: "Escalader le ticket",
      label: "Motif de l'escalade",
      default: "Demande arbitrage Supervision",
      multiline: true,
      okLabel: "Escalader"
    }) : prompt("Motif de l'escalade :", "Demande arbitrage Supervision");
    if (!reason || !ticket) return;
    setSaving(true);
    var currentUser = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var {
      error
    } = await window.HubData.escalateTicket(ticket.id, {
      toUserId: currentUser?.id || null,
      groupId: "supervision",
      reason
    });
    setSaving(false);
    if (error) {
      showFlash("Erreur : " + error.message, "err");
      return;
    }
    setTicket({
      ...ticket,
      escalated_at: new Date().toISOString(),
      escalated_group: "supervision",
      escalated_reason: reason
    });
    showFlash("✓ Ticket escaladé à Supervision");
    setTimeout(() => {
      if (onClose) onClose();
    }, 800);
  };
  var resolve = async () => {
    if (!ticket) return;
    await patch({
      status: "resolved",
      closed_at: new Date().toISOString()
    });
    setTimeout(() => {
      if (onClose) onClose();
    }, 800);
  };
  var closeT = async () => {
    if (!ticket) return;
    if (!confirm("Fermer définitivement ce ticket ?")) return;
    await patch({
      status: "closed",
      closed_at: new Date().toISOString()
    });
    setTimeout(() => {
      if (onClose) onClose();
    }, 800);
  };
  var STATUS = [{
    v: "open",
    label: "Ouvert",
    color: "#3b82f6",
    soft: "#eff4ff"
  }, {
    v: "in_progress",
    label: "En cours",
    color: "#a855f7",
    soft: "#f5efff"
  }, {
    v: "waiting",
    label: "En attente",
    color: "#f59e0b",
    soft: "#fff6e6"
  }, {
    v: "resolved",
    label: "Résolu",
    color: "#10b981",
    soft: "#e8f8f1"
  }, {
    v: "closed",
    label: "Fermé",
    color: "#94a3b8",
    soft: "#f1f3f6"
  }];
  var PRIO = [{
    v: "critique",
    label: "Critique",
    color: "#dc2626",
    soft: "#fdecec"
  }, {
    v: "haute",
    label: "Haute",
    color: "#ea580c",
    soft: "#fef0e6"
  }, {
    v: "normale",
    label: "Normale",
    color: "#475569",
    soft: "#eef1f5"
  }, {
    v: "basse",
    label: "Basse",
    color: "#64748b",
    soft: "#f1f3f6"
  }];
  var CATEGORIES = ["Support technique", "Réseau · VPN", "Accès & Droits", "Messagerie", "Matériel · Imprimante", "Matériel · Périphérique", "Logiciel · Installation", "Téléphonie", "Gestion comptes RH · Onboarding", "Gestion comptes RH · Offboarding", "Autre"];
  var sMeta = ticket ? STATUS.find(s => s.v === ticket.status) || STATUS[0] : STATUS[0];
  var pMeta = ticket ? PRIO.find(p => p.v === ticket.priority) || PRIO[2] : PRIO[2];
  var fmtDate = iso => iso ? new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : "—";
  var tree = /*#__PURE__*/React.createElement("div", {
    style: D.backdrop,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: D.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: D.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: D.backBtn,
    title: "Retour \xE0 la liste"
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "Ticketing"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontVariantNumeric: "tabular-nums",
      color: "#0f172a",
      fontWeight: 700
    }
  }, ticketId), ticket && ticket.client && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "#475569",
      fontWeight: 600
    }
  }, ticket.client.name)), ticket && ticket.client && ticket.client.contracts && ticket.client.contracts[0] && /*#__PURE__*/React.createElement("span", {
    title: ticket.client.contracts[0].name,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      borderRadius: 999,
      background: ticket.client.contracts[0].status === "active" ? "#dcfce7" : ticket.client.contracts[0].status === "expiring" ? "#fef3c7" : "#fee2e2",
      color: ticket.client.contracts[0].status === "active" ? "#065f46" : ticket.client.contracts[0].status === "expiring" ? "#78350f" : "#991b1b",
      fontSize: 10.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "currentColor"
    }
  }), "Contrat ", ticket.client.contracts[0].status)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, flash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 6,
      background: flash.tone === "err" ? "#fee2e2" : "#dcfce7",
      color: flash.tone === "err" ? "#991b1b" : "#065f46"
    }
  }, flash.msg), /*#__PURE__*/React.createElement("button", {
    onClick: escalate,
    disabled: !dataOn || saving,
    style: D.btnEscalate,
    title: "Remonter \xE0 la Supervision"
  }, "\u2191 Escalader"), /*#__PURE__*/React.createElement("button", {
    onClick: resolve,
    disabled: !dataOn || saving,
    style: D.btnResolve
  }, "\u2713 Marquer r\xE9solu"), /*#__PURE__*/React.createElement("button", {
    onClick: closeT,
    disabled: !dataOn || saving,
    style: D.btnClose,
    title: "Fermer d\xE9finitivement le ticket"
  }, "\xD7 Fermer"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: D.close
  }, "\xD7"))), loading ? /*#__PURE__*/React.createElement("div", {
    style: D.empty
  }, "Chargement\u2026") : !ticket && dataOn ? /*#__PURE__*/React.createElement("div", {
    style: D.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 6
    }
  }, "Ticket ", ticketId, " introuvable"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "V\xE9rifiez que la table tickets a bien \xE9t\xE9 cr\xE9\xE9e (supabase/schema.sql + seeds.sql).")) : !dataOn ? /*#__PURE__*/React.createElement("div", {
    style: D.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 6
    }
  }, "D\xE9tail indisponible en mode d\xE9mo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "Configurez Supabase pour activer la fiche d\xE9tail dynamique.")) : /*#__PURE__*/React.createElement("div", {
    style: D.body
  }, /*#__PURE__*/React.createElement("div", {
    style: D.colMain
  }, ticket.escalated_at && /*#__PURE__*/React.createElement("div", {
    style: D.escBanner
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: D.escIcon
  }, "\u2191"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#fff"
    }
  }, "Ticket escalad\xE9 au groupe ", ticket.escalated_group || "Supervision"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      marginTop: 2
    }
  }, fmtDate(ticket.escalated_at), " \u2014 ", ticket.escalated_reason)))), /*#__PURE__*/React.createElement("h1", {
    style: D.h1
  }, ticket.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b",
      marginTop: 4
    }
  }, "Ouvert le ", fmtDate(ticket.opened_at), " \xB7 Derni\xE8re maj ", fmtDate(ticket.updated_at), ticket.closed_at && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 Cl\xF4tur\xE9 le ", fmtDate(ticket.closed_at))), ticket.description && /*#__PURE__*/React.createElement("div", {
    style: D.descBox
  }, /*#__PURE__*/React.createElement("div", {
    style: D.sectionLabel
  }, "Description"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.6,
      color: "#334155",
      whiteSpace: "pre-wrap"
    }
  }, ticket.description)), /*#__PURE__*/React.createElement("div", {
    style: D.threadPlaceholder
  }, /*#__PURE__*/React.createElement("div", {
    style: D.sectionLabel
  }, "Conversation"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#94a3b8"
    }
  }, "Aucun message pour ce ticket. (Le fil de conversation arrivera dans une prochaine version.)"))), /*#__PURE__*/React.createElement("aside", {
    style: D.colSide
  }, /*#__PURE__*/React.createElement("div", {
    style: D.sectionLabel
  }, "Propri\xE9t\xE9s"), /*#__PURE__*/React.createElement(PropRow, {
    label: "Statut"
  }, /*#__PURE__*/React.createElement("select", {
    value: ticket.status || "open",
    onChange: e => patch({
      status: e.target.value
    }),
    disabled: saving,
    style: {
      ...D.select,
      borderColor: sMeta.color + "55",
      background: sMeta.soft,
      color: sMeta.color,
      fontWeight: 700
    }
  }, STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.v,
    value: s.v
  }, s.label)))), /*#__PURE__*/React.createElement(PropRow, {
    label: "Priorit\xE9"
  }, /*#__PURE__*/React.createElement("select", {
    value: ticket.priority || "normale",
    onChange: e => patch({
      priority: e.target.value
    }),
    disabled: saving,
    style: {
      ...D.select,
      borderColor: pMeta.color + "55",
      background: pMeta.soft,
      color: pMeta.color,
      fontWeight: 700
    }
  }, PRIO.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.v,
    value: p.v
  }, p.label)))), /*#__PURE__*/React.createElement(PropRow, {
    label: "Cat\xE9gorie"
  }, /*#__PURE__*/React.createElement("select", {
    value: ticket.category || "",
    onChange: e => patch({
      category: e.target.value
    }),
    disabled: saving,
    style: D.select
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Aucune \u2014"), CATEGORIES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement(PropRow, {
    label: "Assign\xE9 \xE0"
  }, /*#__PURE__*/React.createElement("select", {
    value: ticket.assignee ? ticket.assignee.id : "",
    onChange: e => patch({
      assignee_id: e.target.value || null
    }),
    disabled: saving,
    style: D.select
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Non assign\xE9 \u2014"), profiles.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name, p.team ? ` · ${p.team}` : "")))), /*#__PURE__*/React.createElement(PropRow, {
    label: "\xC9quipe"
  }, /*#__PURE__*/React.createElement("input", {
    value: ticket.assignee_team || "",
    onChange: e => setTicket({
      ...ticket,
      assignee_team: e.target.value
    }),
    onBlur: e => patch({
      assignee_team: e.target.value || null
    }),
    placeholder: "Support N1, N2, S\xE9curit\xE9...",
    style: D.select,
    disabled: saving
  })), /*#__PURE__*/React.createElement(PropRow, {
    label: "SLA cible"
  }, /*#__PURE__*/React.createElement("input", {
    type: "datetime-local",
    value: ticket.sla_due_at ? new Date(ticket.sla_due_at).toISOString().slice(0, 16) : "",
    onChange: e => patch({
      sla_due_at: e.target.value ? new Date(e.target.value).toISOString() : null
    }),
    style: D.select,
    disabled: saving
  })), /*#__PURE__*/React.createElement(PropRow, {
    label: "Type"
  }, /*#__PURE__*/React.createElement("select", {
    value: ticket.lifecycle || "",
    onChange: e => patch({
      lifecycle: e.target.value || null
    }),
    disabled: saving,
    style: D.select
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Incident / Demande standard"), /*#__PURE__*/React.createElement("option", {
    value: "onboarding"
  }, "\uD83D\uDC64+ Arriv\xE9e collaborateur"), /*#__PURE__*/React.createElement("option", {
    value: "offboarding"
  }, "\uD83D\uDC64\u2212 D\xE9part collaborateur"))), /*#__PURE__*/React.createElement(PropRow, {
    label: "Facturable"
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      fontSize: 12.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ticket.billable || false,
    onChange: e => patch({
      billable: e.target.checked
    }),
    disabled: saving
  }), "Prestation facturable")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: "12px 14px",
      background: "#f8fafc",
      borderRadius: 8,
      border: "1px solid #eef2f7"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4
    }
  }, "R\xE9f."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      color: "#0f172a"
    }
  }, ticket.id))))));
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};
var PropRow = ({
  label,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 12
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, label), children);
window.TicketDetailModal = TicketDetailModal;
var D = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.65)",
    backdropFilter: "blur(4px)",
    zIndex: 2500,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    padding: 16
  },
  modal: {
    width: "100%",
    maxWidth: 1280,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 30px 80px rgba(0,0,0,.45)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 22px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafbfd",
    gap: 12,
    flexWrap: "wrap"
  },
  backBtn: {
    padding: "6px 12px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnEscalate: {
    padding: "7px 13px",
    background: "#f5f3ff",
    color: "#5b21b6",
    border: "1px solid #c4b5fd",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  btnResolve: {
    padding: "7px 13px",
    background: "#10b981",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  btnClose: {
    padding: "7px 13px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "transparent",
    border: 0,
    fontSize: 22,
    color: "#94a3b8",
    cursor: "pointer"
  },
  empty: {
    padding: 60,
    textAlign: "center"
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 0,
    flex: 1,
    overflowY: "auto"
  },
  colMain: {
    padding: "22px 26px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  colSide: {
    padding: "22px 22px",
    borderLeft: "1px solid #f1f5f9",
    background: "#fafbfd",
    overflowY: "auto"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.3
  },
  descBox: {
    padding: 14,
    background: "#f8fafc",
    border: "1px solid #eef2f7",
    borderRadius: 10
  },
  threadPlaceholder: {
    padding: 14,
    background: "#fff",
    border: "1px dashed #e2e8f0",
    borderRadius: 10
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  select: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  escBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)",
    borderRadius: 10
  },
  escIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800
  }
};