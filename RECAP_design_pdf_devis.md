# Matrice de design — PDF devis (modèle Sage 50)

Spécification de la mise en page des pièces commerciales (générées avec
**pdfmake**). Le devis sert de référence ; les variantes par type sont en fin.
Réutilisable pour reproduire le même rendu ailleurs.

---

## 0. Réglages page & typographie
- **Format** : A4 portrait. **Marges** : 28 pt (gauche/droite/haut) ;
  bas = 30 pt (devis, signature dans le corps) sinon ~64 pt.
- **Police** : Roboto (embarquée pdfmake). **Corps** : 9 pt, couleur `#0f172a`.
- **Montants** : `toLocaleString("fr-FR", {min/max 2 décimales})` avec
  normalisation de l'espace fine (U+202F/U+00A0 → espace normal).

## 1. Palette
| Usage | Couleur |
|---|---|
| Texte principal | `#0f172a` |
| Texte secondaire / labels | `#475569` · `#64748b` · `#94a3b8` |
| **Accent titre / filet rouge** | `#c91c45` |
| Références / mono / sous-totaux | `#3730a3` (fond `#eef2ff`) |
| Filets fins | `#cbd5e1` · `#f1f5f9` |
| Bandeau NET À PAYER | fond `#0f172a`, texte blanc |
| Reste à payer | `#ea580c` · Soldé `#065f46` · Réglé `#047857` |
| Avoir / négatif | `#dc2626` |

## 2. Bandeau d'en-tête
- Table 2 colonnes `["*", 220]`, **filet bas 2,4 pt** couleur `#c91c45`
  (uniquement la ligne inférieure), sans bordures verticales.
- **Gauche** : logo SVG Astorya, `fit [340, 80]`, marge `[4,6,0,6]`.
- **Droite** : libellé du type (**DEVIS**, COMMANDE, …) en `#c91c45`,
  **22 pt gras**, aligné à droite (réduit à **18 pt** + `noWrap` si libellé long
  type « BON DE LIVRAISON »/« FACTURE D'ACOMPTE »).

## 3. Bloc « parties » (émetteur / destinataire)
Table 2 colonnes, marge `[0,8,0,14]` :
- **Émetteur (gauche, largeur `*`)** : raison sociale **10 pt gras** ; adresse
  8,5 ; CP + ville 8,5 ; email 8,5 ; puis **Tel · Site** et **SIRET · Capital**
  en 8,5 `#475569` (collés sous l'adresse).
- **Client (droite, largeur ~220–230, marge gauche 40)** : nom **10 pt gras** ;
  adresse 8,5 ; CP ville 8,5 ; SIREN 8 `#666` ; TVA 8 `#666`.
- **Filet fin** horizontal `#cbd5e1` 0,4 pt sous les coordonnées.

## 4. Ligne méta (3 colonnes)
- Gauche : **« Date : JJ/MM/AAAA »** 10 pt gras.
- Centre : **« <Type> N° <ID> »** 11 pt gras, centré.
- Droite : **« Validité : … »** (devis) / **« Échéance : … »** (facture,
  « À la livraison » si vide) 10 pt gras.

## 5. Tableau des lignes
- En-tête (`tableHeader` 9 pt gras `#0f172a`), fond d'en-tête gris clair.
- **Colonnes (avec réf. article)** : `N°(25) · Article(60) · Désignation(*) ·
  Qté(40) · P.U. HT(65) · Montant HT(65)`. Sans réf. : la colonne Article
  disparaît (la réf. passe en tête de désignation).
- Désignation : libellé **gras** + description (HTML → inlines, gras/ital/
  souligné/couleur), réf. en mono `#3730a3` 8 pt.
- **Regroupement** : lignes **Abonnements** (récurrent) puis **Prestations
  ponctuelles**, chacune suivie d'un **sous-total HT** compact, aligné à droite,
  `#3730a3` sur fond `#eef2ff` (pas de bandeau de groupe). Lignes purement
  texte : italique `#666`, en fin de tableau.

## 6. Récapitulatif TVA + Totaux (2 colonnes)
- **Récap TVA (gauche)** — table 5 colonnes `[32,58,46,58,58]` :
  `Code(T20/T5,5…) · Base HT · Taux TVA · Montant TVA · Montant TTC`.
- **Totaux (droite)** — table `["*", 72]` :
  Total HT, Total TVA, Total TTC, puis (factures) lignes **Avoir(s) émis**
  (`#dc2626`) / **Déjà réglé** (`#047857`), et enfin le bandeau :
  - **NET A PAYER** (fond `#0f172a`, blanc) — devis/commande ;
  - **RESTE A PAYER** (`#ea580c`) ou **SOLDÉ** (`#065f46`) — facture ;
  police 9,5 pt gras, cellules compactes (marge verticale 2).

## 7. Note logistique (devis)
Texte italique 9 pt `#475569`, justifié, **juste au-dessus** du bloc signature.

## 8. Bloc signature (devis & commande)
2 colonnes, **insécable** (mini-table `dontBreakRows: true`, jamais coupé entre
2 pages ; ne PAS utiliser `unbreakable`) :
- **Gauche** : « <Type> suivi par : <owner> » 10 gras ; « Nos coordonnées
  bancaires » 9 gras ; IBAN / BIC 8,5.
- **Droite** : mention **« Règlement à la commande d'un acompte de 40 % »**
  10 gras ; **cadre bordé noir 0,7 pt** avec « Bon pour accord : » (haut) +
  espace + « Le : » (bas).

## 9. Pied de page
- **Contacts retirés** du pied de page.
- **Réserve de propriété** : 6,5 pt italique `#555` (masquée sur devis, couverte
  par le verso CGV).
- **Pagination** : « Page X / Y » 7,5 pt `#888`, alignée à droite.

## 10. Verso CGV (devis uniquement)
`pageBreak: "before"` ; mise en page 2 colonnes justifiées, articles en
`Article N — Titre` (8,5 gras) + corps 7 pt justifié, dimensionnés pour remplir
une page A4.

---

## 11. Variantes par type de pièce
- **Commande** : identique au devis (mention acompte + « Bon pour accord »),
  signature dans le corps.
- **Bon de livraison** : colonnes `N° · Article · Désignation · **Qté
  commandée** · **Qté livrée (vierge)** ` ; **aucun montant** (ni P.U., ni
  totaux, ni sous-totaux) ; bloc bas = « Livraison effectuée par le technicien :
  » (vierge) + **cadre de signature client** (Nom / Date / Signature).
- **Facture & facture d'acompte** : bas de page **modèle Sage** — « TVA payée
  sur les débits », coordonnées bancaires, **mention pénalités de retard**
  (loi 2008-776 + indemnité 40 €), **mention recouvrement** (cabinet + SIREN),
  et **coupon de règlement détachable** (✂) : à l'ordre de la société, Code
  client, N° facture, **Montant dû**, Échéance, Mode de paiement. Facture
  d'acompte = même visuel qu'une facture + mention « déduite de la facture
  définitive ».
- **Avoir** : mêmes mentions (TVA débits, banque, pénalités) **sans coupon** ;
  montants en négatif ; mention « Avoir émis en référence à la facture … ».

## 12. Robustesse pdfmake (rappels)
- Blocs de bas de page **insécables** via `dontBreakRows: true` (pas
  `unbreakable`, qui plante sur des `columns` en fin de document).
- Aperçu via `pdfmake.open()` (ne pas naviguer un onglet vide vers un blob) ;
  précharger pdfmake ; paralléliser la résolution des données.
- Décoder les entités HTML (`&nbsp;`…) dans les désignations.
