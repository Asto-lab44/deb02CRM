// ════════════════════════════════════════════════════════════════════
// ProjectDetail — Fiche détaillée d'un projet (/projet?id=…)
// ════════════════════════════════════════════════════════════════════
//
// Structure :
//   [Sidebar gauche]  Stages workflow + retour kanban
//   [Topbar]          ref Sage, client, badge stage, boutons avancer/clore
//   [Colonne main]    Stepper visuel 7 stages + sections
//                     - Infos projet (nom, description, montants, dates)
//                     - Livrables (project_items)
//                     - Timeline événements
//   [Colonne side]    Chef de projet + équipe + propriétés éditables
//
// Sources : api.projects.getById (qui joint items + team + events)
// Realtime : reload auto via HubData.subscribeChanges
// ════════════════════════════════════════════════════════════════════

const ProjectDetail = () => {
  const STAGES = (window.api && window.api.projects && window.api.projects.STAGES) || [];
  const urlId = (typeof window !== "undefined") ? new URLSearchParams(window.location.search).get("id") : null;

  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [profiles, setProfiles] = React.useState([]);

  const reload = React.useCallback(async () => {
    if (!urlId || !window.api || !window.api.projects) { setLoading(false); return; }
    setLoading(true);
    const p = await window.api.projects.getById(urlId);
    setProject(p);
    setLoading(false);
  }, [urlId]);

  React.useEffect(() => {
    reload();
    if (window.HubData && window.HubData.fetchProfiles) {
      window.HubData.fetchProfiles().then(({ data }) => setProfiles(data || []));
    }
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  if (!urlId) {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#64748b" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Aucun projet sélectionné</div>
        <a href="/projets" style={{ padding: "9px 16px", background: "#0f172a", color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Retour au kanban</a>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>Chargement du projet…</div>;
  }

  if (!project) {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#64748b" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Projet introuvable</div>
        <div style={{ fontSize: 13, marginBottom: 18 }}>ID : <code>{urlId}</code></div>
        <a href="/projets" style={{ padding: "9px 16px", background: "#0f172a", color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Retour au kanban</a>
      </div>
    );
  }

  const fmtEUR = (n) => n != null ? Math.round(n).toLocaleString("fr-FR") + " €" : "—";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  const stage = STAGES.find((s) => s.k === project.stage) || STAGES[0];
  const overdue = project.delivery_due && new Date(project.delivery_due) < new Date() && project.stage !== "clos";

  // ───── Actions
  const advance = async () => {
    const idx = STAGES.findIndex((s) => s.k === project.stage);
    if (idx === -1 || idx >= STAGES.length - 1) {
      if (window.HubToast) window.HubToast.warn("Le projet est déjà au stade final.");
      return;
    }
    const next = STAGES[idx + 1];
    try {
      await window.api.projects.changeStage(project.id, next.k);
      if (window.HubToast) window.HubToast.success("✓ Passé en « " + next.label + " »");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const setStageManual = async (newK) => {
    if (newK === project.stage) return;
    try {
      await window.api.projects.changeStage(project.id, newK);
      if (window.HubToast) window.HubToast.success("✓ Stage maj");
      reload();
    } catch (e) { if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e)); }
  };

  const cancel = async () => {
    const ok = window.HubModal ? await window.HubModal.confirm({
      title: "Annuler ce projet ?",
      message: "Le projet sera marqué comme annulé. Tu pourras le restaurer en changeant son stage manuellement.",
      okLabel: "Annuler le projet", okStyle: "danger",
    }) : confirm("Annuler ce projet ?");
    if (!ok) return;
    await window.api.projects.changeStage(project.id, "annule");
    if (window.HubToast) window.HubToast.success("✓ Projet annulé");
    reload();
  };

  const editField = async (field, currentVal, label) => {
    const val = window.HubModal ? await window.HubModal.prompt({
      title: "Modifier " + label, label, default: currentVal || "", okLabel: "Enregistrer",
    }) : prompt(label, currentVal || "");
    if (val == null) return;
    await window.api.projects.update(project.id, { [field]: val });
    reload();
    if (window.HubToast) window.HubToast.success("✓ " + label + " mis à jour");
  };

  const setDueDate = async () => {
    const val = window.HubModal ? await window.HubModal.prompt({
      title: "Date de livraison souhaitée", label: "Date (YYYY-MM-DD)",
      default: project.delivery_due || new Date().toISOString().slice(0, 10),
      inputType: "date", okLabel: "Enregistrer",
    }) : prompt("Date livraison (YYYY-MM-DD)", project.delivery_due || "");
    if (!val) return;
    await window.api.projects.update(project.id, { delivery_due: val });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Date de livraison enregistrée");
  };

  const assignPM = async () => {
    if (!profiles.length) {
      if (window.HubToast) window.HubToast.warn("Aucun profil disponible. Crée d'abord des comptes utilisateurs.");
      return;
    }
    if (!window.HubModal) return;
    const chosen = await window.HubModal.choice({
      title: "Affecter un chef de projet",
      message: "Choisis le PM qui pilote ce projet.",
      options: profiles.map((p) => ({ value: p.id, label: p.name || p.email, sub: p.team || p.role || "—" })),
    });
    if (!chosen) return;
    const p = profiles.find((x) => x.id === chosen);
    await window.api.projects.update(project.id, { pm_id: chosen, pm_name: p ? p.name : null });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Chef de projet : " + (p ? p.name : "—"));
  };

  const addTeamMember = async () => {
    if (!profiles.length || !window.HubModal) return;
    const chosen = await window.HubModal.choice({
      title: "Ajouter un membre à l'équipe",
      options: profiles
        .filter((p) => !(project.team || []).find((t) => t.profile_id === p.id))
        .map((p) => ({ value: p.id, label: p.name || p.email, sub: p.team || p.role || "—" })),
    });
    if (!chosen) return;
    const role = await window.HubModal.choice({
      title: "Rôle dans le projet",
      options: [
        { value: "technicien", label: "Technicien" },
        { value: "livreur", label: "Livreur" },
        { value: "installateur", label: "Installateur" },
        { value: "support", label: "Support" },
        { value: "membre", label: "Membre (générique)" },
      ],
    });
    if (!role) return;
    await window.api.projects.addTeamMember(project.id, chosen, role);
    reload();
    if (window.HubToast) window.HubToast.success("✓ Membre ajouté");
  };

  const removeTeamMember = async (profileId, name) => {
    const ok = window.HubModal ? await window.HubModal.confirm({
      title: "Retirer " + (name || "ce membre") + " ?", okLabel: "Retirer", okStyle: "danger",
    }) : confirm("Retirer ce membre ?");
    if (!ok) return;
    await window.api.projects.removeTeamMember(project.id, profileId);
    reload();
    if (window.HubToast) window.HubToast.success("✓ Membre retiré");
  };

  const addComment = async () => {
    const text = window.HubModal ? await window.HubModal.prompt({
      title: "Ajouter un commentaire", label: "Message", multiline: true, okLabel: "Publier",
    }) : prompt("Commentaire :");
    if (!text || !text.trim()) return;
    await window.api.projects.addEvent(project.id, "comment", { text: text.trim() });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Commentaire publié");
  };

  return (
    <div style={S.frame}>
      {/* Styles impression PDF */}
      <style>{`
        @media print {
          aside, .topbar-actions, .pdf-hide { display: none !important; }
          body * { visibility: hidden; }
          .pdf-page, .pdf-page * { visibility: visible; }
          .pdf-page { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; box-shadow: none !important; }
          .pdf-page table, .pdf-page .card { box-shadow: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <a href="/" style={{ ...S.brand, textDecoration: "none", color: "inherit" }}>
          <div style={S.logo}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Projet</div>
          </div>
        </a>
        <a href="/projets" style={{ ...S.backBtn, textDecoration: "none" }}>← Tous les projets</a>

        <div style={{ ...S.navSection, marginTop: 8 }}>
          <div style={S.navLabel}>Stage actuel</div>
          {STAGES.map((s) => (
            <div key={s.k} onClick={() => setStageManual(s.k)} style={{ ...S.navItem, ...(project.stage === s.k ? S.navItemActive : {}) }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
              <span style={{ flex: 1, marginLeft: 4 }}>{s.label}</span>
              {project.stage === s.k && <span style={{ fontSize: 10, color: "#3730a3", fontWeight: 700 }}>● ACTUEL</span>}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </aside>

      {/* MAIN */}
      <main style={S.main} className="pdf-page">
        {/* Topbar */}
        <header style={S.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <a href="/projets" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Projets</a>
            <span style={{ color: "#cbd5e1" }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{project.sage_ref || project.id}</span>
            <span style={{ ...S.stageBadge, background: stage.color + "15", color: stage.color, border: "1px solid " + stage.color + "30" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: stage.color }} />
              {stage.label}
            </span>
            {overdue && <span style={S.overdueBadge}>⏰ EN RETARD</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()} style={S.btnGhost} title="Télécharger en PDF (via dialog impression)">↓ PDF</button>
            {project.stage !== "clos" && project.stage !== "annule" && (
              <>
                <button onClick={cancel} style={S.btnDanger}>✕ Annuler</button>
                <button onClick={advance} style={S.btnPrimary}>Avancer →</button>
              </>
            )}
          </div>
        </header>

        {/* Stepper */}
        <div style={S.stepperWrap}>
          {STAGES.map((s, i) => {
            const passed = STAGES.findIndex((x) => x.k === project.stage) >= i;
            const current = project.stage === s.k;
            return (
              <div key={s.k} style={S.stepperItem}>
                <div style={{ ...S.stepperDot, background: passed ? s.color : "#e2e8f0", color: passed ? "#fff" : "#94a3b8", boxShadow: current ? "0 0 0 4px " + s.color + "30" : "none" }}>
                  {passed ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: current ? 700 : 500, color: passed ? "#0f172a" : "#94a3b8", textAlign: "center", marginTop: 6 }}>{s.label}</div>
                {i < STAGES.length - 1 && <div style={{ ...S.stepperLine, background: passed ? s.color : "#e2e8f0" }} />}
              </div>
            );
          })}
        </div>

        {/* Body 2 colonnes */}
        <div style={S.body}>
          <section style={S.colMain}>
            {/* Bloc nom + description */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h1 style={S.h1}>{project.name}</h1>
                  {project.description && <p style={S.descr}>{project.description}</p>}
                </div>
                <button onClick={() => editField("name", project.name, "Nom du projet")} style={S.editBtn}>✎ Éditer</button>
              </div>
              <div style={S.metaGrid}>
                <Meta label="Montant HT"  val={fmtEUR(project.amount_ht)} />
                <Meta label="Montant TTC" val={fmtEUR(project.amount_ttc)} strong />
                <Meta label="Livraison souhaitée" val={fmtDate(project.delivery_due)} onClick={setDueDate} editable />
                <Meta label="Livré le"  val={fmtDate(project.delivery_done)} />
                <Meta label="Installé le" val={fmtDate(project.install_done)} />
                <Meta label="Recette le" val={fmtDate(project.recette_done)} />
              </div>
            </div>

            {/* Livrables avec édition inline */}
            <ItemsBlock project={project} reload={reload} fmtEUR={fmtEUR} S={S} />

            {/* Timeline */}
            <div style={S.card}>
              <div style={S.cardHead}>
                <h2 style={S.h2}>📜 Timeline ({(project.events || []).length})</h2>
                <button onClick={addComment} style={S.smallBtn}>+ Commentaire</button>
              </div>
              {(project.events || []).length === 0 ? (
                <div style={S.empty}>Aucun événement. L'historique se remplit automatiquement aux changements de stage.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {project.events.map((e) => <EventRow key={e.id} ev={e} STAGES={STAGES} />)}
                </div>
              )}
            </div>
          </section>

          {/* COLONNE SIDE */}
          <aside style={S.colSide}>
            {/* Chef de projet */}
            <div style={S.card}>
              <h2 style={S.h2}>👤 Chef de projet</h2>
              {project.pm_name ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <Avatar name={project.pm_name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{project.pm_name}</div>
                  </div>
                  <button onClick={assignPM} style={S.smallBtn}>Changer</button>
                </div>
              ) : (
                <button onClick={assignPM} style={{ ...S.btnPrimary, width: "100%", marginTop: 6 }}>+ Affecter un chef</button>
              )}
            </div>

            {/* Équipe */}
            <div style={S.card}>
              <div style={S.cardHead}>
                <h2 style={S.h2}>👥 Équipe ({(project.team || []).length})</h2>
                <button onClick={addTeamMember} style={S.smallBtn}>+ Ajouter</button>
              </div>
              {(project.team || []).length === 0 ? (
                <div style={{ ...S.empty, padding: 12, fontSize: 11.5 }}>Aucun membre. Clique « + Ajouter ».</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {project.team.map((t) => (
                    <div key={t.profile_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <Avatar name={(t.profile && t.profile.name) || "?"} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.profile && t.profile.name || "?"}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{t.role}</div>
                      </div>
                      <button onClick={() => removeTeamMember(t.profile_id, t.profile && t.profile.name)} title="Retirer" style={{ background: "transparent", border: 0, color: "#cbd5e1", fontSize: 14, cursor: "pointer", padding: 4 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liens */}
            <div style={S.card}>
              <h2 style={S.h2}>🔗 Liens</h2>
              {project.client_id && <a href={"/fiche-client?id=" + encodeURIComponent(project.client_id)} style={S.linkRow}>◉ Voir le client</a>}
              {project.opp_id && <a href={"/avancer-opportunite?opp=" + encodeURIComponent(project.opp_id)} style={S.linkRow}>€ Opportunité d'origine</a>}
              {project.sage_ref && <div style={{ ...S.linkRow, color: "#94a3b8", cursor: "default" }}>🧾 Sage : {project.sage_ref}</div>}
            </div>

            {/* Métadonnées */}
            <div style={S.card}>
              <h2 style={S.h2}>ℹ Métadonnées</h2>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.8 }}>
                <div>Créé le : <strong style={{ color: "#0f172a" }}>{fmtDateTime(project.created_at)}</strong></div>
                <div>Maj : <strong style={{ color: "#0f172a" }}>{fmtDateTime(project.updated_at)}</strong></div>
                {project.closed_at && <div>Clôturé : <strong style={{ color: "#0f172a" }}>{fmtDateTime(project.closed_at)}</strong></div>}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

// ───── Sous-composants
const ItemsBlock = ({ project, reload, fmtEUR, S }) => {
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState({});

  const startEdit = (it) => {
    setEditingId(it.id);
    setDraft({ ...it });
  };
  const cancelEdit = () => { setEditingId(null); setDraft({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    // Recalcule total_ht à partir de quantity * unit_price_ht
    const qty = parseFloat(draft.quantity) || 0;
    const pu = parseFloat(draft.unit_price_ht) || 0;
    const total = qty * pu;
    const patch = {
      designation: draft.designation,
      quantity: qty,
      unit: draft.unit || "u",
      unit_price_ht: pu,
      total_ht: total,
      status: draft.status,
      ref_produit: draft.ref_produit || null,
      delivered_qty: parseFloat(draft.delivered_qty) || 0,
    };
    await window.api.projects.updateItem(editingId, patch);
    if (window.HubToast) window.HubToast.success("✓ Livrable mis à jour");
    cancelEdit();
    reload();
  };

  const addItem = async () => {
    if (!window.HubModal) return;
    const designation = await window.HubModal.prompt({ title: "Nouveau livrable", label: "Désignation", placeholder: "ex : Astorya Suite Enterprise 250 licences", okLabel: "Continuer" });
    if (!designation || !designation.trim()) return;
    try {
      await window.api.projects.addItem(project.id, {
        designation: designation.trim(),
        quantity: 1, unit: "u", unit_price_ht: 0, total_ht: 0, status: "todo",
      });
      if (window.HubToast) window.HubToast.success("✓ Livrable ajouté — édite les détails inline");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const removeItem = async (it) => {
    const ok = window.HubModal ? await window.HubModal.confirm({
      title: "Supprimer ce livrable ?", message: it.designation,
      okLabel: "Supprimer", okStyle: "danger",
    }) : confirm("Supprimer ?");
    if (!ok) return;
    await window.api.projects.removeItem(it.id);
    if (window.HubToast) window.HubToast.success("✓ Livrable supprimé");
    reload();
  };

  const cellInput = { width: "100%", border: "1px solid #cbd5e1", padding: "4px 8px", borderRadius: 5, fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff" };

  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <h2 style={S.h2}>📦 Livrables ({(project.items || []).length})</h2>
        <button onClick={addItem} style={S.smallBtn}>+ Ajouter un livrable</button>
      </div>
      {(project.items || []).length === 0 ? (
        <div style={S.empty}>Aucun livrable. Clique « + Ajouter un livrable » ou importe via CSV.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Désignation</th>
              <th style={{ ...S.th, textAlign: "right", width: 70 }}>Qté</th>
              <th style={{ ...S.th, textAlign: "right", width: 100 }}>PU HT</th>
              <th style={{ ...S.th, textAlign: "right", width: 100 }}>Total HT</th>
              <th style={{ ...S.th, width: 110 }}>Statut</th>
              <th style={{ ...S.th, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {project.items.map((it) => {
              const isEdit = editingId === it.id;
              if (isEdit) {
                return (
                  <tr key={it.id} style={{ background: "#fafbfc" }}>
                    <td style={S.td}>
                      <input value={draft.designation || ""} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} style={cellInput} placeholder="Désignation" />
                      <input value={draft.ref_produit || ""} onChange={(e) => setDraft({ ...draft, ref_produit: e.target.value })} style={{ ...cellInput, marginTop: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} placeholder="Ref produit (optionnel)" />
                    </td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <input type="number" value={draft.quantity || 0} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} style={{ ...cellInput, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }} />
                    </td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <input type="number" step="0.01" value={draft.unit_price_ht || 0} onChange={(e) => setDraft({ ...draft, unit_price_ht: e.target.value })} style={{ ...cellInput, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }} />
                    </td>
                    <td style={{ ...S.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                      {fmtEUR((parseFloat(draft.quantity) || 0) * (parseFloat(draft.unit_price_ht) || 0))}
                    </td>
                    <td style={S.td}>
                      <select value={draft.status || "todo"} onChange={(e) => setDraft({ ...draft, status: e.target.value })} style={cellInput}>
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="delivered">Livré</option>
                        <option value="installed">Installé</option>
                        <option value="validated">Validé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={saveEdit} title="Enregistrer" style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: 0, borderRadius: 5, fontSize: 11, cursor: "pointer" }}>✓</button>
                        <button onClick={cancelEdit} title="Annuler" style={{ padding: "4px 8px", background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>×</button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={it.id} onDoubleClick={() => startEdit(it)} title="Double-clique pour éditer">
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{it.designation}</div>
                    {it.ref_produit && <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{it.ref_produit}</div>}
                    {it.serial_numbers && it.serial_numbers.length > 0 && <div style={{ fontSize: 10.5, color: "#0e7a55", marginTop: 2 }}>SN : {it.serial_numbers.join(", ")}</div>}
                  </td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{Number(it.quantity).toFixed(0)} {it.unit}</td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(it.unit_price_ht)}</td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{fmtEUR(it.total_ht)}</td>
                  <td style={S.td}><ItemStatusBadge status={it.status} /></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => startEdit(it)} title="Éditer" style={{ padding: "4px 8px", background: "transparent", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>✎</button>
                      <button onClick={() => removeItem(it)} title="Supprimer" style={{ padding: "4px 8px", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>×</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Total ligne */}
            <tr style={{ background: "#fafbfc", borderTop: "2px solid #0f172a" }}>
              <td colSpan={3} style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>TOTAL HT</td>
              <td style={{ ...S.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                {fmtEUR((project.items || []).reduce((s, it) => s + (Number(it.total_ht) || 0), 0))}
              </td>
              <td colSpan={2} style={S.td}></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

const Meta = ({ label, val, strong, editable, onClick }) => (
  <div style={{ padding: 10, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, cursor: editable ? "pointer" : "default" }} onClick={onClick}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: strong ? 16 : 13.5, fontWeight: strong ? 700 : 600, color: "#0f172a", marginTop: 3, fontFamily: strong ? "'JetBrains Mono', monospace" : "inherit" }}>{val}{editable && <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 11 }}>✎</span>}</div>
  </div>
);

const ItemStatusBadge = ({ status }) => {
  const map = {
    todo: { l: "À faire", bg: "#f1f5f9", c: "#64748b" },
    in_progress: { l: "En cours", bg: "#fef3c7", c: "#92400e" },
    delivered: { l: "Livré", bg: "#dbeafe", c: "#1e40af" },
    installed: { l: "Installé", bg: "#cffafe", c: "#155e75" },
    validated: { l: "Validé", bg: "#dcfce7", c: "#065f46" },
    cancelled: { l: "Annulé", bg: "#fee2e2", c: "#991b1b" },
  };
  const m = map[status] || map.todo;
  return <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: m.bg, color: m.c, fontWeight: 700, letterSpacing: 0.3 }}>{m.l}</span>;
};

const EventRow = ({ ev, STAGES }) => {
  const fmtWhen = (d) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  let icon = "•", text = "Événement", color = "#94a3b8";
  if (ev.type === "created") { icon = "+"; text = "Projet créé"; color = "#0ea5e9"; }
  else if (ev.type === "stage_change") {
    icon = "→"; color = "#a855f7";
    const to = STAGES.find((s) => s.k === ev.payload?.to);
    text = "Passé en « " + (to ? to.label : ev.payload?.to) + " »";
    if (ev.payload?.reason) text += " — " + ev.payload.reason;
  }
  else if (ev.type === "team_add") { icon = "+"; text = "Membre ajouté à l'équipe"; color = "#10b981"; }
  else if (ev.type === "comment") { icon = "💬"; text = ev.payload?.text || "Commentaire"; color = "#475569"; }
  else if (ev.type === "delivery") { icon = "🚚"; text = "Livraison enregistrée"; color = "#ea580c"; }
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 24, height: 24, borderRadius: 999, background: color + "20", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: "#0f172a", whiteSpace: "pre-wrap" }}>{text}</div>
        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{ev.author_name || "Système"} · {fmtWhen(ev.created_at)}</div>
      </div>
    </div>
  );
};

const Avatar = ({ name, size = 32 }) => {
  const init = (name || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>{init}</div>
  );
};

const S = {
  frame: { display: "flex", minHeight: "100vh", background: "#f3f5f8", fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 14, flexShrink: 0, position: "sticky", top: 0, height: "100vh" },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 12px", borderBottom: "1px solid #f1f5f9" },
  logo: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  backBtn: { display: "block", padding: "9px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center" },
  navSection: { display: "flex", flexDirection: "column", gap: 2 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 8px 4px" },
  navItem: { display: "flex", alignItems: "center", gap: 4, padding: "7px 10px", borderRadius: 6, fontSize: 12, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },

  main: { flex: 1 },
  topbar: { padding: "16px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  stageBadge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginLeft: 8 },
  overdueBadge: { fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontWeight: 800, letterSpacing: 0.4 },
  btnPrimary: { padding: "8px 16px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  btnDanger: { padding: "8px 12px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnGhost: { padding: "8px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" },

  stepperWrap: { display: "flex", padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", gap: 0, overflowX: "auto" },
  stepperItem: { flex: 1, minWidth: 90, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  stepperDot: { width: 32, height: 32, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, transition: "all .12s" },
  stepperLine: { position: "absolute", top: 16, left: "50%", right: "-50%", height: 2, zIndex: 0 },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, padding: 20 },
  colMain: { display: "flex", flexDirection: "column", gap: 14 },
  colSide: { display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: 16 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  h1: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 },
  h2: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 },
  descr: { fontSize: 13, color: "#475569", margin: "6px 0 0", lineHeight: 1.5 },
  editBtn: { padding: "5px 10px", background: "transparent", color: "#3730a3", border: "1px solid #e0e7ff", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer" },
  smallBtn: { padding: "5px 10px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer" },

  metaGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "8px 10px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5", textAlign: "left", background: "#fafbfc" },
  td: { padding: "10px", fontSize: 12.5, borderBottom: "1px solid #f1f5f9", color: "#0f172a" },

  empty: { padding: 20, textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc" },

  linkRow: { display: "block", padding: "8px 0", fontSize: 12.5, color: "#3730a3", textDecoration: "none", borderBottom: "1px solid #f1f5f9" },
};

window.ProjectDetail = ProjectDetail;
