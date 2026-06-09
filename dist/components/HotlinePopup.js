// Popup CTI Hotline — déclenché par un appel entrant (3CX via webhook en prod,
// bouton "Simuler appel" en démo). Match du numéro entrant à la base clients,
// affiche les tickets ouverts ou bascule sur le formulaire nouveau ticket.

var HotlinePopup = ({
  call,
  onClose,
  onCreateTicket
}) => {
  // ───── État interne : "ringing" → l'agent décroche → on affiche la fiche.
  var [phase, setPhase] = React.useState("ringing"); // ringing | answered | transcript | newTicket
  var [elapsed, setElapsed] = React.useState(0);
  var [form, setForm] = React.useState({
    subject: "",
    category: "Support technique",
    prio: "normale",
    desc: ""
  });
  var [transcriptText, setTranscriptText] = React.useState("");
  var [targetTicketId, setTargetTicketId] = React.useState(null);
  var [transcribing, setTranscribing] = React.useState(false);
  React.useEffect(() => {
    setPhase("ringing");
    setElapsed(0);
    setTranscriptText("");
    setTargetTicketId(call && call.openTickets && call.openTickets[0] ? call.openTickets[0].id : null);
    setForm({
      subject: "",
      category: "Support technique",
      prio: "normale",
      desc: ""
    });
  }, [call && call.id]);
  React.useEffect(() => {
    if (phase !== "answered") return;
    var t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  React.useEffect(() => {
    if (!call) return;
    var onKey = e => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, onClose]);
  if (!call) return null;
  // Le DesignCanvas applique un transform sur l'ancêtre, ce qui casse les
  // position:fixed. On rend la popup directement sur document.body.
  var portalTarget = typeof document !== "undefined" ? document.body : null;

  // Pilotage 3CX : appel à l'Edge Function 3cx-call-control (proxy OAuth)
  // pour décrocher / raccrocher l'appel directement depuis le Hub.
  // Si la config Call Control n'est pas renseignée (settings vides), on
  // bascule sur le comportement informatif (passage à phase "answered"
  // sans toucher la téléphonie).
  var [ccBusy, setCcBusy] = React.useState(false);
  var callControl = async action => {
    setCcBusy(true);
    try {
      var supa = window.HubSupabase && window.HubSupabase.client;
      if (!supa) throw new Error("Supabase non configuré");
      var {
        data: sess
      } = await supa.auth.getSession();
      var jwt = sess?.session?.access_token;
      if (!jwt) throw new Error("Non authentifié");
      var me = await window.api.auth.getUser();
      var {
        data: profile
      } = await supa.from("profiles").select("extension_3cx").eq("id", me.id).single();
      var ext = profile?.extension_3cx;
      if (!ext) throw new Error("Aucune extension 3CX renseignée — admin");
      var resp = await fetch("https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/call-control", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": "Bearer " + jwt
        },
        body: JSON.stringify({
          action,
          extension: ext
        })
      });
      var json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "HTTP " + resp.status);
      return {
        ok: true,
        json
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message
      };
    } finally {
      setCcBusy(false);
    }
  };
  var answer = async () => {
    // Tente d'abord de décrocher la ligne via 3CX Call Control
    var r = await callControl("answer");
    if (!r.ok) {
      if (window.HubToast) {
        window.HubToast.warn("Décrochage 3CX indispo (" + r.error + ") — popup informatif uniquement");
      }
    } else if (window.HubToast) {
      window.HubToast.success("✓ Ligne décrochée");
    }
    // Dans tous les cas on passe en mode fiche client / nouveau ticket
    if (call.openTickets && call.openTickets.length > 0) {
      setPhase("answered");
    } else {
      setForm(f => ({
        ...f,
        desc: call.transcript || ""
      }));
      setPhase("newTicket");
    }
  };
  var decline = async () => {
    // Tente de raccrocher la ligne via 3CX Call Control
    var r = await callControl("drop");
    if (!r.ok && window.HubToast) {
      window.HubToast.warn("Raccrochage 3CX indispo : " + r.error);
    } else if (window.HubToast) {
      window.HubToast.success("✓ Appel refusé");
    }
    if (onClose) onClose();
  };
  var fmtElapsed = () => `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  var fmtDuration = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Simule le temps de traitement speech-to-text 3CX (~1.2 s)
  var endAndTranscribe = () => {
    setTranscribing(true);
    setTimeout(() => {
      setTranscribing(false);
      setTranscriptText(call.transcript || "(aucune retranscription disponible)");
      setPhase("transcript");
    }, 1200);
  };
  var attachTranscript = async () => {
    if (!targetTicketId || !transcriptText.trim()) return;
    // 1. Persiste l'appel + retranscription en BDD si possible
    if (window.HubData && window.HubData.enabled() && window.HubData.recordCall && window.HubData.saveTranscript) {
      try {
        var {
          data: callRow
        } = await window.HubData.recordCall({
          caller_name: call.name,
          caller_phone: call.phone,
          duration_sec: call.durationSec || elapsed,
          direction: "inbound",
          status: "completed",
          ticket_id: targetTicketId,
          started_at: new Date(Date.now() - (call.durationSec || elapsed) * 1000).toISOString(),
          ended_at: new Date().toISOString()
        });
        await window.HubData.saveTranscript({
          call_id: callRow && callRow.id,
          ticket_id: targetTicketId,
          source: "manual",
          text: transcriptText.trim(),
          duration_sec: call.durationSec || elapsed,
          language: "fr"
        });
      } catch (e) {
        console.warn("[HotlinePopup] persist call:", e);
      }
    }
    // 2. Fallback localStorage via HubAccess.addTranscript (mode démo)
    if (window.HubAccess && window.HubAccess.addTranscript) {
      window.HubAccess.addTranscript(targetTicketId, {
        from: call.name,
        phone: call.phone,
        durationSec: call.durationSec || elapsed,
        text: transcriptText.trim(),
        at: new Date().toISOString()
      });
    }
    onCreateTicket && onCreateTicket({
      ticketId: targetTicketId,
      attached: true,
      client: call.name,
      subject: "Retranscription d'appel ajoutée"
    });
    onClose && onClose();
  };
  var submitNewTicket = async e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.subject.trim()) return;
    var ticketId = "INC-" + Math.floor(2900 + Math.random() * 99);

    // 1. Persiste l'appel hotline (table calls) en BDD si possible
    if (window.HubData && window.HubData.enabled() && window.HubData.recordCall) {
      try {
        var startedAt = new Date(Date.now() - (call.durationSec || 0) * 1000).toISOString();
        var {
          data: callRow
        } = await window.HubData.recordCall({
          caller_name: call.name || "Inconnu",
          caller_phone: call.phone || "",
          direction: "inbound",
          status: "completed",
          duration_sec: call.durationSec || 0,
          started_at: startedAt,
          ended_at: new Date().toISOString(),
          ticket_id: ticketId,
          category: form.category || "incident"
        });
        // Et la retranscription si présente
        if (form.desc.trim() && callRow && callRow.id && window.HubData.saveTranscript) {
          await window.HubData.saveTranscript({
            call_id: callRow.id,
            ticket_id: ticketId,
            source: "manual",
            text: form.desc.trim(),
            duration_sec: call.durationSec || 0,
            language: "fr"
          });
        }
      } catch (err) {
        console.warn("[HotlinePopup] recordCall:", err);
      }
    }

    // 2. Fallback localStorage (mode démo)
    if (window.HubAccess && window.HubAccess.addTranscript && form.desc.trim()) {
      window.HubAccess.addTranscript(ticketId, {
        from: call.name || "Inconnu",
        phone: call.phone,
        durationSec: call.durationSec || 0,
        text: form.desc.trim(),
        at: new Date().toISOString()
      });
    }
    onCreateTicket && onCreateTicket({
      ...form,
      client: call.name,
      company: call.company,
      phone: call.phone,
      ticketId
    });
    onClose && onClose();
  };
  var initials = (call.name || "?").split(" ").slice(0, 2).map(s => s[0]).join("");
  var isUnknown = !!call.unknown;
  var tree = /*#__PURE__*/React.createElement("div", {
    style: H.backdrop,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H.modal,
      ...(phase === "ringing" ? H.modalRinging : {})
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: H.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: phase === "ringing" ? H.ringIcon : H.liveIcon
  }, phase === "ringing" ? "📞" : "🟢"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 11.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6
    }
  }, /*#__PURE__*/React.createElement("span", null, phase === "ringing" ? "Appel entrant · 3CX" : phase === "newTicket" ? "Nouveau ticket" : phase === "transcript" ? "Retranscription · 3CX AI" : "En ligne · " + fmtElapsed()), phase === "answered" && /*#__PURE__*/React.createElement("span", {
    style: H.recPill
  }, /*#__PURE__*/React.createElement("span", {
    style: H.recDot
  }), " REC")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      marginTop: 1
    }
  }, call.phone, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      fontWeight: 500
    }
  }, "\xB7 Ligne ", call.line || "Hotline")))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: H.close,
    "aria-label": "Fermer"
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: H.clientCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H.clientAvatar,
      background: isUnknown ? "#94a3b8" : "#3730a3"
    }
  }, isUnknown ? "?" : initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, isUnknown ? "Numéro inconnu" : call.name), !isUnknown && call.tier && /*#__PURE__*/React.createElement("span", {
    style: {
      ...H.tierBadge,
      ...(call.tier === "premium" ? H.tierPremium : H.tierStandard)
    }
  }, call.tier === "premium" ? "★ Premium" : "Standard")), !isUnknown && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#475569",
      marginTop: 2
    }
  }, call.company, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1",
      margin: "0 6px"
    }
  }, "\xB7"), " ", call.email), !isUnknown && call.lastContact && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#94a3b8",
      marginTop: 4
    }
  }, "Dernier contact : ", call.lastContact, " \xB7 Contrat ", call.contract), isUnknown && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#dc2626",
      marginTop: 4
    }
  }, "Aucun client trouv\xE9 pour ce num\xE9ro. Cr\xE9er une fiche apr\xE8s l'appel ?")), !isUnknown && /*#__PURE__*/React.createElement("a", {
    href: `/fiche-client`,
    style: H.linkBtn
  }, "Fiche client \u2192")), phase === "ringing" && /*#__PURE__*/React.createElement("div", {
    style: H.ringingFoot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: decline,
    disabled: ccBusy,
    style: {
      ...H.btn,
      ...H.btnDecline,
      opacity: ccBusy ? 0.6 : 1,
      cursor: ccBusy ? "wait" : "pointer"
    }
  }, ccBusy ? "⏳" : "✕ Refuser"), /*#__PURE__*/React.createElement("button", {
    onClick: answer,
    disabled: ccBusy,
    style: {
      ...H.btn,
      ...H.btnAnswer,
      opacity: ccBusy ? 0.6 : 1,
      cursor: ccBusy ? "wait" : "pointer"
    }
  }, ccBusy ? "⏳ Décrochage…" : "📞 Décrocher")), phase === "answered" && /*#__PURE__*/React.createElement("div", {
    style: H.body
  }, /*#__PURE__*/React.createElement("div", {
    style: H.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: H.sectionTitle
  }, call.openTickets.length, " ticket", call.openTickets.length > 1 ? "s" : "", " ouvert", call.openTickets.length > 1 ? "s" : ""), /*#__PURE__*/React.createElement("div", {
    style: H.sectionSub
  }, "Dossiers en cours pour ce client")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPhase("newTicket"),
    style: {
      ...H.btn,
      ...H.btnGhost,
      padding: "6px 12px",
      fontSize: 12
    }
  }, "+ Nouveau ticket")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, call.openTickets.map(t => /*#__PURE__*/React.createElement("a", {
    key: t.id,
    href: `/ticketing#${t.id}`,
    style: H.ticketRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H.prioPill,
      background: prioTone[t.prio]?.bg,
      color: prioTone[t.prio]?.fg
    }
  }, prioTone[t.prio]?.label || t.prio), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#94a3b8",
      fontWeight: 600
    }
  }, t.id), t.sla && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: t.sla === "danger" ? "#dc2626" : t.sla === "warn" ? "#a65f00" : "#10b981"
    }
  }, "SLA ", t.slaLeft)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      marginTop: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "Ouvert ", t.opened, " \xB7 ", t.assignee || "Non assigné")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\u203A")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 8,
      fontSize: 11.5,
      color: "#7f1d1d",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: H.recDot
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Enregistrement 3CX en cours"), " \xB7 transcription speech-to-text automatique \xE0 la fin de l'appel")), /*#__PURE__*/React.createElement("div", {
    style: H.ringingFoot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPhase("newTicket"),
    style: {
      ...H.btn,
      ...H.btnGhost
    }
  }, "+ Cr\xE9er un ticket"), /*#__PURE__*/React.createElement("button", {
    onClick: endAndTranscribe,
    disabled: transcribing,
    style: {
      ...H.btn,
      ...H.btnAnswer,
      background: transcribing ? "#94a3b8" : "#dc2626"
    }
  }, transcribing ? "⏳ Transcription…" : "⏻ Terminer & retranscrire"))), phase === "transcript" && /*#__PURE__*/React.createElement("div", {
    style: H.body
  }, /*#__PURE__*/React.createElement("div", {
    style: H.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: H.sectionTitle
  }, "Retranscription automatique"), /*#__PURE__*/React.createElement("div", {
    style: H.sectionSub
  }, "Dur\xE9e appel \xB7 ", fmtDuration(call.durationSec || 0), " \xB7 enregistrement archiv\xE9 sur le PBX 3CX")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: "#0f172a",
      color: "#fff",
      fontSize: 11,
      fontWeight: 600
    }
  }, "\u25B6 \xC9couter")), /*#__PURE__*/React.createElement("div", {
    style: H.audioBar
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "00:00"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 4,
      background: "#e2e8f0",
      borderRadius: 999,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg, #10b981 0%, #10b981 100%)",
      borderRadius: 999,
      opacity: 0.4
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtDuration(call.durationSec || 0))), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Texte de la transcription ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "(modifiable avant rattachement)")), /*#__PURE__*/React.createElement("textarea", {
    value: transcriptText,
    onChange: e => setTranscriptText(e.target.value),
    rows: 8,
    style: {
      ...H.input,
      fontFamily: "inherit",
      lineHeight: 1.5,
      fontSize: 12.5,
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Ajouter \xE0 la description du ticket"), /*#__PURE__*/React.createElement("select", {
    value: targetTicketId || "",
    onChange: e => setTargetTicketId(e.target.value),
    style: H.input
  }, call.openTickets.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.id, " \u2014 ", t.title)))), /*#__PURE__*/React.createElement("div", {
    style: H.ringingFoot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      ...H.btn,
      ...H.btnGhost
    }
  }, "Ne pas rattacher"), /*#__PURE__*/React.createElement("button", {
    onClick: attachTranscript,
    disabled: !targetTicketId || !transcriptText.trim(),
    style: {
      ...H.btn,
      ...H.btnAnswer,
      background: "#10b981"
    }
  }, "\u2713 Ajouter au ticket ", targetTicketId || ""))), phase === "newTicket" && /*#__PURE__*/React.createElement("form", {
    onSubmit: submitNewTicket,
    style: H.body
  }, /*#__PURE__*/React.createElement("div", {
    style: H.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: H.sectionTitle
  }, call.openTickets && call.openTickets.length === 0 ? "Aucun ticket ouvert — créer un incident" : "Nouveau ticket"), /*#__PURE__*/React.createElement("div", {
    style: H.sectionSub
  }, "Pr\xE9-rempli depuis l'appel en cours"))), /*#__PURE__*/React.createElement("div", {
    style: H.formRow
  }, /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Client"), /*#__PURE__*/React.createElement("input", {
    value: isUnknown ? "" : call.name,
    placeholder: isUnknown ? "Renseigner le nom du client" : "",
    style: {
      ...H.input,
      background: isUnknown ? "#fff" : "#f8fafc",
      color: isUnknown ? "#0f172a" : "#475569"
    },
    readOnly: !isUnknown
  })), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "T\xE9l\xE9phone"), /*#__PURE__*/React.createElement("input", {
    value: call.phone,
    readOnly: true,
    style: {
      ...H.input,
      background: "#f8fafc",
      color: "#475569"
    }
  }))), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Sujet ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#dc2626"
    }
  }, "*")), /*#__PURE__*/React.createElement("input", {
    value: form.subject,
    onChange: e => setForm({
      ...form,
      subject: e.target.value
    }),
    placeholder: "Ex. Lenteur connexion VPN depuis ce matin",
    required: true,
    style: H.input,
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: H.formRow
  }, /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Cat\xE9gorie"), /*#__PURE__*/React.createElement("select", {
    value: form.category,
    onChange: e => setForm({
      ...form,
      category: e.target.value
    }),
    style: H.input
  }, /*#__PURE__*/React.createElement("option", null, "Support technique"), /*#__PURE__*/React.createElement("option", null, "R\xE9seau \xB7 VPN"), /*#__PURE__*/React.createElement("option", null, "Acc\xE8s & Droits"), /*#__PURE__*/React.createElement("option", null, "Messagerie"), /*#__PURE__*/React.createElement("option", null, "Mat\xE9riel"), /*#__PURE__*/React.createElement("option", null, "Logiciel \xB7 Installation"), /*#__PURE__*/React.createElement("option", null, "Autre"))), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Priorit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: form.prio,
    onChange: e => setForm({
      ...form,
      prio: e.target.value
    }),
    style: H.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "critique"
  }, "Critique"), /*#__PURE__*/React.createElement("option", {
    value: "haute"
  }, "Haute"), /*#__PURE__*/React.createElement("option", {
    value: "normale"
  }, "Normale"), /*#__PURE__*/React.createElement("option", {
    value: "basse"
  }, "Basse")))), /*#__PURE__*/React.createElement("label", {
    style: H.field
  }, /*#__PURE__*/React.createElement("span", {
    style: H.fieldLabel
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    value: form.desc,
    onChange: e => setForm({
      ...form,
      desc: e.target.value
    }),
    rows: 3,
    placeholder: "Notes prises pendant l'appel\u2026",
    style: {
      ...H.input,
      fontFamily: "inherit",
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: H.ringingFoot
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: {
      ...H.btn,
      ...H.btnGhost
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: {
      ...H.btn,
      ...H.btnAnswer,
      background: "#10b981"
    }
  }, "\u2713 Cr\xE9er le ticket")))));
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

// ───── Données de démo : 4 callers (différents scénarios)
// transcript = ce que produirait l'AI speech-to-text 3CX en bout de chaîne.
// duration = durée typique de la conversation (utilisée pour l'horodatage).
var HOTLINE_DEMO_CALLERS = [{
  id: "c1",
  phone: "+33 1 42 86 74 21",
  line: "Hotline support",
  name: "Sophie Dubois",
  company: "MAIF Innovation",
  email: "s.dubois@maif.fr",
  tier: "premium",
  contract: "Premium 24/7",
  lastContact: "il y a 3 j (Romain D.)",
  openTickets: [{
    id: "INC-2841",
    title: "Impossible d'accéder à SharePoint Direction",
    prio: "critique",
    sla: "warn",
    slaLeft: "47 min",
    opened: "il y a 28 min",
    assignee: "Non assigné"
  }, {
    id: "INC-2829",
    title: "VPN se déconnecte toutes les 10 min",
    prio: "haute",
    sla: "danger",
    slaLeft: "22 min",
    opened: "il y a 1 j",
    assignee: "Tom Verdier"
  }],
  durationSec: 247,
  transcript: "Bonjour, c'est Sophie Dubois de MAIF Innovation. Je rappelle au sujet du ticket SharePoint, c'est devenu vraiment urgent — toute l'équipe Direction est bloquée pour la présentation de demain matin. L'erreur 403 apparaît sur Chrome et sur Edge, on a vidé le cache, rien n'y fait. L'agent a vérifié les permissions Azure AD et a vu que le groupe Direction a été retiré du site par erreur lors du nettoyage SSO ce week-end. Re-application des droits en cours, propagation sous 15 minutes. Sophie reste en attente d'un mail de confirmation. Sur le ticket VPN INC-2829, Tom a confirmé que le déploiement Intune du driver est planifié ce soir 19h."
}, {
  id: "c2",
  phone: "+33 4 78 92 33 12",
  line: "Hotline support",
  name: "Marc Lefebvre",
  company: "Crédit Agricole Sud",
  email: "m.lefebvre@ca-sud.fr",
  tier: "standard",
  contract: "Standard 9-18h",
  lastContact: "il y a 2 sem.",
  openTickets: [],
  durationSec: 182,
  transcript: "Bonjour, Marc Lefebvre, Crédit Agricole Sud. J'appelle parce que depuis le redémarrage de mon poste ce matin, mon Outlook ne se synchronise plus avec l'Exchange. Profil reconstruit, ça ne change rien. L'agent a fait un Outlook /safe puis vérifié les credentials manager — le mot de passe SSO a expiré pendant la fenêtre de maintenance du week-end. Nouveau MDP envoyé sur le mobile, déblocage immédiat. À tester côté Marc dans la prochaine heure, rappel prévu si pas résolu."
}, {
  id: "c3",
  phone: "+33 2 51 47 88 02",
  line: "Hotline support",
  name: "Camille Dufour",
  company: "Astorya · Direction Marketing",
  email: "camille.dufour@astorya.fr",
  tier: "premium",
  contract: "Premium 24/7",
  lastContact: "hier (Tom Verdier)",
  openTickets: [{
    id: "INC-2837",
    title: "VPN se déconnecte toutes les 10 min",
    prio: "haute",
    sla: "ok",
    slaLeft: "5 h 10",
    opened: "il y a 2 j",
    assignee: "Tom Verdier"
  }],
  durationSec: 203,
  transcript: "Bonjour, Camille Dufour à l'appareil — je vous appelle pour le ticket INC-2837. Depuis le déploiement Intune d'hier soir le Wi-Fi tient enfin la connexion sur mon poste, j'ai fait 3 réunions Teams de suite ce matin sans aucune coupure. Tom a confirmé que le driver Intel AX211 v23.50.1 est bien installé. On peut passer le ticket en résolu de son côté. Camille demande si on peut pousser le même correctif sur les 4 autres postes de la Direction Marketing qui ont le même dock Dell — Tom a créé une tâche de déploiement groupé pour la semaine prochaine."
}, {
  id: "c4",
  phone: "+33 6 12 47 88 91",
  line: "Hotline support",
  unknown: true,
  openTickets: [],
  durationSec: 64,
  transcript: "Appel d'un numéro inconnu. Personne se présente comme \"Julien, partenaire d'un de vos clients\" sans préciser lequel. Demande des informations sur les contrats de support actifs. Agent rappelle qu'aucune information ne peut être transmise sans identification client préalable. Communication écourtée."
}];
window.HotlinePopup = HotlinePopup;
window.HOTLINE_DEMO_CALLERS = HOTLINE_DEMO_CALLERS;
var prioTone = {
  critique: {
    bg: "#fdecec",
    fg: "#dc2626",
    label: "Critique"
  },
  haute: {
    bg: "#fef0e6",
    fg: "#ea580c",
    label: "Haute"
  },
  normale: {
    bg: "#eef1f5",
    fg: "#475569",
    label: "Normale"
  },
  basse: {
    bg: "#f1f3f6",
    fg: "#64748b",
    label: "Basse"
  }
};
var H = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,.3)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  modalRinging: {
    boxShadow: "0 25px 60px rgba(16, 185, 129, .45), 0 0 0 4px rgba(16, 185, 129, .15)",
    animation: "ring-pulse 1.4s ease-in-out infinite"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafbfd"
  },
  ringIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#dcfce7",
    color: "#10b981",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    boxShadow: "0 0 0 0 rgba(16, 185, 129, .55)",
    animation: "ring-icon 1s ease-out infinite"
  },
  liveIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#0f172a",
    color: "#10b981",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14
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
  clientCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 22px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff"
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.3,
    flexShrink: 0
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  tierPremium: {
    background: "#fef3c7",
    color: "#a16207"
  },
  tierStandard: {
    background: "#e2e8f0",
    color: "#475569"
  },
  linkBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: "#3730a3",
    textDecoration: "none",
    padding: "6px 10px",
    border: "1px solid #c7d2fe",
    borderRadius: 7,
    whiteSpace: "nowrap"
  },
  body: {
    padding: "16px 22px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },
  ticketRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 9,
    border: "1px solid #e2e8f0",
    background: "#fff",
    textDecoration: "none",
    color: "inherit"
  },
  prioPill: {
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    flexShrink: 0
  },
  ringingFoot: {
    display: "flex",
    gap: 10,
    padding: "0 0 4px",
    marginTop: 4
  },
  btn: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 9,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    border: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  btnAnswer: {
    background: "#10b981",
    color: "#fff"
  },
  btnDecline: {
    background: "#f1f5f9",
    color: "#475569"
  },
  btnGhost: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: "#475569"
  },
  input: {
    padding: "8px 11px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#fff"
  },
  recPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "#dc2626",
    animation: "rec-blink 1.2s ease-in-out infinite",
    flexShrink: 0
  },
  audioBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8
  }
};

// CSS animations injectées une seule fois
if (typeof document !== "undefined" && !document.getElementById("hotline-popup-css")) {
  var style = document.createElement("style");
  style.id = "hotline-popup-css";
  style.textContent = `
    @keyframes ring-icon { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.55); } 70% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
    @keyframes ring-pulse { 0%,100% { box-shadow: 0 25px 60px rgba(16,185,129,.35), 0 0 0 4px rgba(16,185,129,.15); } 50% { box-shadow: 0 25px 60px rgba(16,185,129,.5), 0 0 0 6px rgba(16,185,129,.25); } }
    @keyframes rec-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `;
  document.head.appendChild(style);
}