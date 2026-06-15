// ════════════════════════════════════════════════════════════════════
// Edge Function : ai-mail
// Proxy sécurisé vers l'API Anthropic Claude.
// ════════════════════════════════════════════════════════════════════
//
// Pourquoi : éviter d'exposer la clé API Anthropic côté navigateur.
// La clé est stockée comme secret Supabase (ANTHROPIC_API_KEY) et
// injectée uniquement côté Edge.
//
// Authentification : appel autorisé uniquement pour les utilisateurs
// authentifiés Supabase Auth (via JWT dans Authorization header).
//
// Modèle par défaut : claude-haiku-4-5 (rapide, ~0,003 € / requête).
//
// DÉPLOIEMENT :
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
//   supabase functions deploy ai-mail --no-verify-jwt
// (le --no-verify-jwt est requis car on vérifie le JWT manuellement)
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

// @ts-ignore — Deno runtime
const Deno = (globalThis as any).Deno;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-haiku-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // ─── CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // ─── 1. Vérification authentification utilisateur
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Authorization header manquant" }, 401);
    }

    const supaUrl = Deno.env.get("SUPABASE_URL");
    const supaAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supaUrl || !supaAnon) {
      return json({ error: "Edge config incomplète" }, 500);
    }

    const supa = createClient(supaUrl, supaAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supa.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Utilisateur non authentifié" }, 401);
    }

    // ─── 2. Récupération de la clé Anthropic depuis les secrets
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "Clé API Anthropic non configurée côté serveur" }, 500);
    }

    // ─── 3. Lecture du body de la requête
    const body = await req.json();
    const {
      system,
      user,
      max_tokens = 1500,
      temperature = 0.7,
      model = DEFAULT_MODEL,
    } = body;

    if (!user) {
      return json({ error: "Champ 'user' obligatoire" }, 400);
    }

    // ─── 4. Appel Anthropic
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const anthropicData = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return json(
        { error: "Anthropic: " + (anthropicData?.error?.message || anthropicRes.statusText) },
        anthropicRes.status,
      );
    }

    // ─── 5. Extraction du texte
    const content = anthropicData.content || [];
    const text = content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    // ─── 6. Log dans la table user_events pour audit (best-effort)
    try {
      await supa.from("user_events").insert({
        id: "EVT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        user_id: userData.user.id,
        user_name: userData.user.email,
        user_email: userData.user.email,
        type: "ai_mail",
        severity: "info",
        path: "/ai-mail",
        message: "Génération IA " + (anthropicData.usage?.output_tokens || 0) + " tokens",
        payload: {
          model: anthropicData.model,
          input_tokens: anthropicData.usage?.input_tokens,
          output_tokens: anthropicData.usage?.output_tokens,
        },
      });
    } catch (e) {
      // Table user_events optionnelle, ne bloque pas la réponse
    }

    return json({
      text,
      model: anthropicData.model,
      usage: anthropicData.usage,
    });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
