# Vidéos d'événement (Remotion)

Un seul modèle pour toutes les annonces « À l'affiche » : match, concert, soirée spéciale.
On décrit l'événement dans un petit fichier JSON, une commande produit :

| Fichier | Format | Usage |
|---|---|---|
| `out/<slug>.mp4` | 1080×1920, 10 s, avec musique | Instagram / Facebook / TikTok (Reels, Stories) |
| `../videos/<slug>.mp4` | 720×1280, muet, ~1 Mo | le site |
| `../videos/<slug>-poster.jpg` | 576×1024 | l'affiche du site (image avant lecture) |

…et affiche dans le terminal le bloc HTML `<section class="affiche">` à coller dans `index.html`, avec
`data-date`, `data-until` et `data-expires` déjà remplis (l'annonce se masque seule après l'événement).

## Annoncer un événement

1. Créez `events/AAAA-MM-JJ-<nom>.json` en partant d'un exemple de `events/exemples/` :

   ```json
   {
     "type": "match",
     "home": "France",
     "away": "Angleterre",
     "subtitle": "Six Nations",
     "date": "2027-02-06T21:10",
     "footage": "sport.mp4"
   }
   ```

2. Lancez le rendu (depuis `event-video/`) :

   ```bash
   npm run event -- events/2027-02-06-france-angleterre.json
   ```

3. Collez le bloc HTML imprimé à la place de l'ouverture de `<section class="affiche">` et de sa `<figure>`
   dans `index.html`, puis mettez à jour le texte à côté (titre, chapô, date, heure).

Le nom de fichier sans la date donne le `slug` (`france-angleterre`), donc les noms des vidéos.
Par sécurité, le script refuse d'écraser une vidéo du site qu'il n'a pas produite lui-même
(`sport.mp4`, `ambiance.mp4`…). Les vidéos qu'il a produites sont listées dans `events/rendered.txt`.

## Champs

| Champ | Obligatoire | Rôle |
|---|---|---|
| `type` | oui | `match` (grand écran), `live` (concert / DJ) ou `soiree` (soirée à thème) |
| `date` | oui | début, heure de Paris : `"2027-02-06T21:10"`. Donne « Samedi 6 févr. » et « 21h10 » |
| `home`, `away` | match | les deux équipes, dans l'ordre d'affichage |
| `title` | live / soirée | le grand titre, `\n` pour passer à la ligne (3 lignes max) |
| `subtitle` | non | petite ligne manuscrite : compétition, style musical… |
| `kicker` | non | le bandeau rouge. Par défaut « Match en direct », « Live music », « Soirée spéciale » |
| `footage` | non | vidéo de fond prise dans `../videos/` (ou `live.mp4`). Par défaut selon le type : `sport.mp4`, `live.mp4`, `ambiance.mp4` |
| `footageStart` | non | secondes à sauter au début de la vidéo de fond |
| `until` | non | dernier jour de l'événement (par défaut le jour de `date`) |
| `expires` | non | heure précise de fin, après minuit (par défaut 1 h du matin le lendemain) |
| `dayLabel`, `timeLabel` | non | forcer le texte de la date ou de l'heure |
| `music` | non | `false` pour une vidéo sans son |
| `slug` | non | forcer le nom des fichiers |

## Prévisualiser et ajuster

```bash
npm i          # une fois
npm run dev    # ouvre Remotion Studio : on modifie les champs à droite et on voit le résultat
```

Le modèle est dans `src/EventPromo.tsx` (mise en page, timing), les champs dans `src/schema.ts`.
`npm run footage` recopie les vidéos du site dans `public/footage/` (non versionné).
Ajouter `--no-site` au rendu ne produit que la version réseaux sociaux.

## Crédits

Polices Anton et Kaushan Script (SIL OFL, licences dans `public/fonts/`), Oswald via Google Fonts.
Musique et effets sonores : voir `public/audio/CREDITS.md`. Les sons CC BY doivent être crédités
là où la vidéo avec le son est publiée. Remotion est gratuit pour les équipes de 3 personnes maximum.
