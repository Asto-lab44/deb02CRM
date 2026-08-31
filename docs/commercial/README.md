# Catalogue commercial — Hub Astorya

Supports commerciaux du Hub Astorya : catalogue complet des modules et fonctions,
argumentaire « votre logiciel, pas un abonnement » (propriété vs SaaS), bloc
Sécurité & Conformité (défense en profondeur, ANSSI, RGPD, hébergement France),
captures d'écran anonymisées et one-pager de synthèse.

## Fichiers

### Catalogue (multi-pages, A4 paysage)
| Fichier | Rôle |
|---|---|
| `catalogue-modules.html` | Version écran auto-portante (captures intégrées en data-URI). Source de l'Artifact. |
| `catalogue-modules.print.html` | Version imprimable = `print_pre.html` + `catalogue-modules.html` + `print_post.html`. |
| `Hub_Astorya_Catalogue_Modules.pdf` | PDF **A4 paysage**. |

### One-pager (A4 portrait, argumentaire)
| Fichier | Rôle |
|---|---|
| `onepager-argumentaire.html` | Version écran (Artifact). Message : « Devenez l'architecte de votre propre ERP » (IA + Astorya). |
| `onepager-argumentaire.print.html` | Version imprimable A4 portrait. |
| `Hub_Astorya_Argumentaire_1pager.pdf` | PDF **A4 portrait**, une seule page. |

### Captures d'écran (sources, anonymisées)
| Fichier | Écran |
|---|---|
| `mock_accueil.html` | Tableau de bord d'accueil |
| `mock_crm.html` | Pipeline commercial (Kanban SPANCO) |
| `mock_facturation.html` | Devis & Factures (gestion commerciale type Sage) |
| `mock_rapports.html` | Rapports & BI (tableau de bord de direction) |

### Enrobage d'impression
`print_pre.html` (préambule paysage) + `print_post.html` (fermeture).

> **Captures anonymisées** : sociétés inventées, utilisateur « Compte démo »,
> URL neutre `hub.astorya.fr`. Aucune donnée client réelle.

## Régénérer les captures (PNG)

```bash
CHROME=$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1)
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1380,1300 --screenshot=shot_accueil.png     --virtual-time-budget=4000 "file://$PWD/mock_accueil.html"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1380,815  --screenshot=shot_crm.png         --virtual-time-budget=4000 "file://$PWD/mock_crm.html"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1380,800  --screenshot=shot_facturation.png --virtual-time-budget=4000 "file://$PWD/mock_facturation.html"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1380,760  --screenshot=shot_rapports.png    --virtual-time-budget=4000 "file://$PWD/mock_rapports.html"
```

Puis ré-encoder les PNG en `data:` URI et remplacer les `src` dans `catalogue-modules.html`.

## Régénérer les PDF

```bash
CHROME=$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1)
# Catalogue (paysage)
cat print_pre.html catalogue-modules.html print_post.html > catalogue-modules.print.html
"$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=Hub_Astorya_Catalogue_Modules.pdf --virtual-time-budget=9000 \
  "file://$PWD/catalogue-modules.print.html"
# One-pager (portrait)
"$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=Hub_Astorya_Argumentaire_1pager.pdf --virtual-time-budget=6000 \
  "file://$PWD/onepager-argumentaire.print.html"
```

## Charte

- Typographies : **Bricolage Grotesque** (display), **IBM Plex Sans** (texte), **IBM Plex Mono** (labels).
- Couverture « cockpit » indigo (dégradé violet), sections numérotées, cartes à picto, thèmes clair & sombre.
