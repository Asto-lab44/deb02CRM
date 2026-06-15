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
        if (data && row.stage === "won" && previousStage !== "won") {
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
  // Cycle 7 stages : recu → devis_valide → preparation → pret_livrer
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
      { k: "devis_valide",  label: "Devis validé",    color: "#3b82f6" },
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
      if (!s) return null;
      const patch = { stage: newStage };
      // Auto-fill des dates clés selon le stage
      if (newStage === "livre" && !patch.delivery_done) patch.delivery_done = new Date().toISOString().slice(0, 10);
      if (newStage === "installe" && !patch.install_done) patch.install_done = new Date().toISOString().slice(0, 10);
      if (newStage === "clos") { patch.closed_at = new Date().toISOString(); patch.recette_done = new Date().toISOString().slice(0, 10); }
      const { data, error } = await s.from("projects").update(patch).eq("id", id).select().maybeSingle();
      if (error) { console.warn("[api.projects.changeStage]", error.message); return null; }
      // Log event
      const cuId = await getCurrentUserId();
      const cuName = getCurrentUserName();
      await s.from("project_events").insert({
        project_id: id, type: "stage_change",
        payload: { to: newStage, reason: reason || null },
        author_id: cuId, author_name: cuName,
      });
      // Notification au chef de projet (si défini et différent de l'auteur)
      const stageLabels = { recu: "Reçu", devis_valide: "Devis validé", preparation: "En préparation", pret_livrer: "Prêt à livrer", livre: "Livré", installe: "Installé", clos: "Clos", annule: "Annulé" };
      const severity = newStage === "clos" ? "success" : newStage === "annule" ? "error" : (newStage === "livre" || newStage === "installe" ? "success" : "info");
      const targetId = (data && data.pm_id && data.pm_id !== cuId) ? data.pm_id : null;
      // Si pas de chef projet → broadcast (recipient_id null)
      await s.from("notifications").insert({
        recipient_id: targetId,
        type: "project_stage",
        title: "Projet " + (data?.sage_ref || data?.name || id) + " → " + (stageLabels[newStage] || newStage),
        body: (cuName || "Quelqu'un") + " a fait avancer le projet" + (reason ? " · " + reason : ""),
        link: "/projet?id=" + id,
        severity,
        payload: { project_id: id, from: data?.stage, to: newStage, author: cuName },
      });
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
  window.api = { clients, opportunities, contacts, actions, contracts, contractTemplates, projects, deliveryNotes, notifications, auth };
})();
