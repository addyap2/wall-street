# Enseigne néon (Blender)

L'enseigne du Wall Street en néon 3D, reconstruite à partir de `images/logo.jpg` :
anneau pervenche, éléphant corail (contour tracé depuis le logo + traits intérieurs),
« Wall Street » en tubes Kaushan Script crème et « PUB · RESTAURANT » en bleu.

Animation à 30 i/s : images 1 à 90, l'enseigne s'allume en grésillant (anneau → éléphant → lettres) ;
images 91 à 210, une boucle allumée qui se répète sans saut (léger bourdonnement, un raté sur le titre).

## Fichiers

| Fichier | Rôle |
|---|---|
| `build_neon.py` | construit toute la scène (Blender 5.3) ; c'est la source, le `.blend` en est le résultat |
| `wall-street-neon.blend` | la scène prête à rendre |
| `encode.sh` | assemble les images rendues en vidéos |
| `renders/` | images et vidéos produites (non versionné) |

Vidéos produites par `encode.sh` :

- `renders/neon-sign-1080.mp4` : 1080×1080, 11 s (allumage puis boucle ×2), pour les réseaux sociaux
- `renders/neon-intro.mp4` et `renders/neon-loop.mp4` : 1080×1080, les deux morceaux séparés
- `renders/neon-sign-poster.jpg` : une image de l'enseigne allumée
- `../event-video/public/brand/neon-intro.mp4` et `neon-loop.mp4` : versions légères (540 px)
  utilisées par le modèle de vidéo d'événement (`"logo": "neon"`)

Le fond est noir : en superposition, utilisez `mix-blend-mode: screen` pour ne garder que la lueur.

## Refaire le rendu

```bash
cd neon-sign
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b --factory-startup --python build_neon.py -- --save   # reconstruit wall-street-neon.blend
$B -b wall-street-neon.blend -o //renders/frames/neon_#### -F PNG -a   # ~7 min
./encode.sh
```

Le script peut aussi être lancé dans un Blender ouvert : il crée une scène « WallStreetNeon »
à part, sans toucher aux autres scènes.
