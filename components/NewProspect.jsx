// Fiche nouveau prospect — formulaire de qualification

const NewProspect = () => {
  // ───── État UI interactif (segments, chips, action) — fiche neuve, tout vide
  const [effectif,   setEffectif]   = React.useState(null);
  const [tier,       setTier]       = React.useState(null);
  const [fonction,   setFonction]   = React.useState(null);
  const [roles,      setRoles]      = React.useState([]);
  const [action,     setAction]     = React.useState(null);
  const [ca,         setCa]         = React.useState("");
  const [contactPrenom, setContactPrenom] = React.useState("");
  const [contactNom,    setContactNom]    = React.useState("");
  const [contactRole,   setContactRole]   = React.useState("");
  const [contactEmail,  setContactEmail]  = React.useState("");
  const [contactPhone,  setContactPhone]  = React.useState("");
  const [contactLi,     setContactLi]     = React.useState("");
  const [besoin,        setBesoin]        = React.useState("");
  const [notes,         setNotes]         = React.useState("");
  const [extraContacts, setExtraContacts] = React.useState(0);
  const [flash,         setFlash]         = React.useState(null);

  // ───── Auto-complétion SIRENE (recherche-entreprises.api.gouv.fr)
  const [companyName,    setCompanyName]    = React.useState("");
  const [companySiren,   setCompanySiren]   = React.useState("");
  const [companyNaf,     setCompanyNaf]     = React.useState("");
  const [companyTva,     setCompanyTva]     = React.useState("");
  const [companyAddress, setCompanyAddress] = React.useState("");
  const [companyCity,    setCompanyCity]    = React.useState("");
  const [companyCP,      setCompanyCP]      = React.useState("");
  const [companySector,  setCompanySector]  = React.useState("");
  const [companySubSect, setCompanySubSect] = React.useState("");
  const [companyWeb,     setCompanyWeb]     = React.useState("");
  const [companyLi,      setCompanyLi]      = React.useState("");
  const [siretResults,   setSiretResults]   = React.useState([]);
  const [siretLoading,   setSiretLoading]   = React.useState(false);
  const [siretOpen,      setSiretOpen]      = React.useState(false);

  // Mapping section NAF (lettre) → libellé secteur
  const sectionLabels = {
    A: "Agriculture, sylviculture et pêche",
    B: "Industries extractives",
    C: "Industrie manufacturière",
    D: "Production et distribution d'électricité",
    E: "Eau, déchets et dépollution",
    F: "Construction & BTP",
    G: "Commerce",
    H: "Transports et entreposage",
    I: "Hébergement et restauration",
    J: "Information et communication",
    K: "Banque, finance & assurance",
    L: "Activités immobilières",
    M: "Activités spécialisées, scientifiques et techniques",
    N: "Services administratifs et de soutien",
    O: "Administration publique",
    P: "Enseignement",
    Q: "Santé et action sociale",
    R: "Arts, spectacles et activités récréatives",
    S: "Autres activités de services",
    T: "Activités des ménages",
    U: "Activités extra-territoriales",
  };

  // Sous-secteur dérivé de la division NAF (2 premiers chiffres)
  const subSectorByDivision = {
    "62": "Programmation et conseil informatique",
    "63": "Services d'information",
    "64": "Activités financières",
    "65": "Assurance",
    "66": "Activités auxiliaires de services financiers",
    "70": "Conseil de direction",
    "71": "Architecture, ingénierie",
    "72": "Recherche et développement",
    "73": "Publicité, études de marché",
    "74": "Autres activités spécialisées",
  };

  // Slug pour deviner site web / LinkedIn depuis le nom
  const slugify = (s) => String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Mapping tranche_effectif_salarie INSEE → mes 5 buckets
  const mapEffectif = (code) => {
    if (!code) return null;
    if (["NN", "00", "01", "02", "03", "11", "12"].includes(code)) return "1-50";
    if (["21", "22"].includes(code)) return "51-250";
    if (["31", "32"].includes(code)) return "251-1k";
    if (["41", "42"].includes(code)) return "1k-5k";
    return "5k+";
  };

  // Calcule la clé TVA intracom FR à partir du SIREN
  const computeTva = (siren) => {
    const clean = String(siren).replace(/\D/g, "");
    if (clean.length !== 9) return "";
    const key = (12 + (3 * (parseInt(clean, 10) % 97))) % 97;
    return "FR" + String(key).padStart(2, "0") + clean;
  };
  const formatSiren = (s) => {
    const c = String(s).replace(/\D/g, "");
    return c.length === 9 ? `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6,9)}` : c;
  };

  // Debounce 300ms sur la recherche
  const siretTimer = React.useRef(null);
  React.useEffect(() => {
    if (siretTimer.current) clearTimeout(siretTimer.current);
    const q = (companyName || "").trim();
    if (q.length < 3) { setSiretResults([]); return; }
    siretTimer.current = setTimeout(async () => {
      setSiretLoading(true);
      try {
        const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=6`);
        const j = await r.json();
        setSiretResults(Array.isArray(j.results) ? j.results : []);
      } catch (e) { setSiretResults([]); }
      setSiretLoading(false);
    }, 300);
    return () => { if (siretTimer.current) clearTimeout(siretTimer.current); };
  }, [companyName]);

  const pickCompany = (e) => {
    const siege = e.siege || {};
    const siren = e.siren || "";
    const name = e.nom_complet || e.nom_raison_sociale || siege.denomination_usuelle || "";
    const naf = e.activite_principale || siege.activite_principale || "";
    const section = e.section_activite_principale || siege.section_activite_principale || (naf ? null : null);

    setCompanyName(name);
    setCompanySiren(formatSiren(siren));
    setCompanyNaf(naf);
    setCompanyTva(computeTva(siren));

    // Adresse — privilégie geo_adresse (concaténée), sinon reconstitue
    const addr = siege.geo_adresse
      || [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ")
      || siege.adresse || "";
    // On retire la ville + CP en fin de adresse pour ne garder que la rue
    let street = addr;
    if (siege.code_postal) street = street.replace(siege.code_postal, "").trim();
    if (siege.libelle_commune) street = street.replace(new RegExp(siege.libelle_commune, "i"), "").trim();
    street = street.replace(/[\s,]+$/, "");
    setCompanyAddress(street);
    setCompanyCity(siege.libelle_commune || "");
    setCompanyCP(siege.code_postal || "");

    // Secteur (section NAF) + sous-secteur (division NAF)
    if (section && sectionLabels[section]) setCompanySector(sectionLabels[section]);
    else if (naf) {
      const sec = naf.charAt(0);
      const divCode = naf.slice(0, 2);
      const div = subSectorByDivision[divCode];
      if (div) setCompanySector(div);
    }
    if (naf) {
      const div = subSectorByDivision[naf.slice(0, 2)];
      setCompanySubSect(div || naf);
    }

    // Site web et LinkedIn — devinés depuis le nom (à corriger manuellement si besoin)
    const slug = slugify(name);
    if (slug) {
      setCompanyWeb(slug + ".fr");
      setCompanyLi("linkedin.com/company/" + slug);
    }

    const mapped = mapEffectif(e.tranche_effectif_salarie || siege.tranche_effectif_salarie);
    if (mapped) setEffectif(mapped);
    setSiretOpen(false);
    setSiretResults([]);
    showFlash("✓ Entreprise importée depuis SIRENE");
  };

  const showFlash = (msg, tone = "ok") => {
    setFlash({ msg, tone });
    setTimeout(() => setFlash(null), 2800);
  };

  const toggleRole = (r) => setRoles((rs) => rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]);

  const cancel = () => {
    if (confirm("Abandonner ce prospect ? Toutes les saisies non enregistrées seront perdues.")) {
      window.location.href = "/crm";
    }
  };

  const saveDraft = () => {
    const draft = { effectif, tier, fonction, roles, action, at: new Date().toISOString() };
    try { localStorage.setItem("hubAstorya.prospectDraft.v1", JSON.stringify(draft)); } catch (e) {}
    showFlash("✓ Brouillon enregistré localement");
  };

  const createProspect = async () => {
    const payload = { effectif, tier, fonction, roles, action, at: new Date().toISOString() };
    if (window.HubData && window.HubData.enabled()) {
      // Insertion minimale dans clients (le formulaire complet sera connecté champ par champ ensuite)
      try {
        const id = "ACC-" + Math.floor(Math.random() * 9000 + 1000);
        await window.HubSupabase.client.from("clients").insert({ id, name: "Nouveau prospect (à compléter)" });
        showFlash("✓ Prospect créé en base — redirection…");
        setTimeout(() => { window.location.href = "/fiche-client"; }, 900);
        return;
      } catch (e) { /* fallback ci-dessous */ }
    }
    try { localStorage.setItem("hubAstorya.prospectDraft.v1", JSON.stringify({ ...payload, _created: true })); } catch (e) {}
    showFlash("✓ Prospect enregistré (mode démo)");
    setTimeout(() => { window.location.href = "/fiche-client"; }, 900);
  };

  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { N: "#a855f7", K: "#6366f1", S: "#10b981", T: "#f59e0b", E: "#0ea5e9", M: "#dc2626", L: "#8b5cf6" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  return (
    <div style={npStyles.frame}>
      {/* Topbar */}
      <header style={npStyles.topbar}>
        <a href="/crm" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", textDecoration: "none" }}>
          <span>CRM</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span>Comptes & contacts</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Nouveau prospect</span>
          <span style={npStyles.refMono}>PRO-DRAFT</span>
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>● Auto-save · il y a 4 sec</span>
        </a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {flash && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: flash.tone === "err" ? "#fee2e2" : "#dcfce7", color: flash.tone === "err" ? "#991b1b" : "#065f46" }}>{flash.msg}</span>
          )}
          <button onClick={cancel} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Annuler</button>
          <button onClick={saveDraft} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Enregistrer brouillon</button>
          <button onClick={createProspect} style={{ ...npStyles.primaryBtn, cursor: "pointer" }}>Créer le prospect</button>
        </div>
      </header>

      {/* Title row */}
      <div style={npStyles.titleRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={npStyles.heroIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
          </div>
          <div>
            <h1 style={npStyles.h1}>Nouveau prospect</h1>
            <p style={npStyles.subtitle}>Qualifiez une nouvelle entreprise et son interlocuteur clé · l'IA enrichira automatiquement les données publiques</p>
          </div>
        </div>
        <div style={npStyles.completion}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Fiche complétée</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>64 %</span>
          </div>
          <div style={{ width: 180, height: 5, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: "64%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #a855f7)", borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div style={npStyles.body}>

        {/* LEFT — form */}
        <div style={npStyles.formCol}>

          {/* SECTION 1 — Société */}
          <section style={npStyles.section}>
            <SectionHead num="01" title="Société" subtitle="Identité et caractéristiques de l'entreprise prospect" status="done" />

            <FormRow label="Raison sociale" required>
              <div style={{ ...npStyles.searchInputWrap, position: "relative" }}>
                <input
                  style={npStyles.input}
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setSiretOpen(true); }}
                  onFocus={() => setSiretOpen(true)}
                  onBlur={() => setTimeout(() => setSiretOpen(false), 150)}
                  placeholder="Tapez le nom de l'entreprise ou un SIREN…"
                />
                <span style={npStyles.searchTag}>{siretLoading ? "⏳ Recherche…" : "🔍 Auto-complété via base SIRENE"}</span>
                {siretOpen && siretResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,.08)", zIndex: 20, maxHeight: 320, overflowY: "auto" }}>
                    {siretResults.map((e) => {
                      const siege = e.siege || {};
                      return (
                        <div key={e.siren} onMouseDown={() => pickCompany(e)}
                             style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom_complet || e.nom_raison_sociale}</div>
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                              SIREN <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatSiren(e.siren)}</span>
                              {siege.libelle_commune && <> · {siege.libelle_commune}</>}
                              {e.activite_principale && <> · NAF {e.activite_principale}</>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10.5, color: "#3730a3", fontWeight: 700 }}>↵</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </FormRow>

            <div style={npStyles.formGrid3}>
              <FormRow label="SIREN" required>
                <input style={{ ...npStyles.input, fontFamily: "'JetBrains Mono', monospace" }}
                       value={companySiren}
                       onChange={(e) => { setCompanySiren(e.target.value); const t = computeTva(e.target.value); if (t) setCompanyTva(t); }} />
              </FormRow>
              <FormRow label="Code NAF">
                <input style={{ ...npStyles.input, fontFamily: "'JetBrains Mono', monospace" }} value={companyNaf} onChange={(e) => setCompanyNaf(e.target.value)} />
              </FormRow>
              <FormRow label="TVA intracom.">
                <input style={{ ...npStyles.input, fontFamily: "'JetBrains Mono', monospace" }} value={companyTva} onChange={(e) => setCompanyTva(e.target.value)} />
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Secteur d'activité" required>
                <input style={npStyles.input} value={companySector} onChange={(e) => setCompanySector(e.target.value)} placeholder="Auto-rempli depuis le NAF" />
              </FormRow>
              <FormRow label="Sous-secteur">
                <input style={npStyles.input} value={companySubSect} onChange={(e) => setCompanySubSect(e.target.value)} placeholder="" />
              </FormRow>
            </div>

            <div style={npStyles.formGrid3}>
              <FormRow label="Effectif" required>
                <div style={npStyles.segCtrl}>
                  {["1-50", "51-250", "251-1k", "1k-5k", "5k+"].map((v) => (
                    <button key={v} onClick={() => setEffectif(v)}
                            style={{ ...npStyles.segBtn, ...(effectif === v ? npStyles.segBtnActive : {}), cursor: "pointer" }}>{v}</button>
                  ))}
                </div>
                <div style={npStyles.inputHelp}>Source SIRENE : 1 200 collaborateurs</div>
              </FormRow>
              <FormRow label="CA annuel">
                <div style={npStyles.inputWithSuffix}>
                  <input style={{ ...npStyles.input, border: "none", padding: "0 4px", fontWeight: 600 }} value={ca} onChange={(e) => setCa(e.target.value)} placeholder="0" />
                  <span style={npStyles.suffix}>M€</span>
                </div>
                <div style={npStyles.inputHelp}>{ca ? `Saisi · bilan ${new Date().getFullYear() - 1}` : "À renseigner"}</div>
              </FormRow>
              <FormRow label="Tier prospect">
                <div style={npStyles.tierRow}>
                  {["A", "B", "C"].map((v) => {
                    const on = tier === v;
                    return (
                      <button key={v} onClick={() => setTier(v)}
                              style={{ ...npStyles.tierBtn, ...(on ? { background: "#fef3c7", color: "#a16207", border: "1.5px solid #fde68a", fontWeight: 700 } : { background: "#fff", color: "#64748b" }), cursor: "pointer" }}>
                        {on && "★ "}{v}
                      </button>
                    );
                  })}
                </div>
                <div style={npStyles.inputHelp}>{tier === "A" ? "Grand compte stratégique" : tier === "B" ? "Compte secondaire" : "Compte tactique"}</div>
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Site web">
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#94a3b8" }}>🌐</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} value={companyWeb} onChange={(e) => setCompanyWeb(e.target.value)} placeholder="exemple.fr" />
                  {companyWeb && <span style={{ ...npStyles.linkTag, color: "#10b981" }}>↗</span>}
                </div>
              </FormRow>
              <FormRow label="LinkedIn entreprise">
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#0a66c2" }}>in</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} value={companyLi} onChange={(e) => setCompanyLi(e.target.value)} placeholder="linkedin.com/company/…" />
                </div>
              </FormRow>
            </div>

            <FormRow label="Adresse siège">
              <div style={npStyles.formGrid2}>
                <input style={npStyles.input} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Adresse" />
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                  <input style={npStyles.input} value={companyCP} onChange={(e) => setCompanyCP(e.target.value)} placeholder="CP" />
                  <input style={npStyles.input} value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Ville" />
                </div>
              </div>
            </FormRow>
          </section>

          {/* SECTION 2 — Contact principal */}
          <section style={npStyles.section}>
            <SectionHead num="02" title="Contact principal" subtitle="Décideur identifié ou point d'entrée commercial" status="active" />

            <div style={npStyles.formGrid2}>
              <FormRow label="Prénom" required>
                <input style={npStyles.input} value={contactPrenom} onChange={(e) => setContactPrenom(e.target.value)} />
              </FormRow>
              <FormRow label="Nom" required>
                <input style={npStyles.input} value={contactNom} onChange={(e) => setContactNom(e.target.value)} />
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Fonction" required>
                <input style={npStyles.input} value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
              </FormRow>
              <FormRow label="Niveau hiérarchique">
                <div style={npStyles.segCtrl}>
                  {["Opér.", "Mgr", "Dir.", "C-level"].map((v) => (
                    <button key={v} onClick={() => setFonction(v)}
                            style={{ ...npStyles.segBtn, ...(fonction === v ? npStyles.segBtnActive : {}), cursor: "pointer" }}>{v}</button>
                  ))}
                </div>
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Email pro" required>
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#94a3b8" }}>✉</span>
                  <input type="email" style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && <span style={{ ...npStyles.linkTag, color: "#10b981" }}>✓ Format ok</span>}
                </div>
              </FormRow>
              <FormRow label="Téléphone">
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#94a3b8" }}>☎</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </FormRow>
            </div>

            <FormRow label="Rôle dans le projet" subtitle="Quelle place dans la décision d'achat ?">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Décideur", "Champion", "Prescripteur", "Utilisateur", "Acheteur", "Bloqueur"].map((r) => {
                  const on = roles.includes(r);
                  return (
                    <button key={r} onClick={() => toggleRole(r)}
                            style={{ ...npStyles.roleChip, ...(on ? npStyles.roleChipOn : {}), cursor: "pointer" }}>
                      {on && "★ "}{r}
                    </button>
                  );
                })}
              </div>
            </FormRow>

            <FormRow label="LinkedIn profil">
              <div style={npStyles.inputWithIcon}>
                <span style={{ color: "#0a66c2" }}>in</span>
                <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} value={contactLi} onChange={(e) => setContactLi(e.target.value)} placeholder="linkedin.com/in/…" />
                {contactLi && <span style={{ ...npStyles.linkTag, color: "#4f46e5" }}>↗</span>}
              </div>
            </FormRow>
          </section>

          {/* SECTION 3 — Qualification BANT */}
          <section style={npStyles.section}>
            <SectionHead num="03" title="Qualification commerciale" subtitle="Méthode BANT — Budget · Authority · Need · Timeline" status="todo" />

            <div style={npStyles.bantGrid}>
              <div style={npStyles.bantCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={npStyles.bantLetter}>B</span>
                  <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3, background: "#e8f8f1", color: "#0e7a55", fontWeight: 700 }}>Confirmé</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Budget</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>200-300 k€ alloués Q3 2026 (interview presse CIO)</div>
                <div style={npStyles.bantRating}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ ...npStyles.bantDot, background: n <= 4 ? "#10b981" : "#eef1f5" }} />
                  ))}
                </div>
              </div>

              <div style={npStyles.bantCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={npStyles.bantLetter}>A</span>
                  <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3, background: "#e8f8f1", color: "#0e7a55", fontWeight: 700 }}>Confirmé</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Authority</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>Laurent Mercier (DSI) — décideur direct sur ce périmètre</div>
                <div style={npStyles.bantRating}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ ...npStyles.bantDot, background: n <= 5 ? "#10b981" : "#eef1f5" }} />
                  ))}
                </div>
              </div>

              <div style={npStyles.bantCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={npStyles.bantLetter}>N</span>
                  <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3, background: "#fff6e6", color: "#a65f00", fontWeight: 700 }}>À explorer</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Need</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>Insatisfaction Pega exprimée publiquement · modernisation SI évoquée</div>
                <div style={npStyles.bantRating}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ ...npStyles.bantDot, background: n <= 3 ? "#f59e0b" : "#eef1f5" }} />
                  ))}
                </div>
              </div>

              <div style={npStyles.bantCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={npStyles.bantLetter}>T</span>
                  <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3, background: "#fdecec", color: "#dc2626", fontWeight: 700 }}>Urgent</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Timeline</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>Contrat Pega arrive à échéance 30 juin 2026 (dans 35 j)</div>
                <div style={npStyles.bantRating}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ ...npStyles.bantDot, background: n <= 5 ? "#dc2626" : "#eef1f5" }} />
                  ))}
                </div>
              </div>
            </div>

            <FormRow label="Besoin exprimé / problème à résoudre">
              <textarea
                style={npStyles.textarea}
                rows="3"
                value={besoin}
                onChange={(e) => setBesoin(e.target.value)}
                placeholder="Modernisation, contraintes, contexte concurrentiel…"
              />
            </FormRow>

            <div style={npStyles.formGrid2}>
              <FormRow label="Concurrent actuel">
                <div style={{ ...npStyles.compChip, background: "#e8f8f1", borderColor: "#0e7a55", color: "#0e7a55", display: "inline-flex" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", background: "#0e7a55", color: "#fff", borderRadius: 3 }}>PG</span>
                  <span style={{ fontWeight: 600 }}>Pega Platform Cloud</span>
                </div>
                <div style={npStyles.inputHelp}>Fin de contrat : 30 juin 2026 · 218 k€/an</div>
              </FormRow>
              <FormRow label="Échéance estimée du projet">
                <div style={npStyles.dateInput}>
                  <span style={{ color: "#94a3b8" }}>📅</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace" }} defaultValue="" />
                </div>
              </FormRow>
            </div>
          </section>

          {/* SECTION 4 — Origine & étapes */}
          <section style={npStyles.section}>
            <SectionHead num="04" title="Origine & prochaines étapes" subtitle="Comment ce prospect est-il arrivé et que faire ensuite ?" status="todo" />

            <div style={npStyles.formGrid2}>
              <FormRow label="Source du prospect" required>
                <div style={npStyles.select}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>◷</span>
                    <span>Radar fin de contrat concurrent</span>
                  </span>
                  <span style={{ color: "#94a3b8" }}>▾</span>
                </div>
                <div style={npStyles.inputHelp}>Détecté automatiquement le 18 mai</div>
              </FormRow>
              <FormRow label="Date de prise de contact">
                <div style={npStyles.dateInput}>
                  <span style={{ color: "#94a3b8" }}>📅</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontFamily: "'JetBrains Mono', monospace" }} defaultValue="" />
                </div>
                <div style={npStyles.inputHelp}>Premier email envoyé · réponse positive 23 mai</div>
              </FormRow>
            </div>

            <FormRow label="Owner attribué" required>
              <div style={npStyles.linkedCardMini}>
                <Avatar name="Karim Ben Salah" size={26} color="#6366f1" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>Karim Ben Salah</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>AE Senior · Cyber — région SE</div>
                </div>
                <button onClick={() => alert("Changer l'owner attribué\n\n• Nadia Lefèvre (AE Senior · EMEA)\n• Karim Ben Salah (AE Cyber)\n• Tom Verdier (AE Hub)\n• Émilie Garnier (AE BENELUX)\n\n(La sélection sera connectée à la table profiles.)")} style={{ ...npStyles.changeBtn, cursor: "pointer" }}>Changer</button>
              </div>
            </FormRow>

            <FormRow label="Première action à mener" subtitle="L'IA proposera un brouillon basé sur le contexte">
              <div style={npStyles.actionRadios}>
                {[
                  { k: "email", title: "📧 Email d'introduction personnalisé", hint: "Brouillon IA prêt : « DORA + fin contrat Pega »" },
                  { k: "call",  title: "📞 Cold call programmé",                hint: "Script généré · slot calendrier suggéré" },
                  { k: "in",    title: "in Demande de connexion LinkedIn",     hint: "Via Sales Navigator" },
                  { k: "event", title: "📅 Inviter à un événement",             hint: "Webinar DORA · 12 juin" },
                ].map((a) => {
                  const on = action === a.k;
                  return (
                    <label key={a.k} onClick={() => setAction(a.k)}
                           style={{ ...npStyles.actionRadio, ...(on ? npStyles.actionRadioOn : {}), cursor: "pointer" }}>
                      <input type="radio" name="next" checked={on} onChange={() => setAction(a.k)} />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.hint}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </FormRow>

            <FormRow label="Étiquettes">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={npStyles.tag}># Radar-2026</span>
                <span style={npStyles.tag}># Banque-privée</span>
                <span style={npStyles.tag}># Displacement-Pega</span>
                <span style={npStyles.tag}># DORA</span>
                <span style={npStyles.tag}># Sud-EMEA</span>
                <button onClick={() => { const t = prompt("Nouvelle étiquette :"); if (t) showFlash("✓ Étiquette « " + t + " » ajoutée"); }} style={{ ...npStyles.addChip, cursor: "pointer" }}>+</button>
              </div>
            </FormRow>

            <FormRow label="Notes internes" subtitle="Contexte additionnel, contacts mutuels, anecdotes…">
              <textarea
                style={npStyles.textarea}
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexte additionnel, contacts mutuels, anecdotes…"
              />
            </FormRow>
          </section>

          {/* Bottom actions */}
          <div style={npStyles.actionsRow}>
            <button onClick={cancel} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Annuler</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {flash && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: flash.tone === "err" ? "#fee2e2" : "#dcfce7", color: flash.tone === "err" ? "#991b1b" : "#065f46" }}>{flash.msg}</span>
              )}
              <button onClick={saveDraft} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Enregistrer brouillon</button>
              <button onClick={() => { setExtraContacts((n) => n + 1); showFlash("✓ Contact additionnel ajouté"); }} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>+ Ajouter un autre contact{extraContacts > 0 && ` (${extraContacts})`}</button>
              <button onClick={createProspect} style={{ ...npStyles.primaryBtn, cursor: "pointer" }}>✓ Créer le prospect</button>
            </div>
          </div>
        </div>

        {/* RIGHT — preview & IA */}
        <aside style={npStyles.previewCol}>

          {/* Preview card */}
          <div style={npStyles.previewBlock}>
            <div style={npStyles.previewHead}>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Aperçu fiche</span>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#10b981", color: "#fff", fontWeight: 700, letterSpacing: 0.4 }}>● LIVE</span>
            </div>

            <div style={npStyles.previewCard}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={npStyles.previewLogo}>BM</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Banque Méridionale</span>
                    <span style={{ ...npStyles.tierBadge, background: "#fef3c7", color: "#a16207", border: "1px solid #fde68a" }}>★ A</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Banque privée · 1 200 emp.</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>📍 Marseille · CA 142 M€</div>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Contact principal</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name="Laurent Mercier" size={28} color="#dc2626" />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>Laurent Mercier <span style={{ fontSize: 9, padding: "0 4px", background: "#fdecec", color: "#dc2626", borderRadius: 3, fontWeight: 700, marginLeft: 4 }}>★ DÉCIDEUR</span></div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>DSI · C-level</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Score qualification</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#10b981", letterSpacing: -0.6 }}>87</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>/ 100</span>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "#e8f8f1", color: "#0e7a55", fontWeight: 700, marginLeft: "auto" }}>HOT</span>
                </div>
                <div style={{ width: "100%", height: 4, background: "#eef1f5", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: "87%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #10b981)", borderRadius: 999 }} />
                </div>
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name="Karim Ben Salah" size={20} color="#6366f1" />
                <span style={{ fontSize: 11, color: "#475569" }}>Owner : <strong>Karim Ben Salah</strong></span>
              </div>
            </div>
          </div>

          {/* AI Enrichment */}
          <div style={npStyles.previewBlock}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>★</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Enrichissement IA</div>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>Sources externes croisées automatiquement</div>
              </div>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#0a66c2", color: "#fff" }}>in</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>LinkedIn Sales Navigator</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>1 200 employés · 8 nouvelles embauches IT 30j</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#f59e0b", color: "#fff" }}>S</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Base SIRENE / Pappers</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>SIREN, NAF, dirigeants, bilans 2022-2024</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#dc2626", color: "#fff" }}>📰</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Veille presse spécialisée</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>3 articles : « insatisfaction CRM », « budget IT en hausse »</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#a855f7", color: "#fff" }}>◷</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Radar concurrentiel</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>Pega — fin contrat 30/06 · notice échue 01/05</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSourcePending}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#eef1f5", color: "#94a3b8" }}>↻</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#94a3b8" }}>Crawl site web entreprise</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>Stack tech, partenaires, dirigeants…</div>
              </div>
              <span style={{ fontSize: 10, color: "#a855f7", fontWeight: 600 }}>En cours</span>
            </div>
          </div>

          {/* Doublons */}
          <div style={{ ...npStyles.previewBlock, background: "#fffbeb", borderColor: "#fde68a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>⚠</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a65f00" }}>Doublons potentiels</span>
            </div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, marginBottom: 8 }}>
              Aucun doublon exact détecté. <strong>1 entreprise similaire</strong> dans votre base :
            </div>
            <div style={npStyles.dupRow}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "#475569", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>BM</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Banque Méridional<span style={{ color: "#dc2626" }}>e</span> SA</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>Lost 2024 · Tom Verdier</div>
              </div>
              <button style={{ ...npStyles.smBtn, fontSize: 10.5 }}>Voir</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ───── helpers
const SectionHead = ({ num, title, subtitle, status }) => {
  const statusMeta = {
    done: { bg: "#e8f8f1", color: "#0e7a55", icon: "✓" },
    active: { bg: "#eef2ff", color: "#4f46e5", icon: num },
    todo: { bg: "#fafbfc", color: "#94a3b8", icon: num },
  };
  const s = statusMeta[status];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eef1f5" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{s.icon}</div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.2 }}>{title}</h2>
        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
};

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

const npStyles = {
  frame: { width: 1440, background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column" },

  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 4 },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eef1f5", background: "#fff" },
  heroIcon: { width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0, color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  completion: { padding: "10px 14px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },

  body: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 0, padding: 20, gridAutoRows: "min-content" },

  formCol: { display: "flex", flexDirection: "column", gap: 14, paddingRight: 14 },

  section: { padding: 20, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },

  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f172a", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box" },
  inputHelp: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inputWithSuffix: { display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", background: "#fff" },
  suffix: { fontSize: 12, color: "#94a3b8", fontWeight: 500, paddingLeft: 8, borderLeft: "1px solid #eef1f5", marginLeft: 4 },
  inputWithIcon: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" },
  select: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer" },
  dateInput: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" },
  linkTag: { fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "#fafbfc", border: "1px solid currentColor", whiteSpace: "nowrap" },
  searchInputWrap: { position: "relative" },
  searchTag: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#eef2ff", color: "#4f46e5", fontWeight: 600 },

  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  formGrid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },

  segCtrl: { display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" },
  segBtn: { padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  segBtnActive: { background: "#0f172a", color: "#fff", fontWeight: 600 },

  tierRow: { display: "flex", gap: 6 },
  tierBtn: { width: 40, padding: "6px 0", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, cursor: "pointer", textAlign: "center" },
  tierBadge: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 },

  roleChip: { padding: "5px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  roleChipOn: { background: "#fef3c7", borderColor: "#fbbf24", color: "#a16207", fontWeight: 700 },

  compChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid", borderRadius: 6, fontSize: 11.5 },

  linkedCardMini: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  changeBtn: { padding: "3px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },

  // BANT
  bantGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 },
  bantCard: { padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  bantLetter: { width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  bantRating: { display: "flex", gap: 3, marginTop: 8 },
  bantDot: { width: 14, height: 5, borderRadius: 2, display: "inline-block" },

  // Action radios
  actionRadios: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  actionRadio: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" },
  actionRadioOn: { background: "linear-gradient(180deg, #fafbff, #fff)", borderColor: "#4f46e5", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" },

  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },
  addChip: { padding: "3px 10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 500 },

  actionsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginTop: 4 },

  // Preview column
  previewCol: { display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "start" },
  previewBlock: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  previewHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  previewCard: { padding: 14, background: "linear-gradient(180deg, #fafbfc, #fff)", border: "1px solid #eef1f5", borderRadius: 10 },
  previewLogo: { width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #475569, #1e293b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, letterSpacing: 0.4, flexShrink: 0 },

  aiSource: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  aiSourcePending: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", opacity: 0.7 },
  aiSourceIcon: { width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  statusOk: { fontSize: 11, color: "#10b981", fontWeight: 700 },

  dupRow: { display: "flex", alignItems: "center", gap: 9, padding: 8, background: "#fff", border: "1px solid #fde68a", borderRadius: 6 },
  smBtn: { padding: "3px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 5, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },
};

window.NewProspect = NewProspect;
