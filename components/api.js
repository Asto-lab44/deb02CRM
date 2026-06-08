// Hub Astorya — Couche d'accès aux données
// Toutes les opérations CRUD passent par ce module.
// Si Supabase est configuré et l'utilisateur authentifié → Supabase.
// Sinon → localStorage (fallback offline / dev).
//
// Usage :
//   await window.api.clients.list({ status: 'prospect' })
//   await window.api.clients.create({ name, ... })
//   await window.api.opportunities.update('OPP-1234', { stage: 'won' })
//   await window.api.actions.complete('EX-1234')
//
// Tables Supabase : clients, opportunities, contacts, actions, contracts

(function () {
  "use strict";

  function supa() {
    return window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
  }

  async function getCurrentUserId() {
    const s = supa();
    if (!s) return null;
    try {
      const { data } = await s.auth.getSession();
      return data && data.session && data.session.user ? data.session.user.id : null;
    } catch (e) { return null; }
  }

  function lsKey(resource) { return "hubAstorya." + resource + ".v1"; }
  function lsGet(resource) {
    try { return JSON.parse(localStorage.getItem(lsKey(resource)) || "[]"); } catch (e) { return []; }
  }
  function lsSet(resource, arr) {
    try { localStorage.setItem(lsKey(resource), JSON.stringify(arr)); } catch (e) {}
  }

  function genId(prefix) {
    return prefix + "-" + Math.floor(Math.random() * 9000 + 1000) + Date.now().toString().slice(-4);
  }

  function flattenClient(row) {
    if (!row) return row;
    const extras = row.data && typeof row.data === "object" ? row.data : {};
    const out = { ...extras, ...row };
    delete out.data;
    return out;
  }

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
    // tout le reste va dans data
    const reserved = new Set(["id", "name", "industry", "city", "website", "status", "owner", "client_since", "data", "updated_at", "created_at", "created_by"]);
    const data = {};
    Object.keys(payload).forEach((k) => {
      if (k === "raison_sociale" || k === "secteur" || k === "ville" || k === "site_web") return;
      if (!reserved.has(k)) data[k] = payload[k];
    });
    topLevel.data = data;
    return topLevel;
  }

  // ────────────────────── CLIENTS ────────────────────────────────────
  const clients = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("clients").select("*");
        if (filter.status) q = q.eq("status", filter.status);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) console.warn("[api.clients.list]", error.message);
        return (data || []).map(flattenClient);
      }
      let arr = lsGet("prospects");
      if (filter.status) arr = arr.filter((c) => c.status === filter.status);
      return arr;
    },

    async getById(id) {
      const s = supa();
      if (s) {
        const { data, error } = await s.from("clients").select("*").eq("id", id).maybeSingle();
        if (error) console.warn("[api.clients.getById]", error.message);
        return flattenClient(data);
      }
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
        const { data, error } = await s.from("clients").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.clients.create]", error.message);
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

    async remove(id) {
      const s = supa();
      if (s) {
        const { error } = await s.from("clients").delete().eq("id", id);
        if (error) console.warn("[api.clients.remove]", error.message);
      }
      const arr = lsGet("prospects").filter((c) => c.id !== id);
      lsSet("prospects", arr);
    },
  };

  // ────────────────────── OPPORTUNITIES ──────────────────────────────
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

  // ────────────────────── CONTACTS (secondaires) ─────────────────────
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

  // ────────────────────── ACTIONS (Email/RDV/Call/Tâche/Note) ────────
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

  // ────────────────────── CONTRACTS ──────────────────────────────────
  const contracts = {
    async list(filter = {}) {
      const s = supa();
      if (s) {
        let q = s.from("contracts").select("*");
        if (filter.client_id) q = q.eq("client_id", filter.client_id);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error) console.warn("[api.contracts.list]", error.message);
        return data || [];
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
        const row = { client_id: full.client_id || null, opp_id: full.opp_id || null,
          name: full.name || "Contrat", status: full.status || "active",
          start_date: full.start || null, end_date: full.end || null,
          monthly_eur: full.monthly_eur || null,
          products: full.products || [], total_ht_y1: full.total_ht_y1 || null,
          tcv: full.tcv || null, margin_pct: full.margin_pct || null,
          notes: full.notes || null, data: full,
        };
        if (created_by) row.created_by = created_by;
        const { data, error } = await s.from("contracts").insert(row).select().maybeSingle();
        if (error) {
          console.warn("[api.contracts.create]", error.message);
        } else if (data) return data;
      }
      const arr = lsGet("contracts");
      arr.unshift(full);
      lsSet("contracts", arr);
      return full;
    },
  };

  // ────────────────────── AUTH HELPERS ───────────────────────────────
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
      if (!s) return null; // pas de Supabase → pas de redirect
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

  window.api = { clients, opportunities, contacts, actions, contracts, auth };
})();
