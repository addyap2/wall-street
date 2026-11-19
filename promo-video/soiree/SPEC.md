# SPEC: « Une soirée au Wall Street » (storyline A)

GOAL:    a local scrolling past wants to spend tonight at the Wall Street: afterwork pint → dinner → the match → the band.
OUTPUT:  HyperFrames, 1080 x 1920 (9:16), 30 fps
TIME:    31 s x 30 = 930 frames. Grid at 120 BPM (15 frames a beat) so a music bed can be laid on later.
LOOK:    the site's own footage full-bleed, never letterboxed or dimmed.
         Brand periwinkle #7897D0 (sampled from the logo file, so the logo JPG sits seamlessly on it), ink blue #223163,
         cream #F4ECDD, coral #E85466 rationed to the hour tab and the CTA button.
         Display: Oswald 700, hour 200 px, tracking -1%. Label: Oswald 600 caps 64 px, tracking 4%. (Anton/Kaushan
         are the site's faces but not installed here; swap in when the font files are added.)
         Medium: a periwinkle band, like the site's masthead strip. It sweeps full-frame to cover each hour change,
         then collapses into a 250 px strip (y 1050–1300) that carries the time stamp.
OBJECTS: the Paulaner pour, the pink Delirium elephant tap, the wok, the plated noodles, the spring roll in its sauce,
         the tiramisu, the crowd at the big screen, the band under the Wall Street sign, the lit façade at night, the logo.
MOTION:  band sweep x: -1080 → 0 in 0.35 s power3.in (accelerates into the cut); collapse clip-path 0.55 s expo.out;
         hour tab wipes in 0.3 s expo.out; label words blur 6 px → 0 in 0.13 s, 0.08 s apart; landed type is still.
         Claim lines blur in per line; end-card logo iris clip-path circle 0 → 75% in 0.6 s expo.out.
SHOTS:
  0.0–3.0   18H00 · AFTERWORK. Pour (wallstreet 3.0–6.0). Band already landed at frame 0 (hook = pint + hour).
  3.0–5.0   Delirium elephant tap pulled (wallstreet 6.4). Hard cut.
  5.0       band sweeps across → 19H30 · EN CUISINE
  5.0–8.6   wok toss (cuisine 2.0); 8.6 plating (kitchen 2.6); 10.4 spring roll dip (cuisine 9.2); 12.2 tiramisu (dessert 0.5)
  13.8      sweep → 20H45 · COUP D'ENVOI. Crowd + screen (sport 0.5), 17.0 screen goes green (sport 21.5)
  18.6      sweep → 22H00 · LIVE MUSIC. Band under the sign (live 15.0, frame scaled 1.3 from the top to crop the
            burned-in Instagram caption), 21.2 band again (live 21.0)
  23.4      match cut: daytime sign → the lit façade at night. Claim: « Le pub qui vit / au rythme de Fréjus »
  27.0      dive into the sign's pink elephant → periwinkle flood → logo iris → « 36 rue de l'Intendance · Fréjus »
            → coral button « Réservez votre table ». Holds to 31.0.
BANNED:  dark void, glow/neon added, gradients, glass cards, cream-serif look, fade-and-slide-up on everything,
         docked logo, corner labels, three cards in a row, the France–Italie poster (one-off, player likenesses),
         Halloween footage (seasonal).
QA:      0.0 (thumbnail: pint + 18H00), 5.1 (sweep mid), 5.7 (band landed), 14.4, 19.3, 24.5 (claim), 27.6 (dive), 30.5 (end card).

SOUND:   "Pub Party Rock" (HeyGen catalog, 145 BPM, 0.4139 s a beat), started 26.295 s into the track so its natural
         ending decays under the end card. The night-façade cut (23.4) and the logo iris (27.539, moved from 27.45)
         sit exactly 10 beats apart, both on beats. Whooshes on the three band sweeps (three different takes), an air
         whoosh on the dive into the elephant, one boom on the logo. Footage stays muted. Credits: assets/sfx/CREDITS.md.
