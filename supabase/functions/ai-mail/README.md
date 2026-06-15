# Edge Function : `ai-mail`

Proxy sécurisé entre le navigateur et l'API Anthropic Claude.

## 🔑 Pourquoi

La clé API Anthropic ne doit **jamais** être exposée côté navigateur. Cette Edge Function reçoit les prompts depuis le client (authentifié via Supabase Auth), appelle Anthropic avec la clé stockée comme **secret Supabase**, et renvoie la réponse.

## 🛠 Déploiement (une seule fois)

### 1. Récupère ta clé API Anthropic

Va sur https://console.anthropic.com/settings/keys → **Create Key** → copie `sk-ant-api03-…`

### 2. Installe la CLI Supabase (si pas déjà fait)

```bash
npm install -g supabase
```

### 3. Login + link au projet

```bash
supabase login
supabase link --project-ref cqdgecllzyqimfuovrpp
```

### 4. Définis le secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXX
```

### 5. Déploie la fonction

```bash
supabase functions deploy ai-mail --no-verify-jwt
```

> `--no-verify-jwt` est requis car on vérifie manuellement le JWT à l'intérieur de la fonction (permet d'avoir un message d'erreur clair côté UI).

### 6. Vérifie

```bash
supabase functions list
# Tu dois voir : ai-mail · DEPLOYED
```

## 🧪 Test

Depuis l'UI Hub Astorya :
- Ouvre n'importe quel devis
- Clique **✉ Envoyer**
- Clique **🤖 Rédiger avec IA**
- Un mail structuré apparaît dans le corps du message

## 📊 Monitoring

Chaque appel est loggé dans `user_events` (type = `ai_mail`) avec le nombre de tokens consommés. Tu peux suivre l'usage dans la page **Temps & Activités** > Journal d'événements.

## 💰 Coûts

Modèle utilisé : `claude-haiku-4-5`
- Input : ~$0.25 / 1M tokens
- Output : ~$1.25 / 1M tokens
- **Coût moyen par mail généré : ~0,003 €** (3 mails = 1 centime)

## 🛡 Sécurité

- ✅ Clé API Anthropic stockée comme secret côté serveur
- ✅ Authentification utilisateur requise (JWT Supabase Auth vérifié)
- ✅ CORS configuré pour `*` (à restreindre à `https://deb02-crm.vercel.app` en prod stricte)
- ✅ Audit log dans `user_events`
