// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Data layer Supabase pour le ticketing (HubData)
// ════════════════════════════════════════════════════════════════════
//
// Distinct de window.api (qui gère CRM : clients/opps/contacts/actions/contrats).
// Ce module est dédié au TICKETING et aux ressources spécifiques au support :
// tickets, comments, profiles, calls, transcripts.
//
// SOMMAIRE
//   §1. Helpers internes      (supa, listeners, cache, flattenClient)
//   §2. Reads (fetch...)      → fetchGroups, fetchClients, fetchTickets,
//                                fetchTicketById, fetchProfiles,
//                                fetchCommentsByTicket
//   §3. Mutations             → createTicket, updateTicket, escalateTicket,
//                                createComment, recordCall, saveTranscript
//   §4. Realtime              → subscribeChanges, subscribeCommentsForTicket
//                                (notifs live multi-onglets / multi-agents)
//   §5. Export window.HubData
//
// FORMAT DE RETOUR
//   Toutes les méthodes async renvoient { data, error } à la Supabase.
//   - data : la donnée demandée (objet/array) ou null
//   - error : { message } ou null
//
// CACHE
//   - cache.tickets, cache.clients : mémorise le dernier fetch en mémoire
//   - invalidate(name) : reset le cache d'une ressource (appelé après mutate)
//
// USAGE
//   const { data, error } = await window.HubData.fetchTickets({ limit: 50 })
//   const off = window.HubData.subscribeChanges(() => reload())
//   await window.HubData.createTicket({ id, title, client_id, priority, … })
// ════════════════════════════════════════════════════════════════════

(function () {
  const supa = (typeof window !== "undefined" && window.HubSupabase && window.HubSupabase.enabled)
    ? window.HubSupabase.client : null;

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  // Caches simples — invalidés à chaque mutation
  const cache = { groups: null, clients: null, contracts: null, tickets: null, assets: null };
  const invalidate = (key) => { if (key) cache[key] = null; else Object.keys(cache).forEach((k) => cache[k] = null); notify(); };

  // ─── Lectures ─────────────────────────────────────────────────────
  async function fetchGroups() {
    if (!supa) return { data: null, error: null };
    if (cache.groups) return { data: cache.groups, error: null };
    const { data, error } = await supa.from("groups")
      .select("id, name, color, description, access, profile_groups(profile_id, profiles(name))");
    if (data) {
      cache.groups = data.map((g) => ({
        ...g,
        members: (g.profile_groups || []).map((pg) => pg.profiles && pg.profiles.name).filter(Boolean),
      }));
    }
    return { data: cache.groups, error };
  }

  // Étale le contenu de la colonne jsonb `data` au niveau supérieur, sans écraser les colonnes existantes
  function flattenClient(c) {
    if (!c) return c;
    const extras = c.data && typeof c.data === "object" ? c.data : {};
    const out = { ...extras, ...c };
    delete out.data;
    return out;
  }

  async function fetchClients() {
    if (!supa) return { data: null, error: null };
    if (cache.clients) return { data: cache.clients, error: null };
    const { data, error } = await supa.from("clients")
      .select("*, contracts(*)");
    if (data) cache.clients = data.map(flattenClient);
    return { data: cache.clients, error };
  }

  async function fetchClientById(id) {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("clients").select("*, contracts(*), assets(*)").eq("id", id).single();
    return { data: flattenClient(data), error };
  }

  async function fetchTickets({ limit = 50, client_id } = {}) {
    if (!supa) return { data: null, error: null };
    if (!client_id && cache.tickets) return { data: cache.tickets, error: null };
    let q = supa.from("tickets")
      .select(`
        id, client_id, title, description, category, status, priority,
        lifecycle, billable, billable_note,
        assignee_team, escalated_at, escalated_reason, escalated_group,
        sla_due_at, opened_at, updated_at,
        client:clients(id, name, contracts(status, name, end_date)),
        assignee:profiles!tickets_assignee_id_fkey(id, name, team),
        escalated_to_user:profiles!tickets_escalated_to_fkey(id, name),
        comments(count)
      `)
      .order("opened_at", { ascending: false })
      .limit(limit);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (data && !client_id) cache.tickets = data;
    return { data: cache.tickets, error };
  }

  async function fetchTicketById(id) {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("tickets")
      .select(`
        id, title, description, category, status, priority,
        lifecycle, billable, billable_note,
        assignee_id, assignee_team, escalated_at, escalated_reason, escalated_group,
        sla_due_at, opened_at, updated_at, closed_at,
        client:clients(id, name, contracts(status, name, end_date, tier)),
        assignee:profiles!tickets_assignee_id_fkey(id, name, team)
      `)
      .eq("id", id)
      .single();
    return { data, error };
  }

  async function fetchProfiles() {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("profiles")
      .select("id, name, role, team, email")
      .eq("status", "active")
      .order("name");
    return { data, error };
  }

  async function fetchAssetsByClient(clientId) {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("assets")
      .select("*")
      .eq("client_id", clientId)
      .order("type, hostname");
    return { data, error };
  }

  async function fetchCommentsByTicket(ticketId) {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("comments")
      .select("id, ticket_id, author_id, author_name, author_email, body, kind, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    return { data, error };
  }

  async function createComment(payload) {
    if (!supa) return { data: null, error: new Error("Supabase non configuré.") };
    const { data, error } = await supa.from("comments").insert(payload).select().single();
    return { data, error };
  }

  function subscribeCommentsForTicket(ticketId, onChange) {
    if (!supa) return () => {};
    const channel = supa.channel(`comments-${ticketId}`)
      .on("postgres_changes",
          { event: "*", schema: "public", table: "comments", filter: `ticket_id=eq.${ticketId}` },
          () => onChange && onChange())
      .subscribe();
    return () => { try { supa.removeChannel(channel); } catch (e) {} };
  }

  async function fetchTranscriptsByTicket(ticketId) {
    if (!supa) return { data: null, error: null };
    const { data, error } = await supa.from("call_transcripts")
      .select("*, call:calls(caller_name, caller_phone, duration_sec, started_at)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    return { data, error };
  }

  // ─── Mutations ────────────────────────────────────────────────────
  async function createTicket(payload) {
    if (!supa) return { data: null, error: new Error("Supabase non configuré.") };
    const { data, error } = await supa.from("tickets").insert(payload).select().single();
    if (!error) invalidate("tickets");
    return { data, error };
  }

  async function updateTicket(id, patch) {
    if (!supa) return { data: null, error: new Error("Supabase non configuré.") };
    const { data, error } = await supa.from("tickets").update(patch).eq("id", id).select().single();
    if (!error) invalidate("tickets");
    return { data, error };
  }

  async function escalateTicket(id, { toUserId, groupId, reason }) {
    return updateTicket(id, {
      escalated_to: toUserId,
      escalated_group: groupId,
      escalated_reason: reason,
      escalated_at: new Date().toISOString(),
    });
  }

  async function recordCall(payload) {
    if (!supa) return { data: null, error: new Error("Supabase non configuré.") };
    const { data, error } = await supa.from("calls").insert(payload).select().single();
    return { data, error };
  }

  async function saveTranscript(payload) {
    if (!supa) return { data: null, error: new Error("Supabase non configuré.") };
    const { data, error } = await supa.from("call_transcripts").insert(payload).select().single();
    return { data, error };
  }

  // ─── Realtime (subscribe to changes) ──────────────────────────────
  // Couvre tickets/comments (support) ET clients/opportunities/contacts/
  // actions/contracts (CRM) → toute mutation côté serveur déclenche le
  // callback `fn`, qui peut alors recharger les listes affichées.
  function subscribeChanges(fn) {
    listeners.add(fn);
    if (!supa) return () => listeners.delete(fn);

    const channel = supa.channel("hub-data-" + Math.random().toString(36).slice(2, 8))
      // Support
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" },       () => invalidate("tickets"))
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" },      () => invalidate("tickets"))
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" },        () => invalidate("groups"))
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" },       () => invalidate("clients"))
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" },        () => invalidate("assets"))
      // CRM
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, () => notify())
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" },      () => notify())
      .on("postgres_changes", { event: "*", schema: "public", table: "actions" },       () => notify())
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" },     () => notify())
      .subscribe();
    return () => {
      listeners.delete(fn);
      try { supa.removeChannel(channel); } catch (e) {}
    };
  }

  function enabled() { return !!supa; }

  window.HubData = {
    enabled,
    fetchGroups, fetchClients, fetchClientById, fetchTickets, fetchTicketById, fetchProfiles,
    fetchAssetsByClient, fetchTranscriptsByTicket,
    fetchCommentsByTicket, createComment, subscribeCommentsForTicket,
    createTicket, updateTicket, escalateTicket, recordCall, saveTranscript,
    invalidate, subscribeChanges,
  };
})();
