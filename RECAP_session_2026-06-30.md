# Récapitulatif de session — 2026-06-30

Synthèse des travaux réalisés sur le Hub Astorya lors de cette session
(33 commits, poussés sur `main` et `claude/sharp-edison-P3k0r`).
Destiné à la relecture (interne / tiers).

---

## 1. Nouveau module : Trésorerie ✅
- **Vue Trésorerie / encaissements** (`components/TresorerieEncaissements.jsx`,
  `tresorerie.html`) : règlements reçus, acomptes encaissés, avoirs émis,
  restes à recouvrer, par mois/client. `8d24963`

## 2. Nouveau module : Comptabilité + FEC ✅ (chantier majeur)
Cycle comptable complet, en partie double, résilient localStorage.
- **Base** : `sql/20260630_accounting.sql` (plan comptable PCG simplifié,
  journaux VE/AC/BQ/CA/OD, écritures avec lignes en `data` jsonb, RLS).
- **Logique** (`api.js` §Comptabilité) + **UI** (`components/Comptabilite.jsx`,
  onglets Balance / Écritures / Grand livre / TVA / Plan comptable).
- Génération auto des écritures depuis les pièces : **Ventes** (facture/avoir
  → VE), **Règlements** (→ BQ), **Achats** (commande fournisseur → AC). `5c1a19d` `58febc5`
- **TVA ventilée par taux** (445710/4457155/4457110) + **lettrage auto 411**
  (facture ↔ règlement) + **validation/clôture** (ValidDate FEC). `2bf4fb5`
- **Déclaration de TVA** (collectée − déductible = à décaisser) + écriture de
  TVA (OD → 44551/44567). `a821862`
- **Lettrage manuel** (Grand livre) + **clôture d'exercice** avec à-nouveaux
  (report bilan 1–5 + résultat en 120/129). `df7ffc2`
- **Export FEC** (Fichier des Écritures Comptables, 18 colonnes DGFiP).
> ⚠️ Socle solide mais **simplifié** — à faire valider par un expert-comptable.

## 3. Sécurité & durcissement 🔒
- **RLS** : `USING(true)` → `auth.uid() IS NOT NULL` sur leasing/garanties
  (+ `sql/20260630_security_hardening.sql`). `5daa9e5`
- **Edge Function `inbound-mail`** : refus si `WEBHOOK_TOKEN` absent, validation
  & bornage des entrées. `5daa9e5` `95a41dd`
- **Gardes d'auth** sur toutes les pages + **anti-flash** (`auth-guard.js` :
  masque le contenu jusqu'à confirmation de session). `5daa9e5` `95a41dd`
- **XSS** : liens de notification assainis (`javascript:` bloqué). `95a41dd`
- **Mode dégradé** localStorage rendu visible (toast). `95a41dd`

## 4. Fiabilité du module commercial (Sage 50) 💶
- **Acompte** : déduction **idempotente** (plus de double déduction) `d8c3fac`
  et **TVA ventilée par taux**. `e72d4bb`
- **Cardinalité stricte 1:1** devis → commande → BL → facture (transform
  renvoie l'enfant existant). `e71f68c`
- **BL** : persistance de la livraison d'article (`delivered_qty`, colonne
  optionnelle + repli) `701f7f7`.

## 5. Refonte des PDF commerciaux (modèle Sage) 🧾
- **Adresse client** fiabilisée (fix champ + hydratation depuis la fiche). `03e9126`
- **Bas de page par type** : devis/commande → « Bon pour accord » ; facture &
  facture d'acompte → mentions Sage (**TVA sur les débits**, pénalités de
  retard, **recouvrement AGIR RECOUVREMENT SIREN 389 792 052**, **coupon de
  règlement** détachable) ; avoir → mentions sans coupon. `099f430` `6de2229`
- **BL** : « Qté commandée » + « Qté livrée » (vierge), colonne N° de série
  retirée, titre sur une ligne, aucun montant, **case de signature encadrée**,
  « Livraison effectuée par le technicien » (champ vierge). `5b4e99a` `7ccdd3e` `8cea2bd`
- **Devis** : note logistique juste au-dessus de « Devis suivi par ». `eed5a75`
- **Mise en page** : coordonnées Astorya remontées `afd87cc`, case SOLDÉ
  réduite + contacts retirés `9d6c191`, échéance « À la livraison ».
- **Robustesse rendu** : blocs bas de page **insécables** (`dontBreakRows`,
  fini les coupures entre pages et les plantages pdfmake) `36fb82d` `fa63d89`,
  correction de la **page blanche** à l'aperçu `efdef29`, aperçu **1 clic** +
  génération parallélisée `cd53719`.
- **Facture d'acompte** : visuel identique à une facture.

## 6. Ergonomie
- **Aperçu au survol** (liste des pièces) qui se **ferme** en quittant la
  ligne. `6751098`

## 7. Qualité, portabilité & documentation 📚
- **Schéma cœur reconstruit** `sql/SCHEMA_COMPLET.sql` (tables non versionnées :
  clients, contacts, opportunities, actions, contracts, tickets, profiles…). `66f78c1`
- **`README.md`** racine (porte d'entrée relecteur) `d2534f5`,
  **`FONCTIONNEMENT.md`** (+ PDF) `43dd445` `74d5da1`,
  **`DEPLOIEMENT.md`** (runbook portabilité) `dc372f8`.
- **Centralisation** `fmtEUR`/`fmtDate`/statuts dans `constants.js` `2a03961`,
  **code mort retiré**, `.gitignore` enrichi, `DEVELOPMENT.md` archivé. `d2534f5` `59a901c`

---

## Actions requises côté exploitant (Supabase / hébergement)
1. **Exécuter les migrations SQL** (idempotentes) dans l'ordre — voir
   `DEPLOIEMENT.md` — notamment : `SCHEMA_COMPLET.sql`,
   `20260630_security_hardening.sql`, `20260630_project_items_delivered_qty.sql`,
   `20260630_accounting.sql`, `20260629_facture_acompte.sql`.
2. **Redéployer l'Edge Function** `inbound-mail` (durcissement) + vérifier
   `INBOUND_WEBHOOK_TOKEN`.
3. **Faire valider** le paramétrage comptable + le FEC par l'expert-comptable.
4. Vider le cache navigateur (**Ctrl+Shift+R**) après déploiement.

## Reste à faire (roadmap)
Modules 🚧 Facturation avancée / Marketing / Rapports-BI / RH ; **tests
automatisés** (api.js, PDF) ; ventilation 706/707 ; export du schéma réel
Supabase versionné ; automatisation build + cache-buster.
