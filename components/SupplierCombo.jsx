// ════════════════════════════════════════════════════════════════════
// SupplierCombo — combobox fournisseur réutilisable
// ════════════════════════════════════════════════════════════════════
//
// Composant standalone exposé sur window.HubSupplierCombo pour pouvoir
// être consommé depuis StockCatalogue, CommercialDocs et d'autres
// formulaires sans dupliquer le code.
//
// Props :
//   value                  : string — nom du fournisseur sélectionné
//   suppliers              : Array<{id, name, category, …}>
//   cellInput              : style de base pour le trigger (optionnel)
//   onChange(name)         : appelé à la sélection / clear
//   onSuppliersChanged()   : appelé après création / suppression
//   placeholder            : texte affiché quand value est vide
//
// Fonctionnalités :
//   • Recherche en temps réel (case-insensitive)
//   • Clear via « ✕ Retirer la sélection »
//   • Désactivation (soft-delete) d'un fournisseur via × dans la liste
//   • Création inline d'un nouveau fournisseur depuis la recherche
//   • Fermeture au clic extérieur ou Échap
//
// ════════════════════════════════════════════════════════════════════

const SupplierCombo = ({ value, suppliers, cellInput, onChange, onSuppliersChanged, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef(null);

  // Fermeture au clic extérieur
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = (suppliers || []).filter((s) => !q || (s.name || "").toLowerCase().indexOf(q) !== -1);
  const exact = (suppliers || []).some((s) => (s.name || "").toLowerCase() === q);
  const canCreate = q && !exact;

  const select = (name) => {
    onChange && onChange(name || null);
    setQuery("");
    setOpen(false);
  };
  const createNew = async () => {
    const name = query.trim();
    if (!name) return;
    try {
      await window.api.suppliers.create({ name });
      if (window.HubToast) window.HubToast.success("✓ Fournisseur « " + name + " » ajouté");
      onSuppliersChanged && onSuppliersChanged();
      select(name);
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Création : " + (e.message || e));
    }
  };
  const removeSupplier = async (e, sup) => {
    e.stopPropagation();
    if (!confirm("Désactiver le fournisseur « " + sup.name + " » ?\n\nIl sera caché de la liste mais l'historique des achats est préservé.")) return;
    try {
      await window.api.suppliers.remove(sup.id);
      if (window.HubToast) window.HubToast.success("✓ Fournisseur retiré");
      onSuppliersChanged && onSuppliersChanged();
    } catch (e2) {
      if (window.HubToast) window.HubToast.error("Suppression : " + (e2.message || e2));
    }
  };

  const baseInput = cellInput || { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", width: "100%", background: "#fff" };

  const trigger = (
    <button type="button" onClick={() => setOpen((v) => !v)}
            style={{ ...baseInput, textAlign: "left", cursor: "pointer",
                     borderColor: !value ? "#fca5a5" : "#e2e8f0",
                     color: !value ? "#dc2626" : "#0f172a", fontWeight: 600,
                     display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || (placeholder || "⚠ À assigner")}
      </span>
      <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {trigger}
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 1000,
                      background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(15,23,42,0.15)", maxHeight: 320, display: "flex",
                      flexDirection: "column", minWidth: 240 }}>
          <input autoFocus type="text" value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => { if (e.key === "Enter") { if (filtered[0]) select(filtered[0].name); else if (canCreate) createNew(); } if (e.key === "Escape") setOpen(false); }}
                 placeholder="🔍 Rechercher un fournisseur…"
                 style={{ padding: "8px 10px", border: "none", borderBottom: "1px solid #eef1f5",
                          outline: "none", fontSize: 12, fontFamily: "inherit", color: "#0f172a" }} />
          <div style={{ flex: 1, overflowY: "auto" }}>
            {value && (
              <div onClick={() => select("")}
                   style={{ padding: "8px 10px", fontSize: 11.5, color: "#dc2626", cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>
                ✕ Retirer la sélection
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding: 14, fontSize: 11.5, color: "#94a3b8", textAlign: "center" }}>
                Aucun fournisseur ne correspond.
              </div>
            ) : (
              filtered.map((s) => (
                <div key={s.id}
                     onClick={() => select(s.name)}
                     style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
                              fontSize: 12, cursor: "pointer",
                              background: s.name === value ? "#eff6ff" : "transparent",
                              borderBottom: "1px solid #f8fafc" }}
                     onMouseEnter={(e) => { if (s.name !== value) e.currentTarget.style.background = "#f8fafc"; }}
                     onMouseLeave={(e) => { if (s.name !== value) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ flex: 1, color: "#0f172a", fontWeight: s.name === value ? 700 : 500 }}>
                    {s.name}
                    {s.category && <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>· {s.category}</span>}
                  </span>
                  <button type="button" onClick={(e) => removeSupplier(e, s)}
                          title="Désactiver ce fournisseur"
                          style={{ width: 20, height: 20, borderRadius: 4, border: "none",
                                   background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>×</button>
                </div>
              ))
            )}
          </div>
          {canCreate && (
            <div onClick={createNew}
                 style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#065f46",
                          background: "#d1fae5", cursor: "pointer", borderTop: "1px solid #a7f3d0" }}>
              + Ajouter « <strong>{query.trim()}</strong> »
            </div>
          )}
        </div>
      )}
    </div>
  );
};

window.HubSupplierCombo = SupplierCombo;
