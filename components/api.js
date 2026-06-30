// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Couche d'accès aux données (API layer)
// ════════════════════════════════════════════════════════════════════
//
// SOMMAIRE
//   §1. Helpers internes (supa, getCurrentUserId, lsGet/lsSet, genId, flattenClient, buildClientPatch)
//   §2. clients         → CRUD prospects/clients (Supabase clients + fallback localStorage)
//   §3. opportunities   → CRUD pipeline commercial (Supabase opportunities)
//   §4. contacts        → CRUD contacts secondaires d'un client (Supabase contacts)
//   §5. actions         → CRUD timeline d'actions (Supabase actions)
//   §6. contracts       → CRUD contrats client (Supabase contracts)
//   §7. auth            → getUser/signOut/requireAuth (wrapper Supabase Auth)
//   §8. Export window.api
//
// COMPORTEMENT GLOBAL
//   - Si Supabase est configuré (HubSupabase.enabled) → tous les writes/reads
//     vont en BDD Supabase. Filtrage automatique des soft-deleted (deleted_at).
//   - Si Supabase fail (RLS, schéma manquant…) → fallback silencieux sur
//     localStorage pour ne pas perdre la donnée (`hubAstorya.prospects.v1`,
//     `.opportunities.v1`, etc.)
//   - Les deletes sont SOFT (UPDATE deleted_at = now()) sur les tables
//     concernées — pas de perte de donnée par erreur.
//   - Les IDs générés (`genId`) sont collision-résistants (timestamp base36
//     + 6 chars random).
//
// USAGE
//   await window.api.clients.list({ status: 'prospect' })
//   await window.api.clients.create({ raison_sociale, siren, ... })
//   await window.api.opportunities.update('OPP-…', { stage: 'won' })
//   await window.api.actions.complete('EX-…')
//   const u = await window.api.auth.getUser()
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ───────────────────────────────────────────────────────────────────
  // §1. HELPERS INTERNES
  // ───────────────────────────────────────────────────────────────────

  /** Renvoie le client Supabase si configuré, sinon null. */
  function supa() {
    return window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
  }

  /** Renvoie l'UUID de l'utilisateur connecté à Supabase Auth, sinon null. */
  async function getCurrentUserId() {
    const s = supa();
    if (!s) return null;
    try {
      const { data } = await s.auth.getSession();
      return data && data.session && data.session.user ? data.session.user.id : null;
    } catch (e) { return null; }
  }

  /** Renvoie le nom (display name) de l'utilisateur connecté, depuis HubAccess. */
  function getCurrentUserName() {
    try {
      const u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
      return (u && u.name) || null;
    } catch (e) { return null; }
  }

  // localStorage helpers — chaque ressource est sérialisée sous la clé
  // `hubAstorya.<resource>.v1` (un tableau JSON).
  function lsKey(resource) { return "hubAstorya." + resource + ".v1"; }
  function lsGet(resource) {
    try { return JSON.parse(localStorage.getItem(lsKey(resource)) || "[]"); } catch (e) { return []; }
  }
  function lsSet(resource, arr) {
    try { localStorage.setItem(lsKey(resource), JSON.stringify(arr)); } catch (e) {}
  }

  /** Génère un ID unique de la forme `PREFIX-{timestamp36}{rand6}`.
   *  Collision-résistant : ~2 milliards de combinaisons pour rand6 + timestamp ms. */
  function genId(prefix) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return prefix + "-" + ts + rand;
  }

  /** "Aplatit" une ligne client Supabase : les colonnes top-level + le contenu
   *  de la colonne `data` (jsonb) sont fusionnés dans un seul objet plat.
   *  → permet à ClientPage de lire `c.siren`, `c.naf`, etc. uniformément. */
  function flattenClient(row) {
    if (!row) return row;
    const extras = row.data && typeof row.data === "object" ? row.data : {};
    const out = { ...extras, ...row };
    delete out.data;
    return out;
  }

  /** Construit un payload BDD pour `clients.insert` / `clients.update` :
   *  - les colonnes "core" (name, industry, city, website, status, owner)
   *    deviennent des colonnes top-level
   *  - tout le reste (siren, naf, tva, effectif, adresse…) part dans la
   *    colonne `data jsonb` pour rester schemaless. */
  function buildClientPatch(payload) {
    const topLevel = {
      id: payload.id,
      name: payload.raison_sociale || payload.name,
      industry: payload.secteur || payload.industry || null,
      city: payload.ville || payload.city || null,
      website: payload.site_web || payload.website || null,
      status: payload.status || "prospect",
      owner: payload.owner || null,
      client_since: payload.client_since || null,
    };
    const reserved = new Set(["id", "name", "industry", "city", "website", "status", "owner", "client_since", "data", "updated_at", "created_at", "created_by"]);
    const data = {};
    Object.keys(payload).forEach((k) => {
      if (k === "raison_sociale" || k === "secteur" || k === "ville" || k === "site_web") return;
      if (!reserved.has(k)) data[k] = payload[k];
    });
    topLevel.data = data;
    return topLevel;
  }

  // ───────────────────────────────────────────────────────────────────
  // §2. CLIENTS — prospects + clients
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.clients
  // Colonnes JSONB : `data` (siren, naf, tva, effectif, adresse, contact_principal…)
  // Soft-delete : `deleted_at IS NULL` est appliqué automatiquement aux reads.
  //
  // Méthodes :
  //   list({status}?)      → tableau, trié created_at DESC
  //   getById(id)          → objet ou null (fallback localStorage si pas en BDD)
  //   create(payload)      → objet créé (avec id généré si absent)
  //   update(id, patch)    → objet maj
  //   remove(id)           → SOFT delete (UPDATE deleted_at = now())

  const clients = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("clients").select("*");
        if (filter.status) q = q.eq("status", filter.status);
        // Filtre les soft-deleted
        q = q.is("deleted_at", null);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) {
          console.warn("[api.clients.list]", error.message);
          // Fallback localStorage uniquement si Supabase fail
          let arr = lsGet("prospects");
          if (filter.status) arr = arr.filter((c) => c.status === filter.status);
          return arr;
        }
        return (data || []).map(flattenClient);
      }
      // Pas de Supabase configuré → localStorage seul
      let arr = lsGet("prospects");
      if (filter.status) arr = arr.filter((c) => c.status === filter.status);
      return arr;
    },

    async getById(id) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("clients").select("*").eq("id", id).maybeSingle();
        if (error) console.warn("[api.clients.getById]", error.message);
        if (data) return flattenClient(data);
      }
      // Fallback localStorage si pas trouvé en BDD (insert avait pu rater)
      const arr = lsGet("prospects");
      return arr.find((c) => c.id === id) || null;
    },

    async create(payload) {
      const id = payload.id || genId("ACC");
      const full = { ...payload, id, created_at: payload.created_at || new Date().toISOString(), status: payload.status || "prospect" };
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        const row = buildClientPatch({ ...full, created_by });
        if (created_by) row.created_by = created_by;
        let { data, error } = await s.from("clients").insert(row).select().maybeSingle();
        // Retry sans colonne data si elle n'existe pas dans le schéma
        if (error && /column.+data.+does not exist/i.test(error.message || "")) {
          const { data: data2, error: e2 } = await s.from("clients").insert({ ...row, data: undefined }).select().maybeSingle();
          if (!e2) { data = data2; error = null; }
        }
        if (error) {
          console.warn("[api.clients.create]", error.message);
          alert("Sauvegarde Supabase impossible : " + error.message + "\n\nExécute supabase/setup-tout.sql dans le SQL Editor.");
          // fallback local
          const arr = lsGet("prospects");
          arr.unshift(full);
          lsSet("prospects", arr);
          return full;
        }
        return flattenClient(data);
      }
      const arr = lsGet("prospects");
      arr.unshift(full);
      lsSet("prospects", arr);
      return full;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        // CRITIQUE : on lit le data jsonb actuel pour le MERGER avec les
        // nouveaux champs. Sinon buildClientPatch remplace toute la colonne
        // data et fait disparaître les fields non touchés par cette édition
        // (tech, contacts_additionnels, contact_principal partiel, etc.).
        let existingData = {};
        try {
          const { data: cur } = await s.from("clients").select("data").eq("id", id).single();
          if (cur && cur.data && typeof cur.data === "object") existingData = cur.data;
        } catch (e) {}
        const row = buildClientPatch({ id, ...patch });
        delete row.id; // ne pas patcher la clé primaire
        // Merge data : on garde tout l'existant + écrase uniquement les
        // champs explicitement renseignés dans le patch.
        row.data = { ...existingData, ...(row.data || {}) };
        const { data, error } = await s.from("clients").update(row).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.clients.update]", error.message);
        if (data) return flattenClient(data);
      }
      const arr = lsGet("prospects");
      const idx = arr.findIndex((c) => c.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
        lsSet("prospects", arr);
        return arr[idx];
      }
      return null;
    },

    /** SOFT-delete : marque `deleted_at = now()`. La donnée reste en BDD,
     *  juste filtrée par les reads. Permet de restaurer via une simple
     *  requête `UPDATE clients SET deleted_at = NULL`. */
    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("clients").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) {
          console.warn("[api.clients.remove]", error.message);
          // Si la colonne deleted_at n'existe pas (vieux schéma), fallback hard delete
          if (/column.+deleted_at.+does not exist/i.test(error.message || "")) {
            await s.from("clients").delete().eq("id", id);
          } else {
            throw new Error("Suppression échouée : " + error.message);
          }
        }
      }
      const arr = lsGet("prospects").filter((c) => c.id !== id);
      lsSet("prospects", arr);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §3. OPPORTUNITIES — pipeline commercial
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.opportunities
  // Stages : qualif → discovery → propo → nego → won/lost
  // Champs clés : client_id, amount_eur, stage, proba (0-100), close_date,
  //               owner (nom du commercial), modules (text[])
  //
  // Méthodes : list({client_id, stage}?), getById, create, update
  const opportunities = {
    /** Supprime TOUTES les opportunités (table + localStorage). Irréversible.
     *  Utilisé depuis l'admin pour vider le dropdown "Rattacher à une opportunité"
     *  des entrées test/junk. Ne touche pas aux clients ni aux contacts. */
    async purgeAll() {
      const s = supa();
      let removed = 0;
      if (s) {
        try {
          const { count } = await s.from("opportunities").select("*", { count: "exact", head: true });
          const { error } = await s.from("opportunities").delete().not("id", "is", null);
          if (error) throw new Error(error.message);
          removed = count || 0;
        } catch (e) { throw e; }
      }
      try { lsSet("opportunities", []); } catch (e) {}
      return { removed };
    },

    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("opportunities").select("*");
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        if (filter.stage) q = q.eq("stage", filter.stage);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) console.warn("[api.opportunities.list]", error.message);
        return data || [];
      }
      let arr = lsGet("opportunities");
      if (filter.client_id) arr = arr.filter((o) => o.client_id === filter.client_id);
      return arr;
    },

    async getById(id) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("opportunities").select("*").eq("id", id).maybeSingle();
        if (error) console.warn("[api.opportunities.getById]", error.message);
        return data;
      }
      const arr = lsGet("opportunities");
      return arr.find((o) => o.id === id || o.ref === id) || null;
    },

    async create(payload) {
      const id = payload.id || payload.ref || genId("OPP");
      const full = { ...payload, id, ref: id, created_at: payload.created_at || new Date().toISOString(), stage: payload.stage || "qualif" };
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        const row = {
          id, client_id: full.client_id || null,
          name: full.name, amount_eur: parseFloat(String(full.amount || "0").replace(/[^\d.]/g, "")) || 0,
          stage: full.stage, proba: full.proba || 20,
          close_date: full.close_date || null,
          owner: full.owner || null, produit: full.produit || null, modules: full.modules || [],
          type: full.type || "new", source: full.source || null, duration: full.duration || null,
          notes: full.notes || null, data: full,
        };
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("opportunities").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.opportunities.create]", error.message);
          const arr = lsGet("opportunities"); arr.unshift(full); lsSet("opportunities", arr);
          return full;
        }
        return { ...(data.data || {}), ...data };
      }
      const arr = lsGet("opportunities");
      arr.unshift(full);
      lsSet("opportunities", arr);
      return full;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        // Colonnes réelles de la table opportunities
        const REAL = new Set(["client_id", "name", "amount_eur", "stage", "proba", "close_date", "owner", "produit", "modules", "type", "source", "duration", "notes"]);
        const row = {};
        const extraData = {};
        for (const k of Object.keys(patch || {})) {
          if (k === "amount" && typeof patch.amount === "string") {
            row.amount_eur = parseFloat(patch.amount.replace(/[^\d.]/g, "")) || 0;
          } else if (k === "amount") {
            row.amount_eur = Number(patch.amount) || 0;
          } else if (REAL.has(k)) {
            row[k] = patch[k];
          } else if (k === "data" && patch.data && typeof patch.data === "object") {
            Object.assign(extraData, patch.data);
          } else {
            extraData[k] = patch[k];
          }
        }
        // Lit le stage actuel pour détecter la transition vers "won"
        let previousStage = null;
        try {
          const { data: cur } = await s.from("opportunities").select("stage, data").eq("id", id).maybeSingle();
          if (cur) {
            previousStage = cur.stage;
            // Merge extras dans le data jsonb existant (sans écraser)
            if (Object.keys(extraData).length > 0) {
              const existingData = (cur.data && typeof cur.data === "object") ? cur.data : {};
              row.data = { ...existingData, ...extraData };
            }
          } else if (Object.keys(extraData).length > 0) {
            row.data = extraData;
          }
        } catch (e) {
          if (Object.keys(extraData).length > 0) row.data = extraData;
        }
        const { data, error } = await s.from("opportunities").update(row).eq("id", id).select().maybeSingle();
        if (error) {
          console.warn("[api.opportunities.update]", error.message);
          throw new Error(error.message);
        }
        // Transition vers "won" → auto-création d'un projet dans Projets & Livrables
        // (idempotent : ne crée pas si un projet est déjà lié à cette opp)
        // Hook idempotent : se déclenche tant que l'opp est en 'won' ET qu'il
        // manque des étapes downstream (projet, commande, BL). Évite que
        // le cascade ne se fasse jamais si l'opp était déjà 'won' lors de
        // l'introduction du hook (existant historique).
        const oppIsWonNow = (data && data.stage === "won") || row.stage === "won";
        if (oppIsWonNow) {
          try {
            const { data: existingProj } = await s.from("projects").select("id").eq("opportunity_id", id).maybeSingle();
            if (!existingProj) {
              const created_by = await getCurrentUserId();
              const cuName = getCurrentUserName();
              const projId = genId("PRJ");
              const projRow = {
                id: projId,
                name: data.name || "Projet — " + id,
                stage: "recu",
                client_id: data.client_id || null,
                amount_ht: data.amount_eur || null,
                opportunity_id: id,
                description: data.notes || (data.data && data.data.besoin) || null,
                data: { opportunity_id: id, opportunity_name: data.name, created_from: "auto_won" },
              };
              if (created_by) projRow.created_by = created_by;
              const { error: pErr } = await s.from("projects").insert(projRow);
              if (pErr) {
                // Fallback si la colonne opportunity_id n'existe pas → on stocke en data jsonb
                if (/opportunity_id|column/i.test(pErr.message)) {
                  delete projRow.opportunity_id;
                  await s.from("projects").insert(projRow);
                } else {
                  console.warn("[api.opportunities.update] auto-project:", pErr.message);
                }
              }
              // Event projet
              await s.from("project_events").insert({
                project_id: projId, type: "created",
                payload: { from_opportunity: id, stage: "recu" },
                author_id: created_by || null,
                author_name: cuName,
              }).catch(() => {});
            }

            // Auto-cascade complète : TOUS les devis liés (statut non figé)
            // sont transformés en Commande → BL. Multi-devis supporté.
            try {
              const { data: existingDocs } = await s.from("commercial_docs")
                .select("id, type, status, parent_doc_id")
                .eq("opportunity_id", id)
                .is("deleted_at", null);
              const docs = existingDocs || [];
              const cdocs = (window.api && window.api.commercialDocs) || null;

              // 1. Pour CHAQUE devis non transformé/annulé/refusé : transform → commande
              const devisToCascade = docs.filter((d) =>
                d.type === "devis" &&
                d.status !== "transforme" &&
                d.status !== "annule" &&
                d.status !== "refuse"
              );

              const newCommandes = [];
              for (const devis of devisToCascade) {
                if (!cdocs || !cdocs.transform) break;
                try {
                  await s.from("commercial_docs").update({ status: "accepte" }).eq("id", devis.id);
                  const cmd = await cdocs.transform(devis.id, "commande");
                  if (cmd) newCommandes.push(cmd);
                } catch (eC) { console.warn("[opp→cmd auto " + devis.id + "]", eC.message || eC); }
              }

              // 2. Si aucun devis trouvé MAIS aucune commande non plus → crée une commande "from scratch"
              const hasCommande = docs.some((d) => d.type === "commande") || newCommandes.length > 0;
              if (!hasCommande && cdocs && cdocs.create) {
                const amt = Number(data.amount_eur) || 0;
                const c = await cdocs.create({
                  type: "commande",
                  status: "brouillon",
                  client_id: data.client_id || null,
                  client_name: data.client_name || (data.data && data.data.client_name) || null,
                  opportunity_id: id,
                  title: data.name || "Commande — " + id,
                  notes: data.notes || null,
                  owner: data.owner || null,
                  lines: amt > 0 ? [{
                    designation: data.name || "Prestation",
                    quantity: 1, unit: "forfait",
                    unit_price_ht: amt, discount_pct: 0,
                    tva_rate: 20,
                    total_ht: amt, total_tva: amt * 0.2, total_ttc: amt * 1.2,
                  }] : [],
                });
                if (c) newCommandes.push(c);
              }

              // 3. Pour CHAQUE commande (nouvelle ou existante non transformée) :
              //    transform → BL
              const allCommandes = [
                ...newCommandes,
                ...docs.filter((d) =>
                  d.type === "commande" &&
                  d.status !== "transforme" &&
                  d.status !== "annule" &&
                  d.status !== "refuse"
                ),
              ];
              // Dédoublonnage par id
              const seenIds = new Set();
              for (const cmd of allCommandes) {
                if (seenIds.has(cmd.id)) continue;
                seenIds.add(cmd.id);
                if (!cdocs || !cdocs.transform) break;
                // Vérifie qu'aucun BL n'a déjà cette commande comme parent
                const blExists = docs.some((d) => d.type === "bl" && d.parent_doc_id === cmd.id);
                if (blExists) continue;
                try {
                  await s.from("commercial_docs").update({ status: "accepte" }).eq("id", cmd.id);
                  await cdocs.transform(cmd.id, "bl");
                } catch (eBL) { console.warn("[opp→BL auto " + cmd.id + "]", eBL.message || eBL); }
              }
            } catch (e) {
              console.warn("[opp→cascade auto]", e.message || e);
            }
          } catch (e) {
            console.warn("[opp→project auto]", e.message || e);
          }
        }
        if (data) return data;
      }
      const arr = lsGet("opportunities");
      const idx = arr.findIndex((o) => o.id === id || o.ref === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
        lsSet("opportunities", arr);
        return arr[idx];
      }
      // si pas trouvé, on l'ajoute
      arr.unshift({ id, ref: id, ...patch });
      lsSet("opportunities", arr);
      return arr[0];
    },

    /** Supprime UNE opportunité par id. Idempotent. Détache aussi le lien
     *  côté projects (opportunity_id → null) si un projet pointe dessus
     *  pour ne pas laisser de référence orpheline. */
    async remove(id) {
      if (!id) return null;
      const s = supa();
      if (s) {
        try {
          // Détache les projets liés (FK nullable)
          await s.from("projects").update({ opportunity_id: null }).eq("opportunity_id", id);
        } catch (e) { console.warn("[opp.remove projects detach]", e.message || e); }
        const { error } = await s.from("opportunities").delete().eq("id", id);
        if (error) throw new Error(error.message);
        return { id };
      }
      let arr = lsGet("opportunities");
      arr = arr.filter((o) => o.id !== id && o.ref !== id);
      lsSet("opportunities", arr);
      return { id };
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §4. CONTACTS — interlocuteurs liés à un client
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.contacts
  // Particularité : un seul `is_principal=true` par client (contrainte unique
  // partielle en BDD). Les autres contacts sont marqués `is_principal=false`.
  //
  // Méthodes : list({client_id}?), create, update, remove
  const contacts = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("contacts").select("*");
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) console.warn("[api.contacts.list]", error.message);
        return data || [];
      }
      let arr = lsGet("contacts");
      if (filter.client_id) arr = arr.filter((c) => c.client_id === filter.client_id);
      return arr;
    },

    async create(payload) {
      const id = payload.id || genId("CT");
      const full = { ...payload, id, created_at: new Date().toISOString() };
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        const row = { id, client_id: full.client_id || null,
          prenom: full.prenom || null, nom: full.nom || null, fonction: full.fonction || null,
          email: full.email || null, phone: full.phone || null, linkedin: full.linkedin || null,
          is_principal: !!full.is_principal, roles: full.roles || [], hierarchie: full.hierarchie || null,
          notes: full.notes || null, data: full,
        };
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("contacts").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.contacts.create]", error.message);
        } else if (data) return data;
      }
      const arr = lsGet("contacts");
      arr.unshift(full);
      lsSet("contacts", arr);
      return full;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("contacts").update(patch).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.contacts.update]", error.message);
        if (data) return data;
      }
      const arr = lsGet("contacts");
      const idx = arr.findIndex((c) => c.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("contacts", arr); return arr[idx]; }
      return null;
    },

    async remove(id) {
      const s = supa();
      if (s) await s.from("contacts").delete().eq("id", id);
      const arr = lsGet("contacts").filter((c) => c.id !== id);
      lsSet("contacts", arr);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §5. ACTIONS — timeline (Email / Call / RDV / Tâche / Note)
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.actions
  // Types : email, call, rdv, visio, task, note, in (LinkedIn), wait, stage
  // Statuts : todo (à mener), done (terminée), cancelled
  // Champs clés : client_id, opp_id, due_at, priority (haute/moyenne/basse/ai),
  //               assigned_to (nom user), completed_at
  //
  // Méthodes : list({client_id, status}?), create, complete(id), remove(id)
  const actions = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("actions").select("*");
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        if (filter.status) q = q.eq("status", filter.status);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) console.warn("[api.actions.list]", error.message);
        return data || [];
      }
      let arr = lsGet("actionsExtra");
      let completed = lsGet("actionsCompleted");
      let all = [...arr, ...completed];
      if (filter.client_id) all = all.filter((a) => a.client_id === filter.client_id);
      if (filter.status) all = all.filter((a) => a.status === filter.status);
      return all;
    },

    async create(payload) {
      const id = payload.id || genId("EX");
      const full = { ...payload, id, status: payload.status || "todo", created_at: new Date().toISOString() };
      // Default assigned : utilisateur courant si rien de fourni
      if (!full.assigned) {
        try {
          const cu = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
          if (cu && cu.name) full.assigned = cu.name;
        } catch (e) {}
      }
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        const row = { id, client_id: full.client_id || null, opp_id: full.opp_id || null,
          type: full.type || "task", title: full.title || "Action",
          meta: full.meta || null, due_text: full.due || null,
          priority: full.priority || "moyenne", assigned_to: full.assigned || null,
          status: full.status, tag: full.tag || null, tag_color: full.tagColor || null,
          icon: full.icon || null, data: full,
        };
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("actions").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.actions.create]", error.message);
        } else if (data) return data;
      }
      const arr = lsGet("actionsExtra");
      arr.unshift(full);
      lsSet("actionsExtra", arr);
      return full;
    },

    async complete(id) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("actions").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.actions.complete]", error.message);
        if (data) return data;
      }
      // move from extra → completed
      const extra = lsGet("actionsExtra");
      const idx = extra.findIndex((a) => a.id === id);
      if (idx >= 0) {
        const done = { ...extra[idx], status: "done", completed_at: new Date().toISOString() };
        extra.splice(idx, 1);
        lsSet("actionsExtra", extra);
        const arr = lsGet("actionsCompleted");
        arr.unshift(done);
        lsSet("actionsCompleted", arr);
        return done;
      }
      return null;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("actions").update(patch).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.actions.update]", error.message);
        if (data) return data;
      }
      const arr = lsGet("actionsExtra");
      const idx = arr.findIndex((a) => a.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("actionsExtra", arr); return arr[idx]; }
      return null;
    },

    async remove(id) {
      const s = supa();
      if (s) await s.from("actions").delete().eq("id", id);
      lsSet("actionsExtra", lsGet("actionsExtra").filter((a) => a.id !== id));
      lsSet("actionsCompleted", lsGet("actionsCompleted").filter((a) => a.id !== id));
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6. CONTRACTS — contrats client
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.contracts
  // Tiers : premium / standard / none
  // Statuts : active, expiring, expired, none
  // Champs clés : client_id, opp_id (origine), name, start_date, end_date,
  //               monthly_eur, products (jsonb)
  //
  // Méthodes : list({client_id}?), create, update, remove
  const contracts = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("contracts").select("*").is("deleted_at", null);
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) {
          console.warn("[api.contracts.list]", error.message);
          // Si la colonne deleted_at n'existe pas (vieux schéma), retry sans filtre
          if (/column.+deleted_at.+does not exist/i.test(error.message || "")) {
            let q2 = s.from("contracts").select("*");
            if (filter.client_id) q2 = q2.eq("client_id", filter.client_id);
            const { data: d2 } = await q2.order("created_at", { ascending: false });
            return d2 || [];
          }
        }
        // Fusionne avec localStorage si Supabase OK mais vide
        const supaList = data || [];
        let local = lsGet("contracts");
        if (filter.client_id) local = local.filter((c) => c.client_id === filter.client_id);
        const seen = new Set(supaList.map((c) => c.id));
        const merged = [...supaList];
        local.forEach((c) => { if (!seen.has(c.id)) merged.push(c); });
        return merged;
      }
      let arr = lsGet("contracts");
      if (filter.client_id) arr = arr.filter((c) => c.client_id === filter.client_id);
      return arr;
    },

    async create(payload) {
      const full = { ...payload, id: payload.id || genId("CTR"), created_at: new Date().toISOString() };
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        // ⚠ `id` du schéma contracts est uuid auto-généré, pas notre genId.
        // On laisse PostgreSQL générer l'uuid et on garde full.id en référence
        // métier dans la colonne `data.ref` pour pouvoir retrouver le contrat.
        const row = {
          client_id: full.client_id || null,
          name: full.name || "Contrat",
          status: full.status || "active",
          start_date: full.start || null, end_date: full.end || null,
          monthly_eur: full.monthly_eur || null,
          products: full.products || [], total_ht_y1: full.total_ht_y1 || null,
          tcv: full.tcv || null, margin_pct: full.margin_pct || null,
          notes: full.notes || null,
          data: { ...full, ref: full.id },
        };
        // opp_id seulement si présent (peut ne pas exister sur vieux schéma)
        if (full.opp_id) row.opp_id = full.opp_id;
        if (created_by) row.created_by = created_by;
        let { data, error } = await s.from("contracts").insert(row).select().maybeSingle();
        // Retry sans colonnes optionnelles si elles n'existent pas
        if (error && /column.+(opp_id|products|total_ht_y1|tcv|margin_pct|data).+does not exist/i.test(error.message || "")) {
          const minimal = {
            client_id: row.client_id, name: row.name, status: row.status,
            start_date: row.start_date, end_date: row.end_date,
            monthly_eur: row.monthly_eur, notes: row.notes,
          };
          const { data: d2, error: e2 } = await s.from("contracts").insert(minimal).select().maybeSingle();
          if (!e2) { data = d2; error = null; }
        }
        if (error) {
          console.warn("[api.contracts.create]", error.message);
          alert("Erreur de sauvegarde du contrat : " + error.message + "\n\nVérifie que setup-tout.sql a bien été exécuté.");
          // fallback local
          const arr = lsGet("contracts");
          arr.unshift(full);
          lsSet("contracts", arr);
          return full;
        }
        return data;
      }
      const arr = lsGet("contracts");
      arr.unshift(full);
      lsSet("contracts", arr);
      return full;
    },

    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("contracts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) {
          console.warn("[api.contracts.remove]", error.message);
          if (/column.+deleted_at.+does not exist/i.test(error.message || "")) {
            await s.from("contracts").delete().eq("id", id);
          } else throw new Error(error.message);
        }
      }
      const arr = lsGet("contracts").filter((c) => c.id !== id);
      lsSet("contracts", arr);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.5 CONTRACT_TEMPLATES — modèles de contrat (CGV PDF uploadables)
  // ───────────────────────────────────────────────────────────────────
  //
  // Combinaison Storage (PDF) + table (métadonnées + texte extrait).
  // Méthodes : list, getActive, getDefault, upload, remove, setDefault
  const contractTemplates = {
    /** Liste les modèles actifs (non soft-deleted). */
    async list() {
      const s = supa();
      if (!s) return [];
      const { data, error } = await s.from("contract_templates")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[api.contractTemplates.list]", error.message);
        return [];
      }
      return data || [];
    },

    /** Récupère le modèle par défaut (celui marqué is_default=true). */
    async getDefault() {
      const s = supa();
      if (!s) return null;
      const { data } = await s.from("contract_templates")
        .select("*")
        .is("deleted_at", null)
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();
      return data || null;
    },

    /** Upload un PDF + crée la ligne template.
     *  payload = { name, version, description, file (File object), cgvText (string extrait) } */
    async upload(payload) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré.");
      const file = payload.file;
      if (!file) throw new Error("Aucun fichier PDF fourni.");
      if (file.type !== "application/pdf") throw new Error("Le fichier doit être au format PDF.");

      const path = "templates/" + Date.now() + "-" + (file.name || "template.pdf").replace(/[^\w.-]/g, "_");
      // 1. Upload du PDF dans Storage
      let { error: upErr } = await s.storage.from("contract-templates").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });
      // Si le bucket n'existe pas → on tente de le créer puis on retry
      if (upErr && /bucket not found|not_found/i.test(upErr.message || "")) {
        const { error: createErr } = await s.storage.createBucket("contract-templates", {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10 Mo
          allowedMimeTypes: ["application/pdf"],
        });
        if (createErr && !/already exists/i.test(createErr.message || "")) {
          throw new Error("Création du bucket Storage impossible : " + createErr.message + "\n\nCrée-le manuellement dans Supabase Dashboard → Storage → New bucket → 'contract-templates' (Public, 10 MB).");
        }
        // Retry l'upload
        const retry = await s.storage.from("contract-templates").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: "application/pdf",
        });
        upErr = retry.error;
      }
      if (upErr) throw new Error("Upload échoué : " + upErr.message);
      const { data: urlData } = s.storage.from("contract-templates").getPublicUrl(path);
      const pdf_url = urlData ? urlData.publicUrl : null;

      // 2. Insertion en BDD
      const row = {
        name: payload.name || file.name.replace(/\.pdf$/i, ""),
        version: payload.version || "v1.0",
        description: payload.description || null,
        pdf_url,
        pdf_size_kb: Math.round(file.size / 1024),
        cgv_text: payload.cgvText || null,
        is_active: true,
      };
      const created_by = await getCurrentUserId();
      if (created_by) row.created_by = created_by;
      const { data, error } = await s.from("contract_templates").insert(row).select().maybeSingle();
      if (error) {
        console.warn("[api.contractTemplates.upload]", error.message);
        throw new Error("Sauvegarde métadonnées échouée : " + error.message);
      }
      return data;
    },

    /** Soft-delete + suppression du PDF dans Storage. */
    async remove(id) {
      const s = supa();
      if (!s) return;
      const { data: existing } = await s.from("contract_templates").select("pdf_url").eq("id", id).maybeSingle();
      // 1. Soft-delete en BDD
      const { error } = await s.from("contract_templates").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
      if (error) throw new Error(error.message);
      // 2. Suppression du PDF en Storage (best-effort)
      if (existing && existing.pdf_url) {
        const m = existing.pdf_url.match(/contract-templates\/(.+)$/);
        if (m) {
          try { await s.storage.from("contract-templates").remove([m[1]]); } catch (e) {}
        }
      }
    },

    /** Marque un modèle comme par défaut (les autres deviennent non-default). */
    async setDefault(id) {
      const s = supa();
      if (!s) return;
      // 1. Reset tous à false
      await s.from("contract_templates").update({ is_default: false }).neq("id", id);
      // 2. Set le nouveau à true
      const { error } = await s.from("contract_templates").update({ is_default: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.6 PROJECTS — Projets & Livrables (commande Sage → workflow Hub)
  // ───────────────────────────────────────────────────────────────────
  //
  // Tables : projects + project_items + project_team + project_events
  // Cycle 6 stages : recu → preparation → pret_livrer
  //                → livre → installe → clos
  // Méthodes :
  //   list({stage?,client_id?,pm_id?})  → projets actifs
  //   getById(id)                       → projet + items + team + events
  //   create(payload)                   → crée projet (+items via items=[…])
  //   update(id, patch)                 → maj projet
  //   changeStage(id, stage)            → maj stage + log event
  //   addTeamMember(id, profileId, role)
  //   removeTeamMember(id, profileId)
  //   addEvent(id, type, payload)       → log event manuel
  //   syncFromSage(sageOrder)           → upsert depuis import Sage (idempotent
  //                                        via sage_ref)
  //   remove(id)                        → SOFT delete
  const projects = {
    /** Stages du workflow, dans l'ordre du kanban. */
    STAGES: [
      { k: "recu",          label: "Reçu",            color: "#94a3b8" },
      { k: "preparation",   label: "En préparation",  color: "#a855f7" },
      { k: "pret_livrer",   label: "Prêt à livrer",   color: "#ea580c" },
      { k: "livre",         label: "Livré",           color: "#f59e0b" },
      { k: "installe",      label: "Installé",        color: "#0ea5e9" },
      { k: "clos",          label: "Clos",            color: "#10b981" },
    ],

    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("projects").select("*").is("deleted_at", null);
        if (filter.stage) q = q.eq("stage", filter.stage);
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        if (filter.pm_id) q = q.eq("pm_id", filter.pm_id);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) { console.warn("[api.projects.list]", error.message); return lsGet("projects"); }
        return data || [];
      }
      let arr = lsGet("projects");
      if (filter.stage) arr = arr.filter((p) => p.stage === filter.stage);
      if (filter.client_id) arr = arr.filter((p) => p.client_id === filter.client_id);
      return arr;
    },

    /** Backfill : crée un projet pour chaque opportunité déjà gagnée (stage="won")
     *  qui n'a pas encore de projet associé. Idempotent : peut être rappelé sans risque.
     *  Retourne { created, skipped, errors } pour visibilité. */
    async backfillFromWonOpps() {
      const s = supa();
      if (!s) return { created: 0, skipped: 0, errors: 0 };
      let created = 0, skipped = 0, errors = 0;
      try {
        const { data: wonOpps } = await s.from("opportunities").select("*").eq("stage", "won");
        if (!wonOpps || wonOpps.length === 0) return { created: 0, skipped: 0, errors: 0 };
        // Tous les projets existants (avec opportunity_id ou data.opportunity_id)
        const { data: allProjects } = await s.from("projects").select("id, opportunity_id, data").is("deleted_at", null);
        const linkedOppIds = new Set();
        (allProjects || []).forEach((p) => {
          if (p.opportunity_id) linkedOppIds.add(p.opportunity_id);
          if (p.data && p.data.opportunity_id) linkedOppIds.add(p.data.opportunity_id);
        });
        const created_by = await getCurrentUserId();
        const cuName = getCurrentUserName();
        for (const opp of wonOpps) {
          if (linkedOppIds.has(opp.id)) { skipped++; continue; }
          const projId = genId("PRJ");
          const projRow = {
            id: projId,
            name: opp.name || "Projet — " + opp.id,
            stage: "recu",
            client_id: opp.client_id || null,
            amount_ht: opp.amount_eur || null,
            opportunity_id: opp.id,
            description: opp.notes || (opp.data && opp.data.besoin) || null,
            data: { opportunity_id: opp.id, opportunity_name: opp.name, created_from: "backfill_won" },
          };
          if (created_by) projRow.created_by = created_by;
          let { error: pErr } = await s.from("projects").insert(projRow);
          if (pErr && /opportunity_id|column/i.test(pErr.message)) {
            delete projRow.opportunity_id;
            const r = await s.from("projects").insert(projRow);
            pErr = r.error;
          }
          if (pErr) { errors++; console.warn("[backfill]", pErr.message); continue; }
          await s.from("project_events").insert({
            project_id: projId, type: "created",
            payload: { from_opportunity: opp.id, stage: "recu", mode: "backfill" },
            author_id: created_by || null,
            author_name: cuName,
          }).catch(() => {});
          created++;
        }
      } catch (e) {
        console.warn("[backfillFromWonOpps]", e.message || e);
      }
      return { created, skipped, errors };
    },

    async getById(id) {
      const s = supa();
      if (s) {
        const [{ data: proj }, { data: items }, { data: team }, { data: events }] = await Promise.all([
          s.from("projects").select("*").eq("id", id).maybeSingle(),
          s.from("project_items").select("*").eq("project_id", id).order("created_at"),
          s.from("project_team").select("*, profile:profiles(id, name, email, role, team)").eq("project_id", id),
          s.from("project_events").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(50),
        ]);
        if (!proj) return null;
        return { ...proj, items: items || [], team: team || [], events: events || [] };
      }
      return lsGet("projects").find((p) => p.id === id) || null;
    },

    async create(payload) {
      const id = payload.id || genId("PRJ");
      const items = payload.items || [];
      const full = { ...payload, id, created_at: new Date().toISOString(), stage: payload.stage || "recu" };
      delete full.items;
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        const row = { ...full, data: full.data || {} };
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("projects").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.projects.create]", error.message);
          alert("Sauvegarde projet impossible : " + error.message);
          const arr = lsGet("projects"); arr.unshift({ ...full, items });
          lsSet("projects", arr); return full;
        }
        // Items
        if (items.length > 0) {
          const rows = items.map((it) => ({ ...it, project_id: id }));
          await s.from("project_items").insert(rows);
        }
        // Event "création"
        const cuName = getCurrentUserName();
        await s.from("project_events").insert({
          project_id: id, type: "created",
          payload: { stage: row.stage, items_count: items.length },
          author_id: created_by || null,
          author_name: cuName,
        });
        return data;
      }
      const arr = lsGet("projects"); arr.unshift({ ...full, items });
      lsSet("projects", arr); return full;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("projects").update(patch).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.projects.update]", error.message);
        if (data) return data;
      }
      const arr = lsGet("projects");
      const idx = arr.findIndex((p) => p.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("projects", arr); return arr[idx]; }
      return null;
    },

    async changeStage(id, newStage, reason) {
      const s = supa();
      if (!s) {
        // Fallback localStorage
        const arr = lsGet("projects");
        const idx = arr.findIndex((p) => p.id === id);
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], stage: newStage, updated_at: new Date().toISOString() };
          lsSet("projects", arr);
          return arr[idx];
        }
        return null;
      }
      const patch = { stage: newStage, updated_at: new Date().toISOString() };
      // Auto-fill des dates clés selon le stage — noms de colonnes corrects
      if (newStage === "livre") patch.delivered_at = new Date().toISOString();
      if (newStage === "installe") patch.installed_at = new Date().toISOString();
      if (newStage === "clos") patch.closed_at = new Date().toISOString();
      const { data, error } = await s.from("projects").update(patch).eq("id", id).select().maybeSingle();
      if (error) {
        console.warn("[api.projects.changeStage]", error.message);
        throw new Error(error.message);
      }
      // Log event (best-effort, ne bloque pas le retour si la table n'existe pas)
      const cuId = await getCurrentUserId();
      const cuName = getCurrentUserName();
      try {
        await s.from("project_events").insert({
          id: "PEVT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          project_id: id, type: "stage_change",
          payload: { to: newStage, reason: reason || null },
          author_id: cuId, author_name: cuName,
        });
      } catch (e) { console.warn("[changeStage] events insert skipped:", e.message); }
      // Notification (best-effort, skip si table notifications absente)
      try {
        const stageLabels = { recu: "Reçu", preparation: "En préparation", pret_livrer: "Prêt à livrer", livre: "Livré", installe: "Installé", clos: "Clos", annule: "Annulé" };
        const severity = newStage === "clos" ? "success" : newStage === "annule" ? "error" : (newStage === "livre" || newStage === "installe" ? "success" : "info");
        const targetId = (data && data.pm_id && data.pm_id !== cuId) ? data.pm_id : null;
        await s.from("notifications").insert({
          recipient_id: targetId,
          type: "project_stage",
          title: "Projet " + ((data && (data.sage_ref || data.name)) || id) + " → " + (stageLabels[newStage] || newStage),
          body: (cuName || "Quelqu'un") + " a fait avancer le projet" + (reason ? " · " + reason : ""),
          link: "/projet?id=" + id,
          severity,
          payload: { project_id: id, to: newStage, author: cuName },
        });
      } catch (e) { /* table notifications optionnelle */ }
      return data;
    },

    async addTeamMember(projectId, profileId, role) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("project_team").upsert({
        project_id: projectId, profile_id: profileId, role: role || "membre",
      }).select().maybeSingle();
      if (error) { console.warn("[api.projects.addTeamMember]", error.message); return null; }
      const cuId = await getCurrentUserId();
      await s.from("project_events").insert({
        project_id: projectId, type: "team_add",
        payload: { profile_id: profileId, role },
        author_id: cuId, author_name: getCurrentUserName(),
      });
      return data;
    },

    async removeTeamMember(projectId, profileId) {
      const s = supa();
      if (!s) return;
      await s.from("project_team").delete().eq("project_id", projectId).eq("profile_id", profileId);
    },

    async addEvent(projectId, type, payload) {
      const s = supa();
      if (!s) return null;
      const cuId = await getCurrentUserId();
      const { data, error } = await s.from("project_events").insert({
        project_id: projectId, type, payload: payload || {},
        author_id: cuId, author_name: getCurrentUserName(),
      }).select().maybeSingle();
      if (error) console.warn("[api.projects.addEvent]", error.message);
      return data;
    },

    /** Ajoute/modifie/supprime un livrable (project_item). */
    async addItem(projectId, item) {
      const s = supa();
      if (!s) return null;
      const row = { ...item, project_id: projectId };
      delete row.id;
      const { data, error } = await s.from("project_items").insert(row).select().maybeSingle();
      if (error) { console.warn("[api.projects.addItem]", error.message); return null; }
      const cuId = await getCurrentUserId();
      await s.from("project_events").insert({
        project_id: projectId, type: "item_add",
        payload: { designation: row.designation, qty: row.quantity },
        author_id: cuId, author_name: getCurrentUserName(),
      });
      return data;
    },

    async updateItem(itemId, patch) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("project_items").update(patch).eq("id", itemId).select().maybeSingle();
      if (error) console.warn("[api.projects.updateItem]", error.message);
      return data;
    },

    async removeItem(itemId) {
      const s = supa();
      if (!s) return;
      await s.from("project_items").delete().eq("id", itemId);
    },

    /** Upsert depuis une commande Sage. Idempotent via sage_ref.
     *  Si le projet existe déjà (même sage_ref) → update. Sinon → create. */
    async syncFromSage(sageOrder) {
      if (!sageOrder || !sageOrder.sage_ref) throw new Error("sage_ref obligatoire pour la sync");
      const s = supa();
      if (!s) throw new Error("Supabase non configuré");
      const { data: existing } = await s.from("projects").select("id").eq("sage_ref", sageOrder.sage_ref).maybeSingle();
      if (existing) {
        // Update : on ne touche pas au stage si déjà avancé
        const patch = { ...sageOrder };
        delete patch.id; delete patch.sage_ref; delete patch.stage; delete patch.items;
        await s.from("projects").update(patch).eq("id", existing.id);
        return { id: existing.id, mode: "updated" };
      }
      // Create
      const created = await projects.create({ ...sageOrder, stage: "recu" });
      return { id: created.id, mode: "created" };
    },

    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw new Error(error.message);
      }
      const arr = lsGet("projects").filter((p) => p.id !== id);
      lsSet("projects", arr);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.67 COMMERCIAL DOCS — Gestion Commerciale (style Sage 50c)
  // ───────────────────────────────────────────────────────────────────
  //
  // Tables : commercial_docs + commercial_doc_lines + commercial_articles
  //          + commercial_doc_counters + commercial_tva_rates
  //          + commercial_payment_terms
  // Types  : devis | commande | bl | facture | avoir
  // Workflow : Devis → Commande → BL → Facture (chaînage via parent_doc_id)
  // Méthodes : list, getById, create, update, addLine, updateLine, removeLine
  //            transform (Devis→Commande, Commande→BL, BL→Facture),
  //            nextNumber, recompute, remove (soft)
  const TYPE_PREFIX = { devis: "DEV", commande: "BC", bl: "BL", facture: "FAC", avoir: "AVO", commande_achat: "CA" };
  const TYPE_LABEL  = { devis: "Devis", commande: "Commande", bl: "Bon de livraison", facture: "Facture", avoir: "Avoir", commande_achat: "Commande d'achat" };

  // Helper partagé : synchronise une COMMANDE vers Projets & Livrables.
  // Idempotent : si un projet existe déjà pour la même commande (data.commande_id)
  // ou la même opportunité (opportunity_id), pas de doublon. Sinon, création
  // d'un projet en stage 'recu' avec les lignes du devis comme items.
  // Helper : crée une commande d'achat fournisseur (type='commande_achat')
  // à partir d'une commande client. Idempotent via data.parent_commande_id.
  async function createPurchaseOrder(s, commandeRow, lines) {
    if (!commandeRow || commandeRow.type !== "commande") return;
    // Idempotence : ne crée pas si déjà liée
    try {
      const { data: existing } = await s.from("commercial_docs")
        .select("id")
        .eq("type", "commande_achat")
        .contains("data", { parent_commande_id: commandeRow.id })
        .is("deleted_at", null)
        .maybeSingle();
      if (existing) return existing;
    } catch (e) {}

    // Numérotation CA-AAAA-NNNN via le RPC (réutilise commercial_next_doc_number)
    const cur_year = new Date().getFullYear();
    let seq = 1;
    try {
      const { data: rpc } = await s.rpc("commercial_next_doc_number", { p_type: "commande_achat" });
      if (rpc && rpc[0]) { seq = rpc[0].out_seq; }
    } catch (e) {
      // Fallback : MAX existant
      try {
        const { data: maxRow } = await s.from("commercial_docs")
          .select("number_seq").eq("type", "commande_achat").eq("number_year", cur_year)
          .order("number_seq", { ascending: false }).limit(1).maybeSingle();
        seq = (maxRow && maxRow.number_seq ? maxRow.number_seq : 0) + 1;
      } catch (e2) {}
    }
    const poId = "CA-" + cur_year + "-" + String(seq).padStart(4, "0");

    const created_by = await getCurrentUserId();
    const poRow = {
      id: poId,
      type: "commande_achat",
      status: "brouillon",
      number_year: cur_year,
      number_seq: seq,
      client_id: null,                          // pas de client : c'est un fournisseur
      client_name: "À renseigner",              // nom fournisseur à compléter manuellement
      opportunity_id: commandeRow.opportunity_id || null,
      title: "Achats pour " + (commandeRow.title || commandeRow.id),
      notes: "Commande d'achat générée automatiquement depuis " + commandeRow.id + ". Sélectionner le fournisseur et ajuster les prix d'achat.",
      total_ht: commandeRow.total_ht || 0,
      total_tva: commandeRow.total_tva || 0,
      total_ttc: commandeRow.total_ttc || 0,
      doc_date: new Date().toISOString().slice(0, 10),
      data: {
        parent_commande_id: commandeRow.id,
        opportunity_id: commandeRow.opportunity_id || null,
        created_from: "auto_commande",
        client_destinataire: commandeRow.client_name,  // pour rappel
      },
    };
    if (created_by) poRow.created_by = created_by;

    const { error: poErr } = await s.from("commercial_docs").insert(poRow);
    if (poErr) {
      console.warn("[createPurchaseOrder] insert:", poErr.message);
      return null;
    }
    // Copie des lignes (sans TVA car achat HT chez le fournisseur)
    if (lines && lines.length > 0) {
      const poLines = lines.filter((l) => !l.is_text_only).map((l, i) => ({
        id: "CDL-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + "-" + i,
        doc_id: poId,
        position: i,
        ref: l.ref || null,
        designation: l.designation || "",
        quantity: Number(l.quantity) || 1,
        unit: l.unit || "u",
        unit_price_ht: Number(l.unit_price_ht) || 0,  // prix de vente — à ajuster manuellement
        discount_pct: 0,
        tva_rate: Number(l.tva_rate) || 20,
        total_ht: Number(l.total_ht) || 0,
        total_tva: Number(l.total_tva) || 0,
        total_ttc: Number(l.total_ttc) || 0,
        is_text_only: false,
      }));
      if (poLines.length > 0) await s.from("commercial_doc_lines").insert(poLines).catch(() => {});
    }
    return { id: poId };
  }

  async function syncCommandeToProject(s, commandeRow, lines) {
    if (!commandeRow || commandeRow.type !== "commande") return;
    // 1. Cherche un projet déjà lié à cette commande (via data.commande_id)
    //    ou à la même opportunité (lien indirect).
    let existing = null;
    try {
      const { data: byCmd } = await s.from("projects")
        .select("id")
        .contains("data", { commande_id: commandeRow.id })
        .is("deleted_at", null)
        .maybeSingle();
      existing = byCmd;
    } catch (e) {}
    if (!existing && commandeRow.opportunity_id) {
      try {
        const { data: byOpp } = await s.from("projects")
          .select("id")
          .eq("opportunity_id", commandeRow.opportunity_id)
          .is("deleted_at", null)
          .maybeSingle();
        existing = byOpp;
      } catch (e) {}
    }
    if (existing) return existing;

    // 2. Création d'un projet
    const projId = genId("PRJ");
    const created_by = await getCurrentUserId();
    const cuName = getCurrentUserName();
    const amtHT = Number(commandeRow.total_ht) || 0;
    const amtTTC = Number(commandeRow.total_ttc) || 0;
    const projRow = {
      id: projId,
      name: commandeRow.title || commandeRow.client_name || ("Commande " + commandeRow.id),
      stage: "recu",
      client_id: commandeRow.client_id || null,
      client_name: commandeRow.client_name || null,
      opportunity_id: commandeRow.opportunity_id || null,
      amount_ht: amtHT,
      amount_ttc: amtTTC,
      description: commandeRow.notes || null,
      data: { commande_id: commandeRow.id, opportunity_id: commandeRow.opportunity_id || null, created_from: "auto_commande" },
    };
    if (created_by) projRow.created_by = created_by;
    let { error: pErr } = await s.from("projects").insert(projRow);
    if (pErr && /opportunity_id|column/i.test(pErr.message)) {
      delete projRow.opportunity_id;
      const r = await s.from("projects").insert(projRow);
      pErr = r.error;
    }
    if (pErr) { console.warn("[syncCommandeToProject] insert:", pErr.message); return null; }
    // 3. Copie des lignes en items projet
    if (lines && lines.length > 0) {
      const items = lines.filter((l) => !l.is_text_only).map((l, i) => ({
        id: genId("PIT"),
        project_id: projId,
        position: i,
        ref: l.ref || null,
        designation: l.designation || "",
        quantity: Number(l.quantity) || 1,
        unit: l.unit || "u",
        unit_price_ht: Number(l.unit_price_ht) || 0,
        status: "pending",
      }));
      if (items.length > 0) await s.from("project_items").insert(items).catch(() => {});
    }
    // 4. Event timeline projet
    await s.from("project_events").insert({
      id: "PEVT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      project_id: projId, type: "created",
      payload: { from_commande: commandeRow.id, opportunity_id: commandeRow.opportunity_id || null, stage: "recu" },
      author_id: created_by || null,
      author_name: cuName,
    }).catch(() => {});
    return { id: projId };
  }

  /** Hook BL : génère le PDF du bon de livraison (sans tarifs), l'upload
   *  dans Supabase Storage et l'attache au projet correspondant.
   *  Appelé automatiquement quand un doc de type=bl est créé. */
  async function syncBLToProject(s, blRow, lines) {
    if (!blRow || blRow.type !== "bl") return;
    // 1. Retrouve le projet lié : via parent_doc_id (commande) ou via opportunity_id
    let project = null;
    if (blRow.parent_doc_id) {
      try {
        const { data: byCmd } = await s.from("projects")
          .select("id, data, stage")
          .contains("data", { commande_id: blRow.parent_doc_id })
          .is("deleted_at", null)
          .maybeSingle();
        project = byCmd;
      } catch (e) {}
    }
    if (!project && blRow.opportunity_id) {
      try {
        const { data: byOpp } = await s.from("projects")
          .select("id, data, stage")
          .eq("opportunity_id", blRow.opportunity_id)
          .is("deleted_at", null)
          .maybeSingle();
        project = byOpp;
      } catch (e) {}
    }

    // 2. Synchronise les livrables du projet à partir des lignes du BL.
    //    Les livrables = articles du devis transformé en BL.
    //    Si le projet n'a pas encore de project_items, on les crée.
    if (project && lines && lines.length) {
      try {
        const { data: existing } = await s.from("project_items").select("id").eq("project_id", project.id);
        if (!existing || existing.length === 0) {
          const items = lines.filter((l) => !l.is_text_only).map((l, i) => ({
            id: genId("PIT"),
            project_id: project.id,
            position: i,
            ref: l.ref || null,
            designation: l.designation || "",
            quantity: Number(l.quantity) || 1,
            unit: l.unit || "u",
            unit_price_ht: Number(l.unit_price_ht) || 0,
            status: "pending",
          }));
          if (items.length) {
            const { error: itemsErr } = await s.from("project_items").insert(items);
            if (itemsErr) console.warn("[bl→projet items]", itemsErr.message);
          }
        }
      } catch (e) { console.warn("[bl→projet items sync]", e.message || e); }
    }

    // 3. Génère le PDF (skip silencieux si lib pas chargée — les livrables sont déjà synchronisés)
    if (!window.HubCommercialPdf) {
      console.warn("[bl→projet auto] HubCommercialPdf indisponible — PDF non généré (charge components/commercial-pdf.js sur cette page).");
      // Mémorise quand même la liaison BL ↔ projet pour pouvoir régénérer le PDF plus tard.
      if (project) {
        try {
          const mergedProj = { ...((project.data) || {}), bl_doc_id: blRow.id };
          await s.from("projects").update({ data: mergedProj }).eq("id", project.id);
        } catch (e) {}
      }
      return { project_id: project && project.id };
    }
    let blob;
    try {
      blob = await window.HubCommercialPdf.toBlob({ ...blRow, lines });
    } catch (e) {
      console.warn("[bl→projet auto] génération PDF :", e.message || e);
      return;
    }
    if (!blob) return;

    // 3. Upload dans le bucket bl-pdfs (créé à la volée si absent)
    const path = "bl/" + blRow.id + ".pdf";
    let { error: upErr } = await s.storage.from("bl-pdfs").upload(path, blob, {
      cacheControl: "3600", upsert: true, contentType: "application/pdf",
    });
    if (upErr && /bucket not found|not_found/i.test(upErr.message || "")) {
      await s.storage.createBucket("bl-pdfs", { public: true, fileSizeLimit: 10 * 1024 * 1024 }).catch(() => {});
      const retry = await s.storage.from("bl-pdfs").upload(path, blob, {
        cacheControl: "3600", upsert: true, contentType: "application/pdf",
      });
      upErr = retry.error;
    }
    if (upErr) { console.warn("[bl→projet auto] upload :", upErr.message); return; }

    const { data: urlData } = s.storage.from("bl-pdfs").getPublicUrl(path);
    const pdfUrl = urlData && urlData.publicUrl;
    if (!pdfUrl) return;

    // 4. Mémorise l'URL sur le doc BL (data jsonb)
    try {
      const { data: cur } = await s.from("commercial_docs").select("data").eq("id", blRow.id).maybeSingle();
      const mergedData = { ...((cur && cur.data) || {}), pdf_url: pdfUrl, pdf_uploaded_at: new Date().toISOString() };
      await s.from("commercial_docs").update({ data: mergedData }).eq("id", blRow.id);
    } catch (e) { console.warn("[bl→projet auto] update doc data :", e.message); }

    // 5. Mémorise l'URL sur le projet
    if (project) {
      try {
        const mergedProj = { ...((project.data) || {}), bl_doc_id: blRow.id, bl_pdf_url: pdfUrl, bl_pdf_uploaded_at: new Date().toISOString() };
        await s.from("projects").update({ data: mergedProj }).eq("id", project.id);
        await s.from("project_events").insert({
          id: "PEVT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          project_id: project.id, type: "delivery_note_created",
          payload: { bl_id: blRow.id, pdf_url: pdfUrl },
          author_id: null, author_name: getCurrentUserName(),
        }).catch(() => {});
      } catch (e) { console.warn("[bl→projet auto] update projet :", e.message); }
    }
    return { pdf_url: pdfUrl, project_id: project && project.id };
  }

  const commercialDocs = {
    TYPE_PREFIX, TYPE_LABEL,

    /** Récupère le prochain numéro (year, seq) pour un type donné.
     *  Utilise la RPC SQL commercial_next_doc_number en priorité,
     *  fallback compteur côté JS (race possible mais OK pour usage solo). */
    async nextNumber(type) {
      const s = supa();
      const cur_year = new Date().getFullYear();
      const prefix = TYPE_PREFIX[type] || type.toUpperCase();

      if (s) {
        // 1. Tentative via RPC SQL (atomique, idéal en concurrence)
        try {
          const { data, error } = await s.rpc("commercial_next_doc_number", { p_type: type });
          if (!error && data && data.length > 0) {
            const row = data[0];
            return { year: row.out_year, seq: row.out_seq };
          }
        } catch (e) {}

        // 2. Fallback : compteur direct
        try {
          const { data: cur } = await s.from("commercial_doc_counters").select("next_seq").eq("type", type).eq("year", cur_year).maybeSingle();
          if (cur) {
            const next_seq = cur.next_seq;
            await s.from("commercial_doc_counters").upsert({ type, year: cur_year, next_seq: next_seq + 1 });
            return { year: cur_year, seq: next_seq };
          }
        } catch (e) {}

        // 3. Fallback robuste : lit le MAX existant dans commercial_docs et incrémente
        // Garantit pas de doublon même si la table compteur n'existe pas
        try {
          const { data: maxRow } = await s.from("commercial_docs")
            .select("number_seq")
            .eq("type", type)
            .eq("number_year", cur_year)
            .order("number_seq", { ascending: false })
            .limit(1)
            .maybeSingle();
          const next_seq = (maxRow && maxRow.number_seq ? maxRow.number_seq : 0) + 1;
          // Initialise le compteur si la table existe
          try { await s.from("commercial_doc_counters").upsert({ type, year: cur_year, next_seq: next_seq + 1 }); } catch (e) {}
          return { year: cur_year, seq: next_seq };
        } catch (e) {}
      }

      // 4. Pas de Supabase OU tout a fail → localStorage en cherchant aussi les docs existants
      const counters = JSON.parse(localStorage.getItem("hubAstorya.cdoc_counters.v1") || "{}");
      const localDocs = JSON.parse(localStorage.getItem("hubAstorya.commercial_docs.v1") || "[]");
      const maxLocal = localDocs
        .filter((d) => d.type === type && d.number_year === cur_year)
        .reduce((m, d) => Math.max(m, Number(d.number_seq) || 0), 0);
      const key = type + "_" + cur_year;
      const counterVal = counters[key] || 0;
      const next_seq = Math.max(counterVal, maxLocal) + 1;
      counters[key] = next_seq;
      localStorage.setItem("hubAstorya.cdoc_counters.v1", JSON.stringify(counters));
      return { year: cur_year, seq: next_seq };
    },

    /** Formate l'id complet d'un doc : "DEV-2026-0001". */
    formatNumber(type, year, seq) {
      const prefix = TYPE_PREFIX[type] || type.toUpperCase();
      return prefix + "-" + year + "-" + String(seq).padStart(4, "0");
    },

    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("commercial_docs").select("*").is("deleted_at", null);
        if (filter.type) q = q.eq("type", filter.type);
        if (filter.status) q = q.eq("status", filter.status);
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        if (filter.project_id) q = q.eq("project_id", filter.project_id);
        if (filter.opportunity_id) q = q.eq("opportunity_id", filter.opportunity_id);
        if (filter.parent_doc_id) q = q.eq("parent_doc_id", filter.parent_doc_id);
        const { data, error } = await q.order("doc_date", { ascending: false }).limit(500);
        if (error) {
          console.warn("[api.commercialDocs.list]", error.message);
          return lsGet("commercial_docs");
        }
        return data || [];
      }
      let arr = lsGet("commercial_docs");
      if (filter.type) arr = arr.filter((d) => d.type === filter.type);
      if (filter.status) arr = arr.filter((d) => d.status === filter.status);
      if (filter.client_id) arr = arr.filter((d) => d.client_id === filter.client_id);
      return arr;
    },

    async getById(id) {
      const s = supa();
      if (s) {
        const [{ data: doc }, { data: lines }] = await Promise.all([
          s.from("commercial_docs").select("*").eq("id", id).maybeSingle(),
          s.from("commercial_doc_lines").select("*").eq("doc_id", id).order("position"),
        ]);
        if (!doc) return null;
        // Hydrate les champs internes depuis data jsonb (champs masqués sur PDF)
        const hydrated = (lines || []).map((l) => {
          const meta = (l.data && typeof l.data === "object") ? l.data : {};
          return {
            ...l,
            manufacturer_ref: l.manufacturer_ref || meta.manufacturer_ref || null,
            purchase_price_indicative: l.purchase_price_indicative != null ? l.purchase_price_indicative : (meta.purchase_price_indicative != null ? meta.purchase_price_indicative : null),
            supplier: l.supplier || meta.supplier || null,
            periodicity: l.periodicity || meta.periodicity || "oneshot",
          };
        });
        return { ...doc, lines: hydrated };
      }
      const arr = lsGet("commercial_docs");
      const doc = arr.find((d) => d.id === id);
      return doc ? { ...doc, lines: doc.lines || [] } : null;
    },

    async create(payload) {
      const type = payload.type || "devis";
      const num = await this.nextNumber(type);
      const id = this.formatNumber(type, num.year, num.seq);
      const lines = payload.lines || [];
      const totals = this._sumLines(lines);
      const full = {
        id, type,
        status: payload.status || "brouillon",
        number_year: num.year,
        number_seq: num.seq,
        client_id: payload.client_id || null,
        client_name: payload.client_name || null,
        client_address: payload.client_address || null,
        client_cp: payload.client_cp || null,
        client_city: payload.client_city || null,
        client_siren: payload.client_siren || null,
        client_tva: payload.client_tva || null,
        contact_name: payload.contact_name || null,
        contact_email: payload.contact_email || null,
        project_id: payload.project_id || null,
        opportunity_id: payload.opportunity_id || null,
        parent_doc_id: payload.parent_doc_id || null,
        doc_date: payload.doc_date || new Date().toISOString().slice(0, 10),
        // Devis : valid_until = doc_date + délai société (30j par défaut) si non fourni
        valid_until: payload.valid_until || (type === "devis" ? (() => {
          const base = payload.doc_date ? new Date(payload.doc_date) : new Date();
          let delay = 30;
          try {
            const c = commercialCompany._cache;
            if (c && c.delai_validite_devis_jours) delay = Number(c.delai_validite_devis_jours) || 30;
          } catch (e) {}
          base.setDate(base.getDate() + delay);
          return base.toISOString().slice(0, 10);
        })() : null),
        // Facture : payment_due = doc_date + délai des conditions de paiement (30j si net30)
        payment_due: payload.payment_due || null,
        total_ht: totals.ht,
        total_tva: totals.tva,
        total_ttc: totals.ttc,
        discount_pct: payload.discount_pct || 0,
        title: payload.title || null,
        notes: payload.notes || null,
        internal_notes: payload.internal_notes || null,
        payment_terms_id: payload.payment_terms_id || "rcpt",
        owner: payload.owner || getCurrentUserName(),
        data: payload.data || {},
        created_at: new Date().toISOString(),
      };
      const s = supa();
      if (s) {
        const created_by = await getCurrentUserId();
        if (created_by) full.created_by = created_by;
        const { data, error } = await s.from("commercial_docs").insert(full).select().maybeSingle();
        if (error) {
          console.warn("[api.commercialDocs.create]", error.message);
          // Fallback local
          const arr = lsGet("commercial_docs"); arr.unshift({ ...full, lines }); lsSet("commercial_docs", arr);
          return { ...full, lines };
        }
        // Insertion des lignes
        if (lines.length > 0) {
          const rows = lines.map((l, i) => ({
            id: l.id || genId("CDL"),
            doc_id: id,
            position: i,
            article_id: l.article_id || null,
            ref: l.ref || null,
            designation: l.designation || "",
            description: l.description || null,
            quantity: l.quantity || 1,
            unit: l.unit || "u",
            unit_price_ht: l.unit_price_ht || 0,
            discount_pct: l.discount_pct || 0,
            tva_rate: l.tva_rate != null ? l.tva_rate : 20.00,
            total_ht: l.total_ht || 0,
            total_tva: l.total_tva || 0,
            total_ttc: l.total_ttc || 0,
            is_text_only: !!l.is_text_only,
            // Champs internes (jamais sur PDF) — persistance dans data jsonb
            // pour ne pas nécessiter de migration colonne dédiée.
            data: {
              ...((l.data && typeof l.data === "object") ? l.data : {}),
              manufacturer_ref: l.manufacturer_ref || null,
              purchase_price_indicative: l.purchase_price_indicative == null ? null : Number(l.purchase_price_indicative),
              supplier: l.supplier || null,
            },
          }));
          await s.from("commercial_doc_lines").insert(rows);
        }
        // Hook : si c'est une COMMANDE, on crée/synchronise un projet
        // dans Projets & Livrables (colonne Reçu) pour la visibilité opérationnelle
        if (type === "commande") {
          try { await syncCommandeToProject(s, data, lines); } catch (e) { console.warn("[commande→projet auto]", e.message || e); }
          // Crée aussi une COMMANDE D'ACHAT fournisseur (CA-AAAA-NNNN)
          try { await createPurchaseOrder(s, data, lines); } catch (e) { console.warn("[commande→commande_achat auto]", e.message || e); }
        }
        // Hook : si c'est un BL, on génère son PDF (sans tarifs) et on l'attache au projet
        if (type === "bl") {
          try { await syncBLToProject(s, data, lines); } catch (e) { console.warn("[bl→projet auto]", e.message || e); }
        }
        return { ...data, lines };
      }
      const arr = lsGet("commercial_docs"); arr.unshift({ ...full, lines }); lsSet("commercial_docs", arr);
      return { ...full, lines };
    },

    async update(id, patch) {
      const s = supa();
      const row = { ...patch, updated_at: new Date().toISOString() };
      delete row.lines;
      if (s) {
        const { data, error } = await s.from("commercial_docs").update(row).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.commercialDocs.update]", error.message);
        if (data) return data;
      }
      const arr = lsGet("commercial_docs");
      const idx = arr.findIndex((d) => d.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...row }; lsSet("commercial_docs", arr); return arr[idx]; }
      return null;
    },

    /** Recalcule les totaux d'un doc à partir de ses lignes. */
    _sumLines(lines) {
      let ht = 0, tva = 0;
      (lines || []).forEach((l) => {
        if (l.is_text_only) return;
        const qty = Number(l.quantity) || 0;
        const pu = Number(l.unit_price_ht) || 0;
        const disc = Number(l.discount_pct) || 0;
        const lineHT = qty * pu * (1 - disc / 100);
        const lineTVA = lineHT * (Number(l.tva_rate) || 20) / 100;
        ht += lineHT;
        tva += lineTVA;
      });
      return { ht: Math.round(ht * 100) / 100, tva: Math.round(tva * 100) / 100, ttc: Math.round((ht + tva) * 100) / 100 };
    },

    async recompute(id) {
      const s = supa();
      if (!s) return null;
      const { data: lines } = await s.from("commercial_doc_lines").select("*").eq("doc_id", id);
      const totals = this._sumLines(lines || []);
      const { data } = await s.from("commercial_docs").update({
        total_ht: totals.ht, total_tva: totals.tva, total_ttc: totals.ttc,
        updated_at: new Date().toISOString(),
      }).eq("id", id).select().maybeSingle();
      return data;
    },

    async addLine(doc_id, line) {
      const s = supa();
      const qty = Number(line.quantity) || 1;
      const pu = Number(line.unit_price_ht) || 0;
      const disc = Number(line.discount_pct) || 0;
      const tvaR = Number(line.tva_rate) != null ? Number(line.tva_rate) : 20;
      const total_ht = qty * pu * (1 - disc / 100);
      const total_tva = total_ht * tvaR / 100;
      const row = {
        id: line.id || genId("CDL"),
        doc_id,
        position: line.position || 0,
        article_id: line.article_id || null,
        ref: line.ref || null,
        designation: line.designation || "",
        description: line.description || null,
        quantity: qty, unit: line.unit || "u",
        unit_price_ht: pu, discount_pct: disc, tva_rate: tvaR,
        total_ht: Math.round(total_ht * 100) / 100,
        total_tva: Math.round(total_tva * 100) / 100,
        total_ttc: Math.round((total_ht + total_tva) * 100) / 100,
        is_text_only: !!line.is_text_only,
        // supplier est une vraie colonne (ALTER TABLE 20260615_stock_catalogue)
        supplier: line.supplier || null,
        // Champs internes (jamais sur PDF) → data jsonb pour ne pas créer
        // d'erreur "column does not exist" si la migration n'est pas appliquée.
        data: {
          ...((line.data && typeof line.data === "object") ? line.data : {}),
          manufacturer_ref: line.manufacturer_ref || null,
          purchase_price_indicative: line.purchase_price_indicative == null ? null : Number(line.purchase_price_indicative),
          // Périodicité (recurring / oneshot) — affecte le groupement et le
          // sous-total abonnements dans l'éditeur et le PDF.
          periodicity: line.periodicity || "oneshot",
        },
      };
      if (s) {
        const { data, error } = await s.from("commercial_doc_lines").insert(row).select().maybeSingle();
        if (error) console.warn("[addLine]", error.message);
        if (data) { await this.recompute(doc_id); return data; }
      }
      return row;
    },

    async updateLine(line_id, patch) {
      const s = supa();
      // Sépare les champs internes (stockés dans data jsonb) des colonnes table.
      // Si on les laissait dans le patch, Supabase rejetterait l'update entier
      // avec "column manufacturer_ref does not exist" et la qté ne serait pas
      // persistée — symptôme : "Enregistrer ne fait rien".
      const INTERNAL_KEYS = ["manufacturer_ref", "purchase_price_indicative", "periodicity"];
      const internal = {};
      const row = {};
      Object.keys(patch || {}).forEach((k) => {
        if (INTERNAL_KEYS.includes(k)) internal[k] = patch[k];
        else row[k] = patch[k];
      });
      // Recalcul des totaux ligne si quantity / prix / remise / tva touchés
      if (row.quantity != null || row.unit_price_ht != null || row.discount_pct != null || row.tva_rate != null) {
        // Lecture courante pour merger
        if (s) {
          const { data: cur } = await s.from("commercial_doc_lines").select("*").eq("id", line_id).maybeSingle();
          if (cur) {
            const merged = { ...cur, ...row };
            const qty = Number(merged.quantity) || 0;
            const pu = Number(merged.unit_price_ht) || 0;
            const disc = Number(merged.discount_pct) || 0;
            const tvaR = Number(merged.tva_rate) != null ? Number(merged.tva_rate) : 20;
            row.total_ht = Math.round(qty * pu * (1 - disc / 100) * 100) / 100;
            row.total_tva = Math.round(row.total_ht * tvaR / 100 * 100) / 100;
            row.total_ttc = Math.round((row.total_ht + row.total_tva) * 100) / 100;
          }
        }
      }
      // Merge des champs internes dans data jsonb (pas de migration BDD requise).
      if (Object.keys(internal).length && s) {
        try {
          const { data: cur } = await s.from("commercial_doc_lines").select("data").eq("id", line_id).maybeSingle();
          const prevData = (cur && cur.data && typeof cur.data === "object") ? cur.data : {};
          row.data = { ...prevData, ...internal };
        } catch (e) { row.data = { ...internal }; }
      }
      if (s) {
        const { data, error } = await s.from("commercial_doc_lines").update(row).eq("id", line_id).select().maybeSingle();
        if (error) console.warn("[updateLine]", error.message);
        if (data) { await this.recompute(data.doc_id); return data; }
      }
      return null;
    },

    async removeLine(line_id) {
      const s = supa();
      if (s) {
        const { data: cur } = await s.from("commercial_doc_lines").select("doc_id").eq("id", line_id).maybeSingle();
        await s.from("commercial_doc_lines").delete().eq("id", line_id);
        if (cur) await this.recompute(cur.doc_id);
      }
    },

    /** Transforme un doc en doc de type suivant (Devis→Commande, Commande→BL, BL→Facture).
     *  Crée un nouveau doc qui pointe vers l'original via parent_doc_id, recopie les
     *  lignes et bascule le statut du parent en "transforme". */
    async transform(parent_id, new_type) {
      const parent = await this.getById(parent_id);
      if (!parent) throw new Error("Document parent introuvable");
      // Si le parent n'a pas de lignes (commande "from scratch" / commande vide),
      // on remonte la chaîne parent_doc_id jusqu'à trouver un ancêtre avec des
      // lignes — en général le devis d'origine. Comme ça le BL est toujours
      // créé avec les articles du devis.
      let sourceLines = parent.lines || [];
      if (sourceLines.length === 0 && parent.parent_doc_id) {
        let cur = parent;
        for (let i = 0; i < 5; i++) {
          if (!cur.parent_doc_id) break;
          const anc = await this.getById(cur.parent_doc_id);
          if (!anc) break;
          if (anc.lines && anc.lines.length) { sourceLines = anc.lines; break; }
          cur = anc;
        }
      }
      const lines = sourceLines.map((l) => ({
        article_id: l.article_id, ref: l.ref, designation: l.designation, description: l.description,
        quantity: l.quantity, unit: l.unit, unit_price_ht: l.unit_price_ht,
        discount_pct: l.discount_pct, tva_rate: l.tva_rate,
        total_ht: l.total_ht, total_tva: l.total_tva, total_ttc: l.total_ttc,
        is_text_only: l.is_text_only,
      }));
      const childPayload = {
        type: new_type,
        status: "brouillon",
        client_id: parent.client_id, client_name: parent.client_name,
        client_address: parent.client_address, client_cp: parent.client_cp, client_city: parent.client_city,
        client_siren: parent.client_siren, client_tva: parent.client_tva,
        contact_name: parent.contact_name, contact_email: parent.contact_email,
        project_id: parent.project_id, opportunity_id: parent.opportunity_id,
        parent_doc_id: parent_id,
        title: parent.title, notes: parent.notes,
        payment_terms_id: parent.payment_terms_id,
        owner: parent.owner,
        lines,
        // Note interne du devis propagée tout au long de la cascade
        // (Devis → Commande → BL → Facture). Stockée dans data.internal_notes,
        // jamais affichée sur le PDF client.
        data: {
          ...(parent.data || {}),
          internal_notes: (parent.data && parent.data.internal_notes) || parent.internal_notes || null,
        },
      };
      // Facture définitive : déduit les acomptes déjà facturés sur le devis
      // d'origine (modèle Sage — ligne négative « Acompte déjà facturé »).
      if (new_type === "facture") {
        try {
          // Remonte la chaîne jusqu'au devis racine
          let rootDevisId = null, cur = parent;
          for (let i = 0; i < 6; i++) {
            if (cur.type === "devis") { rootDevisId = cur.id; break; }
            if (!cur.parent_doc_id) break;
            cur = await this.getById(cur.parent_doc_id);
            if (!cur) break;
          }
          if (rootDevisId) {
            const s2 = supa();
            let acomptes = [];
            if (s2) {
              const { data } = await s2.from("commercial_docs").select("*")
                .eq("type", "facture_acompte").eq("parent_doc_id", rootDevisId).is("deleted_at", null);
              acomptes = data || [];
            } else {
              acomptes = lsGet("commercial_docs").filter((d) => d.type === "facture_acompte" && d.parent_doc_id === rootDevisId);
            }
            acomptes.forEach((ac) => {
              const acHt = Number(ac.total_ht) || 0;
              const acTva = Number(ac.total_tva) || 0;
              const rate = acHt > 0 ? Math.round((acTva / acHt) * 10000) / 100 : 20;
              childPayload.lines.push({
                article_id: null, ref: "ACOMPTE",
                designation: "Acompte déjà facturé — " + (ac.ref || ac.id),
                quantity: 1, unit: "forfait", unit_price_ht: -acHt, discount_pct: 0,
                tva_rate: rate, total_ht: -acHt, total_tva: -acTva,
                total_ttc: -(acHt + acTva), is_text_only: false, periodicity: "oneshot",
              });
            });
          }
        } catch (e) { console.warn("[transform] déduction acompte:", e); }
      }

      const child = await this.create(childPayload);
      // Le parent garde son statut métier (accepte / livre / paye) au lieu
      // d'être figé en « transforme ». Le lien parent_doc_id sur l'enfant
      // matérialise la transformation sans bloquer l'édition du parent.
      // Si le statut courant est < requires, on force au moins requires
      // pour que les pills du workflow restent cohérentes.
      try {
        const REQ = { devis: "accepte", commande: "accepte", bl: "livre", facture: "paye" };
        const target = REQ[parent.type];
        if (target && parent.status !== target && parent.status !== "paye") {
          await this.update(parent_id, { status: target });
        }
      } catch (e) { /* non bloquant */ }
      return child;
    },

    /** Crée une FACTURE D'ACOMPTE à partir d'un devis (ou commande).
     *  Modèle Sage : une seule ligne « Acompte de X% sur devis N° » avec la
     *  TVA proportionnelle. Le pourcentage OU un montant HT fixe.
     *  opts = { pct } ou { amount_ht }. Défaut : 40%.
     *  L'acompte est rattaché au devis via parent_doc_id + data.acompte=true. */
    async createAcompte(parent_id, opts = {}) {
      const parent = await this.getById(parent_id);
      if (!parent) throw new Error("Document parent introuvable");
      const baseHt = Number(parent.total_ht) || 0;
      // TVA moyenne pondérée du devis (pour rester cohérent multi-taux)
      const baseTva = Number(parent.total_tva) || 0;
      const effectiveRate = baseHt > 0 ? Math.round((baseTva / baseHt) * 10000) / 100 : 20;
      let pct = opts.pct != null ? Number(opts.pct) : null;
      let acompteHt;
      if (opts.amount_ht != null) {
        acompteHt = Number(opts.amount_ht) || 0;
        pct = baseHt > 0 ? Math.round((acompteHt / baseHt) * 10000) / 100 : null;
      } else {
        if (pct == null) pct = 40;
        acompteHt = Math.round(baseHt * pct / 100 * 100) / 100;
      }
      const acompteTva = Math.round(acompteHt * effectiveRate / 100 * 100) / 100;
      const acompteTtc = Math.round((acompteHt + acompteTva) * 100) / 100;
      const label = pct != null
        ? "Acompte de " + pct + " % sur devis " + (parent.ref || parent.id)
        : "Acompte sur devis " + (parent.ref || parent.id);
      const line = {
        article_id: null, ref: "ACOMPTE", designation: label, description: null,
        quantity: 1, unit: "forfait", unit_price_ht: acompteHt, discount_pct: 0,
        tva_rate: effectiveRate, total_ht: acompteHt, total_tva: acompteTva,
        total_ttc: acompteTtc, is_text_only: false, periodicity: "oneshot",
      };
      const payload = {
        type: "facture_acompte",
        status: "brouillon",
        client_id: parent.client_id, client_name: parent.client_name,
        client_address: parent.client_address, client_cp: parent.client_cp, client_city: parent.client_city,
        client_siren: parent.client_siren, client_tva: parent.client_tva,
        contact_name: parent.contact_name, contact_email: parent.contact_email,
        project_id: parent.project_id, opportunity_id: parent.opportunity_id,
        parent_doc_id: parent_id,
        title: "Acompte " + (pct != null ? pct + "% " : "") + "— " + (parent.title || parent.client_name || ""),
        owner: parent.owner,
        lines: [line],
        data: { ...(parent.data || {}), acompte: true, acompte_pct: pct, source_devis_ref: parent.ref || parent.id },
      };
      return await this.create(payload);
    },

    /** (Re)génère le PDF d'un BL existant et l'attache au projet.
     *  Utile pour les BL créés avant que le hook automatique n'existe. */
    async regenerateBLPdf(bl_id) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré.");
      const full = await this.getById(bl_id);
      if (!full) throw new Error("BL introuvable");
      if (full.type !== "bl") throw new Error("Le document " + bl_id + " n'est pas un BL (type=" + full.type + ")");
      return await syncBLToProject(s, full, full.lines || []);
    },

    /** Retrouve le BL le plus récent lié à un projet via son commande_id
     *  (data.commande_id) ou son opportunity_id. */
    async findBLForProject(project) {
      const s = supa();
      if (!s || !project) return null;
      const cmdId = project.data && project.data.commande_id;
      if (cmdId) {
        const { data } = await s.from("commercial_docs")
          .select("id, type, status, parent_doc_id")
          .eq("type", "bl").eq("parent_doc_id", cmdId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        if (data) return data;
      }
      const oppId = project.opportunity_id || (project.data && project.data.opportunity_id);
      if (oppId) {
        const { data } = await s.from("commercial_docs")
          .select("id, type, status, parent_doc_id")
          .eq("type", "bl").eq("opportunity_id", oppId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        return data || null;
      }
      return null;
    },

    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("commercial_docs").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw new Error(error.message);
      }
      const arr = lsGet("commercial_docs").filter((d) => d.id !== id);
      lsSet("commercial_docs", arr);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.68 COMMERCIAL ARTICLES — Catalogue (admin)
  // ───────────────────────────────────────────────────────────────────
  const commercialArticles = {
    async list({ active = true } = {}) {
      const s = supa();
      if (s) {
        let q = s.from("commercial_articles").select("*");
        if (active) q = q.eq("active", true);
        const { data, error } = await q.order("category").order("ref");
        if (error) { console.warn("[articles.list]", error.message); }
        else { return data || []; }
      }
      // Fallback localStorage : applique aussi le filtre actif
      let arr = lsGet("commercial_articles");
      if (active) arr = arr.filter((a) => a.active !== false);
      return arr;
    },

    async create(payload) {
      const id = payload.id || genId("ART");
      const row = { id, active: true, created_at: new Date().toISOString(), ...payload };
      const s = supa();
      if (s) {
        const { data, error } = await s.from("commercial_articles").insert(row).select().maybeSingle();
        if (error) { console.warn("[articles.create]", error.message); throw new Error(error.message); }
        return data;
      }
      const arr = lsGet("commercial_articles"); arr.unshift(row); lsSet("commercial_articles", arr);
      return row;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("commercial_articles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        if (error) console.warn("[articles.update]", error.message);
        if (data) return data;
      }
      const arr = lsGet("commercial_articles");
      const idx = arr.findIndex((a) => a.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("commercial_articles", arr); return arr[idx]; }
      return null;
    },

    /** Soft-delete : passe active=false. Si Supabase indispo, on désactive aussi en localStorage. */
    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("commercial_articles").update({ active: false }).eq("id", id);
        if (error) console.warn("[articles.remove]", error.message);
      }
      const arr = lsGet("commercial_articles");
      const idx = arr.findIndex((a) => a.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], active: false }; lsSet("commercial_articles", arr); }
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.69 COMMERCIAL COMPANY SETTINGS — Coordonnées société émettrice
  // ───────────────────────────────────────────────────────────────────
  /** Settings stockés dans commercial_company_settings (1 ligne, id='default').
   *  Utilisé par le renderer PDF + l'admin > Société. */
  const commercialCompany = {
    _cache: null,
    async get() {
      if (this._cache) return this._cache;
      const s = supa();
      if (s) {
        const { data } = await s.from("commercial_company_settings").select("*").eq("id", "default").maybeSingle();
        if (data) { this._cache = data; return data; }
      }
      // Fallback : valeurs depuis le devis Astorya analysé
      const fallback = {
        id: "default",
        raison_sociale: "S.A.R.L. ASTORYA SGI", forme_juridique: "SARL",
        adresse: "9 rue du Petit Châtelier", cp: "44300", ville: "Nantes", pays: "France",
        tel: "02 85 52 13 95", email: "contact@astorya.fr", site_web: "www.astorya.fr",
        siret: "52362580400027", capital_eur: 7500,
        iban: "FR7630004018540001003802740", bic: "BNPAFRPPNAN", banque_nom: "BNP Paribas",
        contact_commercial_nom: "Romain DAVIAUD", contact_commercial_email: "r.daviaud@astorya.fr", contact_commercial_tel: "02 85 52 13 95",
        contact_admin_nom: "Laëtitia LUCAS", contact_admin_email: "l.lucas@astorya.fr", contact_admin_tel: "02 85 52 13 95",
        contact_compta_nom: "Louise NEAU", contact_compta_email: "l.neau@astorya.fr", contact_compta_tel: "02 85 52 13 95",
        mention_reserve_propriete: "RESERVE DE PROPRIETE : Nous nous réservons la propriété des marchandises jusqu'au paiement du prix par l'acheteur. Notre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà été revendues (Loi du 12 mai 1980).",
        conditions_paiement_default: "Règlement à la commande d'un acompte de 40%",
        delai_validite_devis_jours: 30,
      };
      this._cache = fallback;
      return fallback;
    },
    async update(patch) {
      const s = supa();
      this._cache = null;
      if (s) {
        const row = { ...patch, id: "default", updated_at: new Date().toISOString() };
        const { data, error } = await s.from("commercial_company_settings").upsert(row).select().maybeSingle();
        if (error) { console.warn("[commercialCompany.update]", error.message); throw new Error(error.message); }
        return data;
      }
      return null;
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.70 COMMERCIAL DOC SENDS — Audit log des envois (email/print/download)
  // ───────────────────────────────────────────────────────────────────
  const commercialSends = {
    async list({ doc_id, status } = {}) {
      const s = supa();
      if (s) {
        let q = s.from("commercial_doc_sends").select("*");
        if (doc_id) q = q.eq("doc_id", doc_id);
        if (status) q = q.eq("status", status);
        const { data } = await q.order("sent_at", { ascending: false }).limit(100);
        return data || [];
      }
      return lsGet("commercial_doc_sends").filter((d) => !doc_id || d.doc_id === doc_id);
    },

    /** Log un envoi (la pièce attachée peut être un blob URL, le PDF est régénéré côté UI). */
    async log(payload) {
      const s = supa();
      const id = genId("SND");
      const created_by = await getCurrentUserId();
      const row = {
        id,
        doc_id: payload.doc_id,
        doc_type: payload.doc_type || null,
        channel: payload.channel || "email",
        recipient_email: payload.recipient_email || null,
        recipient_name: payload.recipient_name || null,
        cc: payload.cc || null,
        subject: payload.subject || null,
        body: payload.body || null,
        attachment_url: payload.attachment_url || null,
        status: payload.status || "sent",
        error_message: payload.error_message || null,
        sent_by: created_by || null,
        sent_by_name: getCurrentUserName(),
        sent_at: new Date().toISOString(),
        provider: payload.provider || "mailto",
        provider_msg_id: payload.provider_msg_id || null,
      };
      if (s) {
        const { data, error } = await s.from("commercial_doc_sends").insert(row).select().maybeSingle();
        if (error) console.warn("[commercialSends.log]", error.message);
        if (data) return data;
      }
      const arr = lsGet("commercial_doc_sends"); arr.unshift(row); lsSet("commercial_doc_sends", arr);
      return row;
    },

    async updateStatus(id, status, patch = {}) {
      const s = supa();
      if (s) {
        const { data } = await s.from("commercial_doc_sends").update({ status, ...patch }).eq("id", id).select().maybeSingle();
        if (data) return data;
      }
      return null;
    },
  };

  /** Référentiel TVA + conditions de paiement (lecture seule pour les users). */
  const commercialRefs = {
    async tvaRates() {
      const s = supa();
      if (s) {
        const { data } = await s.from("commercial_tva_rates").select("*").eq("active", true).order("rate", { ascending: false });
        if (data) return data;
      }
      return [{ rate: 20, label: "Taux normal" }, { rate: 10, label: "Taux intermédiaire" }, { rate: 5.5, label: "Taux réduit" }, { rate: 0, label: "Exonéré" }];
    },
    async paymentTerms() {
      const s = supa();
      if (s) {
        const { data } = await s.from("commercial_payment_terms").select("*").eq("active", true);
        if (data) return data;
      }
      return [{ id: "rcpt", label: "À réception", days: 0 }, { id: "net30", label: "30 jours net", days: 30 }, { id: "net45", label: "45 jours net", days: 45 }];
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.65 DELIVERY NOTES — Bons de livraison
  // ───────────────────────────────────────────────────────────────────
  //
  // Workflow : draft → sent → signed (ou refused/cancelled)
  // Méthodes : list, getById, createForProject, addItem, send, sign, remove
  const deliveryNotes = {
    async list({ project_id, status } = {}) {
      const s = supa();
      if (!s) return [];
      let q = s.from("delivery_notes").select("*").is("deleted_at", null);
      if (project_id) q = q.eq("project_id", project_id);
      if (status) q = q.eq("status", status);
      const { data } = await q.order("created_at", { ascending: false });
      return data || [];
    },

    async getById(id) {
      const s = supa();
      if (!s) return null;
      const [{ data: bl }, { data: items }] = await Promise.all([
        s.from("delivery_notes").select("*").eq("id", id).maybeSingle(),
        s.from("delivery_note_items").select("*").eq("delivery_note_id", id).order("created_at"),
      ]);
      if (!bl) return null;
      return { ...bl, items: items || [] };
    },

    /** Crée un BL à partir d'un projet : prend tous les project_items pas
     *  encore livrés et les transforme en delivery_note_items. */
    async createForProject(projectId) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré");
      // Récupère le projet + ses items
      const project = await projects.getById(projectId);
      if (!project) throw new Error("Projet introuvable");
      const items = (project.items || []).filter((it) => it.status !== "delivered" && it.status !== "validated" && it.status !== "cancelled");
      if (items.length === 0) throw new Error("Aucun livrable à émettre (tous déjà livrés/validés)");
      // Génère un numéro
      const year = new Date().getFullYear();
      // Compte des BL de l'année pour numéroter
      const { count } = await s.from("delivery_notes").select("id", { count: "exact", head: true });
      const number = "BL-" + year + "-" + String((count || 0) + 1).padStart(4, "0");
      const id = number;
      const created_by = await getCurrentUserId();
      const row = {
        id, number,
        project_id: projectId,
        client_id: project.client_id || null,
        status: "draft",
        delivery_date: new Date().toISOString().slice(0, 10),
        delivery_address: project.data?.delivery_address || null,
        delivery_contact: project.pm_name || null,
        data: { project_name: project.name, project_sage_ref: project.sage_ref },
      };
      if (created_by) row.created_by = created_by;
      const { data: blRow, error } = await s.from("delivery_notes").insert(row).select().maybeSingle();
      if (error) throw new Error(error.message);
      // Insère les items
      const itemRows = items.map((it) => ({
        delivery_note_id: id,
        project_item_id: it.id,
        designation: it.designation,
        quantity: it.quantity,
        unit: it.unit || "u",
        serial_numbers: it.serial_numbers || null,
      }));
      await s.from("delivery_note_items").insert(itemRows);
      // Log event projet
      await s.from("project_events").insert({
        project_id: projectId, type: "delivery_note_created",
        payload: { delivery_note_id: id, items_count: items.length },
        author_id: created_by, author_name: getCurrentUserName(),
      });
      return blRow;
    },

    async update(id, patch) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("delivery_notes").update(patch).eq("id", id).select().maybeSingle();
      if (error) console.warn("[api.deliveryNotes.update]", error.message);
      return data;
    },

    async send(id) {
      return await deliveryNotes.update(id, { status: "sent" });
    },

    /** Signe le BL avec signature (dataURL base64), nom + rôle du signataire. */
    async sign(id, { name, role, signatureDataURL, items }) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré");
      // Upload signature dans Storage si fournie
      let signature_url = null;
      if (signatureDataURL) {
        try {
          // dataURL → Blob
          const res = await fetch(signatureDataURL);
          const blob = await res.blob();
          const path = "signatures/" + id + "-" + Date.now() + ".png";
          // S'assure que le bucket existe
          const up = await s.storage.from("delivery-signatures").upload(path, blob, { contentType: "image/png", upsert: true });
          if (up.error && /bucket not found/i.test(up.error.message || "")) {
            await s.storage.createBucket("delivery-signatures", { public: true });
            await s.storage.from("delivery-signatures").upload(path, blob, { contentType: "image/png", upsert: true });
          }
          const { data: urlData } = s.storage.from("delivery-signatures").getPublicUrl(path);
          signature_url = urlData ? urlData.publicUrl : null;
        } catch (e) { console.warn("[deliveryNotes.sign] upload signature:", e); }
      }
      const patch = {
        status: "signed",
        signed_at: new Date().toISOString(),
        signed_by_name: name,
        signed_by_role: role || null,
        signature_url,
      };
      const { data, error } = await s.from("delivery_notes").update(patch).eq("id", id).select().maybeSingle();
      if (error) throw new Error(error.message);
      // Update verified pour les items cochés à la signature
      if (Array.isArray(items)) {
        for (const item of items) {
          await s.from("delivery_note_items").update({ verified: !!item.verified }).eq("id", item.id);
          // Si verified, marque le project_item correspondant comme livré
          if (item.verified && item.project_item_id) {
            await s.from("project_items").update({ status: "delivered", delivered_qty: item.quantity }).eq("id", item.project_item_id);
          }
        }
      }
      // Log event projet
      const cuId = await getCurrentUserId();
      await s.from("project_events").insert({
        project_id: data.project_id, type: "delivery_note_signed",
        payload: { delivery_note_id: id, signer: name },
        author_id: cuId, author_name: getCurrentUserName(),
      });
      // Notification au chef projet
      await s.from("notifications").insert({
        type: "delivery_signed",
        title: "BL " + data.number + " signé par " + name,
        body: "Le bon de livraison a été signé. Le projet peut avancer en « Livré ».",
        link: "/projet?id=" + data.project_id,
        severity: "success",
        recipient_id: null,
      });
      return data;
    },

    async remove(id) {
      const s = supa();
      if (!s) return;
      const { error } = await s.from("delivery_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.7 NOTIFICATIONS — in-app notifications (cloche top-right)
  // ───────────────────────────────────────────────────────────────────
  const notifications = {
    /** Liste les notifs pour l'user courant (ou broadcast). */
    async list({ unreadOnly } = {}) {
      const s = supa();
      if (!s) return [];
      const uid = await getCurrentUserId();
      let q = s.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      if (uid) q = q.or("recipient_id.eq." + uid + ",recipient_id.is.null");
      else q = q.is("recipient_id", null);
      if (unreadOnly) q = q.is("read_at", null);
      const { data, error } = await q;
      if (error) { console.warn("[api.notifications.list]", error.message); return []; }
      return data || [];
    },

    async unreadCount() {
      const s = supa();
      if (!s) return 0;
      const uid = await getCurrentUserId();
      let q = s.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      if (uid) q = q.or("recipient_id.eq." + uid + ",recipient_id.is.null");
      else q = q.is("recipient_id", null);
      const { count } = await q;
      return count || 0;
    },

    async markRead(id) {
      const s = supa();
      if (!s) return;
      await s.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    },

    async markAllRead() {
      const s = supa();
      if (!s) return;
      const uid = await getCurrentUserId();
      let q = s.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
      if (uid) q = q.or("recipient_id.eq." + uid + ",recipient_id.is.null");
      await q;
    },

    /** Crée une notification ciblée ou broadcast. */
    async create({ recipient_id, type, title, body, link, severity, payload }) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("notifications").insert({
        recipient_id: recipient_id || null,
        type: type || "info",
        title: title || "Notification",
        body: body || null,
        link: link || null,
        severity: severity || "info",
        payload: payload || {},
      }).select().maybeSingle();
      if (error) console.warn("[api.notifications.create]", error.message);
      return data;
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §7. AUTH — wrapper Supabase Auth
  // ───────────────────────────────────────────────────────────────────
  //
  // Méthodes :
  //   getUser()       → l'objet user Supabase (null si déconnecté)
  //   signOut()       → déconnecte la session
  //   requireAuth()   → redirige vers /login si pas de session
  //                     (à appeler en début de page protégée)
  const auth = {
    async getUser() {
      const s = supa();
      if (!s) return null;
      try {
        const { data } = await s.auth.getSession();
        return data && data.session ? data.session.user : null;
      } catch (e) { return null; }
    },

    async signOut() {
      const s = supa();
      if (s) await s.auth.signOut();
      try { localStorage.removeItem("hubAstorya.localUser"); } catch (e) {}
    },

    /**
     * Redirige vers /login si pas connecté (sauf si Supabase non configuré).
     * À appeler en début de page protégée.
     */
    async requireAuth() {
      const s = supa();
      if (!s) { window.location.href = "/login"; return null; }
      try {
        const { data } = await s.auth.getSession();
        if (!data || !data.session) {
          window.location.href = "/login";
          return null;
        }
        return data.session.user;
      } catch (e) {
        window.location.href = "/login";
        return null;
      }
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §8. EXPORT global
  // ───────────────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────────────
  // §6.71 USER ACTIVITY — sessions + événements (tracking minimal)
  // ───────────────────────────────────────────────────────────────────
  const userActivity = {
    /** Sessions actives + ended récemment, triées par dernière activité */
    async sessions({ user_id, since_hours = 24, only_active = false } = {}) {
      const s = supa();
      if (!s) return [];
      let q = s.from("user_sessions").select("*");
      if (user_id) q = q.eq("user_id", user_id);
      if (only_active) q = q.is("ended_at", null);
      const sinceDate = new Date(Date.now() - since_hours * 3600 * 1000).toISOString();
      q = q.gte("started_at", sinceDate);
      const { data, error } = await q.order("last_activity", { ascending: false }).limit(200);
      if (error) { console.warn("[userActivity.sessions]", error.message); return []; }
      return data || [];
    },

    /** Événements filtrés par type/sévérité/path/user/date */
    async events({ types, severity, path, user_id, session_id, limit = 200, since_hours = 24 } = {}) {
      const s = supa();
      if (!s) return [];
      let q = s.from("user_events").select("*");
      if (types && types.length) q = q.in("type", types);
      if (severity) q = q.eq("severity", severity);
      if (path) q = q.eq("path", path);
      if (user_id) q = q.eq("user_id", user_id);
      if (session_id) q = q.eq("session_id", session_id);
      if (since_hours) {
        const sinceDate = new Date(Date.now() - since_hours * 3600 * 1000).toISOString();
        q = q.gte("occurred_at", sinceDate);
      }
      const { data, error } = await q.order("occurred_at", { ascending: false }).limit(limit);
      if (error) { console.warn("[userActivity.events]", error.message); return []; }
      return data || [];
    },

    /** Stats agrégées du dashboard (RPC SQL ou fallback compteur côté client). */
    async dashboardStats() {
      const s = supa();
      if (!s) return { online_now: 0, locked_now: 0, sessions_today: 0, events_today: 0, errors_today: 0 };
      try {
        const { data, error } = await s.rpc("activity_dashboard_stats");
        if (!error && data) return data;
      } catch (e) {}
      // Fallback : 5 requêtes
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const isoToday = todayStart.toISOString();
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const [{ count: online_now }, { count: locked_now }, { count: sessions_today }, { count: events_today }, { count: errors_today }] = await Promise.all([
        s.from("user_sessions").select("*", { count: "exact", head: true }).is("ended_at", null).gte("last_activity", fiveMinAgo),
        s.from("user_sessions").select("*", { count: "exact", head: true }).is("ended_at", null).gte("last_activity", fiveMinAgo).eq("is_locked", true),
        s.from("user_sessions").select("*", { count: "exact", head: true }).gte("started_at", isoToday),
        s.from("user_events").select("*", { count: "exact", head: true }).gte("occurred_at", isoToday),
        s.from("user_events").select("*", { count: "exact", head: true }).gte("occurred_at", isoToday).eq("severity", "error"),
      ]);
      return { online_now: online_now || 0, locked_now: locked_now || 0, sessions_today: sessions_today || 0, events_today: events_today || 0, errors_today: errors_today || 0 };
    },

    /** Projets bloqués : pas d'événement project_event depuis N jours */
    async stalledProjects({ days = 7 } = {}) {
      const s = supa();
      if (!s) return [];
      const sinceDate = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      // Récupère tous les projets actifs
      const { data: projects } = await s.from("projects").select("id, name, client_id, client_name, stage, pm_name, updated_at, created_at").is("deleted_at", null).neq("stage", "clos");
      if (!projects) return [];
      // Pour chaque projet, dernier event
      const stalled = [];
      for (const p of projects) {
        const { data: lastEvt } = await s.from("project_events").select("created_at").eq("project_id", p.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const lastActivity = lastEvt ? lastEvt.created_at : (p.updated_at || p.created_at);
        if (lastActivity < sinceDate) {
          stalled.push({ ...p, last_activity: lastActivity, days_stalled: Math.floor((Date.now() - new Date(lastActivity)) / (24 * 3600 * 1000)) });
        }
      }
      return stalled.sort((a, b) => b.days_stalled - a.days_stalled);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.72 INTEL TASKS — Leasing (Locam/Grenke) + Garanties + Concurrents
  // ───────────────────────────────────────────────────────────────────
  const intelTasks = {
    /** Tâches commerciales à anticiper, agrégées depuis 3 sources :
     *  1. leasing_contracts dont date_fin < horizonDays
     *  2. warranties dont date_fin < horizonDays
     *  3. opportunities OUVERTES (stage != won/lost) avec contract_end < horizonDays */
    async list({ horizon_days = 365, only_imminent = false } = {}) {
      const s = supa();
      const horizonDate = new Date(Date.now() + horizon_days * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const tasks = [];
      if (!s) return tasks;

      // 1. Leasing (LOCAM, GRENKE, FRANFINANCE…)
      //    Requête simple : tous les contrats non supprimés, filtrage
      //    côté client (statut + présence date_fin) pour éviter les
      //    subtilités de syntaxe Postgrest sur les NULL.
      try {
        const { data: leases } = await s.from("leasing_contracts")
          .select("*").is("deleted_at", null)
          .order("date_fin", { nullsFirst: false });
        console.log("[intelTasks] leasing_contracts en BDD :", (leases || []).length);
        (leases || []).forEach((l) => {
          if (!l.date_fin) return; // sécurité
          const okStatus = !l.status || l.status === "actif" || l.status === "tacite" || l.status === "termine";
          if (!okStatus) return;
          const daysLeft = Math.floor((new Date(l.date_fin) - Date.now()) / (24 * 3600 * 1000));
          const bailleur = l.bailleur || "Leasing";
          const statusBadge = l.status === "tacite" ? " · ⚠ tacite reconduction"
                            : l.status === "termine" ? " · ✓ contrat terminé"
                            : "";
          tasks.push({
            id: "lease_" + l.id, source: "leasing",
            title: l.designation || (bailleur + " · contrat " + (l.ref_contrat || "")),
            subtitle: bailleur + " · " + (l.ref_contrat || "—") + statusBadge,
            client_id: l.client_id, client_name: l.client_name,
            date_echeance: l.date_fin,
            days_left: daysLeft,
            amount: l.montant_ht,
            commercial: l.commercial,
            notes: l.notes,
            bailleur,
            raw: l,
          });
        });
      } catch (e) { console.warn("[intelTasks] leasing fetch:", e); }

      // 2. Warranties
      try {
        const { data: wars } = await s.from("warranties")
          .select("*").is("deleted_at", null).eq("status", "actif")
          .lte("date_fin", horizonDate).order("date_fin");
        (wars || []).forEach((w) => {
          const daysLeft = Math.floor((new Date(w.date_fin) - Date.now()) / (24 * 3600 * 1000));
          tasks.push({
            id: "war_" + w.id, source: "warranty",
            title: (w.manufacturer || "") + " " + (w.model || ""),
            subtitle: (w.type || "serveur") + " · " + (w.garantie_type || "standard") + (w.serial_number ? " · SN " + w.serial_number : ""),
            client_id: w.client_id, client_name: w.client_name,
            date_echeance: w.date_fin,
            days_left: daysLeft,
            commercial: w.commercial,
            notes: w.notes,
            raw: w,
          });
        });
      } catch (e) {}

      // 3. Concurrents depuis opportunités ouvertes (contract_end dans data jsonb)
      //    On inclut les opps avec contract_end MÊME SANS concurrent nommé :
      //    la simple présence d'une échéance contractuelle doit déclencher une
      //    action de rappel (à contacter avant l'échéance).
      try {
        const { data: opps } = await s.from("opportunities")
          .select("*").not("stage", "in", "(won,lost)");
        (opps || []).forEach((o) => {
          // contract_end peut être en colonne directe ou dans data jsonb
          const ce = o.contract_end || (o.data && o.data.contract_end);
          const concurrent = o.concurrent || (o.data && o.data.concurrent);
          if (!ce) return;
          if (ce > horizonDate) return;
          // Les échéances dans le passé < 30 jours sont conservées (relances tardives)
          const todayMinus30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
          if (ce < todayMinus30) return;
          const daysLeft = Math.floor((new Date(ce) - Date.now()) / (24 * 3600 * 1000));
          tasks.push({
            id: "opp_" + o.id, source: "concurrent",
            title: concurrent ? ("Fin contrat " + concurrent) : "Échéance contrat actuel",
            subtitle: concurrent
              ? (o.name || "Opportunité")
              : ((o.name || "Opportunité") + " · concurrent non renseigné"),
            client_id: o.client_id, client_name: o.client_name || (o.data && o.data.client_name),
            date_echeance: ce,
            days_left: daysLeft,
            amount: o.concurrent_amount || (o.data && o.data.concurrent_amount),
            commercial: o.owner,
            opp_id: o.id,
            raw: o,
          });
        });
      } catch (e) {}

      // Tri par date d'échéance croissante
      tasks.sort((a, b) => (a.days_left || 0) - (b.days_left || 0));
      if (only_imminent) return tasks.filter((t) => t.days_left <= 90);
      return tasks;
    },

    /** Auto-crée une opportunité de renouvellement pour CHAQUE tâche
     *  source=concurrent dont days_left <= threshold (90 par défaut).
     *  Idempotent : ne recrée pas si une opp existe déjà
     *  (data.renewal_for_task_id = task.id OR client_id + contract_end identiques).
     *  Retourne { created: N, skipped: N, opps: [{task_id, opp_id, opp_ref}] }. */
    async autoCreateRenewalOpps({ threshold_days = 90 } = {}) {
      const s = supa();
      if (!s) return { created: 0, skipped: 0, opps: [] };
      // 1. Récupère les tâches concurrent imminentes
      const tasks = await this.list({ horizon_days: 365 });
      const candidates = tasks.filter((t) => t.source === "concurrent" && t.days_left <= threshold_days && t.client_id);
      if (!candidates.length) return { created: 0, skipped: 0, opps: [] };
      // 2. Pré-charge les opportunités existantes pour le dédoublonnage
      const clientIds = Array.from(new Set(candidates.map((t) => t.client_id)));
      const { data: existing } = await s.from("opportunities")
        .select("id, client_id, contract_end, data, name")
        .in("client_id", clientIds);
      const seenByTask = new Map();
      const seenByCloseDate = new Map();
      (existing || []).forEach((o) => {
        const tid = o.data && o.data.renewal_for_task_id;
        if (tid) seenByTask.set(tid, o);
        const ce = o.contract_end || (o.data && o.data.contract_end);
        if (ce) seenByCloseDate.set(o.client_id + "|" + String(ce).slice(0, 10), o);
      });
      // 3. Création
      const result = { created: 0, skipped: 0, opps: [] };
      for (const t of candidates) {
        const ceKey = t.client_id + "|" + String(t.date_echeance).slice(0, 10);
        if (seenByTask.has(t.id) || seenByCloseDate.has(ceKey)) {
          result.skipped++;
          continue;
        }
        const concurrent = (t.raw && (t.raw.concurrent || (t.raw.data && t.raw.data.concurrent))) || "concurrent inconnu";
        const oppName = "Renouvellement " + concurrent + " — " + (t.client_name || "");
        try {
          const payload = {
            client_id: t.client_id,
            client_name: t.client_name,
            name: oppName,
            stage: "qualif",
            proba: 20,
            owner: t.commercial || null,
            type: "renew",
            source: "auto_concurrent_renewal",
            // contract_end = date d'anniversaire (= échéance actuelle du concurrent)
            contract_end: t.date_echeance,
            project_date: t.date_echeance,
            amount: t.amount || 0,
            notes: "Opp créée automatiquement à J-" + Math.max(0, t.days_left) + " avant échéance du contrat « " + concurrent + " ». À qualifier pour anticiper la reprise.",
            data: {
              renewal_for_task_id: t.id,
              renewal_from: concurrent,
              renewal_amount_concurrent: t.amount || null,
              auto_created_at: new Date().toISOString(),
              source_intel: true,
            },
          };
          const created = await window.api.opportunities.create(payload);
          result.created++;
          result.opps.push({ task_id: t.id, opp_id: created.id, opp_ref: created.ref || created.id, client_id: t.client_id });
        } catch (e) {
          console.warn("[autoCreateRenewalOpps]", e.message || e);
          result.skipped++;
        }
      }
      return result;
    },
  };

  const leasingContracts = {
    async list() {
      const s = supa();
      if (!s) return [];
      const { data } = await s.from("leasing_contracts").select("*").is("deleted_at", null).order("date_fin");
      return data || [];
    },
    async create(payload) {
      const s = supa();
      const id = payload.id || genId("LEA");
      const row = { id, ...payload, created_at: new Date().toISOString() };
      if (s) {
        const created_by = await getCurrentUserId();
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("leasing_contracts").insert(row).select().maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      }
      return row;
    },
    async update(id, patch) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("leasing_contracts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async remove(id) {
      const s = supa();
      if (!s) return;
      await s.from("leasing_contracts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    },

    /** Chargement lazy de SheetJS (xlsx) depuis CDN — utilisé pour l'import
     *  GRENKE et tout autre format Excel. */
    async _loadXLSX() {
      if (window.XLSX) return window.XLSX;
      if (!this._xlsxPromise) {
        this._xlsxPromise = new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
          s.onload = () => resolve(window.XLSX);
          s.onerror = () => reject(new Error("Échec chargement SheetJS"));
          document.head.appendChild(s);
        });
      }
      return this._xlsxPromise;
    },

    /** Import XLSX GRENKE "MyContracts" depuis le portail GRENKE.
     *  Colonnes attendues : Contract No., Status, Lessee, Sublessee,
     *  Term of lease, Amount, Leasing instalment, Start/End of primary period.
     *  Dates en serial Excel (45352 = 2024-03-12).
     *  Détecte les doublons par (bailleur=GRENKE, ref_contrat).
     *  Retourne { imported, updated, skipped, errors }. */
    async importGrenkeXLSX(file) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré.");
      const XLSX = await this._loadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      // Première feuille (GRENKE n'en utilise qu'une)
      const ws = wb.Sheets[wb.SheetNames[0]];
      // header:1 → array of arrays, raw:true → garde les valeurs brutes
      // (Date JS si cellDates a fonctionné, number sinon → toISODate gère les 2)
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      if (!rows || rows.length < 2) return { imported: 0, updated: 0, skipped: 0, errors: ["Fichier vide ou sans données"] };
      const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const idx = (name) => header.findIndex((h) => h === name.toLowerCase());
      const COL = {
        ref:      idx("Contract No."),
        status:   idx("Status"),
        lessee:   idx("Lessee"),
        sublessee:idx("Sublessee"),
        term:     idx("Term of lease"),
        amount:   idx("Amount"),
        instalment:idx("Leasing instalment"),
        start:    idx("Start of primary period"),
        end:      idx("End of primary period"),
      };
      if (COL.ref === -1) throw new Error("Colonne « Contract No. » introuvable — format inattendu.");
      // Helpers — toISODate robuste : Date | number serial Excel | string ISO/DD-MM-YYYY
      const toISODate = (v) => {
        if (v == null || v === "") return null;
        // 1. JS Date object
        if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
        // 2. Nombre direct (Excel serial)
        if (typeof v === "number" && isFinite(v) && v > 1000 && v < 100000) {
          const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
          return d.toISOString().slice(0, 10);
        }
        const s = String(v).trim();
        if (!s) return null;
        // 3. Déjà ISO YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        // 4. DD/MM/YYYY ou DD-MM-YYYY
        let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
        // 5. DD/MM/YY → on assume 20YY si < 50, 19YY sinon
        m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
        if (m) {
          const yy = parseInt(m[3], 10);
          const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
          return yyyy + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
        }
        // 6. String numérique → serial Excel
        const n = Number(s.replace(",", "."));
        if (isFinite(n) && n > 1000 && n < 100000) {
          const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
          return d.toISOString().slice(0, 10);
        }
        console.warn("[importGrenkeXLSX] date non parseable :", JSON.stringify(v));
        return null;
      };
      const parseNum = (v) => {
        if (v == null || v === "") return null;
        const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
        return isFinite(n) ? n : null;
      };
      const mapStatus = (st) => {
        const s = String(st || "").toLowerCase();
        if (s.indexOf("end") !== -1 || s.indexOf("termin") !== -1) return "termine";
        if (s.indexOf("resili") !== -1 || s.indexOf("résili") !== -1) return "resilie";
        if (s.indexOf("tacite") !== -1 || s.indexOf("renewed") !== -1) return "tacite";
        if (s.indexOf("running") !== -1 || s.indexOf("actif") !== -1 || s.indexOf("active") !== -1) return "actif";
        return "actif";
      };
      // Pré-charge les contrats GRENKE pour dédup
      const { data: existing } = await s.from("leasing_contracts")
        .select("id, ref_contrat").eq("bailleur", "GRENKE").is("deleted_at", null);
      const byRef = new Map();
      (existing || []).forEach((r) => { if (r.ref_contrat) byRef.set(String(r.ref_contrat), r); });
      const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] || [];
        const ref = String(r[COL.ref] || "").trim();
        if (!ref) { result.skipped++; continue; }
        const term = parseNum(r[COL.term]);
        const amount = parseNum(r[COL.amount]);
        const instalment = parseNum(r[COL.instalment]);
        // GRENKE : term = nombre de mois → 63 mois = mensuel, périodicité standard
        const periodicite = term ? (term <= 12 ? "annuelle" : "mensuelle") : null;
        const payload = {
          bailleur: "GRENKE",
          ref_contrat: ref,
          client_name: String(r[COL.lessee] || "").trim() || null,
          designation: r[COL.sublessee] ? ("Sous-locataire : " + String(r[COL.sublessee]).trim()) : null,
          montant_ht: amount,
          montant_loyer_ttc: instalment,
          periodicite,
          nb_loyers: term,
          date_debut: toISODate(r[COL.start]),
          date_fin: toISODate(r[COL.end]),
          status: mapStatus(r[COL.status]),
          data: {
            status_brut: String(r[COL.status] || "").trim(),
            sublessee: String(r[COL.sublessee] || "").trim(),
            term_months: term,
            instalment_raw: instalment,
            amount_raw: amount,
            source: "GRENKE_MyContracts_XLSX",
          },
        };
        try {
          const exists = byRef.get(ref);
          if (exists) {
            await this.update(exists.id, payload);
            result.updated++;
          } else {
            await this.create(payload);
            result.imported++;
          }
        } catch (e) {
          result.errors.push(ref + " : " + (e.message || e));
          result.skipped++;
        }
      }
      return result;
    },

    /** Import CSV LOCAM "Export_Location_Folders".
     *  Format ISO-8859-1, séparateur ";", 36 colonnes.
     *  Détecte les doublons par (bailleur=LOCAM, ref_contrat).
     *  Retourne { imported, updated, skipped, errors }. */
    async importLocamCSV(fileOrText) {
      const s = supa();
      if (!s) throw new Error("Supabase non configuré.");
      // 1. Lecture + décodage ISO-8859-1 → UTF-8
      let raw;
      if (typeof fileOrText === "string") raw = fileOrText;
      else {
        const buf = await fileOrText.arrayBuffer();
        // LOCAM exporte en windows-1252 / ISO-8859-1
        const dec = new TextDecoder("windows-1252");
        raw = dec.decode(buf);
      }
      // 2. Parsing CSV ; (sans guillemets — LOCAM n'en utilise pas)
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
      if (lines.length < 2) return { imported: 0, updated: 0, skipped: 0, errors: ["Fichier vide ou en-tête seul"] };
      const header = lines[0].split(";");
      const idx = (name) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
      const COL = {
        tacite: idx("Tacite reconduction"),
        num_agence: idx("Numéro d'agence"),
        code_commercial: idx("Code commercial"),
        ref_locam: idx("Votre référence Locam"),
        denomination: idx("Votre dénomination"),
        n_dossier: idx("N° Dossier"),
        n_etude: idx("N° Etude"),
        client_ref: idx("Référence interne de votre client"),
        siren: idx("N° Siren"),
        client_name: idx("Nom du client"),
        adresse: idx("Adresse"),
        localite: idx("Localité"),
        cp: idx("Code postal"),
        ville: idx("Ville"),
        tel: idx("N° Téléphone"),
        portable: idx("N° Portable"),
        email: idx("Adresse email"),
        bien: idx("Bien financé"),
        facture: idx("Votre numéro de facture"),
        etat: idx("Etat du dossier"),
        type_produit: idx("Type de produit"),
        assurance: idx("Présence d'assurance"),
        montant_finance: idx("Montant financé HT"),
        periodicite: idx("Périodicité"),
        nb_loyers: idx("Nombre de loyers"),
        terme: idx("Terme à échoir / Echu"),
        montant_loyer: idx("Montant des loyers TTC"),
        dont_assurance: idx("Dont assurance"),
        dont_maintenance: idx("Dont prestation / maintenance TTC"),
        date_apport: idx("Date de l'apport"),
        date_premiere: idx("Date 1ère échéance"),
        date_derniere: idx("Date de dernière échéance"),
        nb_impayes: idx("Nombre d'impayés"),
        montant_impayes: idx("Montant des impayés TTC"),
        statut: idx("Statut"),
      };
      // 3. Helpers
      const parseDate = (s) => {
        if (!s) return null;
        const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return null;
        return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
      };
      const parseNum = (s) => {
        if (!s) return null;
        const cleaned = String(s).replace(/^0+/, "").replace(/\s/g, "").replace(",", ".");
        const n = parseFloat(cleaned);
        return isFinite(n) ? n : null;
      };
      const mapStatus = (etat, statut) => {
        const e = String(etat || statut || "").toLowerCase();
        if (e.indexOf("termin") !== -1)        return "termine";
        if (e.indexOf("résili") !== -1)        return "resilie";
        if (e.indexOf("tacite") !== -1)        return "tacite";
        if (e.indexOf("cours") !== -1 || e.indexOf("actif") !== -1) return "actif";
        return "actif";
      };
      // 4. Pré-charge les contrats LOCAM existants pour détecter doublons
      const { data: existing } = await s.from("leasing_contracts")
        .select("id, ref_contrat, data").eq("bailleur", "LOCAM").is("deleted_at", null);
      const byRef = new Map();
      (existing || []).forEach((r) => { if (r.ref_contrat) byRef.set(String(r.ref_contrat), r); });
      // 5. Boucle d'import
      const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(";");
        const dossier = (cols[COL.n_dossier] || "").trim();
        if (!dossier) { result.skipped++; continue; }
        const dateDebut = parseDate(cols[COL.date_premiere]);
        const dateFin = parseDate(cols[COL.date_derniere]);
        const payload = {
          bailleur: "LOCAM",
          ref_contrat: dossier,
          client_siren: (cols[COL.siren] || "").trim() || null,
          client_name: (cols[COL.client_name] || "").trim() || null,
          designation: ((cols[COL.bien] || "").trim() + (cols[COL.denomination] ? " — " + (cols[COL.denomination] || "").trim() : "")) || null,
          montant_ht: parseNum(cols[COL.montant_finance]),
          montant_loyer_ttc: parseNum(cols[COL.montant_loyer]),
          periodicite: (cols[COL.periodicite] || "").trim() || null,
          nb_loyers: parseNum(cols[COL.nb_loyers]),
          date_debut: dateDebut, date_fin: dateFin,
          status: mapStatus(cols[COL.etat], cols[COL.statut]),
          data: {
            // Tout le reste dans le jsonb pour ne rien perdre
            num_agence: cols[COL.num_agence],
            code_commercial: cols[COL.code_commercial],
            ref_locam: cols[COL.ref_locam],
            n_etude: cols[COL.n_etude],
            adresse: cols[COL.adresse],
            cp: cols[COL.cp], ville: cols[COL.ville],
            tel: cols[COL.tel], portable: cols[COL.portable], email: cols[COL.email],
            tacite_reconduction: (cols[COL.tacite] || "").toLowerCase() === "oui",
            type_produit: cols[COL.type_produit],
            assurance: cols[COL.assurance],
            terme: cols[COL.terme],
            dont_assurance: parseNum(cols[COL.dont_assurance]),
            dont_maintenance: parseNum(cols[COL.dont_maintenance]),
            date_apport: parseDate(cols[COL.date_apport]),
            nb_impayes: parseNum(cols[COL.nb_impayes]),
            montant_impayes: parseNum(cols[COL.montant_impayes]),
            statut_brut: (cols[COL.statut] || "").trim(),
            etat_brut: (cols[COL.etat] || "").trim(),
          },
        };
        try {
          const exists = byRef.get(dossier);
          if (exists) {
            await this.update(exists.id, payload);
            result.updated++;
          } else {
            await this.create(payload);
            result.imported++;
          }
        } catch (e) {
          result.errors.push(dossier + " : " + (e.message || e));
          result.skipped++;
        }
      }
      return result;
    },
  };

  const warranties = {
    async list() {
      const s = supa();
      if (!s) return [];
      const { data } = await s.from("warranties").select("*").is("deleted_at", null).order("date_fin");
      return data || [];
    },
    async create(payload) {
      const s = supa();
      const id = payload.id || genId("WAR");
      const row = { id, ...payload, created_at: new Date().toISOString() };
      if (s) {
        const created_by = await getCurrentUserId();
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("warranties").insert(row).select().maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      }
      return row;
    },
    async update(id, patch) {
      const s = supa();
      if (!s) return null;
      const { data, error } = await s.from("warranties").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async remove(id) {
      const s = supa();
      if (!s) return;
      await s.from("warranties").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.73 STOCK & CATALOGUE — Matrice d'achats hebdomadaires
  // ───────────────────────────────────────────────────────────────────
  const suppliers = (function () {
    // Fallback localStorage : utilisé tant que la table public.suppliers
    // n'existe pas en base (migration sql/20260615_stock_catalogue.sql
    // pas encore exécutée). L'erreur Supabase est typique :
    //   "Could not find the table 'public.suppliers' in the schema cache"
    const LS_KEY = "hubAstorya.suppliers.v1";
    const lsList = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } };
    const lsSave = (arr) => { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) {} };
    const isMissingTable = (err) => err && /Could not find the table|schema cache|relation .* does not exist|42P01|PGRST205/i.test(err.message || "");
    const genSupId = (name) => "SUP-" + String(name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) + "-" + Math.random().toString(36).slice(2, 4);

    return {
      async list({ active = true } = {}) {
        const s = supa();
        if (s) {
          let q = s.from("suppliers").select("*");
          if (active) q = q.eq("active", true);
          const { data, error } = await q.order("name");
          if (!error) return data || [];
          if (!isMissingTable(error)) { console.warn("[suppliers.list]", error.message); return []; }
        }
        // Fallback localStorage
        const arr = lsList();
        return active ? arr.filter((r) => r.active !== false) : arr;
      },

      async create(payload) {
        const id = payload.id || genSupId(payload.name);
        const row = { id, active: true, ...payload, created_at: new Date().toISOString() };
        const s = supa();
        if (s) {
          const { data, error } = await s.from("suppliers").insert(row).select().maybeSingle();
          if (!error) return data;
          if (!isMissingTable(error)) throw new Error(error.message);
          // sinon → fallback localStorage
        }
        const arr = lsList();
        if (arr.some((r) => (r.name || "").toLowerCase() === String(row.name || "").toLowerCase())) {
          throw new Error("Ce fournisseur existe déjà.");
        }
        arr.push(row); lsSave(arr);
        return row;
      },

      async update(id, patch) {
        const s = supa();
        if (s) {
          const { data, error } = await s.from("suppliers").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
          if (!error) return data;
          if (!isMissingTable(error)) throw new Error(error.message);
        }
        const arr = lsList();
        const idx = arr.findIndex((r) => r.id === id);
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...patch, updated_at: new Date().toISOString() };
        lsSave(arr); return arr[idx];
      },

      /** Soft delete = active=false. Préserve l'historique des références fournisseurs. */
      async remove(id) {
        const s = supa();
        if (s) {
          const { error } = await s.from("suppliers").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
          if (!error) return true;
          if (!isMissingTable(error)) throw new Error(error.message);
        }
        const arr = lsList();
        const idx = arr.findIndex((r) => r.id === id);
        if (idx === -1) return false;
        arr[idx] = { ...arr[idx], active: false }; lsSave(arr);
        return true;
      },

      /** Import en lot : crée tous les fournisseurs qui n'existent pas encore.
       *  Retourne { created: N, skipped: N }. */
      async bulkImport(names) {
        const existing = await this.list({ active: false });
        const existingNames = new Set((existing || []).map((r) => (r.name || "").toLowerCase()));
        const toCreate = (names || [])
          .map((n) => String(n || "").trim())
          .filter((n) => n.length >= 2 && !existingNames.has(n.toLowerCase()));
        let created = 0;
        for (const name of toCreate) {
          try {
            await this.create({ name });
            created++;
          } catch (e) { /* doublon racey ou autre — on continue */ }
        }
        return { created, skipped: (names || []).length - created };
      },
    };
  })();

  const purchaseMatrix = {
    /** Toutes les lignes à acheter (devis acceptés/transformés/envoyés
     *  + commandes). Filtrable par semaine, fournisseur, statut achat. */
    async list({ week, year, supplier, purchase_status, reception_status, since_days = 60, types, archived = false } = {}) {
      const s = supa();
      if (!s) return [];
      const typeFilter = types && types.length ? types : ["commande"];
      const sinceDate = new Date(Date.now() - since_days * 24 * 3600 * 1000).toISOString().slice(0, 10);
      // On essaie de sélectionner stock_archived_at ; si la colonne n'existe
      // pas (migration pas encore passée), on retombe sur data jsonb.
      let docs;
      let err;
      {
        const res = await s.from("commercial_docs")
          .select("id, type, status, client_name, doc_date, opportunity_id, title, number_year, number_seq, stock_archived_at, data")
          .in("type", typeFilter)
          .in("status", ["accepte", "transforme", "envoye", "brouillon"])
          .is("deleted_at", null)
          .gte("doc_date", sinceDate)
          .order("doc_date", { ascending: false });
        docs = res.data; err = res.error;
      }
      if (err) {
        // Fallback sans la colonne
        const res = await s.from("commercial_docs")
          .select("id, type, status, client_name, doc_date, opportunity_id, title, number_year, number_seq, data")
          .in("type", typeFilter)
          .in("status", ["accepte", "transforme", "envoye", "brouillon"])
          .is("deleted_at", null)
          .gte("doc_date", sinceDate)
          .order("doc_date", { ascending: false });
        docs = res.data;
      }
      // Filtrage archivage : la valeur de référence est stock_archived_at,
      // sinon data.stock_archived_at.
      docs = (docs || []).filter((d) => {
        const archivedAt = d.stock_archived_at || (d.data && d.data.stock_archived_at) || null;
        return archived ? !!archivedAt : !archivedAt;
      });
      const docMap = {};
      (docs || []).forEach((d) => { docMap[d.id] = d; });
      const docIds = Object.keys(docMap);
      if (docIds.length === 0) return [];

      const { data: lines } = await s.from("commercial_doc_lines")
        .select("*")
        .in("doc_id", docIds);

      const rows = (lines || [])
        .filter((l) => !l.is_text_only)
        .map((l) => {
          const d = docMap[l.doc_id];
          // Fallback : si colonnes purchase_* absentes, lit le data jsonb
          const meta = (l.data && typeof l.data === "object") ? l.data : {};
          const purchase = Number(l.purchase_price_ht != null ? l.purchase_price_ht : meta.purchase_price_ht) || 0;
          const supplier = l.supplier || meta.supplier || null;
          const supplier_ref = l.supplier_ref || meta.supplier_ref || null;
          const purchase_status = l.purchase_status || meta.purchase_status || "panier";
          const reception_status = l.reception_status || meta.reception_status || "en_cours";
          const received_at = l.received_at || meta.received_at || null;
          const serial_number = l.serial_number || meta.serial_number || null;
          const purchase_date_val = l.purchase_date || meta.purchase_date || null;
          const date = purchase_date_val || d.doc_date;
          const dt = new Date(date);
          const start = new Date(dt.getFullYear(), 0, 1);
          const dayOfYear = Math.floor((dt - start) / (24 * 3600 * 1000)) + 1;
          const week_number = Math.ceil((dayOfYear + start.getDay()) / 7);
          const qty = Number(l.quantity) || 0;
          const sell = Number(l.unit_price_ht) || 0;
          return {
            line_id: l.id,
            doc_id: l.doc_id,
            doc_ref: d.id,
            doc_type: d.type,
            doc_status: d.status,
            doc_title: d.title,
            doc_number: (d.number_year && d.number_seq)
              ? ((d.type === "commande" ? "CDE" : d.type === "facture" ? "FAC" : d.type === "bl" ? "BL" : "DEV") + "-" + d.number_year + "-" + String(d.number_seq).padStart(4, "0"))
              : null,
            client_name: d.client_name,
            opportunity_id: d.opportunity_id,
            doc_date: d.doc_date,
            archived_at: d.stock_archived_at || (d.data && d.data.stock_archived_at) || null,
            purchase_date: purchase_date_val, // brut : null si non set explicitement
            effective_date: date,             // fallback pour calculs (semaine, etc.)
            week_number,
            year_number: dt.getFullYear(),
            ref: l.ref,
            designation: l.designation,
            description: l.description,
            quantity: qty,
            unit: l.unit,
            sell_price_ht: sell,
            purchase_price_ht: purchase,
            tva_rate: l.tva_rate,
            supplier,
            supplier_ref,
            purchase_status,
            reception_status,
            received_at,
            serial_number,
            total_purchase_ht: qty * purchase,
            total_sell_ht: qty * sell,
            margin_eur: qty * (sell - purchase),
            margin_pct: purchase > 0 ? Math.round(((sell - purchase) / purchase) * 10000) / 100 : null,
          };
        });

      // Filtres
      let filtered = rows;
      if (week) filtered = filtered.filter((r) => r.week_number === Number(week));
      if (year) filtered = filtered.filter((r) => r.year_number === Number(year));
      if (supplier) filtered = filtered.filter((r) => (r.supplier || "") === supplier);
      if (purchase_status) filtered = filtered.filter((r) => r.purchase_status === purchase_status);
      if (reception_status) filtered = filtered.filter((r) => r.reception_status === reception_status);
      return filtered;
    },

    /** Mise à jour rapide d'une ligne (statut achat, fournisseur, prix d'achat…) */
    async updateLine(line_id, patch) {
      const s = supa();
      if (!s) return null;
      const allowed = ["supplier", "supplier_ref", "purchase_price_ht", "purchase_status", "reception_status", "received_at", "serial_number", "purchase_date"];
      const row = {};
      for (const k of Object.keys(patch)) {
        if (allowed.includes(k)) row[k] = patch[k];
      }

      // Tentative 1 : update direct (cas SQL migration passée)
      let { data, error } = await s.from("commercial_doc_lines").update(row).eq("id", line_id).select().maybeSingle();
      if (!error) return data;

      // Tentative 2 : SQL migration pas encore passée → fallback dans data jsonb
      if (/Could not find|does not exist|42703|PGRST204/i.test(error.message)) {
        // Lit la ligne courante pour fusionner data existant
        const { data: cur } = await s.from("commercial_doc_lines").select("data").eq("id", line_id).maybeSingle();
        const mergedData = { ...((cur && cur.data) || {}), ...row };
        const retry = await s.from("commercial_doc_lines").update({ data: mergedData }).eq("id", line_id).select().maybeSingle();
        if (retry.error) {
          // Si même data n'existe pas → on ne peut rien faire en BDD, on log et retourne
          console.warn("[updateLine fallback]", retry.error.message);
          throw new Error("Impossible de sauvegarder : exécute sql/20260615_stock_catalogue.sql dans Supabase pour activer les colonnes achat. Détail : " + retry.error.message);
        }
        // Reconstruit un objet plat lu pour cohérence avec l'app
        return { ...(retry.data || {}), ...mergedData };
      }
      throw new Error(error.message);
    },

    /** Archive un document (l'enlève de la vue Stock & Catalogue active).
     *  Tentative colonne dédiée stock_archived_at ; fallback data jsonb. */
    async archiveDoc(doc_id) {
      const s = supa();
      if (!s) return null;
      const now = new Date().toISOString();
      const res = await s.from("commercial_docs").update({ stock_archived_at: now }).eq("id", doc_id).select().maybeSingle();
      if (!res.error) return res.data;
      if (/Could not find|does not exist|42703|PGRST204/i.test(res.error.message)) {
        const { data: cur } = await s.from("commercial_docs").select("data").eq("id", doc_id).maybeSingle();
        const mergedData = { ...((cur && cur.data) || {}), stock_archived_at: now };
        const retry = await s.from("commercial_docs").update({ data: mergedData }).eq("id", doc_id).select().maybeSingle();
        if (retry.error) throw new Error(retry.error.message);
        return retry.data;
      }
      throw new Error(res.error.message);
    },

    async unarchiveDoc(doc_id) {
      const s = supa();
      if (!s) return null;
      const res = await s.from("commercial_docs").update({ stock_archived_at: null }).eq("id", doc_id).select().maybeSingle();
      if (!res.error) return res.data;
      if (/Could not find|does not exist|42703|PGRST204/i.test(res.error.message)) {
        const { data: cur } = await s.from("commercial_docs").select("data").eq("id", doc_id).maybeSingle();
        const mergedData = { ...((cur && cur.data) || {}) };
        delete mergedData.stock_archived_at;
        const retry = await s.from("commercial_docs").update({ data: mergedData }).eq("id", doc_id).select().maybeSingle();
        if (retry.error) throw new Error(retry.error.message);
        return retry.data;
      }
      throw new Error(res.error.message);
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.80 ASSETS — Stock interne (instances physiques de matériel)
  // ───────────────────────────────────────────────────────────────────
  const assets = {
    async list({ status = null, article_id = null, client_id = null, q = null, limit = 500 } = {}) {
      const s = supa();
      if (s) {
        let req = s.from("assets").select("*").eq("active", true);
        if (status)     req = req.eq("status", status);
        if (article_id) req = req.eq("article_id", article_id);
        if (client_id)  req = req.eq("client_id", client_id);
        if (q) {
          const term = "%" + q + "%";
          req = req.or("serial_number.ilike." + term + ",article_label.ilike." + term + ",article_ref.ilike." + term + ",client_name.ilike." + term + ",location.ilike." + term);
        }
        const { data, error } = await req.order("received_at", { ascending: false }).limit(limit);
        if (error) { console.warn("[assets.list]", error.message); }
        else return data || [];
      }
      let arr = lsGet("assets");
      arr = arr.filter((a) => a.active !== false);
      if (status)     arr = arr.filter((a) => a.status === status);
      if (article_id) arr = arr.filter((a) => a.article_id === article_id);
      if (client_id)  arr = arr.filter((a) => a.client_id === client_id);
      if (q) {
        const t = String(q).toLowerCase();
        arr = arr.filter((a) => [a.serial_number, a.article_label, a.article_ref, a.client_name, a.location].some((v) => String(v || "").toLowerCase().includes(t)));
      }
      return arr.slice(0, limit);
    },

    async counters() {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("v_article_counters").select("*");
        if (!error) return data || [];
        console.warn("[assets.counters] vue indisponible, fallback agrégation locale", error.message);
        const { data: rows } = await s.from("assets").select("article_id,status").eq("active", true);
        const out = {};
        (rows || []).forEach((r) => {
          const k = r.article_id || "";
          if (!out[k]) out[k] = { article_id: k, in_stock: 0, reserved: 0, sold: 0, in_sav: 0, broken: 0 };
          if (r.status === "disponible") out[k].in_stock++;
          else if (r.status === "reserve") out[k].reserved++;
          else if (r.status === "affecte" || r.status === "vendu") out[k].sold++;
          else if (r.status === "sav") out[k].in_sav++;
          else if (r.status === "hs") out[k].broken++;
        });
        return Object.values(out);
      }
      return [];
    },

    async create(payload) {
      const id = payload.id || genId("ASSET");
      const row = {
        id,
        active: true,
        status: payload.status || "disponible",
        created_at: new Date().toISOString(),
        ...payload,
      };
      const s = supa();
      if (s) {
        const { data, error } = await s.from("assets").insert(row).select().maybeSingle();
        if (error) { console.warn("[assets.create]", error.message); throw new Error(error.message); }
        return data;
      }
      const arr = lsGet("assets"); arr.unshift(row); lsSet("assets", arr);
      return row;
    },

    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("assets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        if (error) { console.warn("[assets.update]", error.message); throw new Error(error.message); }
        return data;
      }
      const arr = lsGet("assets");
      const idx = arr.findIndex((a) => a.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch, updated_at: new Date().toISOString() }; lsSet("assets", arr); return arr[idx]; }
      return null;
    },

    /** Soft-delete : passe active=false + deleted_at */
    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("assets").update({ active: false, deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) { console.warn("[assets.remove]", error.message); throw new Error(error.message); }
        return;
      }
      const arr = lsGet("assets");
      const idx = arr.findIndex((a) => a.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], active: false, deleted_at: new Date().toISOString() }; lsSet("assets", arr); }
    },

    /** Affecte un asset à un client (et optionnellement projet). */
    async affectToClient(id, { client_id, client_name, project_id = null }) {
      return assets.update(id, {
        status: "affecte",
        client_id, client_name, project_id,
        affected_at: new Date().toISOString(),
      });
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §6.90 DATA EXPORT — réversibilité RGPD (art. 9 du contrat)
  // Collecte TOUTES les données d'un client en CSV + bundle ZIP.
  // Implémente le droit à la portabilité (RGPD art. 20).
  // ───────────────────────────────────────────────────────────────────
  const dataExport = {
    // Convertit un tableau d'objets en CSV (UTF-8 BOM, séparateur ;).
    _toCsv(rows) {
      if (!rows || rows.length === 0) return "﻿(aucune donnée)\n";
      // Colonnes = union des clés de toutes les lignes
      const cols = [];
      const seen = new Set();
      rows.forEach((r) => Object.keys(r || {}).forEach((k) => { if (!seen.has(k)) { seen.add(k); cols.push(k); } }));
      const esc = (v) => {
        if (v == null) return "";
        if (typeof v === "object") v = JSON.stringify(v);
        v = String(v);
        return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      };
      const head = cols.join(";");
      const body = rows.map((r) => cols.map((c) => esc(r ? r[c] : "")).join(";")).join("\r\n");
      return "﻿" + head + "\r\n" + body + "\r\n";
    },

    // Récupère toutes les données liées à un client_id donné.
    async collect(clientId) {
      const s = supa();
      const out = {};
      if (!s) {
        // Fallback localStorage : on exporte ce qu'on a en cache
        ["clients","contacts","opportunities","contracts","commercial_docs","projects"].forEach((k) => {
          out[k] = lsGet(k).filter((r) => !clientId || r.client_id === clientId || r.id === clientId);
        });
        return out;
      }
      const fetchByClient = async (table, col) => {
        try {
          let q = s.from(table).select("*");
          if (col && clientId) q = q.eq(col, clientId);
          const { data, error } = await q;
          if (error) { console.warn("[export]", table, error.message); return []; }
          return data || [];
        } catch (e) { return []; }
      };
      // Tables liées directement au client
      out.clients        = await fetchByClient("clients", "id");
      out.contacts       = await fetchByClient("contacts", "client_id");
      out.opportunities  = await fetchByClient("opportunities", "client_id");
      out.contracts      = await fetchByClient("contracts", "client_id");
      out.actions        = await fetchByClient("actions", "client_id");
      out.commercial_docs = await fetchByClient("commercial_docs", "client_id");
      out.projects       = await fetchByClient("projects", "client_id");
      out.assets         = await fetchByClient("assets", "client_id");
      out.leasing_contracts = await fetchByClient("leasing_contracts", "client_id");
      out.warranties     = await fetchByClient("warranties", "client_id");
      // Lignes des docs commerciaux (rattachées via doc_id)
      const docIds = (out.commercial_docs || []).map((d) => d.id);
      if (docIds.length) {
        try {
          const { data } = await s.from("commercial_doc_lines").select("*").in("doc_id", docIds);
          out.commercial_doc_lines = data || [];
        } catch (e) { out.commercial_doc_lines = []; }
        try {
          const { data } = await s.from("commercial_doc_sends").select("*").in("doc_id", docIds);
          out.commercial_doc_sends = data || [];
        } catch (e) {}
      }
      // Items / events de projets
      const projIds = (out.projects || []).map((p) => p.id);
      if (projIds.length) {
        try { const { data } = await s.from("project_items").select("*").in("project_id", projIds); out.project_items = data || []; } catch (e) {}
        try { const { data } = await s.from("project_events").select("*").in("project_id", projIds); out.project_events = data || []; } catch (e) {}
      }
      return out;
    },

    // Charge JSZip depuis CDN (lazy).
    _loadJSZip() {
      if (window.JSZip) return Promise.resolve(window.JSZip);
      return new Promise((resolve, reject) => {
        const sc = document.createElement("script");
        sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        sc.onload = () => resolve(window.JSZip);
        sc.onerror = () => reject(new Error("Échec chargement JSZip"));
        document.head.appendChild(sc);
      });
    },

    // Génère et télécharge le ZIP complet pour un client.
    async downloadZip(clientId, clientName) {
      const JSZip = await this._loadJSZip();
      const data = await this.collect(clientId);
      const zip = new JSZip();
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeName = String(clientName || clientId || "client").replace(/[^a-zA-Z0-9_-]+/g, "_");

      // Dossier data/ avec un CSV par table
      const dataFolder = zip.folder("data");
      const manifest = { client_id: clientId, client_name: clientName, export_date: new Date().toISOString(), files: [] };
      Object.keys(data).forEach((table) => {
        const rows = data[table] || [];
        const csv = this._toCsv(rows);
        dataFolder.file(table + ".csv", csv);
        manifest.files.push({ file: "data/" + table + ".csv", rows: rows.length });
      });

      // JSON brut complet (pour ré-import technique)
      zip.file("data_complete.json", JSON.stringify(data, null, 2));
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // README explicatif
      const totalRows = manifest.files.reduce((a, f) => a + f.rows, 0);
      const readme = [
        "# Export des données — " + (clientName || clientId),
        "",
        "Export généré le " + new Date().toLocaleString("fr-FR") + " par le Hub Astorya.",
        "",
        "Cet export contient l'intégralité de vos données au titre de votre droit",
        "à la portabilité (RGPD art. 20) et de la clause de réversibilité (art. 9",
        "du contrat de mise à disposition).",
        "",
        "## Contenu",
        "",
        "- `data/*.csv` : une table par fichier CSV (UTF-8 BOM, séparateur point-virgule)",
        "- `data_complete.json` : l'ensemble des données en JSON (pour ré-import technique)",
        "- `manifest.json` : liste des fichiers + nombre de lignes",
        "",
        "## Tables exportées",
        "",
        manifest.files.map((f) => "- " + f.file + " — " + f.rows + " ligne(s)").join("\n"),
        "",
        "Total : " + totalRows + " enregistrement(s).",
        "",
        "## Format des CSV",
        "",
        "- Encodage : UTF-8 avec BOM (ouverture directe dans Excel)",
        "- Séparateur : point-virgule (;)",
        "- Première ligne : en-têtes de colonnes",
        "- Échappement : guillemets doubles",
        "",
        "Pour toute question : dpo@astorya.fr",
      ].join("\n");
      zip.file("README.md", readme);

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export-" + safeName + "-" + dateStr + ".zip";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { tables: manifest.files.length, rows: totalRows };
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §N. EMAIL TEMPLATES — modèles d'emails réutilisables
  // ───────────────────────────────────────────────────────────────────
  //
  // Table : public.email_templates (id, user_id, name, category, subject,
  //         body, variables, is_default, created_at, updated_at)
  //
  // Variables disponibles : {client_name}, {client_raison_sociale},
  //   {contact_prenom}, {contact_nom}, {contact_fonction},
  //   {opportunity_name}, {amount}, {owner_name}, {date_du_jour}
  //
  // Méthodes : list, getById, create, update, remove, render(template, ctx)
  // ───────────────────────────────────────────────────────────────────
  const emailTemplates = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("email_templates").select("*");
        if (filter.category) q = q.eq("category", filter.category);
        const { data, error } = await q.order("position", { ascending: true }).order("name");
        if (error) console.warn("[api.emailTemplates.list]", error.message);
        return data || [];
      }
      return lsGet("email_templates_v1");
    },
    async getById(id) {
      const s = supa();
      if (s) {
        const { data } = await s.from("email_templates").select("*").eq("id", id).maybeSingle();
        return data;
      }
      return lsGet("email_templates_v1").find((t) => t.id === id) || null;
    },
    async create(payload) {
      const id = payload.id || genId("TPL");
      const full = { id, ...payload, created_at: new Date().toISOString() };
      const s = supa();
      if (s) {
        const user_id = await getCurrentUserId();
        const { data } = await s.from("email_templates").insert({ ...full, user_id }).select().maybeSingle();
        return data || full;
      }
      const arr = lsGet("email_templates_v1");
      arr.unshift(full);
      lsSet("email_templates_v1", arr);
      return full;
    },
    async update(id, patch) {
      const s = supa();
      if (s) {
        const { data } = await s.from("email_templates").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        return data;
      }
      const arr = lsGet("email_templates_v1");
      const idx = arr.findIndex((t) => t.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("email_templates_v1", arr); return arr[idx]; }
      return null;
    },
    async remove(id) {
      const s = supa();
      if (s) await s.from("email_templates").delete().eq("id", id);
      const arr = lsGet("email_templates_v1").filter((t) => t.id !== id);
      lsSet("email_templates_v1", arr);
    },
    // Rendu d'un template avec contexte — remplace {variables} par les
    // valeurs du contexte. Retourne { subject, body }.
    render(template, ctx) {
      const c = ctx || {};
      const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const vars = {
        client_name: c.client_name || c.raison_sociale || "",
        client_raison_sociale: c.raison_sociale || c.client_name || "",
        contact_prenom: c.contact_prenom || (c.contact && c.contact.prenom) || "",
        contact_nom: c.contact_nom || (c.contact && c.contact.nom) || "",
        contact_fonction: c.contact_fonction || (c.contact && c.contact.fonction) || "",
        opportunity_name: c.opportunity_name || c.opp_name || "",
        amount: c.amount || "",
        owner_name: c.owner_name || c.owner || "",
        date_du_jour: today,
      };
      const apply = (s) => String(s || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : "{" + k + "}");
      return {
        subject: apply(template.subject || ""),
        body: apply(template.body || ""),
      };
    },
    // Ouvre Outlook Web (OWA) avec le template pré-rempli. Si l'email
    // destinataire est fourni, il est mis en To. Sinon laissé vide.
    composeOutlookWeb({ to, template, ctx }) {
      const rendered = this.render(template, ctx);
      const url = "https://outlook.office.com/owa/?path=/mail/action/compose"
        + (to ? "&to=" + encodeURIComponent(to) : "")
        + "&subject=" + encodeURIComponent(rendered.subject)
        + "&body=" + encodeURIComponent(rendered.body);
      window.open(url, "_blank", "noopener");
      return rendered;
    },
  };

  // ───────────────────────────────────────────────────────────────────
  // §N. INBOUND REQUESTS — demandes de devis entrantes par email
  // ───────────────────────────────────────────────────────────────────
  // Table : public.inbound_requests (alimentée par l'Edge Function
  // inbound-mail OU manuellement depuis le Hub). Chaque entrée correspond
  // à un email reçu sur devis.astorya@gmail.com.
  //
  // Méthodes : list, getById, create, update, remove, markDevisCreated,
  //            attachClient, matchClientByEmail
  // ───────────────────────────────────────────────────────────────────
  const inboundRequests = {
    // Filtre localStorage commun
    _lsList(filter = {}) {
      let arr = lsGet("inbound_requests_v1");
      if (filter.status) arr = arr.filter((r) => r.status === filter.status);
      if (filter.client_id) arr = arr.filter((r) => r.client_id === filter.client_id);
      return arr;
    },
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("inbound_requests").select("*");
        if (filter.status) q = q.eq("status", filter.status);
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        const { data, error } = await q.order("received_at", { ascending: false });
        // Si la table n'existe pas encore (migration non lancée) → fallback
        // localStorage pour que la saisie manuelle fonctionne sans déploiement.
        if (error) {
          console.warn("[api.inboundRequests.list] fallback localStorage:", error.message);
          return this._lsList(filter);
        }
        // Fusionne avec localStorage (demandes créées hors-ligne non encore
        // synchronisées), en dédupliquant par id.
        const ls = this._lsList(filter);
        const seen = new Set((data || []).map((r) => r.id));
        return [...(data || []), ...ls.filter((r) => !seen.has(r.id))];
      }
      return this._lsList(filter);
    },
    async getById(id) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("inbound_requests").select("*").eq("id", id).maybeSingle();
        if (!error && data) return data;
      }
      return lsGet("inbound_requests_v1").find((r) => r.id === id) || null;
    },
    // Création manuelle depuis le Hub (ex : copier-coller d'un email reçu)
    async create(payload) {
      const id = payload.id || genId("INB");
      const full = {
        id,
        from_name: payload.from_name || "",
        from_email: payload.from_email || "",
        to_email: payload.to_email || "devis.astorya@gmail.com",
        subject: payload.subject || "(sans sujet)",
        body_text: payload.body_text || "",
        body_excerpt: (payload.body_text || "").slice(0, 280),
        received_at: payload.received_at || new Date().toISOString(),
        client_id: payload.client_id || null,
        match_method: payload.match_method || "manual",
        needs_identification: !payload.client_id,
        ai_summary: payload.ai_summary || payload.subject || "",
        ai_products: payload.ai_products || [],
        ai_urgency: payload.ai_urgency || "moyenne",
        ai_amount_hint: payload.ai_amount_hint || null,
        status: payload.client_id ? "client_identifie" : "a_traiter",
        created_at: new Date().toISOString(),
      };
      // Toujours écrire en localStorage d'abord → garantit l'affichage même
      // si la table Supabase n'existe pas encore (migration non déployée).
      const arr = lsGet("inbound_requests_v1");
      arr.unshift(full);
      lsSet("inbound_requests_v1", arr);
      // Tente l'écriture Supabase (best effort, ignore l'erreur table absente)
      const s = supa();
      if (s) {
        const { error } = await s.from("inbound_requests").insert(full).select().maybeSingle();
        if (error) console.warn("[api.inboundRequests.create] Supabase indispo, conservé en local:", error.message);
      }
      // Crée la tâche « Devis à faire » (table actions, qui existe)
      await this._createDevisTask(full);
      return full;
    },
    // Crée la tâche « 📋 Devis à faire » liée à la demande entrante
    async _createDevisTask(req) {
      if (!actions || !actions.create) return null;
      let clientName = "Client à identifier";
      if (req.client_id) {
        try {
          const c = await clients.getById(req.client_id);
          clientName = (c && (c.raison_sociale || c.name)) || clientName;
        } catch (e) {}
      }
      try {
        return await actions.create({
          client_id: req.client_id || null,
          type: "task",
          title: "📋 Devis à faire — " + clientName,
          meta: (req.ai_summary || req.subject || "") + (req.ai_amount_hint ? " · Montant évoqué : " + req.ai_amount_hint : ""),
          due: req.ai_urgency === "haute" ? "Urgent — sous 24h" : "Sous 3 jours",
          priority: req.ai_urgency === "haute" ? "haute" : "moyenne",
          tag: "Devis entrant",
          tagColor: "#ea580c",
          icon: "📋",
          data: { source: "inbound_mail", inbound_id: req.id, from_email: req.from_email },
        });
      } catch (e) { console.warn("[inbound._createDevisTask]", e); return null; }
    },
    async update(id, patch) {
      // Met à jour localStorage systématiquement (source fiable hors-ligne)
      const arr = lsGet("inbound_requests_v1");
      const idx = arr.findIndex((r) => r.id === id);
      let updated = null;
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsSet("inbound_requests_v1", arr); updated = arr[idx]; }
      // Best effort Supabase
      const s = supa();
      if (s) {
        const { data, error } = await s.from("inbound_requests").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        if (!error && data) return data;
      }
      return updated;
    },
    // Rattache un client à une demande non identifiée
    async attachClient(id, client_id) {
      return this.update(id, { client_id, needs_identification: false, status: "client_identifie", match_method: "manual" });
    },
    // Marque la demande comme « devis créé »
    async markDevisCreated(id, devis_id) {
      return this.update(id, { status: "devis_cree", devis_id });
    },
    async remove(id) {
      const s = supa();
      if (s) await s.from("inbound_requests").delete().eq("id", id);
      lsSet("inbound_requests_v1", lsGet("inbound_requests_v1").filter((r) => r.id !== id));
    },
    // Normalise une raison sociale pour comparaison floue.
    _normalizeName(s) {
      return String(s || "")
        .toUpperCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/\b(SARL|SAS|SASU|SA|EURL|SCOP|SCI|SNC|SELARL|SELAS|GIE|ASSOCIATION)\b/g, "")
        .replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    },
    // Parse les champs structurés du corps (« Société : X », « Clé : Y »…).
    parseBodyFields(body) {
      const fields = {};
      let societe = null;
      String(body || "").split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-zÀ-ÿ' ]+?)\s*:\s*(.+?)\s*$/);
        if (!m) return;
        const key = m[1].trim().toLowerCase();
        const val = m[2].trim();
        if (!val) return;
        fields[key] = val;
        if (/soci[ée]t[ée]|client|entreprise|raison sociale/.test(key)) societe = val;
      });
      return { societe, fields };
    },
    // Matching client : société dans le corps (prioritaire) → email → domaine.
    // bodyText optionnel pour le matching par « Société : ».
    async matchClientByEmail(email, bodyText) {
      const e = (email || "").toLowerCase().trim();
      const domain = e.split("@")[1] || "";
      const generic = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.fr", "free.fr", "orange.fr", "wanadoo.fr", "laposte.net", "astorya.fr"];
      const allClients = await clients.list().catch(() => []);
      const allContacts = (contacts && contacts.list) ? await contacts.list().catch(() => []) : [];
      const parsed = this.parseBodyFields(bodyText || "");

      // 1. Société dans le corps (prioritaire — workflow interne Astorya)
      if (parsed.societe) {
        const target = this._normalizeName(parsed.societe);
        let hit = (allClients || []).find((c) => this._normalizeName(c.raison_sociale || c.name || "") === target);
        if (!hit) {
          hit = (allClients || []).find((c) => {
            const n = this._normalizeName(c.raison_sociale || c.name || "");
            return n && (n.includes(target) || target.includes(n));
          });
        }
        if (hit) return { client_id: hit.id, method: "body_societe", societe: parsed.societe, fields: parsed.fields };
      }
      // 2. Contact email exact (expéditeur externe)
      if (e && !generic.includes(domain)) {
        const cont = (allContacts || []).find((c) => (c.email || "").toLowerCase() === e);
        if (cont && cont.client_id) return { client_id: cont.client_id, method: "email_exact", societe: parsed.societe, fields: parsed.fields };
        const cli = (allClients || []).find((c) => (c.email || "").toLowerCase() === e);
        if (cli) return { client_id: cli.id, method: "email_exact", societe: parsed.societe, fields: parsed.fields };
      }
      // 3. Domaine
      if (domain && !generic.includes(domain)) {
        const byDom = (allClients || []).find((c) =>
          (c.email || "").toLowerCase().endsWith("@" + domain) ||
          (c.website || "").toLowerCase().includes(domain));
        if (byDom) return { client_id: byDom.id, method: "domain", societe: parsed.societe, fields: parsed.fields };
      }
      return { client_id: null, method: "none", societe: parsed.societe, fields: parsed.fields };
    },
  };

  window.api = { clients, opportunities, contacts, actions, contracts, contractTemplates, projects, deliveryNotes, notifications, auth, commercialDocs, commercialArticles, commercialRefs, commercialCompany, commercialSends, userActivity, intelTasks, leasingContracts, warranties, suppliers, purchaseMatrix, assets, dataExport, emailTemplates, inboundRequests };
})();
