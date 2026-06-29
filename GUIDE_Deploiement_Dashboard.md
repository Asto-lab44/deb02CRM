# Déploiement automatique — version 100 % navigateur (sans CLI)

Projet Supabase : **cqdgecllzyqimfuovrpp**
Boîte surveillée : **daviaud13@gmail.com**
Token webhook (déjà généré) : `ipLDKJI9L-6dty4hGEqwvn6424tnInP6`

Tout se fait dans le navigateur — pas besoin d'installer quoi que ce soit.

---

## ÉTAPE 1 — Créer la table (1 min)

1. Ouvre : **https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/sql/new**
2. Colle le contenu de `sql/20260625_inbound_requests.sql` (ou le SQL fourni dans le chat)
3. **Run** → « Success. No rows returned »

---

## ÉTAPE 2 — Créer l'Edge Function dans le navigateur (5 min)

> Supabase permet de créer une fonction **directement dans le dashboard**, sans CLI.

1. Ouvre : **https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/functions**
2. Clique **Create a new function** (ou « Deploy a new function » → « Via Editor »)
3. Nom de la fonction : **`inbound-mail`** (exactement ce nom)
4. Dans l'éditeur de code web, **efface le contenu par défaut** et colle l'intégralité du fichier
   **`supabase/functions/inbound-mail/index.ts`** (présent dans le repo)
5. Clique **Deploy**

### 2 bis — Définir les secrets

1. Ouvre : **https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/settings/functions**
   (ou Edge Functions → onglet **Secrets** / **Manage secrets**)
2. Ajoute ces secrets :

| Nom | Valeur |
|---|---|
| `INBOUND_WEBHOOK_TOKEN` | `ipLDKJI9L-6dty4hGEqwvn6424tnInP6` |
| `ANTHROPIC_API_KEY` | *(ta clé `sk-ant-...` — optionnel, voir note)* |
| `TEAMS_WEBHOOK_URL` | *(optionnel, pour notif Teams)* |

> **Note IA** : sans `ANTHROPIC_API_KEY`, tout fonctionne quand même — le résumé sera simplement le sujet de l'email (pas d'extraction intelligente). Tu peux l'ajouter plus tard.

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont **injectés automatiquement** par Supabase dans les Edge Functions — tu n'as PAS à les ajouter.

### 2 ter — Vérifier l'URL

La fonction est accessible à :
```
https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/inbound-mail
```
(C'est déjà l'URL pré-remplie dans le script Gmail.)

---

## ÉTAPE 3 — Script sur Gmail (5 min)

1. Connecte-toi sur **https://script.google.com** **avec daviaud13@gmail.com**
2. **Nouveau projet** → renomme « Hub Astorya — Devis »
3. Colle l'intégralité de **`supabase/functions/inbound-mail/gmail-apps-script.gs`**
   → **L'URL et le token sont DÉJÀ pré-remplis**, rien à modifier.
4. **Enregistre** (Ctrl+S)
5. Sélectionne la fonction **`checkInbox`** → **Exécuter** (▶)
6. Autorise l'accès Gmail (Paramètres avancés → Accéder → Autoriser)
7. **⏰ Déclencheurs** → **+ Ajouter un déclencheur** :
   - Fonction : `checkInbox`
   - Source : Déclencheur horaire → **Toutes les 5 minutes**
   - **Enregistrer**

---

## Test final

1. Envoie un email à **daviaud13@gmail.com** :
   ```
   Société : ISOCRATE
   Demande : renouvellement antivirus 12 postes
   ```
2. Dans Apps Script, relance `checkInbox` (▶) — ou attends 5 min
3. Hub → **CRM → 📥 Demandes entrantes** → la demande apparaît avec la tâche « Devis à faire »

---

## Dépannage express

| Erreur (journal Apps Script) | Solution |
|---|---|
| HTTP 401 | Le token ne correspond pas — vérifie `INBOUND_WEBHOOK_TOKEN` dans les secrets Supabase |
| HTTP 404 | La fonction n'est pas déployée ou mauvais nom (doit être `inbound-mail`) |
| HTTP 500 | Table absente → refais l'étape 1 |
| Rien ne remonte | Déclencheur non activé (étape 3.7) |

---

*Token généré spécifiquement pour ce déploiement. Si tu veux le régénérer, change-le dans les secrets Supabase ET dans le script Gmail (les deux doivent être identiques).*
