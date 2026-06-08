// Formulaire nouvelle opportunité — modal / écran de création

const NewOpportunity = () => {
  // ───── Recherche client (Supabase clients + prospects locaux)
  const [clientSearch, setClientSearch] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState(null);
  const [allClients, setAllClients] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const list = await window.api.clients.list();
      const mapped = (list || []).map((p) => ({
        id: p.id,
        name: p.raison_sociale || p.name,
        sector: p.secteur || p.industry,
        city: p.ville || p.city,
        siren: p.siren,
        since: p.status === "client" ? "Client" : "Nouveau prospect",
        source: p.status === "client" ? "supabase" : "local",
      }));
      setAllClients(mapped);
      const urlClientId = new URLSearchParams(window.location.search).get("client");
      if (urlClientId) {
        const hit = mapped.find((c) => c.id === urlClientId);
        if (hit) setSelectedClient(hit);
      }
    })();
  }, []);

  const q = clientSearch.trim().toLowerCase();
  const matches = q ? allClients.filter((c) => [c.name, c.sector, c.city, c.siren].some((v) => String(v || "").toLowerCase().includes(q))).slice(0, 8) : allClients.slice(0, 5);

  const [oppName, setOppName]     = React.useState("");
  const [oppAmount, setOppAmount] = React.useState("");
  const [oppDate, setOppDate]     = React.useState("");
  const [oppNotes, setOppNotes]   = React.useState("");
  const [oppType, setOppType]     = React.useState("new"); // new | extension | renewal | upsell
  const [oppProduit, setOppProduit] = React.useState("Astorya Suite");
  const [oppModules, setOppModules] = React.useState([]); // ["Cyber", "Hub", ...]
  const [oppSource, setOppSource] = React.useState("Référence client existant");
  const [oppDuration, setOppDuration] = React.useState("3 ans");
  const [oppStage, setOppStage] = React.useState("qualif");
  // Owner par défaut = nom de l'utilisateur connecté (via HubAccess).
  // Fallback "Romain Daviaud" si pas de session.
  const initialOwner = (() => {
    try {
      const u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
      return (u && u.name) || "Romain Daviaud";
    } catch (e) { return "Romain Daviaud"; }
  })();
  const [oppOwner, setOppOwner] = React.useState(initialOwner);
  const [oppTags,  setOppTags]  = React.useState([]);
  // Stage pré-sélectionné via ?stage=
  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("stage");
    if (s) setOppStage(s);
  }, []);
  const [flash, setFlash]         = React.useState(null);

  // Résolution du dossier prospect complet (pour récupérer contact_principal + contacts_additionnels)
  const fullProspect = React.useMemo(() => {
    if (!selectedClient) return null;
    try {
      const local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      return local.find((p) => p.id === selectedClient.id) || null;
    } catch (e) { return null; }
  }, [selectedClient]);

  // Probabilité auto selon étape
  const stageProba = { qualif: 20, discovery: 35, propo: 55, nego: 75, won: 100 };
  const proba = stageProba[oppStage] || 20;

  // Toggle module
  const toggleModule = (m) => setOppModules((arr) => arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]);
  const showFlash = (m, tone = "ok") => { setFlash({ m, tone }); setTimeout(() => setFlash(null), 2800); };

  const createOpp = async () => {
    if (!selectedClient) { showFlash("Sélectionnez d'abord un client", "err"); return; }
    if (!oppName.trim()) { showFlash("Nom de l'opportunité obligatoire", "err"); return; }
    const opp = {
      client_id: selectedClient.id,
      client_name: selectedClient.name,
      name: oppName,
      amount: oppAmount,
      close_date: oppDate || null,
      close: oppDate ? new Date(oppDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "",
      notes: oppNotes,
      type: oppType,
      produit: oppProduit,
      modules: oppModules,
      source: oppSource,
      duration: oppDuration,
      stage: oppStage,
      proba,
      owner: oppOwner,
      tags: oppTags,
    };
    try {
      await window.api.opportunities.create(opp);
    } catch (e) {
      showFlash("Erreur de sauvegarde — " + (e.message || ""), "err");
      return;
    }
    showFlash("✓ Opportunité créée — redirection…");
    setTimeout(() => {
      window.location.href = selectedClient && selectedClient.id
        ? "/fiche-client?id=" + encodeURIComponent(selectedClient.id)
        : "/crm";
    }, 900);
  };

  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { N: "#a855f7", K: "#6366f1", S: "#10b981", T: "#f59e0b", E: "#0ea5e9" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  // Faded background context (showing pipeline behind modal)
  return (
    <div style={noStyles.frame}>
      {/* Faded context behind */}
      <div style={noStyles.behind}>
        <div style={noStyles.behindSidebar} />
        <div style={noStyles.behindMain}>
          <div style={noStyles.behindBar} />
          <div style={noStyles.behindKpis}>
            {[1,2,3,4,5].map(i => <div key={i} style={noStyles.behindKpi} />)}
          </div>
          <div style={noStyles.behindKanban}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={noStyles.behindCol}>
                <div style={noStyles.behindColHead} />
                <div style={noStyles.behindCard} />
                <div style={noStyles.behindCard} />
                <div style={noStyles.behindCard} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={noStyles.overlay} />

      {/* MODAL */}
      <div style={noStyles.modal}>
        {/* Header */}
        <header style={noStyles.modalHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={noStyles.modalIcon}>+</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 4, background: "#0f172a", color: "#fff", fontWeight: 700, letterSpacing: 0.4 }}>BROUILLON</span>
                <span style={noStyles.refMono}>OPP-2868</span>
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>● Auto-save · il y a 8 sec</span>
              </div>
              <h1 style={noStyles.h1}>Nouvelle opportunité</h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => history.back()} style={{ ...noStyles.iconBtn, cursor: "pointer" }} title="Fermer">×</button>
          </div>
        </header>

        {/* Stepper */}
        <div style={noStyles.stepper}>
          {[
            { n: 1, label: "Compte & contact", done: true },
            { n: 2, label: "Opportunité", active: true },
            { n: 3, label: "Produits & pricing" },
            { n: 4, label: "Récap & création" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={noStyles.stepItem}>
                <div style={{
                  ...noStyles.stepDot,
                  background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
                  border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
                  color: s.done || s.active ? "#fff" : "#94a3b8",
                }}>{s.done ? "✓" : s.n}</div>
                <span style={{ fontSize: 12, fontWeight: s.active ? 700 : 500, color: s.done ? "#10b981" : s.active ? "#0f172a" : "#94a3b8" }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <div style={{ ...noStyles.stepLine, background: s.done ? "#10b981" : "#eef1f5" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body — scrollable */}
        <div style={noStyles.body}>
          {/* Two columns: left = main form, right = preview + IA */}
          <div style={noStyles.bodyGrid}>

            {/* LEFT — form fields */}
            <div style={noStyles.formCol}>

              {/* SECTION 1 — Compte */}
              <section style={noStyles.section}>
                <SectionHead num="01" title="Compte & demandeur" subtitle="Lié à un compte existant" required done />

                <FormRow label="Compte" required subtitle="Cherchez parmi vos clients et prospects existants">
                  {selectedClient ? (
                    <div style={noStyles.linkedCard}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1e40af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {(selectedClient.name || "").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{selectedClient.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {selectedClient.sector || "Secteur ?"}{selectedClient.city && ` · 📍 ${selectedClient.city}`} · {selectedClient.since}
                        </div>
                      </div>
                      <button onClick={() => { setSelectedClient(null); setClientSearch(""); }} style={noStyles.changeBtn}>Changer</button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>⌕</span>
                        <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} autoFocus
                               placeholder="Rechercher un client par nom, ville, secteur, SIREN…"
                               style={{ ...noStyles.input, paddingLeft: 36 }} />
                      </div>
                      <div style={{ marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 280, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,.04)" }}>
                        {matches.length === 0 && (
                          <div style={{ padding: "14px", fontSize: 12.5, color: "#94a3b8", textAlign: "center" }}>
                            {clientSearch.trim() ? "Aucun client trouvé. " : "Tapez pour rechercher dans la base. "}
                            <a href="/nouveau-prospect" style={{ color: "#3730a3", fontWeight: 600, textDecoration: "none" }}>+ Créer un nouveau prospect →</a>
                          </div>
                        )}
                        {matches.map((c) => (
                          <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(""); }}
                               style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: c.source === "local" ? "#fef3c7" : "#dcfce7", color: c.source === "local" ? "#78350f" : "#065f46", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                              {(c.name || "?").slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                {c.sector || "—"}{c.city && ` · ${c.city}`}
                                {c.siren && <span style={{ marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>{c.siren}</span>}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, fontWeight: 700, background: c.source === "local" ? "#fef3c7" : "#eef2ff", color: c.source === "local" ? "#78350f" : "#3730a3", textTransform: "uppercase", letterSpacing: 0.3, flexShrink: 0 }}>
                              {c.source === "local" ? "Nouveau" : "Client"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </FormRow>

                <FormRow label="Contact principal" required>
                  {(() => {
                    const cp = fullProspect && fullProspect.contact_principal;
                    const fullName = cp ? ((cp.prenom || "") + " " + (cp.nom || "")).trim() : "";
                    if (!fullName && !(cp && cp.email)) {
                      return (
                        <div style={{ ...noStyles.linkedCardMini, color: "#94a3b8", fontStyle: "italic" }}>
                          Aucun contact principal renseigné pour ce client
                        </div>
                      );
                    }
                    const champion = Array.isArray(fullProspect.roles) && fullProspect.roles.includes("Champion");
                    return (
                      <div style={noStyles.linkedCardMini}>
                        <Avatar name={fullName || cp.email} size={24} color="#a855f7" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                            {fullName || cp.email}
                            {champion && <span style={noStyles.championPill}>★ Champion</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {(cp.fonction || "—")}{cp.email ? ` · ${cp.email}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </FormRow>

                <FormRow label="Co-contacts" subtitle="Décideurs supplémentaires identifiés à la création du prospect">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {(() => {
                      const add = (fullProspect && fullProspect.contacts_additionnels) || [];
                      if (!add.length) return <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>Aucun co-contact</span>;
                      const colors = ["#dc2626", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"];
                      return add.map((x, i) => {
                        const n = ((x.prenom || "") + " " + (x.nom || "")).trim() || x.email || "Contact";
                        return (
                          <div key={i} style={noStyles.contactChip}>
                            <Avatar name={n} size={18} color={colors[i % colors.length]} />
                            <span style={{ fontSize: 11.5, fontWeight: 500 }}>{n}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </FormRow>
              </section>

              {/* SECTION 2 — Opportunité */}
              <section style={noStyles.section}>
                <SectionHead num="02" title="Détails opportunité" subtitle="Décrivez la nature et le contexte" required active />

                <FormRow label="Nom de l'opportunité" required>
                  <input
                    style={noStyles.input}
                    value={oppName}
                    onChange={(e) => setOppName(e.target.value)}
                    placeholder="Ex : Déploiement Astorya Suite — 500 sièges"
                  />
                  {oppName.trim() && <div style={{ ...noStyles.inputHelp, color: "#10b981" }}>✓ Nom unique vérifié</div>}
                </FormRow>

                <div style={noStyles.formGrid2}>
                  <FormRow label="Produit principal" required>
                    <select value={oppProduit} onChange={(e) => setOppProduit(e.target.value)} style={{ ...noStyles.input, padding: "8px 12px" }}>
                      <option>Astorya Suite</option>
                      <option>Astorya Cyber</option>
                      <option>Astorya Hub</option>
                      <option>Astorya Analytics</option>
                      <option>Astorya Mobile</option>
                      <option>Prestation sur mesure</option>
                    </select>
                  </FormRow>

                  <FormRow label="Modules complémentaires">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["Cyber", "Hub", "Analytics", "Mobile"].map((m) => {
                        const on = oppModules.includes(m);
                        return (
                          <button
                            key={m}
                            onClick={() => toggleModule(m)}
                            style={{ ...noStyles.toggleChip, ...(on ? noStyles.toggleChipOn : {}), cursor: "pointer" }}
                          >{on ? "✓ " : "+ "}{m}</button>
                        );
                      })}
                    </div>
                  </FormRow>
                </div>

                <div style={noStyles.formGrid2}>
                  <FormRow label="Type d'opportunité" required>
                    <div style={noStyles.radioGroup}>
                      {[
                        { k: "new",       label: "Nouveau client" },
                        { k: "extension", label: "Extension" },
                        { k: "renewal",   label: "Renouvellement" },
                        { k: "upsell",    label: "Up-sell" },
                      ].map((t) => (
                        <label
                          key={t.k}
                          onClick={() => setOppType(t.k)}
                          style={{ ...noStyles.radio, ...(oppType === t.k ? noStyles.radioOn : {}), cursor: "pointer" }}
                        >
                          <input type="radio" name="type" checked={oppType === t.k} onChange={() => setOppType(t.k)} /> <span>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </FormRow>

                  <FormRow label="Source" required>
                    <select value={oppSource} onChange={(e) => setOppSource(e.target.value)} style={{ ...noStyles.input, padding: "8px 12px" }}>
                      <option>Référence client existant</option>
                      <option>Cold outbound</option>
                      <option>Inbound site web</option>
                      <option>Salon professionnel</option>
                      <option>Partenaire revendeur</option>
                      <option>Renouvellement automatique</option>
                      <option>Réseau personnel</option>
                      <option>Autre</option>
                    </select>
                  </FormRow>
                </div>

                <FormRow label="Description & contexte" subtitle="Quel est le besoin ? Quel déclencheur ?">
                  <textarea
                    style={noStyles.textarea}
                    rows="3"
                    value={oppNotes}
                    onChange={(e) => setOppNotes(e.target.value)}
                    placeholder="Contexte du besoin, déclencheur, points clés…"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Markdown supporté</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{oppNotes.length} / 2 000</span>
                  </div>
                </FormRow>
              </section>

              {/* SECTION 3 — Montant & timing */}
              <section style={noStyles.section}>
                <SectionHead num="03" title="Montant & timing" subtitle="Indicateurs financiers et calendaires" required />

                <div style={noStyles.formGrid2}>
                  <FormRow label="Montant estimé" required>
                    <div style={noStyles.inputWithSuffix}>
                      <input
                        style={{ ...noStyles.input, border: "none", padding: "0 4px", fontSize: 18, fontWeight: 600 }}
                        value={oppAmount}
                        onChange={(e) => setOppAmount(e.target.value)}
                        placeholder="0"
                      />
                      <span style={noStyles.suffix}>€ / an</span>
                    </div>
                    <div style={noStyles.inputHelp}>Récurrent annuel HT</div>
                  </FormRow>

                  <FormRow label="Durée contrat">
                    <div style={noStyles.segCtrl}>
                      {["1 an", "3 ans", "5 ans", "Custom"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setOppDuration(d)}
                          style={{ ...noStyles.segBtn, ...(oppDuration === d ? noStyles.segBtnActive : {}), cursor: "pointer" }}
                        >{d}</button>
                      ))}
                    </div>
                    {(() => {
                      const amtN = parseFloat(String(oppAmount).replace(/[^\d.]/g, "")) || 0;
                      const years = oppDuration === "1 an" ? 1 : oppDuration === "3 ans" ? 3 : oppDuration === "5 ans" ? 5 : 0;
                      if (!amtN || !years) return null;
                      const tcv = amtN * years;
                      return <div style={{ ...noStyles.inputHelp, color: "#0f172a", fontWeight: 600, marginTop: 6 }}>TCV : {tcv.toLocaleString("fr-FR").replace(/,/g, " ")} € sur {oppDuration}</div>;
                    })()}
                  </FormRow>
                </div>

                <FormRow label="Étape pipeline" required>
                  <div style={noStyles.pipelineSelector}>
                    {[
                      { k: "qualif", label: "Qualification", color: "#94a3b8", proba: 20 },
                      { k: "discovery", label: "Discovery", color: "#3b82f6", proba: 35 },
                      { k: "propo", label: "Proposition", color: "#a855f7", proba: 55 },
                      { k: "nego", label: "Négociation", color: "#ea580c", proba: 75 },
                      { k: "won", label: "Gagné", color: "#10b981", proba: 100 },
                    ].map((s) => {
                      const active = oppStage === s.k;
                      return (
                        <div
                          key={s.k}
                          onClick={() => setOppStage(s.k)}
                          style={{
                            ...noStyles.pipeStep,
                            ...(active ? noStyles.pipeStepActive : {}),
                            borderColor: active ? s.color : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color, marginRight: 6 }} />
                          <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? "#0f172a" : "#64748b" }}>{s.label}</span>
                          {active && <span style={{ fontSize: 10, color: s.color, fontWeight: 700, marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>{s.proba}%</span>}
                        </div>
                      );
                    })}
                  </div>
                </FormRow>

                <div style={noStyles.formGrid2}>
                  <FormRow label="Probabilité de gain">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, position: "relative", height: 6, background: "#eef1f5", borderRadius: 999 }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: proba + "%", background: stageProba[oppStage] >= 75 ? "#10b981" : "#a855f7", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", width: 44, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{proba}%</span>
                    </div>
                    <div style={noStyles.inputHelp}>Auto-rempli depuis l'étape</div>
                  </FormRow>

                  <FormRow label="Date de clôture cible" required>
                    <div style={noStyles.dateInput}>
                      <span style={{ color: "#94a3b8" }}>📅</span>
                      <input
                        type="date"
                        style={{ ...noStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace" }}
                        value={oppDate}
                        onChange={(e) => setOppDate(e.target.value)}
                      />
                    </div>
                  </FormRow>
                </div>
              </section>

              {/* SECTION 4 — Équipe & concurrence */}
              <section style={noStyles.section}>
                <SectionHead num="04" title="Commercial & étiquettes" subtitle="Qui pilote l'opportunité et comment la classer" />

                <FormRow label="Commercial" required>
                  <select
                    value={oppOwner}
                    onChange={(e) => setOppOwner(e.target.value)}
                    style={{ ...noStyles.input, padding: "8px 12px" }}
                  >
                    <option value="Romain Daviaud">Romain Daviaud · Direction · Achat</option>
                    <option value="Augustin Morin">Augustin Morin · Direction · Commercial</option>
                  </select>
                </FormRow>

                <FormRow label="Étiquettes" subtitle="Tags libres pour catégoriser cette opportunité">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {oppTags.map((tag, i) => (
                      <span key={i} style={{ ...noStyles.tag, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        # {tag}
                        <span onClick={() => setOppTags((arr) => arr.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "#cbd5e1", fontSize: 13 }}>×</span>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        const t = prompt("Nouvelle étiquette :");
                        if (t && t.trim()) setOppTags((arr) => [...arr, t.trim()]);
                      }}
                      style={{ ...noStyles.addChip, cursor: "pointer" }}
                    >+ Ajouter</button>
                  </div>
                </FormRow>
              </section>

              {/* Bottom actions */}
              <div style={noStyles.actionsRow}>
                <button onClick={() => { window.location.href = "/crm"; }} style={noStyles.ghostBtn}>Annuler</button>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={createOpp} style={noStyles.primaryBtn}>Créer l'opportunité →</button>
                </div>
              </div>

              {flash && (
                <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "10px 18px", borderRadius: 8, background: flash.tone === "err" ? "#dc2626" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 10000 }}>
                  {flash.m}
                </div>
              )}
            </div>

            {/* RIGHT — preview + IA */}
            <aside style={noStyles.previewCol}>
              {/* Live preview card */}
              <div style={noStyles.previewSticky}>
                <div style={noStyles.previewHead}>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Aperçu temps réel</span>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#10b981", color: "#fff", fontWeight: 700, letterSpacing: 0.4 }}>● LIVE</span>
                </div>

                {/* Mini opp card (like in pipeline) */}
                <div style={noStyles.previewCard}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "#1e40af", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {((selectedClient && selectedClient.name) || "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{(selectedClient && selectedClient.name) || "Sélectionnez un client…"}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#f5efff", color: "#7e22ce", fontWeight: 700 }}>{oppProduit.replace(/^Astorya\s+/, "")}</span>
                        {oppModules.map((m) => (
                          <span key={m} style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#fdecec", color: "#dc2626", fontWeight: 700 }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: "#0f172a", letterSpacing: -0.3 }}>
                    {oppAmount ? (String(oppAmount).replace(/[^\d.\s]/g, "").trim() + " € / an") : "—"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2, lineHeight: 1.3 }}>{oppName || "Nom de l'opportunité…"}</div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Probabilité</span>
                      <span style={{ fontSize: 11, color: "#0f172a", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{proba}%</span>
                    </div>
                    <div style={{ width: "100%", height: 3, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: proba + "%", height: "100%", background: proba >= 75 ? "#10b981" : proba >= 55 ? "#a855f7" : proba >= 35 ? "#3b82f6" : "#94a3b8", borderRadius: 999 }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                    <Avatar name="Vous" size={18} color="#3730a3" />
                    <span style={{ fontSize: 10.5, color: "#64748b" }}>{oppDate ? new Date(oppDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Date à définir"}</span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#64748b", marginTop: 10, textAlign: "center" }}>↑ Aperçu en colonne <strong>{({ qualif: "Qualification", discovery: "Discovery", propo: "Proposition", nego: "Négociation", won: "Gagné" })[oppStage]}</strong></div>
              </div>

              {/* IA suggestions */}
              <div style={noStyles.aiPanel}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>★</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Suggestions Hub Assistant</span>
                </div>

                <div style={noStyles.aiItem}>
                  <span style={noStyles.aiItemIcon}>💡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Montant estimé : 92 k€</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>Basé sur 3 deals similaires (extension Suite · 200-300 sièges) — moyenne 87 k€ et médiane 91 k€.</div>
                    <button style={noStyles.aiAccept}>Accepter le montant</button>
                  </div>
                </div>

                <div style={noStyles.aiItem}>
                  <span style={noStyles.aiItemIcon}>📅</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Cycle attendu : 115 jours</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>Date de clôture probable : <strong style={{ color: "#0f172a" }}>18 sept. 2026</strong>. Vous avez saisi le 15.</div>
                  </div>
                </div>

                <div style={noStyles.aiItem}>
                  <span style={noStyles.aiItemIcon}>⚠</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Concurrent Pega détecté</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>3 deals AXA précédents ont mentionné Pega. Le voulez-vous dans la liste ?</div>
                    <button style={noStyles.aiAccept}>Ajouter Pega</button>
                  </div>
                </div>

                <div style={noStyles.aiItem}>
                  <span style={noStyles.aiItemIcon}>👥</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Champion à activer</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>Émilie Roux est marquée Champion sur le compte. Suggérée comme contact principal.</div>
                    <div style={{ fontSize: 10.5, color: "#10b981", marginTop: 4, fontWeight: 600 }}>✓ Déjà sélectionnée</div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div style={noStyles.checklist}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Complétion du brouillon</div>
                <ChecklistRow done label="Compte renseigné" />
                <ChecklistRow done label="Contact principal" />
                <ChecklistRow done label="Nom & description" />
                <ChecklistRow done label="Montant & durée" />
                <ChecklistRow done label="Date de clôture" />
                <ChecklistRow active label="Commercial & équipe" />
                <ChecklistRow label="Produits & pricing détaillé" />
                <ChecklistRow label="Validation finale" />
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eef1f5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Complété</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>6 / 8</span>
                  </div>
                  <div style={{ height: 4, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: "75%", height: "100%", background: "#4f46e5", borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───── helpers
const SectionHead = ({ num, title, subtitle, required, done, active }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #eef1f5" }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: done ? "#e8f8f1" : active ? "#eef2ff" : "#fafbfc",
      color: done ? "#0e7a55" : active ? "#4f46e5" : "#94a3b8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0,
    }}>{done ? "✓" : num}</div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</span>
        {required && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "#fdecec", color: "#dc2626", fontWeight: 700 }}>REQUIS</span>}
      </div>
      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
    </div>
  </div>
);

const FormRow = ({ label, subtitle, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{label}</span>
      {required && <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>}
      {subtitle && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{subtitle}</span>}
    </div>
    {children}
  </div>
);

const ChecklistRow = ({ done, active, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
    <span style={{
      width: 16, height: 16, borderRadius: 4,
      background: done ? "#10b981" : active ? "#fff" : "#fff",
      border: done ? "none" : active ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>{done ? "✓" : active ? <span style={{ width: 5, height: 5, borderRadius: 999, background: "#4f46e5" }} /> : ""}</span>
    <span style={{ fontSize: 12, color: done ? "#94a3b8" : active ? "#0f172a" : "#64748b", fontWeight: active ? 600 : 500, textDecoration: done ? "line-through" : "none" }}>{label}</span>
  </div>
);

const noStyles = {
  frame: { width: "100%", minHeight: "100vh", position: "relative", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a",  },

  // Faded behind
  behind: { position: "absolute", inset: 0, display: "flex", background: "#fafbfc", opacity: 0.55, filter: "blur(0.5px)" },
  behindSidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5" },
  behindMain: { flex: 1, padding: 24 },
  behindBar: { height: 48, background: "#fff", borderRadius: 6, marginBottom: 18 },
  behindKpis: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 18 },
  behindKpi: { height: 80, background: "#fff", borderRadius: 10, border: "1px solid #eef1f5" },
  behindKanban: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 },
  behindCol: { display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#f1f3f6", borderRadius: 10 },
  behindColHead: { height: 24, background: "#fff", borderRadius: 4 },
  behindCard: { height: 110, background: "#fff", borderRadius: 8, border: "1px solid #eef1f5" },
  overlay: { position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)" },

  // Modal
  modal: { position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 1180, maxHeight: 1620, background: "#fff", borderRadius: 16, boxShadow: "0 24px 64px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.05)", display: "flex", flexDirection: "column", overflow: "hidden" },

  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #eef1f5" },
  modalIcon: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5" },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.6, margin: "3px 0 0", color: "#0f172a" },
  iconBtn: { width: 32, height: 32, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },

  // Stepper
  stepper: { display: "flex", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #eef1f5", background: "#fafbfc", gap: 8 },
  stepItem: { display: "flex", alignItems: "center", gap: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 },
  stepLine: { flex: 1, height: 2, borderRadius: 999, maxWidth: 120 },

  // Body
  body: { flex: 1, overflowY: "auto" },
  bodyGrid: { display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "100%" },
  formCol: { padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 20 },

  section: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },

  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f172a", outline: "none", boxSizing: "border-box" },
  inputHelp: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inputWithSuffix: { display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", background: "#fff" },
  suffix: { fontSize: 12, color: "#94a3b8", fontWeight: 500, paddingLeft: 8, borderLeft: "1px solid #eef1f5", marginLeft: 4 },
  textarea: { width: "100%", padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box" },
  select: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer" },
  dateInput: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" },

  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

  radioGroup: { display: "flex", gap: 6, flexWrap: "wrap" },
  radio: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#475569", cursor: "pointer", background: "#fff" },
  radioOn: { background: "#eef2ff", borderColor: "#4f46e5", color: "#3730a3", fontWeight: 600 },

  toggleChip: { padding: "5px 10px", border: "1px dashed #cbd5e1", background: "#fff", borderRadius: 999, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  toggleChipOn: { border: "1px solid #4f46e5", background: "#eef2ff", color: "#3730a3", fontWeight: 600, borderStyle: "solid" },

  segCtrl: { display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" },
  segBtn: { padding: "6px 14px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  segBtnActive: { background: "#0f172a", color: "#fff", fontWeight: 600 },

  pipelineSelector: { display: "flex", gap: 4, padding: 4, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  pipeStep: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 6px", borderRadius: 6, cursor: "pointer", border: "1.5px solid transparent" },
  pipeStepActive: { background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },

  linkedCard: { display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  linkedCardMini: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  changeBtn: { padding: "3px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },
  championPill: { fontSize: 9, padding: "0 5px", borderRadius: 3, background: "#fffbeb", color: "#a65f00", fontWeight: 700, border: "1px solid #fde68a", marginLeft: 4 },

  contactChip: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999 },
  compChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", border: "1px solid", borderRadius: 6, fontSize: 11.5 },
  removeChip: { color: "#cbd5e1", cursor: "pointer", fontSize: 13, lineHeight: 1 },
  addChip: { padding: "3px 10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  addBtn: { width: "100%", padding: "10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 8, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },

  // Actions row
  actionsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0", borderTop: "1px solid #eef1f5" },
  ghostBtn: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "8px 18px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  // Preview column
  previewCol: { padding: "20px 24px 24px", background: "#fafbfc", borderLeft: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 14 },
  previewSticky: { padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  previewHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  previewCard: { padding: 12, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, boxShadow: "0 4px 12px rgba(15,23,42,0.06)" },

  aiPanel: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  aiItem: { display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  aiItemIcon: { fontSize: 16, flexShrink: 0, width: 22, textAlign: "center" },
  aiAccept: { padding: "3px 9px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 600, marginTop: 6 },

  checklist: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
};

window.NewOpportunity = NewOpportunity;
