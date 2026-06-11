// Écran 2 — Détail ticket + conversation (vue utilisateur final)

const TicketDetail = ({ ticketId, ticketData, onBack } = {}) => {
  if (!ticketId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 40, color: "#64748b" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Aucun ticket sélectionné</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>Sélectionnez un ticket dans la liste pour voir le détail.</div>
        <a href="/ticketing" style={{ padding: "8px 14px", borderRadius: 8, background: "#4f46e5", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← Voir la liste des tickets</a>
      </div>
    );
  }
  const TICKET_ID = ticketId;
  const [flash, setFlash] = React.useState(null);
  const [composerTabState, setComposerTabState] = React.useState("reply");
  const [replyText, setReplyText] = React.useState("");
  const dataOn = typeof window !== "undefined" && window.HubData && window.HubData.enabled();

  // Si on a un ID mais pas de data complète (ouverture directe via URL ?id=…)
  // on charge la fiche complète depuis Supabase.
  const [loadedTicket, setLoadedTicket] = React.useState(null);
  React.useEffect(() => {
    if (!dataOn || !TICKET_ID || !window.HubData.fetchTicketById) return;
    if (ticketData && ticketData.title && ticketData.client) return; // déjà complet
    window.HubData.fetchTicketById(TICKET_ID).then(({ data }) => {
      if (data) setLoadedTicket(data);
    }).catch(() => {});
  }, [dataOn, TICKET_ID, ticketData]);
  const refreshTicket = React.useCallback(async () => {
    if (!dataOn || !window.HubData.fetchTicketById) return;
    try {
      const { data } = await window.HubData.fetchTicketById(TICKET_ID);
      if (data) setLoadedTicket(data);
    } catch (e) {}
  }, [dataOn, TICKET_ID]);

  // ───── Messages ajoutés par l'agent — Supabase si configuré, fallback localStorage.
  // En mode DB : lecture initiale + abonnement realtime pour la collaboration multi-agents.
  const MSG_KEY = `hubAstorya.ticketMsgs.v1.${TICKET_ID}`;
  const [addedMessages, setAddedMessages] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(MSG_KEY) || "[]"); } catch (e) { return []; }
  });

  const loadComments = React.useCallback(async () => {
    if (!dataOn || !window.HubData.fetchCommentsByTicket) return;
    const { data, error } = await window.HubData.fetchCommentsByTicket(TICKET_ID);
    if (error || !data) return;
    setAddedMessages(data.map((c) => ({
      id: c.id,
      type: "msg",
      from: c.author_name,
      role: c.kind === "note" ? "note" : "agent",
      isNote: c.kind === "note",
      at: new Date(c.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      atIso: c.created_at,
      body: c.body,
      color: "#3730a3",
    })));
  }, [TICKET_ID, dataOn]);

  React.useEffect(() => {
    if (!dataOn) return;
    loadComments();
    const off = window.HubData.subscribeCommentsForTicket && window.HubData.subscribeCommentsForTicket(TICKET_ID, loadComments);
    return () => { off && off(); };
  }, [TICKET_ID, dataOn, loadComments]);

  // Persistance localStorage uniquement en mode démo (sans Supabase)
  React.useEffect(() => {
    if (dataOn) return;
    try { localStorage.setItem(MSG_KEY, JSON.stringify(addedMessages)); } catch (e) {}
  }, [addedMessages, MSG_KEY, dataOn]);

  // Données du ticket : prop si fournie (depuis TicketList), sinon depuis Supabase.
  // Pas de fallback mock — un ticket sans données affiche des valeurs neutres.
  const t = loadedTicket || ticketData || {};
  const display = {
    title:    t.title || "—",
    status:   t.status || "open",
    priority: t.priority || t.prio || "normale",
    category: t.category || t.cat || "—",
    client:   (t.client && t.client.name) || "—",
    clientId: (t.client && t.client.id) || null,
    contract: t.client && t.client.contracts && t.client.contracts[0] ? t.client.contracts[0] :
              (t.client && t.client.maintenance ? { status: t.client.maintenance, name: t.client.contract } : null),
    requester: t.requester_name || t.caller_name || "—",
    escalated: t.escalated_at ? { at: t.escalated_at, group: t.escalated_group, reason: t.escalated_reason } : (t.escalated || null),
    sla_due_at: t.sla_due_at || null,
    opened_at: t.opened_at || null,
  };
  const ticket = t;
  const statusMap   = { open: { label: "Ouvert", color: "#3b82f6", soft: "#eff4ff", text: "#1d4ed8" }, in_progress: { label: "En cours", color: "#a855f7", soft: "#f5efff", text: "#7e22ce" }, waiting: { label: "En attente", color: "#f59e0b", soft: "#fff6e6", text: "#a65f00" }, resolved: { label: "Résolu", color: "#10b981", soft: "#e8f8f1", text: "#0e7a55" }, closed: { label: "Fermé", color: "#94a3b8", soft: "#f1f3f6", text: "#475569" } };
  const priorityMap = { critique: { label: "Critique", color: "#dc2626", soft: "#fdecec", arrow: "▲" }, haute: { label: "Haute", color: "#ea580c", soft: "#fef0e6", arrow: "▲" }, normale: { label: "Normale", color: "#475569", soft: "#eef1f5", arrow: "" }, basse: { label: "Basse", color: "#64748b", soft: "#f1f3f6", arrow: "" } };
  const sMeta = statusMap[display.status] || statusMap.in_progress;
  const pMeta = priorityMap[display.priority] || priorityMap.normale;

  const showFlash = (msg, tone = "ok") => {
    setFlash({ msg, tone });
    setTimeout(() => setFlash(null), 3000);
  };

  const resolveTicket = async () => {
    if (!dataOn) { showFlash("Mode démo — branchement DB nécessaire", "warn"); return; }
    const note = window.HubModal
      ? await window.HubModal.prompt({ title: "Marquer comme résolu", label: "Note de résolution (visible client)", placeholder: "Action effectuée pour résoudre…", multiline: true, okLabel: "Valider la résolution" })
      : prompt("Note de résolution (visible client) :", "");
    if (note === null) return; // cancel
    const { error } = await window.HubData.updateTicket(TICKET_ID, {
      status: "resolved",
      closed_at: new Date().toISOString(),
    });
    if (error) { showFlash("Erreur : " + error.message, "err"); return; }
    if (note && note.trim() && window.HubData.createComment) {
      const currentUser = (window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null;
      await window.HubData.createComment({
        ticket_id: TICKET_ID,
        body: "✓ Résolu — " + note.trim(),
        author_id: currentUser?.id || null,
        author_name: currentUser?.name || null,
        author_email: currentUser?.email || null,
      });
    }
    showFlash("✓ Ticket marqué comme résolu");
    refreshTicket();
  };

  const assignTicket = async () => {
    if (!dataOn) { showFlash("Mode démo — branchement DB nécessaire", "warn"); return; }
    // Liste des utilisateurs depuis Supabase profiles (fallback : Romain + Augustin)
    let users = [];
    try {
      if (window.HubData.fetchProfiles) {
        const { data } = await window.HubData.fetchProfiles();
        users = (data || []).map((p) => ({ id: p.id, name: p.name || p.email, team: p.team || "Astorya" }));
      }
    } catch (e) {}
    if (!users.length) {
      users = [
        { id: null, name: "Romain Daviaud", team: "Direction" },
        { id: null, name: "Augustin Morin", team: "Direction" },
      ];
    }
    // Modal choice moderne au lieu d'un prompt() avec numéros
    let targetIdx;
    if (window.HubModal) {
      const chosen = await window.HubModal.choice({
        title: "Assigner ce ticket",
        message: "Choisissez l'agent à qui transférer le ticket.",
        options: users.map((u, i) => ({ value: String(i), label: u.name, sub: u.team })),
      });
      if (chosen == null) return;
      targetIdx = parseInt(chosen, 10);
    } else {
      const list = users.map((u, i) => `${i + 1}. ${u.name} · ${u.team}`).join("\n");
      const choice = prompt("Assigner à :\n\n" + list + "\n\nTapez le numéro :", "1");
      targetIdx = parseInt(choice, 10) - 1;
    }
    if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= users.length) return;
    const target = users[targetIdx];
    const { error } = await window.HubData.updateTicket(TICKET_ID, {
      assignee_id: target.id,
      assignee_team: target.team,
      status: "in_progress",
    });
    if (error) showFlash("Erreur : " + error.message, "err");
    else { showFlash("✓ Ticket assigné à " + target.name); refreshTicket(); }
  };

  const closeTicket = async () => {
    if (!dataOn) { showFlash("Mode démo — branchement DB nécessaire", "warn"); return; }
    const ok = window.HubModal
      ? await window.HubModal.confirm({ title: "Fermer ce ticket ?", message: "Le client ne pourra plus y répondre une fois fermé.", okLabel: "Fermer définitivement", okStyle: "danger" })
      : confirm("Fermer définitivement ce ticket ? Le client ne pourra plus y répondre.");
    if (!ok) return;
    const { error } = await window.HubData.updateTicket(TICKET_ID, {
      status: "closed",
      closed_at: new Date().toISOString(),
    });
    if (error) showFlash("Erreur : " + error.message, "err");
    else { showFlash("✓ Ticket fermé"); refreshTicket(); }
  };

  const escalateTicket = async () => {
    if (!dataOn) { showFlash("Mode démo — branchement DB nécessaire", "warn"); return; }
    const reason = window.HubModal
      ? await window.HubModal.prompt({ title: "Escalader au groupe Supervision", label: "Motif de l'escalade", default: "Demande arbitrage Supervision", multiline: true, okLabel: "Escalader" })
      : prompt("Motif de l'escalade :", "Demande arbitrage Supervision");
    if (!reason) return;
    const currentUser = (window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null;
    const { error } = await window.HubData.escalateTicket(TICKET_ID, {
      toUserId: currentUser?.id || null,
      groupId: "supervision",
      reason,
    });
    if (error) showFlash("Erreur : " + error.message, "err");
    else { showFlash("✓ Ticket escaladé à Supervision"); refreshTicket(); }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text) { showFlash("Réponse vide", "warn"); return; }
    const isNote = composerTabState === "note";
    const currentUser = (window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null;
    const fromName = currentUser?.name || "Vous";
    const fromEmail = currentUser?.email || null;

    // En mode Supabase : on persiste en base et on laisse le realtime rafraîchir le fil
    if (dataOn && window.HubData.createComment) {
      const { error } = await window.HubData.createComment({
        ticket_id: TICKET_ID,
        author_name: fromName,
        author_email: fromEmail,
        body: text,
        kind: isNote ? "note" : "reply",
      });
      if (error) {
        // Fallback local si l'insert échoue (RLS, etc.)
        const msg = { type: "msg", from: fromName, role: isNote ? "note" : "agent", isNote,
                      at: new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
                      atIso: new Date().toISOString(), body: text, color: "#3730a3" };
        setAddedMessages((prev) => [...prev, msg]);
        showFlash("Sauvegarde locale uniquement : " + (error.message || "permission DB"), "warn");
      } else {
        showFlash(isNote ? "✓ Note interne enregistrée" : "✓ Réponse envoyée à " + (ticketData?.client?.name || display.requester || "demandeur"));
        // Le subscribe realtime ajoutera le message au fil
        loadComments();
      }
    } else {
      // Mode démo
      const msg = { type: "msg", from: fromName, role: isNote ? "note" : "agent", isNote,
                    at: new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
                    atIso: new Date().toISOString(), body: text, color: "#3730a3" };
      setAddedMessages((prev) => [...prev, msg]);
      showFlash(isNote ? "✓ Note interne enregistrée (local)" : "✓ Réponse envoyée (local)");
    }
    setReplyText("");
  };

  // Retranscriptions d'appel 3CX rattachées à ce ticket (alimentées par la
  // popup hotline). Affichées dans le fil de conversation, sous le dernier
  // message bot.
  const subscribe = React.useCallback((fn) => (window.HubAccess && window.HubAccess.subscribe) ? window.HubAccess.subscribe(fn) : () => {}, []);
  const callNotes = React.useSyncExternalStore(
    subscribe,
    () => (window.HubAccess && window.HubAccess.getTranscriptsForTicket) ? window.HubAccess.getTranscriptsForTicket(TICKET_ID) : []
  );

  const fmtDur = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const fmtWhen = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  };

  const Avatar = ({ name, size = 28, color, role }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", B: "#a855f7" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2,
        }}>{initials}</div>
        {role === "bot" && (
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: 999, background: "#0f172a", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>★</span>
        )}
      </div>
    );
  };

  // Fil de conversation construit dynamiquement depuis la base.
  // Événements système issus du ticket réel uniquement (création, description,
  // escalade éventuelle). Les messages humains arrivent via `addedMessages`
  // (table comments, chargée par loadComments + subscribeCommentsForTicket).
  const events = React.useMemo(() => {
    if (!t || !t.id) return [];
    const list = [];
    if (display.opened_at) {
      list.push({
        type: "system", icon: "+",
        at: fmtWhen(display.opened_at),
        text: "Ticket créé" + (display.requester && display.requester !== "—" ? " par " + display.requester : "") + ".",
      });
    }
    if (t.description && t.description.trim()) {
      list.push({
        type: "msg", from: display.requester !== "—" ? display.requester : "Demandeur",
        role: "user", color: "#6366f1",
        at: fmtWhen(display.opened_at),
        body: t.description,
      });
    }
    if (display.escalated) {
      list.push({
        type: "escalation", from: "—",
        to: display.escalated.group || "Supervision",
        group: display.escalated.group || "Supervision",
        at: fmtWhen(display.escalated.at),
        reason: display.escalated.reason || "—",
      });
    }
    return list;
  }, [t.id, t.description, display.opened_at, display.requester, display.escalated]);

  return (
    <div style={tdStyles.frame}>
      {/* ───── SIDEBAR (compact) ───── */}
      <aside style={tdStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...tdStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          <div style={tdStyles.logo}><div style={tdStyles.logoMark}>H</div></div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
        </a>
        <a href="/ticketing?new=1" style={{ ...tdStyles.newBtn, textDecoration: "none", cursor: "pointer" }} title="Créer un nouveau ticket">
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          <span>Nouveau ticket</span>
          <span style={tdStyles.kbd}>N</span>
        </a>
        <div style={tdStyles.navSection}>
          <div style={tdStyles.navLabel}>Mes vues</div>
          <a href="/ticketing" style={{ ...tdStyles.navItem, textDecoration: "none", color: "inherit" }} title="Retour à la liste complète">
            <span style={tdStyles.bullet}>▦</span><span style={{ flex: 1 }}>Tous mes tickets</span><span style={tdStyles.navCount}>9</span>
          </a>
          <a href="/ticketing?assignee=me" style={{ ...tdStyles.navItem, textDecoration: "none", color: "inherit" }} title="Tickets assignés à moi">
            <span style={tdStyles.bullet}>◉</span><span style={{ flex: 1 }}>Assignés à moi</span><span style={tdStyles.navCount}>4</span>
          </a>
        </div>
        <div style={tdStyles.navSection}>
          <div style={tdStyles.navLabel}>Statuts</div>
          {[
            { k: "open",        label: "Ouverts",    c: 2, color: "#3b82f6" },
            { k: "in_progress", label: "En cours",   c: 3, color: "#a855f7" },
            { k: "waiting",     label: "En attente", c: 1, color: "#f59e0b" },
            { k: "resolved",    label: "Résolus",    c: 2, color: "#10b981" },
          ].map((s) => {
            const active = display.status === s.k;
            return (
              <a key={s.k} href={`/ticketing?status=${s.k}`}
                 style={{ ...tdStyles.navItem, ...(active ? tdStyles.navItemActive : {}), textDecoration: "none", color: active ? "#3730a3" : "inherit" }}
                 title={`Voir tous les tickets ${s.label.toLowerCase()}`}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color }} />
                <span style={{ flex: 1, marginLeft: 6 }}>{s.label}</span>
                <span style={tdStyles.navCount}>{s.c}</span>
              </a>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        {(() => {
          const u = (window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null;
          const name = u?.name || "Camille Dufour";
          const role = u?.role || "Direction Marketing";
          return (
            <a href="/administration-utilisateurs"
               title="Profil & préférences"
               style={{ ...tdStyles.userRow, textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <Avatar name={name} size={26} color="#6366f1" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role}</div>
              </div>
            </a>
          );
        })()}
      </aside>

      {/* ───── MAIN ───── */}
      <main style={tdStyles.main}>
        {/* Topbar / breadcrumbs */}
        <header style={tdStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", flexWrap: "wrap" }}>
            {onBack && (
              <button onClick={onBack} style={{ ...tdStyles.ghostBtn, marginRight: 4, cursor: "pointer" }}>← Retour</button>
            )}
            <span>Support IT</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span>Mes tickets</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{TICKET_ID}</span>
            <button style={tdStyles.copyBtn} title="Copier la référence" onClick={() => navigator.clipboard && navigator.clipboard.writeText(TICKET_ID)}>⧉</button>

            {display.client && (
              <>
                <span style={{ color: "#cbd5e1" }}>·</span>
                <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>{display.client}</span>
              </>
            )}

            {/* Indicateur contrat de maintenance parc IT du client */}
            {display.contract && display.contract.status && (
              <span title={`${display.client} — ${display.contract.name || ""}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 999,
                      background: display.contract.status === "active" ? "#dcfce7" : display.contract.status === "expiring" ? "#fef3c7" : "#fee2e2",
                      border: `1px solid ${display.contract.status === "active" ? "#86efac" : display.contract.status === "expiring" ? "#fde68a" : "#fecaca"}`,
                      marginLeft: 8, cursor: "help",
                    }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: display.contract.status === "active" ? "#10b981" : display.contract.status === "expiring" ? "#f59e0b" : "#dc2626" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: display.contract.status === "active" ? "#065f46" : display.contract.status === "expiring" ? "#78350f" : "#991b1b", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Contrat parc {display.contract.status === "active" ? "actif" : display.contract.status === "expiring" ? "expire" : "absent"}
                </span>
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...tdStyles.iconBtn, cursor: "pointer" }} onClick={onBack} title="Retour à la liste">‹</button>
          </div>
        </header>

        {/* Body : conversation + side panel */}
        <div style={tdStyles.body}>
          {/* conversation column */}
          <section style={tdStyles.convCol}>
            {/* Bannière d'escalade (visible uniquement si le ticket est escaladé) */}
            {display.escalated && (
              <div style={escStyles.banner}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={escStyles.bannerIcon}>↑</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Ticket escaladé · {display.escalated.group || "Supervision"}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                      {display.escalated.at && (typeof display.escalated.at === "string" ? display.escalated.at : new Date(display.escalated.at).toLocaleString("fr-FR"))}
                      {display.escalated.reason && <> — {display.escalated.reason}</>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={async () => {
                    if (!dataOn) { showFlash("Mode démo — branchement DB nécessaire", "warn"); return; }
                    const { error } = await window.HubData.updateTicket(TICKET_ID, { escalated_to: null, escalated_at: null, escalated_reason: null, escalated_group: null });
                    if (error) showFlash("Erreur : " + error.message, "err"); else showFlash("✓ Vous avez repris la main sur le ticket");
                  }} style={{ ...escStyles.bannerBtnPrimary, cursor: "pointer" }}>Reprendre la main</button>
                </div>
              </div>
            )}

            {/* Title block */}
            <div style={tdStyles.titleBlock}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ ...tdStyles.statusPill, background: sMeta.soft, color: sMeta.text }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: sMeta.color }} /> {sMeta.label}
                </span>
                <span style={{ ...tdStyles.prioPill, background: pMeta.soft, color: pMeta.color }}>{pMeta.arrow} {pMeta.label}</span>
                {display.escalated && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, background: "#ede9fe", color: "#5b21b6", fontSize: 11.5, fontWeight: 700, border: "1px solid #c4b5fd" }}>
                    ↑ Escaladé · {display.escalated.group || "Supervision"}
                  </span>
                )}
                <span style={tdStyles.metaChip}>{display.category}</span>
                <span style={tdStyles.dot} />
                <span style={{ fontSize: 12, color: "#64748b" }}>{t.opened || "Ouvert il y a 1 j 22 h"}</span>
              </div>
              <h1 style={tdStyles.h1}>{display.title}</h1>
              <p style={tdStyles.subtitle}>
                Ticket <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#475569" }}>{TICKET_ID}</span> · Demandeur {display.requester} · {addedMessages.length} message{addedMessages.length > 1 ? "s" : ""}
              </p>

              {/* SLA strip — calculé depuis sla_due_at + opened_at,
                  avec fallback automatique depuis la priorité si absent */}
              {(() => {
                // SLA par priorité (heures jusqu'à résolution attendue)
                const slaHoursByPrio = { critique: 2, haute: 4, normale: 24, basse: 72 };
                let openedIso = (ticket && (ticket.opened_at || ticket.created_at)) || display.opened_at;
                let dueIso = (ticket && ticket.sla_due_at) || display.sla_due_at;
                // Fallback : si pas d'opened_at, on prend maintenant
                if (!openedIso) openedIso = new Date().toISOString();
                // Fallback : si pas de sla_due_at, on calcule depuis la priorité
                if (!dueIso) {
                  const prio = (ticket && (ticket.priority || ticket.prio)) || display.priority || "normale";
                  const h = slaHoursByPrio[prio] != null ? slaHoursByPrio[prio] : 24;
                  dueIso = new Date(new Date(openedIso).getTime() + h * 3600 * 1000).toISOString();
                }
                const now = Date.now();
                const due = new Date(dueIso).getTime();
                const opened = new Date(openedIso).getTime();
                const totalMs = due - opened;
                const remainingMs = due - now;
                const pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100)) : 100;
                const overdue = remainingMs < 0;
                const fmtRem = (ms) => {
                  const abs = Math.abs(ms);
                  const h = Math.floor(abs / 3600000);
                  const m = Math.floor((abs % 3600000) / 60000);
                  return h >= 24 ? Math.floor(h / 24) + " j " + (h % 24) + " h" : h + " h " + String(m).padStart(2, "0");
                };
                const color = overdue ? "#dc2626" : remainingMs < 3600000 ? "#dc2626" : remainingMs < 6 * 3600000 ? "#f59e0b" : "#10b981";
                const label = overdue ? "Dépassée de " + fmtRem(remainingMs) : fmtRem(remainingMs) + " restantes";
                return (
                  <div style={tdStyles.slaStrip}>
                    <div style={tdStyles.slaBlock}>
                      <div style={tdStyles.slaLabel}>Ouvert le</div>
                      <div style={tdStyles.slaValueOk}>{new Date(openedIso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>
                    <div style={tdStyles.slaSep} />
                    <div style={tdStyles.slaBlock}>
                      <div style={tdStyles.slaLabel}>SLA résolution</div>
                      <div style={{ ...tdStyles.slaValueOk, color }}>{overdue ? "⚠ " : "⏱ "}{label}</div>
                      <div style={tdStyles.slaBar}><div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999 }} /></div>
                    </div>
                    <div style={tdStyles.slaSep} />
                    <div style={tdStyles.slaBlock}>
                      <div style={tdStyles.slaLabel}>Échéance</div>
                      <div style={tdStyles.slaValueOk}>{new Date(dueIso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Conversation thread */}
            <div style={tdStyles.thread}>
              {[...events, ...addedMessages].map((e, i) => {
                if (e.type === "escalation") {
                  return (
                    <div key={i} style={escStyles.timelineRow}>
                      <div style={escStyles.timelineIcon}>↑</div>
                      <div style={escStyles.timelineCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                              <strong>{e.from}</strong> a escaladé le ticket
                              <span style={{ color: "#cbd5e1", margin: "0 6px" }}>→</span>
                              <strong style={{ color: "#5b21b6" }}>{e.to}</strong>
                              <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: "#5b21b6", background: "#ede9fe", padding: "1px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4, border: "1px solid #c4b5fd" }}>{e.group}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11.5, color: "#94a3b8", whiteSpace: "nowrap" }}>{e.at}</span>
                        </div>
                        <div style={escStyles.timelineReason}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: 0.5, marginRight: 6 }}>Motif</span>
                          {e.reason}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (e.type === "system" || e.type === "status") {
                  return (
                    <div key={i} style={tdStyles.sysRow}>
                      <div style={tdStyles.sysLine} />
                      <div style={tdStyles.sysPill}>
                        <span style={{ color: "#94a3b8", marginRight: 6 }}>{e.icon || "↻"}</span>
                        {e.type === "status" ? (
                          <>
                            <strong style={{ color: "#0f172a", fontWeight: 600 }}>{e.actor}</strong> a changé le statut
                            <span style={{ ...tdStyles.miniPill, background: "#eef4ff", color: "#1d4ed8", marginLeft: 6 }}>{e.from}</span>
                            <span style={{ color: "#cbd5e1", margin: "0 4px" }}>→</span>
                            <span style={{ ...tdStyles.miniPill, background: "#f5efff", color: "#7e22ce" }}>{e.to}</span>
                          </>
                        ) : (
                          <span>{e.text}</span>
                        )}
                        <span style={tdStyles.sysTime}>{e.at}</span>
                      </div>
                      <div style={tdStyles.sysLine} />
                    </div>
                  );
                }
                const isUser = e.role === "user";
                const isBot = e.role === "bot";
                const isNote = e.role === "note" || e.isNote;
                return (
                  <div key={i} style={{ ...tdStyles.msgRow, ...(isUser ? tdStyles.msgRowMine : {}) }}>
                    {!isUser && <Avatar name={e.from} size={32} color={e.color} role={isBot ? "bot" : null} />}
                    <div style={{ ...tdStyles.bubbleWrap, alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{e.from}</span>
                        {isNote && <span style={{ ...tdStyles.roleTag, background: "#fef3c7", color: "#78350f", borderColor: "#fde68a" }}>🔒 Note interne</span>}
                        {e.role === "agent" && !isNote && <span style={tdStyles.roleTag}>Technicien · Support</span>}
                        {isBot && <span style={{ ...tdStyles.roleTag, background: "#0f172a", color: "#fff", borderColor: "#0f172a" }}>Assistant IA</span>}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{e.at}</span>
                      </div>
                      <div style={{
                        ...tdStyles.bubble,
                        ...(isUser ? tdStyles.bubbleUser : {}),
                        ...(isBot ? tdStyles.bubbleBot : {}),
                        ...(isNote ? { background: "#fffbeb", borderColor: "#fde68a", borderStyle: "dashed", borderWidth: 1 } : {}),
                      }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: isUser ? "#fff" : "#0f172a", whiteSpace: "pre-wrap" }}>{e.body}</div>
                        {e.attachments && (
                          <div style={tdStyles.attachRow}>
                            {e.attachments.map((a) => (
                              <div key={a.name} style={tdStyles.attach}>
                                <span style={{ color: "#94a3b8" }}>📎</span>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{a.name}</div>
                                  <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{a.size}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {isBot && (
                          <div style={tdStyles.botActions}>
                            <button onClick={resolveTicket} style={{ ...tdStyles.botBtnPrimary, cursor: "pointer" }}>✓ Oui, c'est résolu</button>
                            <button onClick={() => { dataOn ? window.HubData.updateTicket(TICKET_ID, { status: "in_progress" }) : null; showFlash("Statut remis à 'En cours' — un technicien va reprendre."); }}
                                    style={{ ...tdStyles.botBtn, cursor: "pointer" }}>Non, problème persistant</button>
                          </div>
                        )}
                        {e.meta && <div style={tdStyles.bubbleMeta}>{e.meta}</div>}
                      </div>
                      {e.reactions && (
                        <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                          {e.reactions.map((r) => (
                            <span key={r.emoji} style={tdStyles.reaction}>{r.emoji} {r.count}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isUser && <Avatar name={e.from} size={32} color={e.color} />}
                  </div>
                );
              })}

              {/* Retranscriptions d'appel 3CX */}
              {callNotes.map((n, i) => (
                <div key={"call-" + i} style={callStyles.row}>
                  <div style={callStyles.iconCol}>
                    <div style={callStyles.phoneIcon}>📞</div>
                  </div>
                  <div style={callStyles.card}>
                    <div style={callStyles.cardHead}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={callStyles.badge3cx}>3CX · Speech-to-text</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Appel entrant de {n.from}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{fmtWhen(n.at)}</span>
                    </div>

                    <div style={callStyles.meta}>
                      <span>{n.phone}</span>
                      <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>
                      <span>Durée {fmtDur(n.durationSec || 0)}</span>
                      <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>
                      <span>Enregistrement archivé sur PBX 3CX</span>
                    </div>

                    <div style={callStyles.audioBar}>
                      <button onClick={() => {
                        if (n.recording_url) { window.open(n.recording_url, "_blank"); return; }
                        alert("⚠ Aucun enregistrement audio disponible pour cet appel.\n\nLes enregistrements 3CX seront accessibles dès que le PBX poussera leur URL dans la table calls (champ recording_url).");
                      }} style={{ ...callStyles.playBtn, cursor: "pointer" }} title={n.recording_url ? "Lire l'enregistrement" : "Audio indisponible"}>▶</button>
                      <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 999 }}>
                        <div style={{ width: "0%", height: "100%", background: "#10b981", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>00:00 / {fmtDur(n.durationSec || 0)}</span>
                      <button onClick={() => {
                        if (n.recording_url) {
                          const a = document.createElement("a");
                          a.href = n.recording_url; a.download = "appel-" + (n.atIso || Date.now()) + ".mp3";
                          document.body.appendChild(a); a.click(); document.body.removeChild(a);
                          return;
                        }
                        alert("⚠ Aucun enregistrement audio à télécharger.");
                      }} style={{ ...callStyles.dlBtn, cursor: "pointer" }} title={n.recording_url ? "Télécharger" : "Audio indisponible"}>⬇</button>
                    </div>

                    <div style={callStyles.transcriptLabel}>Retranscription</div>
                    <div style={callStyles.transcriptBox}>{n.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div style={tdStyles.composer}>
              <div style={tdStyles.composerTabs}>
                <button onClick={() => setComposerTabState("reply")} style={{ ...tdStyles.composerTab, ...(composerTabState === "reply" ? tdStyles.composerTabActive : {}), cursor: "pointer" }}>Réponse</button>
                <button onClick={() => setComposerTabState("note")} style={{ ...tdStyles.composerTab, ...(composerTabState === "note" ? tdStyles.composerTabActive : {}), cursor: "pointer" }}>Note interne {composerTabState === "note" && <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, color: "#a16207", background: "#fef3c7", padding: "1px 5px", borderRadius: 4 }}>PRIVÉ</span>}</button>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Markdown supporté · ⌘↵ pour envoyer</span>
              </div>
              <textarea
                style={{ ...tdStyles.composerArea, background: composerTabState === "note" ? "#fffbeb" : "#fff" }}
                placeholder={composerTabState === "note" ? "Note interne visible uniquement par l'équipe support…" : "Écrire une réponse à " + display.requester + "…"}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReply(); } }}
              />
              <div style={tdStyles.composerFoot}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setReplyText((t) => t + " @")} style={{ ...tdStyles.composerIcon, cursor: "pointer" }} title="Mentionner un collègue">@</button>
                  <button onClick={() => setReplyText((t) => t + " **gras**")} style={{ ...tdStyles.composerIcon, cursor: "pointer" }} title="Gras (Markdown)">𝐁</button>
                  <button onClick={() => setReplyText((t) => t + "\n```\ncode\n```")} style={{ ...tdStyles.composerIcon, cursor: "pointer" }} title="Bloc de code">{"</>"}</button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {flash && (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                      background: flash.tone === "err" ? "#fee2e2" : flash.tone === "warn" ? "#fef3c7" : "#dcfce7",
                      color:      flash.tone === "err" ? "#991b1b" : flash.tone === "warn" ? "#78350f" : "#065f46" }}>
                      {flash.msg}
                    </span>
                  )}
                  <button onClick={assignTicket} style={{ ...tdStyles.ghostBtn, cursor: "pointer" }} title="Assigner à un technicien">⇄ Assigner</button>
                  <button onClick={escalateTicket} style={{ ...tdStyles.ghostBtn, color: "#5b21b6", borderColor: "#c4b5fd", background: "#f5f3ff", fontWeight: 600, cursor: "pointer" }} title="Remonter le ticket au groupe Administrateur · Supervision">↑ Escalader</button>
                  <button onClick={resolveTicket} style={{ ...tdStyles.ghostBtn, cursor: "pointer" }}>✓ Résoudre</button>
                  <button onClick={closeTicket} style={{ ...tdStyles.ghostBtn, color: "#64748b", cursor: "pointer" }} title="Fermer définitivement le ticket">✕ Fermer</button>
                  <button onClick={sendReply} style={{ ...tdStyles.primaryBtn, cursor: "pointer" }}>Envoyer ↵</button>
                </div>
              </div>
            </div>
          </section>

          {/* Side panel */}
          <aside style={tdStyles.side}>
            <SidePanel Avatar={Avatar} />
          </aside>
        </div>
      </main>
    </div>
  );
};

const SidePanel = ({ Avatar }) => (
  <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

    {/* Properties */}
    <section>
      <div style={tdStyles.sideHead}>Propriétés</div>
      <Field label="Statut" value={
        <span style={{ ...tdStyles.statusPill, background: "#f5efff", color: "#7e22ce" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#a855f7" }} /> En cours
        </span>
      } />
      <Field label="Priorité" value={<span style={{ ...tdStyles.prioPill, background: "#fef0e6", color: "#ea580c" }}>▲ Haute</span>} />
      <Field label="Urgence" value={<span style={tdStyles.fieldChip}>Haute</span>} />
      <Field label="Impact" value={<span style={tdStyles.fieldChip}>Individuel</span>} />
      <Field label="Catégorie" value={<span style={tdStyles.fieldChip}>Réseau · VPN</span>} />
      <Field label="Source" value={<span style={{ fontSize: 12.5, color: "#475569" }}>Portail self-service</span>} />
    </section>

    {/* People */}
    <section>
      <div style={tdStyles.sideHead}>Personnes</div>
      <Field label="Demandeur" value={
        <div style={tdStyles.person}>
          <Avatar name="Camille Dufour" size={22} color="#6366f1" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Camille Dufour</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Marketing · Paris</div>
          </div>
        </div>
      } />
      <Field label="Assigné" value={
        <div style={tdStyles.person}>
          <Avatar name="Tom Verdier" size={22} color="#f59e0b" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Tom Verdier</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Support N2 · Réseau</div>
          </div>
        </div>
      } />
    </section>

    {/* Equipment */}
    <section>
      <div style={tdStyles.sideHead}>Équipement concerné</div>
      <div style={tdStyles.cmdb}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={tdStyles.cmdbIcon}>💻</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>DESKTOP-CD24</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>Dell Latitude 7440 · S/N 7HX29Z3</div>
          </div>
        </div>
        <div style={tdStyles.cmdbGrid}>
          <div><div style={tdStyles.cmdbK}>OS</div><div style={tdStyles.cmdbV}>Windows 11 23H2</div></div>
          <div><div style={tdStyles.cmdbK}>Wi-Fi</div><div style={tdStyles.cmdbV}>Intel AX211 · 23.50.1</div></div>
          <div><div style={tdStyles.cmdbK}>VPN</div><div style={tdStyles.cmdbV}>Astorya-VPN-02</div></div>
          <div><div style={tdStyles.cmdbK}>Site</div><div style={tdStyles.cmdbV}>Paris HQ — 4ᵉ ét.</div></div>
        </div>
      </div>
    </section>

    {/* Linked */}
    <section>
      <div style={tdStyles.sideHead}>Liens</div>
      <div style={tdStyles.linkRow}>
        <span style={tdStyles.linkRef}>INC-2812</span>
        <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>VPN — déconnexions Wi-Fi (résolu)</span>
        <span style={{ ...tdStyles.statusDot, background: "#10b981" }} />
      </div>
      <div style={tdStyles.linkRow}>
        <span style={tdStyles.linkRef}>KB-0148</span>
        <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>Driver Intel AX211 — procédure</span>
        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>📘</span>
      </div>
    </section>

    {/* Activity summary */}
    <section>
      <div style={tdStyles.sideHead}>Métriques</div>
      <div style={tdStyles.metricGrid}>
        <div><div style={tdStyles.metricK}>Temps écoulé</div><div style={tdStyles.metricV}>1 j 22 h</div></div>
        <div><div style={tdStyles.metricK}>Réponses</div><div style={tdStyles.metricV}>11</div></div>
        <div><div style={tdStyles.metricK}>Réouvertures</div><div style={tdStyles.metricV}>0</div></div>
        <div><div style={tdStyles.metricK}>Pièces jointes</div><div style={tdStyles.metricV}>3</div></div>
      </div>
    </section>
  </div>
);

const Field = ({ label, value }) => (
  <div style={tdStyles.field}>
    <div style={tdStyles.fieldLabel}>{label}</div>
    <div style={tdStyles.fieldValue}>{value}</div>
  </div>
);

const tdStyles = {
  frame: { width: "100%", minHeight: "100vh", display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a",  },

  // sidebar (compact)
  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 11 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  // main
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 20px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  copyBtn: { width: 22, height: 22, border: "1px solid #e2e8f0", background: "#fafbfc", borderRadius: 5, fontSize: 11, color: "#94a3b8", cursor: "pointer" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },
  ghostBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 14px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  body: { flex: 1, display: "flex", overflow: "hidden" },
  convCol: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid #eef1f5", overflow: "hidden" },

  // Title block
  titleBlock: { padding: "20px 28px 18px", borderBottom: "1px solid #eef1f5", background: "#fff" },
  statusPill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 500 },
  prioPill: { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 600 },
  metaChip: { fontSize: 11.5, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#eef1f5", fontWeight: 500 },
  dot: { width: 3, height: 3, background: "#cbd5e1", borderRadius: 999 },
  h1: { fontSize: 24, fontWeight: 600, letterSpacing: -0.7, margin: 0, color: "#0f172a", lineHeight: 1.25 },
  subtitle: { fontSize: 12.5, color: "#64748b", margin: "6px 0 0" },

  slaStrip: { display: "flex", alignItems: "stretch", gap: 18, marginTop: 14, padding: "12px 16px", background: "linear-gradient(180deg, #fafbfc, #f5f7fa)", border: "1px solid #eef1f5", borderRadius: 10 },
  slaBlock: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  slaLabel: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  slaValueOk: { fontSize: 13, fontWeight: 600, color: "#0e7a55" },
  slaValueDanger: { fontSize: 13, fontWeight: 600, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" },
  slaBar: { width: "100%", height: 3, background: "#fde2e2", borderRadius: 999, marginTop: 2 },
  slaSep: { width: 1, background: "#eef1f5" },
  kbLink: { fontSize: 12.5, color: "#4f46e5", fontWeight: 500, cursor: "pointer" },

  // Thread
  thread: { flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16, background: "#fafbfc" },

  // System rows
  sysRow: { display: "flex", alignItems: "center", gap: 10, margin: "2px 0" },
  sysLine: { flex: 1, height: 1, background: "#eef1f5" },
  sysPill: { fontSize: 11.5, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 999, whiteSpace: "nowrap" },
  sysTime: { color: "#94a3b8", marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 },
  miniPill: { padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 600 },

  // Messages
  msgRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  msgRowMine: { flexDirection: "row" },
  bubbleWrap: { display: "flex", flexDirection: "column", maxWidth: "78%", flex: 1 },
  bubble: { padding: "10px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, borderTopLeftRadius: 4 },
  bubbleUser: { background: "#4f46e5", border: "1px solid #4338ca", borderRadius: 12, borderTopRightRadius: 4, color: "#fff" },
  bubbleBot: { background: "#0f172a", borderColor: "#0f172a", color: "#fff" },
  bubbleMeta: { fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" },
  roleTag: { fontSize: 10, padding: "1px 6px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  attachRow: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" },
  attach: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 },
  reaction: { fontSize: 11, padding: "2px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999, color: "#475569" },

  botActions: { display: "flex", gap: 8, marginTop: 12 },
  botBtnPrimary: { padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  botBtn: { padding: "6px 12px", background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 12, cursor: "pointer" },

  // Composer
  composer: { background: "#fff", borderTop: "1px solid #eef1f5", padding: "10px 18px 14px" },
  composerTabs: { display: "flex", alignItems: "center", gap: 4, marginBottom: 8 },
  composerTab: { padding: "4px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  composerTabActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  composerArea: { width: "100%", minHeight: 80, padding: 12, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", color: "#0f172a", resize: "none", outline: "none", lineHeight: 1.5, boxSizing: "border-box" },
  composerFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  composerIcon: { width: 28, height: 28, border: "1px solid transparent", background: "transparent", borderRadius: 6, color: "#64748b", cursor: "pointer", fontSize: 13 },

  // Side panel
  side: { width: 320, background: "#fff", overflowY: "auto", flexShrink: 0 },
  sideHead: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 },
  field: { display: "flex", alignItems: "center", padding: "6px 0", gap: 10, minHeight: 30 },
  fieldLabel: { fontSize: 12, color: "#64748b", width: 96, flexShrink: 0 },
  fieldValue: { flex: 1, minWidth: 0 },
  fieldChip: { fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "#eef1f5", color: "#475569", fontWeight: 500 },
  person: { display: "flex", alignItems: "center", gap: 8 },
  addPill: { padding: "3px 9px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer" },

  cmdb: { padding: 12, border: "1px solid #eef1f5", borderRadius: 10, background: "#fafbfc", display: "flex", flexDirection: "column", gap: 12 },
  cmdbIcon: { width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  cmdbGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" },
  cmdbK: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  cmdbV: { fontSize: 12, color: "#0f172a", fontWeight: 500, marginTop: 1 },

  linkRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid transparent", borderRadius: 6, cursor: "pointer" },
  linkRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4f46e5", fontWeight: 600 },
  statusDot: { width: 7, height: 7, borderRadius: 999, flexShrink: 0 },

  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  metricK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  metricV: { fontSize: 16, fontWeight: 600, color: "#0f172a", marginTop: 2, letterSpacing: -0.3 },
};

const escStyles = {
  banner: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 18px", background: "linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)", borderRadius: 12, marginBottom: 14 },
  bannerIcon: { width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.18)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 },
  bannerBtnGhost: { padding: "6px 12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  bannerBtnPrimary: { padding: "6px 12px", background: "#fff", border: 0, borderRadius: 7, color: "#5b21b6", fontSize: 12, fontWeight: 700, cursor: "pointer" },

  timelineRow: { display: "flex", gap: 12, alignItems: "flex-start", margin: "10px 0" },
  timelineIcon: { width: 32, height: 32, borderRadius: 999, background: "#ede9fe", color: "#5b21b6", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, border: "2px solid #fff", boxShadow: "0 0 0 1px #c4b5fd", flexShrink: 0 },
  timelineCard: { flex: 1, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  timelineReason: { fontSize: 12.5, lineHeight: 1.55, color: "#334155", padding: "9px 12px", background: "#fff", border: "1px dashed #c4b5fd", borderRadius: 8 },
};

const callStyles = {
  row: { display: "flex", gap: 12, alignItems: "flex-start", margin: "14px 0" },
  iconCol: { width: 32, display: "flex", justifyContent: "center", flexShrink: 0 },
  phoneIcon: { width: 32, height: 32, borderRadius: 999, background: "#dcfce7", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "2px solid #fff", boxShadow: "0 0 0 1px #bbf7d0" },
  card: { flex: 1, background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  badge3cx: { fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "#10b981", color: "#fff" },
  meta: { fontSize: 11.5, color: "#64748b" },
  audioBar: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 },
  playBtn: { width: 28, height: 28, borderRadius: 999, background: "#10b981", color: "#fff", border: 0, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", paddingLeft: 2 },
  dlBtn: { width: 26, height: 26, borderRadius: 6, background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" },
  transcriptLabel: { fontSize: 10.5, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  transcriptBox: { fontSize: 12.5, lineHeight: 1.6, color: "#334155", padding: "10px 12px", background: "#f0fdf4", border: "1px dashed #bbf7d0", borderRadius: 8, fontStyle: "italic" },
};

window.TicketDetail = TicketDetail;
