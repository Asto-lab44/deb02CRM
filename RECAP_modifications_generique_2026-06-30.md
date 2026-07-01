# Récapitulatif générique des modifications — à réappliquer sur un autre projet

> Document **réutilisable** (indépendant du dépôt, du serveur et de
> l'hébergement). Il décrit **fonctionnellement et techniquement** les
> évolutions à reproduire sur un CRM/ERP de même architecture
> (**React 18 en UMD + composants JSX compilés + Supabase**). Aucune référence
> à un dépôt, une branche, une URL ou un numéro de version de cache précis.

## Conventions du projet cible (rappel)
- Front statique : pages HTML chargeant des composants React **UMD** ; les
  `.jsx` sont compilés vers `dist/` (Babel) ; le `dist/` est servi tel quel.
- Couche d'accès données unique : un objet global `window.api` (fichier
  `api.js`) — toute lecture/écriture y passe.
- Persistance **résiliente** : si Supabase échoue, repli `localStorage`
  (+ éventuel toast « mode dégradé »).
- Pattern **colonnes réservées + `data` jsonb** : champs variables stockés dans
  une colonne `data` jsonb pour éviter une migration par champ.
- **Cache-buster** `?v=…` sur chaque script, incrémenté à chaque livraison.
- Migrations SQL **idempotentes** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

---

## 1. Module « Trésorerie / encaissements »
Vue consolidée alimentée par les pièces commerciales :
- Agréger tous les règlements (`data.payments`) des factures + factures
  d'acompte, les avoirs émis, et les restes à recouvrer (TTC − réglé − avoirs).
- Filtre par mois (navigateur ‹ ›), KPIs (encaissé, dont acomptes, avoirs,
  reste à recouvrer), tableaux encaissements / avoirs / restes à recouvrer.

## 2. Module « Comptabilité » (partie double) + export FEC
Nouvelles tables : `accounting_accounts` (plan comptable PCG simplifié),
`accounting_journals` (VE/AC/BQ/CA/OD), `accounting_entries` (écritures
équilibrées ; lignes dans `data.lines`). RLS « utilisateur authentifié ».
API `accounting` : `accounts/journals/entries` (CRUD résilient),
`generateFromSales` (idempotent), `balance`, `ledger`, `validate`,
`vatReport`, `generateVatEntry`, `generateOpeningEntry`, `exportFEC`.
Génération automatique des écritures depuis les pièces :
- **Facture** → journal VE : débit 411 (TTC) / crédit 706 (HT) + TVA collectée
  **ventilée par taux** (445710 20 %, 4457155 5,5 %, 4457110 10 % ; repli 44571).
- **Avoir** → VE inverse. **Règlement** → BQ : débit 512 / crédit 411.
- **Achat** (commande fournisseur) → AC : débit 607 + 44566 / crédit 401 (tiers FRN).
- **Lettrage** : automatique facture↔règlement (compte 411) + **lettrage manuel**
  (sélection de lignes dans le grand livre, code alphabétique A, B, …).
- **TVA** : rapport (collectée − déductible = à décaisser) + écriture OD vers
  44551 / 44567.
- **Clôture d'exercice** : écriture d'à-nouveaux au 01/01/N+1 (report bilan
  classes 1–5 + résultat en 120/129).
- **Grand livre**, **Balance**, **validation/clôture** (date de validation).
- **Export FEC** : Fichier des Écritures Comptables, 18 colonnes DGFiP,
  séparateur tabulation, décimales à la virgule, BOM UTF-8.
UI à onglets : Balance / Écritures / Grand livre / TVA / Plan comptable +
boutons Générer / Valider / Clôture / Export FEC.
> À faire valider par un expert-comptable ; ventilation 706/707 non gérée.

## 3. Module « Contrats & abonnements » (facturation récurrente + SEPA)
Contrats récurrents par client (stockés sur la table `contracts`, champs
récurrents en `data` jsonb : type, périodicité, mode de règlement, IBAN/BIC/RUM,
options[], prochaine échéance). API `subscriptions` :
- `list/save/remove/due`,
- `generateInvoices` : **une facture d'abonnement par client** agrégeant ses
  contrats dus, créée via la couche factures existante (→ PDF + comptabilité),
  puis avance la prochaine échéance selon la périodicité,
- `sepaExport` (CSV) et **`sepaXml`** (prélèvement **pain.008.001.02** :
  créancier ICS + IBAN/BIC, mandats RUM, montants TTC),
- `importRows` : import en masse (rapprochement client par nom).
UI : liste par client (dernière/prochaine échéance, type, mode, montant),
KPIs, filtre périodicité (Tous/Mensuels/Annuels), création/édition avec
**options activables par période** (+/−), aperçu de facture, import CSV
(+ modèle), génération des factures, export SEPA (CSV + XML).
> Renseigner l'**ICS créancier** + IBAN/BIC société (réglages) ; chaque contrat
> prélevé doit avoir IBAN + RUM.

## 4. Sécurité & durcissement
- RLS : remplacer les policies `USING (true)` par
  `USING (auth.uid() IS NOT NULL)` (migration idempotente dédiée).
- Edge Function de réception (webhook) : **refuser** si le jeton n'est pas
  configuré (ne pas court-circuiter quand la variable d'env est vide) +
  bornage/validation des entrées (taille du corps, JSON, format expéditeur).
- **Garde d'authentification anti-flash** : un script commun (ex. `auth-guard.js`)
  masque `#root` jusqu'à confirmation de session (redirection /login sinon),
  inclus sur toutes les pages sauf la page de login ; filet de sécurité qui
  révèle après quelques secondes.
- **XSS** : assainir les URLs de liens de notification (n'autoriser que `/…`
  ou `http(s)://`, bloquer `javascript:`).
- Rendre visible le **mode dégradé localStorage** (toast).

## 5. Fiabilité du module commercial (modèle Sage 50)
- **Acompte** : déduction **idempotente** lors de la transformation en facture
  (mémoriser les acomptes déjà déduits) ; **ventilation TVA par taux**.
- **Cardinalité stricte 1:1** : `transform(parent, type)` renvoie l'enfant
  existant (non annulé/refusé) au lieu d'en créer un doublon (devis→commande→
  BL→facture).
- **Bon de livraison** : persister la quantité livrée sur l'article projet
  (colonne optionnelle + repli si absente).

## 6. Refonte des PDF commerciaux (modèle Sage)
- **Adresse client** : fiabiliser (bons noms de champs `adresse`/`code_postal`)
  + **hydratation** depuis la fiche client au moment du rendu si absente.
- **Bas de page par type** :
  - Devis & Commande : mention acompte + cadre **« Bon pour accord »**.
  - Facture & facture d'acompte : mentions Sage — **« TVA payée sur les débits »**,
    coordonnées bancaires, **pénalités de retard** (loi 2008-776 + indemnité
    40 €), mention **recouvrement** (cabinet + SIREN), **coupon de règlement
    détachable** (code client / n° facture / montant dû / échéance / mode).
  - Avoir : mêmes mentions **sans** coupon.
- **Bon de livraison** : colonnes **« Qté commandée » + « Qté livrée » (vierge)**,
  **pas de colonne N° de série**, **aucun montant** (supprimer les sous-totaux
  chiffrés), **case de signature encadrée**, « Livraison effectuée par le
  technicien » (champ vierge, pas le commercial), titre sur **une seule ligne**
  (police réduite si long + `noWrap`).
- **Devis** : note logistique juste au-dessus de « suivi par ».
- **Facture** : échéance « À la livraison » quand aucune date.
- **Mise en page** : coordonnées émetteur remontées sous l'adresse ; case
  SOLDÉ/NET réduite ; bloc contacts retiré du pied de page.
- **Robustesse du rendu (pdfmake)** :
  - Blocs de bas de page **insécables** via une mini-table `dontBreakRows: true`
    (⚠️ **ne PAS** utiliser `unbreakable: true` sur des `columns` en fin de
    document : plantage silencieux + page blanche).
  - **Aperçu** : garder `pdfmake .open()` (ne pas naviguer un onglet vide vers
    un blob URL → page blanche) ; **précharger** pdfmake au montage et
    **paralléliser** les appels réseau de résolution pour l'accélérer.
- **Décodage des entités HTML** (`&nbsp;`…) dans les désignations.

## 7. Ergonomie
- Aperçu au survol d'une liste (panneau latéral) qui **se ferme** en quittant la
  ligne (masquage différé, annulé si l'on survole le panneau).

## 8. Contrôle d'accès aux modules (important pour toute nouvelle tuile)
Pour toute **nouvelle tuile** d'accueil, ajouter sa **clé** :
1. à la liste `ALL_KEYS` du gestionnaire d'accès,
2. à l'auto-grant des groupes existants (nouvelle clé accordée aux groupes à
   accès large),
3. aux groupes concernés + au groupe fallback,
4. à la **liste des toggles admin** (écran « Accès aux modules ERP »).
Sinon la tuile est filtrée et **invisible**.
> Rendu des tuiles : rendre le bloc `stats` **facultatif** (`(m.stats || [])`)
> pour éviter un crash `Cannot read properties of undefined (reading 'map')`
> sur une tuile sans stats.

## 9. Portabilité & qualité (transverse)
- **Schéma cœur** : versionner un `SCHEMA_COMPLET.sql` reconstruisant les tables
  non versionnées (clients, contacts, opportunities, actions, contracts,
  contract_templates, delivery_notes/_items, notifications, comments, tickets,
  calls, call_transcripts, app_settings, profiles, groups, profile_groups) —
  FK inter-migrations « soft », RLS authentifiée par défaut. La **source de
  vérité** reste l'export réel de la base.
- Docs : README racine (porte d'entrée), document « fonctionnement »,
  runbook de déploiement/portabilité.
- Centraliser les helpers (`fmtEUR`, `fmtDate`, libellés de statut) ; retirer le
  code mort ; enrichir `.gitignore` (ne **jamais** ignorer `dist/`).

---

## Actions d'exploitation (côté serveur, non incluses dans le front)
1. Exécuter toutes les **migrations SQL** (schéma cœur + comptabilité +
   durcissement RLS + colonnes optionnelles).
2. Redéployer l'**Edge Function** de réception d'emails + vérifier son jeton.
3. Renseigner **ICS + IBAN/BIC** créancier pour le SEPA.
4. Faire **valider le paramétrage comptable + le FEC** par l'expert-comptable.
5. Après déploiement, **incrémenter le cache-buster** et vider le cache
   navigateur.
