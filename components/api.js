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
        const row = buildClientPatch({ id, ...patch });
        delete row.id; // ne pas patcher la clé primaire
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
        const row = { ...patch };
        if (row.amount && typeof row.amount === "string") {
          row.amount_eur = parseFloat(row.amount.replace(/[^\d.]/g, "")) || 0;
          delete row.amount;
        }
        const { data, error } = await s.from("opportunities").update(row).eq("id", id).select().maybeSingle();
        if (error) console.warn("[api.opportunities.update]", error.message);
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
  window.api = { clients, opportunities, contacts, actions, contracts, auth };
})();
