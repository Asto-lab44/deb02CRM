# Sync Sage Gestion Commerciale i7/50c → Hub Astorya

## Architecture

```
┌────────────────────┐    ODBC/MSSQL     ┌──────────────────┐    HTTPS REST    ┌──────────────────┐
│  Sage Gestion Co   │ ────────────────► │  sage-sync.js    │ ───────────────► │  Supabase BDD    │
│  (PC bureautique)  │   lit commandes   │  (Node.js agent  │  POST upsert     │  projects table  │
│                    │                   │   sur ce PC      │                  │  + project_items │
└────────────────────┘                   │   ou un serveur) │                  └──────────────────┘
                                         └──────────────────┘
                                                  │
                                          cron : toutes les 15 min
```

## Tables Sage à lire

Selon ton schéma Sage (variable selon version) :

- **F_DOCENTETE** : entêtes des commandes (numéro, date, client, montant total)
- **F_DOCLIGNE** : lignes produits (désignation, qté, prix unitaire)
- **F_COMPTET** : comptes clients (raison sociale, SIREN)

Champs minimum à mapper :

| Champ Sage | Champ Hub | Type |
|---|---|---|
| `DO_Piece` (n° commande) | `sage_ref` | text (unique) |
| `DO_Date` | `created_at` (référence) | date |
| `CT_Num` → client | `client_id` (lookup) | text |
| `Intitulé` | `name` | text |
| `DO_TotalHT` | `amount_ht` | numeric |
| `DO_TotalTTC` | `amount_ttc` | numeric |
| `DO_DateLivr` | `delivery_due` | date |

## Mise en place de l'agent (Node.js)

### Prérequis sur le serveur Sage

- Node.js 18+
- Driver ODBC pour la version Sage
- Accès lecture seule à la base Sage

### Installation

```bash
mkdir astorya-sage-agent && cd astorya-sage-agent
npm init -y
npm install @supabase/supabase-js odbc dotenv node-cron
```

### Fichier `.env`

```env
SUPABASE_URL=https://cqdgecllzyqimfuovrpp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...  # NE PAS la clé anon, vraie service role
SAGE_DSN=DSN=SageCo50;UID=lecture;PWD=...
SYNC_INTERVAL_CRON=*/15 * * * *  # toutes les 15 min
LAST_SYNC_AT=  # auto-rempli par le script
```

### Fichier `sync.js`

```js
const { createClient } = require("@supabase/supabase-js");
const odbc = require("odbc");
const cron = require("node-cron");
require("dotenv").config();

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncOrders() {
  const conn = await odbc.connect(process.env.SAGE_DSN);
  const since = process.env.LAST_SYNC_AT || "2020-01-01";

  // Récupère les commandes modifiées depuis le dernier sync
  const orders = await conn.query(`
    SELECT
      h.DO_Piece, h.DO_Date, h.Intitulé, h.DO_TotalHT, h.DO_TotalTTC,
      h.DO_DateLivr, h.CT_Num
    FROM F_DOCENTETE h
    WHERE h.cbModification > ?
    ORDER BY h.cbModification
  `, [since]);

  for (const o of orders) {
    // Récupère les lignes
    const lines = await conn.query(`
      SELECT DL_Design, DL_Qte, DL_PrixUnitaire, DL_MontantHT
      FROM F_DOCLIGNE
      WHERE DO_Piece = ?
    `, [o.DO_Piece]);

    // Mapping Hub
    const project = {
      sage_ref: o.DO_Piece,
      name: o.Intitulé || ("Commande " + o.DO_Piece),
      amount_ht: o.DO_TotalHT,
      amount_ttc: o.DO_TotalTTC,
      delivery_due: o.DO_DateLivr,
      data: { sage_ct_num: o.CT_Num, sage_date: o.DO_Date },
    };

    // Upsert via Supabase
    const { data: existing } = await supa.from("projects")
      .select("id").eq("sage_ref", o.DO_Piece).maybeSingle();

    if (existing) {
      await supa.from("projects").update(project).eq("id", existing.id);
    } else {
      const newId = "PRJ-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      await supa.from("projects").insert({ ...project, id: newId, stage: "recu" });
      // Insère les lignes
      const items = lines.map((l) => ({
        project_id: newId,
        designation: l.DL_Design,
        quantity: l.DL_Qte,
        unit_price_ht: l.DL_PrixUnitaire,
        total_ht: l.DL_MontantHT,
      }));
      if (items.length) await supa.from("project_items").insert(items);
    }
  }

  await conn.close();
  process.env.LAST_SYNC_AT = new Date().toISOString();
  console.log(`✓ Sync OK : ${orders.length} commandes`);
}

// Lance toutes les 15 min
cron.schedule(process.env.SYNC_INTERVAL_CRON, syncOrders);
syncOrders(); // run au démarrage
```

### Démarrage

```bash
node sync.js
# ou en service Windows avec node-windows :
# https://github.com/coreybutler/node-windows
```

### Vérification

```bash
# Sur ton Hub, va sur /projets → tu dois voir les commandes
# arrivées dans la colonne "Reçu"
```

## Sécurité

- **Service Role Key** : ne JAMAIS exposer côté navigateur. C'est différent
  de la clé anon publique. Récupère-la dans Supabase Dashboard → Settings
  → API → "service_role secret".
- L'agent tourne sur **ton serveur**, pas chez l'utilisateur. Si compromission,
  tu peux révoquer + regénérer la service_role key sans toucher au front.
- Logs : redirige `node sync.js > sync.log 2>&1` pour audit.

## TODO (phase 2)

- [ ] Sync inverse : changement de stage dans Hub → met à jour Sage (statut commande, livraison)
- [ ] Notifications : alerte si commande Sage absente du Hub > 24h
- [ ] Mapping clients : si CT_Num Sage pas trouvé dans clients Hub, alerter
