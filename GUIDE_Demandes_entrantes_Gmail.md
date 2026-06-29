# Guide de déploiement — Demandes de devis entrantes par email

**Objectif** : chaque email reçu sur **daviaud13@gmail.com** crée automatiquement une tâche « 📋 Devis à faire » dans le Hub, avec le client identifié et le besoin extrait par IA.

**Durée estimée** : ~30 minutes
**Prérequis** : accès admin à Supabase (projet Hub) + accès au compte Google daviaud13@gmail.com

---

## Vue d'ensemble

```
Email → daviaud13@gmail.com
   ↓  (Google Apps Script, vérifie toutes les 5 min)
Edge Function Supabase "inbound-mail"
   ↓  matche le client + extrait le besoin (IA)
Tâche "Devis à faire" + entrée "Demandes entrantes" dans le Hub
```

Il y a **3 grandes étapes** :
1. Créer la table dans Supabase (SQL)
2. Déployer l'Edge Function `inbound-mail` (+ secrets)
3. Installer le script sur le compte Gmail

---

# ÉTAPE 1 — Créer la table dans Supabase

1. Va sur **https://supabase.com/dashboard** → sélectionne ton projet Hub
2. Menu de gauche → **SQL Editor**
3. Clique **+ New query**
4. Copie-colle l'intégralité du fichier **`sql/20260625_inbound_requests.sql`** (présent dans le repo)
5. Clique **Run** (ou Ctrl+Entrée)
6. Tu dois voir « Success. No rows returned »

✅ La table `inbound_requests` est créée.

> 💡 Tant que cette étape n'est pas faite, le Hub fonctionne quand même en mode local (saisie manuelle), mais les demandes ne sont pas partagées entre utilisateurs.

---

# ÉTAPE 2 — Déployer l'Edge Function

### 2.1 — Installer la CLI Supabase (une fois)

Sur ton ordinateur (terminal) :
```bash
npm install -g supabase
supabase login
```
(Une fenêtre navigateur s'ouvre pour t'authentifier.)

### 2.2 — Lier le projet

Dans le dossier du repo Hub :
```bash
supabase link --project-ref <TON_PROJECT_REF>
```
> Le `PROJECT_REF` se trouve dans **Supabase → Project Settings → General → Reference ID** (ex: `abcdefghijklmnop`).

### 2.3 — Définir les secrets

```bash
# Token secret que TU choisis (sera réutilisé dans le script Gmail)
supabase secrets set INBOUND_WEBHOOK_TOKEN="choisis-un-mot-de-passe-long-et-aleatoire"

# Clé API Anthropic pour l'extraction IA (optionnelle mais recommandée)
# À créer sur https://console.anthropic.com → API Keys
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."

# (Optionnel) Webhook Teams pour recevoir les notifications
supabase secrets set TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
```

> ⚠️ Note bien ton `INBOUND_WEBHOOK_TOKEN` quelque part — tu en auras besoin à l'étape 3.

### 2.4 — Déployer la fonction

```bash
supabase functions deploy inbound-mail --no-verify-jwt
```
> `--no-verify-jwt` car l'appel vient de Google (pas d'un utilisateur connecté). La sécurité est assurée par le `INBOUND_WEBHOOK_TOKEN`.

### 2.5 — Récupérer l'URL de la fonction

Elle a la forme :
```
https://<TON_PROJECT_REF>.supabase.co/functions/v1/inbound-mail
```
> Visible aussi dans **Supabase → Edge Functions → inbound-mail**.

✅ L'Edge Function est en ligne.

---

# ÉTAPE 3 — Installer le script sur Gmail

### 3.1 — Ouvrir Apps Script

1. Connecte-toi sur **https://script.google.com** **avec le compte daviaud13@gmail.com** (important : pas un autre compte !)
2. Clique **Nouveau projet**
3. Renomme le projet « Hub Astorya — Demandes de devis »

### 3.2 — Coller le script

1. Efface le contenu par défaut (`function myFunction() {}`)
2. Copie-colle l'intégralité du fichier **`supabase/functions/inbound-mail/gmail-apps-script.gs`**
3. En haut du script, renseigne **2 valeurs** :
   ```javascript
   var WEBHOOK_URL   = "https://<TON_PROJECT_REF>.supabase.co/functions/v1/inbound-mail";
   var WEBHOOK_TOKEN = "le-même-token-que-l-étape-2.3";
   ```
4. **Enregistre** (icône disquette ou Ctrl+S)

### 3.3 — Premier test manuel

1. Dans la barre d'outils, sélectionne la fonction **`checkInbox`**
2. Clique **Exécuter** (▶)
3. Google demande une autorisation → **Examiner les autorisations** → choisis le compte daviaud13@gmail.com → **Autoriser**
   - ⚠️ Google affichera « Cette application n'est pas validée » : clique **Paramètres avancés → Accéder à Hub Astorya (non sécurisé)**. C'est normal pour un script perso.
4. Regarde le journal d'exécution (en bas) : tu dois voir « ✓ Transmis : … » pour chaque email non lu.

### 3.4 — Activer le déclencheur automatique (toutes les 5 min)

1. Dans le menu de gauche d'Apps Script, clique l'icône **⏰ Déclencheurs**
2. **+ Ajouter un déclencheur** (en bas à droite)
3. Configure :
   - Fonction à exécuter : **checkInbox**
   - Déploiement : **Head**
   - Source de l'événement : **Déclencheur horaire**
   - Type : **Minuteur en minutes** → **Toutes les 5 minutes**
4. **Enregistrer**

✅ À partir de maintenant, chaque email reçu sur daviaud13@gmail.com est traité dans les 5 minutes.

---

# Vérification de bout en bout

1. Envoie un email de test à **daviaud13@gmail.com** avec dans le corps :
   ```
   Société : ISOCRATE
   Demande : renouvellement antivirus
   Modèle poste : HP ProBook 450 G3
   ```
2. Attends 5 minutes (ou relance `checkInbox` à la main dans Apps Script)
3. Ouvre le Hub → **CRM → 📥 Demandes entrantes**
4. Tu dois voir la demande avec :
   - Client « ISOCRATE » identifié (si présent en base)
   - Résumé IA
   - Bouton « 📄 Créer le devis »
5. La tâche « 📋 Devis à faire — ISOCRATE » apparaît aussi dans **Actions à mener**

---

# Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Rien n'apparaît après 5 min | Déclencheur non activé | Vérifie l'étape 3.4 |
| Journal : « HTTP 401 » | Token incorrect | Le `WEBHOOK_TOKEN` du script ≠ celui de Supabase |
| Journal : « HTTP 404 » | URL fonction erronée | Vérifie le PROJECT_REF dans l'URL |
| Demande créée mais client = « à identifier » | Société absente du corps ou pas en base | Le commercial rattache manuellement (1 clic) |
| Résumé IA = juste le sujet | `ANTHROPIC_API_KEY` non définie | Ajoute le secret (étape 2.3) puis redéploie |
| Emails retraités en boucle | Libellé « TraitéHub » non posé | Vérifie que checkInbox réussit (marque lu + libellé) |

---

# Sécurité & confidentialité

- Le `INBOUND_WEBHOOK_TOKEN` empêche n'importe qui d'injecter de fausses demandes.
- Le script ne lit que les emails **non lus** de la boîte de réception, et les marque traités (libellé « TraitéHub ») pour ne jamais les renvoyer.
- Aucun mot de passe Gmail n'est stocké : Apps Script tourne **dans** le compte Google, avec son autorisation native.
- L'extraction IA (Anthropic) ne réutilise pas les données pour l'entraînement (DPA en place).

---

# Évolutions possibles (sur demande)

- Filtrer pour ne traiter que les emails avec « devis » dans le sujet
- Créer automatiquement une fiche prospect si le client est inconnu
- Joindre les pièces jointes de l'email au devis
- Notifier un commercial précis selon le client (round-robin ou secteur)

---

*Document généré pour ASTORYA SGI — Hub Astorya. Pour toute question : contact@astorya.fr*
