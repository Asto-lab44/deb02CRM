// Modal "Parc informatique" — extraction de l'inventaire IT du client.
// PC, serveurs, réseau, imprimantes, etc. avec OS, dates d'achat/garantie,
// contrats de maintenance. Filtres par type, statut, et garantie.

const AssetInventoryModal = ({ open, client, onClose }) => {
  const [filterType, setFilterType] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterWarranty, setFilterWarranty] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // Données live depuis Supabase, fallback inline si non configuré
  const dataEnabled = typeof window !== "undefined" && window.HubData && window.HubData.enabled();
  const [liveAssets, setLiveAssets] = React.useState(null);

  React.useEffect(() => {
    if (!open) { setFilterType("all"); setFilterStatus("all"); setFilterWarranty("all"); setSearch(""); return; }
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open || !dataEnabled) return;
    let cancelled = false;
    (async () => {
      const cid = (client && client.id) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null);
      if (!cid) return;
      const { data, error } = await window.HubData.fetchAssetsByClient(cid);
      if (!cancelled && !error && data) {
        setLiveAssets(data.map((a) => ({
          id: a.id, type: a.type, host: a.hostname, model: a.model, serial: a.serial,
          os: a.os, assigned: a.assigned_to, bought: a.bought_on, warranty: a.warranty_end,
          contract: a.contract || "—", site: a.site, status: a.status,
        })));
      }
    })();
    return () => { cancelled = true; };
  }, [open, dataEnabled]);

  if (!open) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const TYPES = {
    laptop:  { label: "Portable",   icon: "💻", color: "#4f46e5" },
    desktop: { label: "Fixe",       icon: "🖥",  color: "#0ea5e9" },
    server:  { label: "Serveur",    icon: "🗄",  color: "#a855f7" },
    network: { label: "Réseau",     icon: "🔌", color: "#0e7a55" },
    printer: { label: "Imprimante", icon: "🖨",  color: "#f59e0b" },
    mobile:  { label: "Mobile",     icon: "📱", color: "#ec4899" },
    display: { label: "Écran",      icon: "🖥",  color: "#64748b" },
  };

  // Aujourd'hui = 2026-05-27 dans la maquette
  const TODAY = new Date("2026-05-27");
  const daysUntil = (iso) => Math.round((new Date(iso) - TODAY) / 86400000);
  const warrantyStatus = (endIso) => {
    const d = daysUntil(endIso);
    if (d < 0) return "expired";
    if (d <= 90) return "warning";
    return "active";
  };

  // ── Inventaire : Supabase si configuré, sinon fallback maquette
  const assets = liveAssets || [
    // SERVEURS
    { id: "AX-SRV-001", type: "server",  host: "axa-dc-prod-01",   model: "Dell PowerEdge R750",     serial: "8K3NM52", os: "Windows Server 2022",      assigned: "Datacenter Paris",  bought: "2023-04-15", warranty: "2027-04-15", contract: "ProSupport Plus", site: "Paris DC", status: "active" },
    { id: "AX-SRV-002", type: "server",  host: "axa-dc-prod-02",   model: "Dell PowerEdge R750",     serial: "8K3NM68", os: "Windows Server 2022",      assigned: "Datacenter Paris",  bought: "2023-04-15", warranty: "2027-04-15", contract: "ProSupport Plus", site: "Paris DC", status: "active" },
    { id: "AX-SRV-003", type: "server",  host: "axa-app-01",       model: "HPE ProLiant DL380 Gen10", serial: "CZJ8412P", os: "Ubuntu 22.04 LTS",         assigned: "Datacenter Paris",  bought: "2021-09-22", warranty: "2026-09-22", contract: "Foundation Care", site: "Paris DC", status: "active" },
    { id: "AX-SRV-004", type: "server",  host: "axa-db-01",        model: "HPE ProLiant DL380 Gen10", serial: "CZJ8412R", os: "Oracle Linux 9",           assigned: "Datacenter Paris",  bought: "2021-09-22", warranty: "2026-09-22", contract: "Foundation Care", site: "Paris DC", status: "active" },
    { id: "AX-SRV-005", type: "server",  host: "axa-bkp-legacy",   model: "Dell PowerEdge R730",     serial: "5Q4LN21", os: "Windows Server 2016",      assigned: "Datacenter Paris",  bought: "2019-03-10", warranty: "2024-03-10", contract: "—",              site: "Paris DC", status: "stock" },

    // RÉSEAU
    { id: "AX-NET-001", type: "network", host: "axa-fw-edge-01",   model: "Fortinet FortiGate 200F", serial: "FG200FT22000123", os: "FortiOS 7.4.3",       assigned: "Infra réseau",       bought: "2024-01-12", warranty: "2027-01-12", contract: "FortiCare 360",   site: "Paris HQ", status: "active" },
    { id: "AX-NET-002", type: "network", host: "axa-sw-core-01",   model: "Cisco Catalyst 9300",     serial: "FCW2540L0AB",     os: "IOS XE 17.9.3",       assigned: "Infra réseau",       bought: "2022-11-08", warranty: "2027-11-08", contract: "Smart Net 24x7",  site: "Paris HQ", status: "active" },
    { id: "AX-NET-003", type: "network", host: "axa-sw-core-02",   model: "Cisco Catalyst 9300",     serial: "FCW2540L0AC",     os: "IOS XE 17.9.3",       assigned: "Infra réseau",       bought: "2022-11-08", warranty: "2027-11-08", contract: "Smart Net 24x7",  site: "Paris HQ", status: "active" },
    { id: "AX-NET-004", type: "network", host: "axa-ap-floor-3",   model: "Aruba AP-635",            serial: "CN12K85PQ",       os: "ArubaOS 10.5",        assigned: "WiFi étage 3",       bought: "2024-06-20", warranty: "2027-06-20", contract: "Aruba Central",   site: "Paris HQ", status: "active" },

    // POSTES DE TRAVAIL (Direction)
    { id: "AX-LAP-001", type: "laptop",  host: "ER-LAP-01",        model: "Apple MacBook Pro 16\" M3 Max", serial: "C02G7K9LMNP", os: "macOS 14.5 Sonoma",       assigned: "Émilie Roux (VP Innov.)", bought: "2024-02-08", warranty: "2027-02-08", contract: "AppleCare+",     site: "Paris HQ", status: "active" },
    { id: "AX-LAP-002", type: "laptop",  host: "AM-LAP-04",        model: "Dell Latitude 7440",      serial: "5R8KP72", os: "Windows 11 Pro 23H2",      assigned: "Antoine Mercier (CISO)",  bought: "2023-08-14", warranty: "2026-08-14", contract: "ProSupport Plus", site: "Paris HQ", status: "active" },
    { id: "AX-LAP-003", type: "laptop",  host: "JP-LAP-12",        model: "Dell Latitude 7430",      serial: "5R8KP43", os: "Windows 11 Pro 23H2",      assigned: "Julien Pasquier (DAF)",    bought: "2022-06-02", warranty: "2025-06-02", contract: "ProSupport",     site: "Paris HQ", status: "active" },
    { id: "AX-LAP-004", type: "laptop",  host: "ML-LAP-08",        model: "Dell Latitude 5440",      serial: "4N2HP91", os: "Windows 11 Pro 23H2",      assigned: "Marie Lopez",              bought: "2024-09-10", warranty: "2027-09-10", contract: "ProSupport",     site: "Paris HQ", status: "active" },
    { id: "AX-LAP-005", type: "laptop",  host: "CD-LAP-22",        model: "Dell Latitude 7430",      serial: "5R8KP78", os: "Windows 11 Pro 23H2",      assigned: "Camille Dufour",           bought: "2022-11-18", warranty: "2025-11-18", contract: "ProSupport",     site: "Paris HQ", status: "active" },
    { id: "AX-LAP-006", type: "laptop",  host: "LP-LAP-15",        model: "Lenovo ThinkPad X1 C11",  serial: "PF3YQM1L", os: "Windows 11 Pro 23H2",      assigned: "Laure Picard",            bought: "2023-04-22", warranty: "2026-04-22", contract: "Premier Support", site: "Paris HQ", status: "active" },
    { id: "AX-LAP-007", type: "laptop",  host: "BR-LAP-31",        model: "Lenovo ThinkPad T14 G3",  serial: "PF4ZQM2A", os: "Windows 11 Pro 23H2",      assigned: "Benoît Roy",              bought: "2022-03-15", warranty: "2025-03-15", contract: "—",              site: "Paris HQ", status: "active" },
    { id: "AX-LAP-008", type: "laptop",  host: "SR-LAP-19",        model: "Apple MacBook Air M2",    serial: "C02H8L7MQR", os: "macOS 14.5 Sonoma",       assigned: "Sarah Renaud",            bought: "2023-11-30", warranty: "2026-11-30", contract: "AppleCare+",     site: "Paris HQ", status: "active" },
    { id: "AX-LAP-009", type: "laptop",  host: "OB-LAP-44",        model: "Dell Latitude 5430",      serial: "4N2HP55", os: "Windows 10 Pro 22H2",      assigned: "Olivier Blanc",           bought: "2020-09-12", warranty: "2023-09-12", contract: "—",              site: "Lyon",     status: "active" },
    { id: "AX-LAP-010", type: "laptop",  host: "EC-LAP-37",        model: "Dell Latitude 5420",      serial: "3M1GN42", os: "Windows 10 Pro 22H2",      assigned: "Élise Chevalier",         bought: "2019-11-25", warranty: "2022-11-25", contract: "—",              site: "Bordeaux", status: "retired" },

    // POSTES FIXES
    { id: "AX-PC-001",  type: "desktop", host: "RECEPT-01",        model: "Dell OptiPlex 7010",      serial: "9X7VN85", os: "Windows 11 Pro 23H2",      assigned: "Accueil hall principal",  bought: "2024-03-04", warranty: "2027-03-04", contract: "ProSupport",     site: "Paris HQ", status: "active" },
    { id: "AX-PC-002",  type: "desktop", host: "SALLE-CONF-A",     model: "Dell OptiPlex 7010",      serial: "9X7VN86", os: "Windows 11 Pro 23H2",      assigned: "Salle Cézanne (visio)",  bought: "2024-03-04", warranty: "2027-03-04", contract: "ProSupport",     site: "Paris HQ", status: "active" },
    { id: "AX-PC-003",  type: "desktop", host: "GRAPH-DESIGN-01",  model: "Apple iMac M3 24\"",      serial: "C02J9N6PRS", os: "macOS 14.5 Sonoma",      assigned: "Studio Marketing",        bought: "2024-01-18", warranty: "2027-01-18", contract: "AppleCare+",     site: "Paris HQ", status: "active" },

    // MOBILES
    { id: "AX-MOB-001", type: "mobile",  host: "iPhone Roux",      model: "Apple iPhone 15 Pro",     serial: "F2LXM4N5P6", os: "iOS 17.5",                assigned: "Émilie Roux",             bought: "2024-02-08", warranty: "2025-02-08", contract: "—",              site: "Paris HQ", status: "active" },
    { id: "AX-MOB-002", type: "mobile",  host: "iPhone Mercier",   model: "Apple iPhone 14",         serial: "G3MYN5O6Q7", os: "iOS 17.5",                assigned: "Antoine Mercier",         bought: "2023-01-12", warranty: "2024-01-12", contract: "—",              site: "Paris HQ", status: "active" },
    { id: "AX-MOB-003", type: "mobile",  host: "Samsung-Lopez",    model: "Samsung Galaxy S23",      serial: "RZ8X1234567", os: "Android 14 (OneUI 6.1)",   assigned: "Marie Lopez",             bought: "2023-09-10", warranty: "2025-09-10", contract: "—",              site: "Paris HQ", status: "active" },

    // ÉCRANS
    { id: "AX-MON-001", type: "display", host: "MON-ER-01",        model: "Dell U3223QE 32\"",       serial: "D7K2P8M5", os: "—",                       assigned: "Émilie Roux",             bought: "2024-02-08", warranty: "2027-02-08", contract: "Advanced Exchange", site: "Paris HQ", status: "active" },
    { id: "AX-MON-002", type: "display", host: "MON-AM-02",        model: "Dell U2723QE 27\"",       serial: "D7K2P8M6", os: "—",                       assigned: "Antoine Mercier",         bought: "2023-08-14", warranty: "2026-08-14", contract: "Advanced Exchange", site: "Paris HQ", status: "active" },

    // IMPRIMANTES
    { id: "AX-PRT-001", type: "printer", host: "IMP-ETAGE-3",      model: "HP LaserJet M507dn",      serial: "VNB3X42KLM", os: "HP firmware 2.4",         assigned: "Étage 3 — Direction",    bought: "2022-05-20", warranty: "2025-05-20", contract: "HP Care Pack",   site: "Paris HQ", status: "active" },
    { id: "AX-PRT-002", type: "printer", host: "IMP-COMPTA",       model: "Canon imageRUNNER C3326i",serial: "RZK56789AB",  os: "—",                      assigned: "Service Compta",         bought: "2021-06-14", warranty: "2026-06-14", contract: "Canon Service+", site: "Paris HQ", status: "active" },
    { id: "AX-PRT-003", type: "printer", host: "IMP-LYON",         model: "HP LaserJet M404dn",      serial: "VNB3X42KMN", os: "HP firmware 2.4",         assigned: "Bureau Lyon",            bought: "2020-03-08", warranty: "2023-03-08", contract: "—",              site: "Lyon",     status: "active" },
  ];

  // ── KPIs
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === "active").length;
  const expiredWarranty = assets.filter((a) => warrantyStatus(a.warranty) === "expired").length;
  const expiringWarranty = assets.filter((a) => warrantyStatus(a.warranty) === "warning").length;
  const withContract = assets.filter((a) => a.contract && a.contract !== "—").length;
  const win10Count = assets.filter((a) => /Windows 10/.test(a.os)).length;
  const totalValue = "≈ 487 k€"; // valeur d'inventaire (estimation fictive)

  // ── Filtrage
  const filtered = assets.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterWarranty !== "all" && warrantyStatus(a.warranty) !== filterWarranty) return false;
    if (search && !(a.host + " " + a.model + " " + a.assigned + " " + a.serial + " " + a.os).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeCounts = Object.keys(TYPES).reduce((acc, k) => { acc[k] = assets.filter((a) => a.type === k).length; return acc; }, {});

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const fmtWarranty = (iso) => {
    const status = warrantyStatus(iso);
    const days = daysUntil(iso);
    const colorByStatus = { expired: "#dc2626", warning: "#a65f00", active: "#0e7a55" };
    const labelByStatus = {
      expired: `Expirée (${Math.abs(days)} j)`,
      warning: `Expire ${days <= 30 ? "dans " + days + " j" : "dans " + Math.round(days/30) + " mois"}`,
      active: `Active`,
    };
    return { color: colorByStatus[status], label: labelByStatus[status], soft: { expired: "#fdecec", warning: "#fff6e6", active: "#dcfce7" }[status] };
  };

  const tree = (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEAD */}
        <div style={S.head}>
          <div>
            <div style={S.eyebrow}>Inventaire IT · Snapshot du 27 mai 2026</div>
            <div style={S.title}>Parc informatique — {client ? client.name : "client"}</div>
            <div style={S.sub}>{totalAssets} équipements · {activeAssets} actifs · valeur estimée {totalValue}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => {
              if (window.HubToast) window.HubToast.info("Export CSV — connexion à la table assets en cours d'implémentation");
            }} style={{ ...S.btnGhost, cursor: "pointer" }} title="Exporter au format CSV">↓ CSV</button>
            <button onClick={() => {
              if (window.HubToast) window.HubToast.info("Export PDF — génération côté serveur prévue (WeasyPrint / Puppeteer)");
            }} style={{ ...S.btnGhost, cursor: "pointer" }} title="Exporter au format PDF">↓ PDF</button>
            <button onClick={onClose} style={S.close} aria-label="Fermer">×</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={S.kpiRow}>
          <div style={S.kpi}>
            <div style={S.kpiK}>Équipements</div>
            <div style={S.kpiV}>{totalAssets}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{activeAssets} en production</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>Garantie expirée</div>
            <div style={{ ...S.kpiV, color: "#dc2626" }}>{expiredWarranty}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{expiringWarranty} expirent {"<"} 3 mois</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>Sous contrat</div>
            <div style={{ ...S.kpiV, color: "#0e7a55" }}>{withContract}<span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}> / {totalAssets}</span></div>
            <div style={{ fontSize: 11, color: "#64748b" }}>maintenance active</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>OS obsolètes</div>
            <div style={{ ...S.kpiV, color: "#a65f00" }}>{win10Count}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Windows 10 (EOL 2025-10)</div>
          </div>
        </div>

        {/* Filtres + recherche */}
        <div style={S.filterBar}>
          <input
            placeholder="Rechercher (hostname, utilisateur, série, modèle…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={S.search}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={S.select}>
            <option value="all">Tous les types ({totalAssets})</option>
            {Object.entries(TYPES).map(([k, t]) => (
              <option key={k} value={k}>{t.icon} {t.label} ({typeCounts[k]})</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={S.select}>
            <option value="all">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="stock">En stock</option>
            <option value="retired">Retiré</option>
          </select>
          <select value={filterWarranty} onChange={(e) => setFilterWarranty(e.target.value)} style={S.select}>
            <option value="all">Toutes garanties</option>
            <option value="active">Active</option>
            <option value="warning">Expire bientôt</option>
            <option value="expired">Expirée</option>
          </select>
          <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
            {filtered.length} / {totalAssets} équipement{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* TABLE */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Type</th>
                <th style={S.th}>Hostname / ID</th>
                <th style={S.th}>Modèle</th>
                <th style={S.th}>Affecté à</th>
                <th style={S.th}>OS / Firmware</th>
                <th style={S.th}>Achat</th>
                <th style={S.th}>Garantie</th>
                <th style={S.th}>Contrat</th>
                <th style={S.th}>Site</th>
                <th style={S.th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const t = TYPES[a.type];
                const w = fmtWarranty(a.warranty);
                const isObsoleteOs = /Windows 10|Windows Server 2016/.test(a.os);
                return (
                  <tr key={a.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, background: t.color + "18", color: t.color, fontSize: 11, fontWeight: 600 }}>
                        <span>{t.icon}</span>{t.label}
                      </div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{a.host}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{a.id} · {a.serial}</div>
                    </td>
                    <td style={S.td}><span style={{ fontSize: 12.5 }}>{a.model}</span></td>
                    <td style={S.td}><span style={{ fontSize: 12 }}>{a.assigned}</span></td>
                    <td style={S.td}>
                      <span style={{ fontSize: 12, color: isObsoleteOs ? "#a65f00" : "#475569", fontWeight: isObsoleteOs ? 600 : 500 }}>
                        {a.os}
                        {isObsoleteOs && <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, color: "#a65f00", background: "#fff6e6", border: "1px solid #fde68a", padding: "0px 5px", borderRadius: 4 }}>EOL</span>}
                      </span>
                    </td>
                    <td style={S.td}><span style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(a.bought)}</span></td>
                    <td style={S.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, background: w.soft, color: w.color, fontSize: 11, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: w.color }} />
                        {w.label}
                      </span>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>fin {fmtDate(a.warranty)}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: 12, color: a.contract === "—" ? "#cbd5e1" : "#0f172a" }}>{a.contract}</span>
                    </td>
                    <td style={S.td}><span style={{ fontSize: 12, color: "#64748b" }}>📍 {a.site}</span></td>
                    <td style={S.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: statusColors[a.status].fg }}>
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColors[a.status].fg }} />
                        {statusColors[a.status].label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOT */}
        <div style={S.foot}>
          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
            Source : CMDB Astorya · synchronisation Intune / Jamf / SCCM toutes les 4 h · dernière maj 27 mai 2026 à 09:42
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost} onClick={onClose}>Fermer</button>
            <button onClick={() => {
              if (window.HubToast) window.HubToast.info("Rapport audit — génération PDF côté serveur prévue (à connecter via fonction Edge Supabase)");
            }} style={{ ...S.btnPrimary, cursor: "pointer" }}>Générer rapport audit →</button>
          </div>
        </div>
      </div>
    </div>
  );
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

window.AssetInventoryModal = AssetInventoryModal;

const statusColors = {
  active:  { fg: "#10b981", label: "Actif" },
  stock:   { fg: "#94a3b8", label: "En stock" },
  retired: { fg: "#cbd5e1", label: "Retiré" },
};

const S = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 1320, maxHeight: "94vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" },

  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "22px 24px 18px", borderBottom: "1px solid #f1f5f9" },
  eyebrow: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 19, fontWeight: 700, color: "#0f172a", marginTop: 4 },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  btnGhost: { padding: "7px 12px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "16px 24px 0" },
  kpi: { background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #eef2f7" },
  kpiK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  kpiV: { fontSize: 22, fontWeight: 700, color: "#0f172a", marginTop: 4, letterSpacing: -0.4 },

  filterBar: { display: "flex", gap: 10, padding: "16px 24px 0", alignItems: "center", flexWrap: "wrap" },
  search: { flex: 1, minWidth: 240, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, color: "#0f172a", background: "#fff", outline: "none" },
  select: { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, color: "#0f172a", background: "#fff", fontWeight: 500, cursor: "pointer" },

  tableWrap: { margin: "14px 24px 16px", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1100 },
  th: { textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "9px 12px", color: "#0f172a", verticalAlign: "top" },

  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px 18px", borderTop: "1px solid #f1f5f9" },
};
