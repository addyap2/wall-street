# Wall Street — Pub Restaurant (Fréjus)

Site vitrine one-page pour le **Wall Street**, bar · brasserie · pub restaurant à Fréjus.
Concerts live, matchs en direct, cuisine 100 % maison.

## Stack

Site **statique** (HTML / CSS / JS), sans étape de build. Rien à installer.

```
index.html      # page unique (hero, concept, carte, live & matchs, ambiance, infos)
styles.css      # styles + charte (bleu pervenche / rouge corail / crème)
script.js       # nav mobile, onglets de la carte, année du footer
images/         # logo, photos d'ambiance, tireuses, néon Delirium
```

## Aperçu en local

Ouvrez simplement `index.html` dans un navigateur, ou lancez un petit serveur :

```bash
python3 -m http.server 3000
# puis http://localhost:3000
```

## Déploiement Vercel

Aucune configuration nécessaire — Vercel sert les fichiers statiques tels quels.

1. Poussez le repo sur GitHub (déjà fait sur `main`).
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importez `wall-street`.
3. Framework Preset : **Other** (aucun build). Laissez les champs par défaut, cliquez **Deploy**.

Ou en ligne de commande :

```bash
npm i -g vercel
vercel        # préversion
vercel --prod # production
```

## À compléter avant mise en ligne

Quelques champs sont volontairement laissés en attente dans `index.html` (section `#infos`) :

- **Adresse exacte** et lien Google Maps
- **Numéro de téléphone** (`tel:` + affichage)
- **Horaires** précis
- **Liens Instagram / Facebook** réels

Cherchez les mentions « à compléter / à confirmer » dans la section Infos.
