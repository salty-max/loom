# Loom — Design Document

**Status** : draft v0.1
**Date** : 2026-04-22
**Auteur** : Max

Document de référence du périmètre fonctionnel et technique de Loom. Les sections "Features" et "Limitations" listent exhaustivement ce que la v0/v0.1 font et ne font pas — toute déviation doit passer par une modification de ce document.

---

## 1. Vision

Loom est un **DSL d'algorithmique musicale** inspiré de [TidalCycles](https://tidalcycles.org/) et [Strudel](https://strudel.cc/), *volontairement contraint* au modèle du tracker [PICO-8](https://www.lexaloffle.com/pico-8.php). Deux objectifs simultanés :

1. **Shippable en quelques mois.** Reproduire Strudel intégralement = 3+ ans. Contraindre à PICO-8 = une cible réaliste.
2. **Identité immédiate.** 4 voix, 8 formes d'onde, 8 effets : un son reconnaissable, une esthétique qui se suffit à elle-même.

Cibles utilisateur :
- **Live coders** qui veulent un environnement léger et joyeux pour des sets chiptune
- **Chiptune makers** habitués à PICO-8 qui veulent une syntaxe textuelle versionnable
- **Développeurs** qui veulent embarquer de la musique algorithmique dans un projet TS/browser

Non-cibles :
- Musiciens orchestraux — échantillons, synthèse FM complète, MIDI-vers-DAW haut de gamme
- Productions mix/master — Loom génère des événements, pas un produit fini mastérisé
- Apprentissage musical généraliste — Loom enseigne *PICO-8 style*, pas la théorie musicale

---

## 2. Scope & contraintes

### Principe directeur

> Tout ce qu'on peut exprimer en PICO-8, on l'expose en v0. Tout ce qu'on ne peut pas, on ne l'ajoute pas sauf demande explicite.

C'est une **contrainte auto-imposée**, pas une limitation technique. Le moteur `core/` (pattern algebra) peut exprimer bien plus — polyrythmes, transformations arbitraires, etc. Mais l'API publique `pico8/` garde la laisse courte. Déverrouillage ultérieur = additif, jamais breaking.

### Niveaux de maturité

| Phase | Livrable | Utilisateurs visés |
|---|---|---|
| **v0** | Library + CLI print. Compose, inspecte les événements en JSON. Pas encore de son. | Développeurs qui veulent valider la logique |
| **v0.1** | Son. Web Audio + serveur local + hot-swap. Mini-notation riche. | Live coders pour vrai |
| **v1** | Polish. MIDI, REPL terminal, euclidean rythmiques. | Power users |

---

## 3. Features (le "on fait ça")

### 3.1 Sons — 8 formes d'onde built-in

La palette sonore est **fixe et identique à PICO-8**. Slot 0 à 7 :

| # | Nom | Caractère sonore | Usage typique |
|---|---|---|---|
| 0 | Triangle | Doux, rond, mellow | Basse, sous-mélodie |
| 1 | Tilted Saw | Saw atténué, chaleureux | Pads, accompagnements |
| 2 | Saw | Bruyant, tranchant, brillant | Leads agressifs |
| 3 | Square | Creux, rétro, NES-like | Mélodies classiques 8-bit |
| 4 | Pulse | Square fin (duty cycle différent) | Leads brillants, alternative au square |
| 5 | Organ | Additive, plusieurs harmoniques | Accords, nappes |
| 6 | Noise | Bruit blanc | Percussions, crashes, whooshes |
| 7 | Phaser | Métallique modulé | Effets spéciaux, ambiances |

**Slots 8 à 15** : réservés pour des **instruments custom** définis par l'utilisateur (waveforms échantillonnées). Scope v0.1+ via `.p8` import, scope v1+ pour définition programmatique. Rien d'autre n'est autorisé — pas de FM, pas de samples, pas de soundfonts.

### 3.2 Effets per-step — 8 effets

Chaque step d'un SFX peut porter **un seul** effet parmi 8 :

| # | Nom | Comportement | Équivalent conceptuel |
|---|---|---|---|
| 0 | None | Aucun effet, la note joue normalement | — |
| 1 | Slide | Glissando depuis la note précédente jusqu'à la note courante, sur toute la durée du step | Portamento |
| 2 | Vibrato | Oscillation rapide du pitch autour de la note (env. ±50 cents) | Mod wheel légère |
| 3 | Drop | Le pitch chute rapidement pendant le step | Drum hit, kick |
| 4 | Fade in | Le volume monte de 0 au niveau nominal pendant le step | Soft attack |
| 5 | Fade out | Le volume descend du niveau nominal à 0 pendant le step | Release rapide |
| 6 | Arp fast | Sur un groupe de 4 steps consécutifs partageant cet effet, arpège rapide sur les 4 pitches | Accord staccato rapide |
| 7 | Arp slow | Idem mais plus lent | Accord arpégé lent |

**Règles de combinaison** :
- Un seul effet par step — pas d'empilement dans la version v0
- `Arp fast` / `Arp slow` fonctionnent en groupes de 4 steps (c'est le comportement PICO-8 natif). Si moins de 4 steps consécutifs partagent l'effet, l'arpège se limite au nombre disponible
- `Slide` sur le premier step d'un SFX se comporte comme `None` (rien à partir d'où glisser)

Ces 8 effets couvrent l'ensemble de ce qu'un musicien PICO-8 attend. Pas de filtre passe-bas/haut, pas de reverb, pas de delay — la **caractérologie 8-bit vient justement de l'absence** de ces effets modernes.

### 3.3 Volume & pitch

| Paramètre | Plage | Semantic |
|---|---|---|
| **Volume** | 0 - 7 | Entier. 0 = silence (équivalent rest `~`), 7 = max. Courbe de mapping vers l'amplitude audio définie par l'adapter |
| **Pitch** | 0 - 63 | Entier. 64 semi-tons = ~5 octaves. Mapping MIDI configurable par adapter (défaut : pitch 36 = C2) |

Pas de **micro-tuning**, pas de cents. Tempérament égal, 12 notes par octave, accordage fixe.

### 3.4 Structure : SFX → Music → Song

Trois niveaux de composition hiérarchiques, identiques à PICO-8 :

```
Song       = chain of Music patterns + optional loop markers
    │
    └── Music pattern = up to 4 channels, each referencing an SFX (or silence)
            │
            └── SFX = 32 steps × { pitch, instrument, volume, effect } + speed
                        │
                        └── Step = one of: Note, Rest (~)
```

**Contraintes dures** :
- Un SFX fait **exactement 32 steps**. Pas 16, pas 64, pas variable.
- Un Music pattern a **exactement 4 channels max**. Pas 5, pas 6.
- La vitesse d'un SFX est en **ticks par step** (1 tick = 1/128 seconde). Plage 1-255. Par défaut 16 (soit un step tous les 125 ms = 8 steps/sec, 4 steps/beat à 120 BPM).
- Un Song peut chaîner jusqu'à **64 Music patterns** (limite PICO-8). Boucle optionnelle via `loop: [startIdx, endIdx]`.

### 3.5 Mini-notation

Syntaxe textuelle dense, inline dans du TS, pour écrire des patterns rapidement. Cycle standard = 1 unité de temps de la pattern algebra, que Loom traduit en *N steps* selon la `speed` configurée.

**v0 (issue #12) — minimal**

| Construction | Sens |
|---|---|
| `c3 e3 g3 c4` | 4 tokens espacés → 4 events, chacun 1/4 de cycle |
| `~` | Rest (silence) |
| `"c3 ~ e3 ~"` | 4 steps dont 2 rests |

**v0.1 — expansion (issues #26, #27, #28)**

| Construction | Sens | Ex |
|---|---|---|
| `[x y]` | Groupe : 2 events dans 1/N du cycle parent | `a [b c] d` → 3 slots, 2ème est b+c collés |
| `<x y z>` | Alternation : un élément par cycle, en cyclique | `<a b>` → cycle 0 : a, cycle 1 : b, cycle 2 : a |
| `x*n` | Répétition dans le slot courant | `a*4` → 4 a's en un slot |
| `x/n` | Ralentissement — x s'étale sur n slots | `a/2 b` → 3 slots total |
| `x@n` | Élongation — x prend n unités dans un groupe | `[a@2 b]` → a prend 2/3, b prend 1/3 |

**v1 — euclidean (issue #29)**

| Construction | Sens |
|---|---|
| `x(k, n)` | k hits de x répartis sur n steps (Bjorklund) |
| `x(k, n, r)` | Idem, rotation de r |

**Explicitement hors scope**
- `x?p` (probabilité inline) — à faire via combinator `sometimes(x, p)`
- `{x y}` (polymétrique) — trop exotique pour PICO-8
- Choix `|` — absorbé par `<>` alternation

### 3.6 Transforms

Les **combinators** appliquent à des `Pattern` complets (après parsing mini-notation). Disponibles en v0.1 (issue #13) :

| Combinator | Effet |
|---|---|
| `fast(n)` | Compresse un pattern à 1/n de sa durée |
| `slow(n)` | Dilate à n× la durée |
| `rev()` | Renverse l'ordre des events dans un cycle |

Hors scope v0/v0.1 — **reportés selon demande**
- `every(n, f)` — applique f tous les n cycles
- `jux(f)` — joue en stéréo, avec f appliqué à une voie
- `sometimes(f, p)` — applique f avec probabilité p
- `struct(mask, pat)` — plaque un rythme binaire sur un pattern
- `chunk(n, f)` — applique f à un chunk du pattern par cycle

Pourquoi reportés ? Ces transforms sont *l'identité Strudel power user*. PICO-8 n'en a pas d'équivalents natifs. On les ajoutera quand/si les utilisateurs les demandent réellement, pas spéculativement.

---

## 4. Limitations (le "on ne fait pas ça")

Liste exhaustive des écarts avec un DAW/synth complet. Aucun de ces items n'est en roadmap implicite.

### Audio

- **Pas de FM** (Megadrive/Adlib style) — un preset futur "16-bit" pourrait en ajouter, hors scope Loom actuel
- **Pas de samples / wavetables arbitraires** — les 8 waveforms sont fixes
- **Pas de filtre** (LP/HP/BP/notch) — le caractère vient du waveform, pas du filtrage
- **Pas de reverb / delay / chorus** — mix sec, 8-bit
- **Pas de sidechain / ducking** — les 4 voix sont indépendantes
- **Pas de stereo** — mix mono. Un adapter web-audio peut router les voix en pan statique en v1, pas de panning par step

### Rythmique

- **Grille fixe de 32 steps/SFX** — impossible de faire un pattern à 17 steps sans workaround
- **Pas de polyrythmes** au sein d'un SFX — tous les steps ont la même durée
- **Pas de polymétrique** `{x y}` — même longueur de cycle pour toutes les voix dans un music pattern
- **Swing/groove timing** non-quantifié pour v0 — tous les steps sont égaux. v1+ pourrait introduire un paramètre `swing: 0..100`

### Composition

- **Pas d'automations continues** — tout est step-discret. Un slide `1` interpole dans un step, mais il n'y a pas de courbe d'enveloppe paramétrable
- **Pas de tempo variable** — BPM fixe pour toute une composition. Les changements de tempo se font entre morceaux, pas au sein d'un song
- **Pas de signature variable** — pas de 7/8, 5/4. La structure 32-steps impose un 4/4 implicite
- **Pas de MIDI sync out** vers un hardware externe en v0/v0.1 — prévu en v1 (#16)

### UX

- **Pas d'import DAW** (Ableton Live Set, Logic, FL Studio) — seul `.p8` en v0.1 (#11)
- **Pas d'export partitition** (MusicXML, LilyPond)
- **Pas d'interface visuelle dans Loom** — Loom est headless (lib + CLI). L'UI tracker visuelle vit dans **Bloop** (le projet app séparé), pas ici

### Conceptuelles

- **Pas de concept d'"utilisateur"** — Loom est une lib, pas un service. Auth/persistence sont l'affaire de Bloop
- **Pas de cloud / sync** — compositions = fichiers `.loom.ts` locaux ou string encodée dans l'URL d'un partage
- **Pas d'IA / génération automatique** — Loom compose à partir de ce que l'utilisateur écrit, pas à partir d'un prompt. Hors scope produit.

---

## 5. Architecture

### Couches et dépendances

Strictement unidirectionnel — **jamais inverse** :

```
     ┌───────────────────────────────────────────────┐
     │  cli  +  runtime                              │  CLI commands + REPL
     ├───────────────────────────────────────────────┤
     │  adapters  (print, web-audio, midi)           │  Output layer
     ├───────────────────────────────────────────────┤
     │  pico8  (SFX, Music, Song, validators)        │  PICO-8 semantics
     │  mini   (parser)                              │  Notation DSL
     │  transforms  (fast, slow, rev)                │  Pattern ops
     ├───────────────────────────────────────────────┤
     │  core  (Time, Event, Pattern)                 │  Pure algebra, dep-free
     └───────────────────────────────────────────────┘
```

| Couche | Rôle | Dépend de | Publié comme subpath |
|---|---|---|---|
| `core` | Time rationnel, Event, Pattern lazy | rien | `loom/*` (root) |
| `mini` | Parser string → Pattern | core | `loom/mini` |
| `transforms` | Combinators sur Pattern | core | `loom/transforms` |
| `pico8` | Types et builders contraints PICO-8 | core + mini + transforms | `loom/pico8` |
| `adapters` | Rendu d'un Pattern vers sortie | core + pico8 | `loom/adapters/*` |
| `runtime` | Controller hot-swap + eval sandbox | core + adapters | `loom/runtime` |
| `cli` | Binaire `loom` | tout | binaire `loom` |

### Pourquoi ce layering

- `core` est **réutilisable en dehors du contexte PICO-8**. Si un jour on veut un preset 16-bit ou Doom-MIDI, on crée `loom/megadrive` qui dépend de `core`, sans toucher `pico8`.
- `pico8` **contraint** sans modifier le moteur. Toutes les validations (`SFX_INVALID_LENGTH`, pitch > 63, etc.) vivent à ce niveau.
- `adapters` sont des **pluggables**. Le même Pattern peut être envoyé en print (debug), web-audio (son), MIDI (DAW externe). L'adapter ne connaît pas PICO-8, il consomme juste des `Event`.
- `runtime` **ne connaît pas le son**. Il orchestre : eval, swap, panic, tick. Il reçoit un adapter en injection.

### Pattern algebra — noyau conceptuel

Un `Pattern<T>` est une **fonction pure du temps** :

```ts
interface Pattern<T> {
  query(begin: Time, end: Time): Event<T>[];
}
```

- **Pas d'état**, pas de playhead. Querier `[5, 6)` retourne toujours les mêmes events, peu importe quand on querier.
- **Temps rationnel** (`{ num: bigint, den: bigint }`) — pas de floats. Permet des subdivisions exactes à n'importe quelle profondeur (quintolet dans un triolet dans un 16ème).
- **Cycle = 1 unité** — le BPM n'apparaît que dans l'adapter. Un pattern `fast(2)` a 2 cycles pour 1 unité de temps externe.
- **Events immuables**, triés par `begin`, peuvent déborder `end` (fin d'un event qui continue).

Cette stratégie permet le **hot-swap gratuit** : remplacer `controller.activePattern` par un autre fait que le prochain `query()` retournera les events du nouveau pattern — pas de glitch, pas de restart, l'horloge continue.

---

## 6. Syntaxe utilisateur

### TS-first, mini-notation inline

Un fichier Loom typique (`.loom.ts`) :

```ts
import { stack, seq } from 'loom';
import { sfx, music, song } from 'loom/pico8';
import { fast, slow, rev, every } from 'loom/transforms';
import { mini } from 'loom/mini';

// Mini-notation pour des rythmes denses
const bass = mini('<c2 g2 e2 c3>/2')
  .with({ instrument: 'triangle', volume: 5 });

// Composition TS pour réutiliser, transformer, structurer
const lead = mini('c5 [e5 g5] ~ c6')
  .with({ instrument: 'square', volume: 6, effect: 'vibrato' });

const hats = mini('~*4 [c4 c4]*2')
  .with({ instrument: 'noise', volume: 3 });

const verse = music({
  ch0: bass,
  ch1: lead,
  ch2: hats,
});

const chorus = verse
  .with({ ch1: lead.fast(2) })     // lead joue 2× plus vite
  .with({ ch3: mini('c3 g3').slow(2) });

export default song([verse, verse, chorus, chorus], {
  loop: [0, 3],                    // boucle le tout
});
```

### Décision : TS + mini-notation, pas YAML

**YAML/TOML a été envisagé et rejeté** (voir discussion design). Raisons principales :
1. Le live coding eval une *expression*, pas un *document*. YAML force à reparser tout.
2. Pas de variables, pas de composition — `const bass = ...; stack(bass, ...)` est impossible en YAML pur.
3. Les transforms sont fondamentalement fonctionnels — les encoder en YAML demande des meta-keys imbriquées monstrueuses.
4. Pas d'IntelliSense, pas de type-check au moment de l'édition.

Le bénéfice "configy" de YAML est déjà couvert par **la mini-notation dense + la GUI tracker de Bloop + l'import `.p8`**.

---

## 7. Live coding

### Scénario utilisateur

1. L'utilisateur ouvre `loom serve` dans un terminal → une page éditeur s'ouvre dans le navigateur
2. Il écrit du code dans l'éditeur CodeMirror
3. Il appuie sur `Cmd+Enter` → le code est évalué dans un Web Worker isolé, le pattern retourné remplace atomiquement le pattern en cours
4. **La musique qui joue à ce moment continue sans glitch**. Au prochain tick du scheduler (~10-50ms), le nouveau pattern prend la main, aligné sur le cycle courant
5. L'utilisateur peut relancer n'importe quand — pas de "stop puis start", juste une continuité musicale

### Controller runtime (#25)

```ts
import { createController } from 'loom/runtime';
import { webAudio } from 'loom/adapters/web-audio';

const controller = createController({
  bpm: 120,
  adapter: webAudio,
});

controller.setPattern(initialPattern);

// Eval user code — hot-swap atomique
controller.eval('seq(c3, e3, g3).fast(2)');

controller.panic();     // coupe toutes les voix en cours
controller.stop();
controller.status;      // { cycle, bpm, error, adapter }
```

**Propriétés garanties** :
- `setPattern(next)` est synchrone et atomique
- Un eval qui throw préserve le pattern précédent et remonte l'erreur via callback — jamais de disruption sonore pour un typo
- Le scheduler utilise un lookahead de ~100 ms, donc le swap perçu = latence du lookahead (imperceptible en pratique)
- `panic()` déconnecte toutes les voix Web Audio et met le pattern à `silence` — pour les situations de "j'ai cassé, ça hurle, stop tout"

### Sandbox eval

- **Browser** : Web Worker avec postMessage, seul `loom/*` pré-importé. Pas de `window`, pas de `document`, pas de `fetch`
- **Node/Bun** : `vm.createContext` avec les mêmes imports, pas de `fs`, `process`, `child_process`

L'utilisateur ne peut **pas** faire d'I/O depuis le code live-codé. C'est exclusivement de la composition pattern-algebra.

---

## 8. CLI

Binaire `loom` installé via `bun add loom` ou équivalent. Commandes :

| Commande | Comportement | Milestone |
|---|---|---|
| `loom events <file>` | Évalue le fichier, print JSON events pour N cycles (défaut 1) sur stdout | v0 |
| `loom serve [file]` | Spawn serveur local sur :3030, ouvre le navigateur sur un éditeur live | v0.1 |
| `loom play <file>` | Lecture temps-réel via binding Node audio (ou headless browser bridge) | v0.1 |
| `loom render <file> -o out.{wav,mid}` | Offline rendering. Format dispatché par l'extension : `.wav` (audio) ou `.mid` (Standard MIDI File). Flag `--stems` pour exporter 1 `.wav` par canal | v0.1 |
| `loom repl` | REPL terminal pour live coding texte-only | v1 |

`loom serve` est **le workflow principal** — la qualité de son et l'UX éditeur/hot-swap sont là. `loom play` est un fallback terminal pour scripts/CI. `loom render` est pour l'export final.

---

## 9. Formats de fichier & export

### Résumé — matrice des imports/exports

| Format | Direction | Module | Issue | Use case |
|---|---|---|---|---|
| `.loom.ts` | in (source live + file) | n/a (eval sandbox) | — | Source primaire — ce que l'utilisateur écrit |
| `.p8` | **in / out** (roundtrip) | `loom/pico8/p8` | #11 | Interop avec PICO-8 lui-même |
| `.wav` | out | `loom/adapters/web-audio` via OfflineAudioContext | #19 | Audio rendu pour publier / partager / mixer |
| `.wav` stems | out | idem, flag `--stems` | #19 | 1 `.wav` par canal → mix dans un DAW |
| `.mid` | out | `loom/adapters/midi-file` | #30 | Import dans Ableton / Logic / FL / Reaper |
| URL hash `#s=…` | **in / out** | `loom/pico8/share` | #31 | Partage 100% client-side, pas de serveur |

### `.loom.ts` (source)

Un fichier TypeScript standard qui `export default` un `Song` (ou un `MusicPattern` ou un `Pattern` plus libre). Imports depuis `loom/*` pré-autorisés dans la sandbox d'eval.

### `.p8` roundtrip (#11)

Le format cart PICO-8 est un texte simple avec des sections :

```
pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- code lua
__gfx__
-- sprites
__sfx__
000c08 ...  <- sfx 0 : hex-encoded
010816 ...  <- sfx 1
__music__
01 00424344 <- pattern 0, chain flags + 4 sfx ids
```

Loom ne s'intéresse qu'aux sections `__sfx__` et `__music__`. Parser + serializer garantissent un **roundtrip lossless**. Use cases :
- Import d'un cart existant pour le remixer en code
- Export d'une composition Loom vers un cart ouvert dans PICO-8

### `.wav` render (#19)

Via `OfflineAudioContext` + web-audio adapter (même signal path que playback live, sans sortie realtime). Défaut : 16-bit PCM, 44.1 kHz.

Flag `--stems` : au lieu d'un seul mixdown, produit `out.ch0.wav`, `out.ch1.wav`, `out.ch2.wav`, `out.ch3.wav` — 1 fichier par canal PICO-8. Use case : importer les stems dans un DAW pour mixer avec des pistes non-Loom (voix, guitare, synthé externe).

**Non supporté** : MP3, OGG, FLAC. Après un `.wav` render, l'utilisateur convertit avec `ffmpeg -i out.wav out.mp3` si besoin. Pas la peine d'embarquer libmp3lame/libvorbis dans le bundle Loom.

### `.mid` export (#30)

Standard MIDI File 1.0, distinct du **live MIDI adapter** (#16) qui pilote un synth hardware en temps réel. Le `.mid` export produit un fichier pour ouvrir dans un DAW offline.

Mapping PICO-8 → MIDI :
- 4 canaux → 4 tracks distincts (MIDI channels 0-3)
- `pitch 0-63` → note number avec offset configurable (défaut +36 pour que `pitch 0 = C2`)
- `volume 0-7` → velocity 0-127 (mapping linéaire ×18)
- `slide` → pitch-bend interpolé
- `vibrato` → CC 1 (mod wheel) modulé
- `arp fast/slow` → événements note-on discrets au taux de l'arpège
- `drop`, `fade in/out` → courbes CC d'expression, **best-effort documenté comme lossy**

Les effets qui n'ont pas d'équivalent direct en MIDI sont documentés comme "rendu approximatif" — un DAW qui importe le `.mid` entendra quelque chose de proche mais pas identique au rendu Loom.

### URL share (#31)

Encode une composition (Song ou MusicPattern) en string compacte via :
1. Sérialisation binaire custom (format fixe PICO-8 : 32 steps × 4 channels × {pitch, instr, vol, effect} ≈ 320 bytes/pattern)
2. Compression pako (DEFLATE)
3. Encodage base64url (URL-safe)

Payload attendu pour un song de 4 patterns : **500-800 bytes encodé**. Tient largement dans la limite d'URL de n'importe quel navigateur.

Use case : partage viral à la BeepBox. Tu postes `loom.fun/play#s=eJyz...` sur Discord/Twitter/Reddit, le destinataire clique, `loom serve` (ou le player web autonome) décode le hash et **lit la compo sans serveur, sans compte, sans install**.

Un byte de version en tête permet de migrer le format si on change la sérialisation plus tard sans casser les liens existants.

**Hors scope** : raccourcisseurs d'URL genre `loom.fun/s/abc123`. Ça demanderait un backend avec storage, ce qui contredit le principe "Loom lib = pure client". Les fonctionnalités hébergées (liens courts, discovery, likes) sont le boulot de Bloop, pas de Loom.

---

## 10. Non-fonctionnel

### Performance

| Métrique | Cible v0.1 | Cible v1 |
|---|---|---|
| Scheduler lookahead | 100 ms | 100 ms |
| Jitter audio perçu | < 5 ms | < 2 ms |
| Eval → swap perçu | < 150 ms | < 50 ms |
| Render 1 min en `.wav` | < 3 s | < 1 s |
| Bundle adapter web-audio gzippé | < 30 KB | < 20 KB |
| Parser mini-notation (100 chars) | < 5 ms | < 1 ms |

### Compatibilité

- **Navigateurs** : Chrome 120+, Safari 17+, Firefox 120+ (Web Audio API + Web Worker requis)
- **Runtimes** : Node 24+, Bun 1.3+
- **OS** : macOS, Linux, Windows (Bun install officiel sur les trois)

### Accessibilité

- Éditeur CodeMirror supporte screen readers par défaut
- Transport controls (play/stop/panic) navigables au clavier
- Loom n'a aucune dépendance visuelle — un utilisateur malvoyant peut live-coder sans la grille de pattern (le son est le feedback primaire)

### Internationalisation

- Messages d'erreur en anglais uniquement (codes SCREAMING_SNAKE_CASE → les traductions sont côté Bloop ou côté applicatif)
- Documentation en anglais pour la portée communauté internationale

---

## 11. Roadmap

### v0 — "compose & inspect" (17 issues)

- **#1** Event type
- **#2** Pattern query
- **#3** primitives pure/silence/seq/stack/cat
- **#4** unit tests
- **#5-#10** PICO-8 types, waveforms, effects, sfx/music/song builders
- **#12** mini-notation minimal
- **#13** transforms fast/slow/rev
- **#14** print adapter
- **#17** CLI events
- **#21-#22** tooling (lockfile hook, issue templates)
- **#23** docs (CONTRIBUTING.md)

**Sortie v0** : bibliothèque qui compile, se teste, publie des .d.ts, et laisse l'utilisateur vérifier à la main qu'un pattern produit les bons events. Pas encore de son.

### v0.1 — "live coding + export" (12 issues)

- **#11** import/export `.p8`
- **#15** web-audio adapter avec 8-bit synth
- **#18** CLI play
- **#19** CLI render (`.wav`, `.mid`, stems)
- **#24** CLI serve (éditeur browser + Cmd+Enter)
- **#25** runtime controller hot-swap
- **#26** mini groups `[x y]`
- **#27** mini alternation `<x y>`
- **#28** mini modifiers `*n` `/n` `@n`
- **#30** MIDI file export (`.mid` Standard MIDI File 1.0)
- **#31** URL share encoding (pako + base64url pour `#s=…`)

**Sortie v0.1** : la v1 publique en mode beta. Les utilisateurs peuvent installer, `loom serve`, entendre, itérer, **exporter** (audio, MIDI, stems, lien de partage). Mini-notation suffisamment riche pour écrire 80% des patterns sans combinator TS.

### v1 — "polish" (3 issues)

- **#16** MIDI adapter (Web MIDI + node-midi)
- **#20** CLI REPL terminal-only
- **#29** mini euclidean `x(k, n)` Bjorklund

**Sortie v1** : publication officielle npm. Hook pour DAW externe, live coding terminal pour les puristes, rythmes euclidiens pour les chiptune fans hardcore.

---

## 12. Questions ouvertes

Décisions à prendre avant ou pendant l'implémentation. Certaines déverrouillées par les issues, d'autres demandent discussion produit.

### Techniques

1. **Scheduler lookahead optimal ?** — 100 ms est un défaut raisonnable. À tuner avec mesure réelle sur Chrome/Safari/Firefox.
2. **Granularité Web Worker sandbox ?** — un worker partagé pour tous les evals ou un worker neuf par eval ? Partagé = faster swaps, neuf = safer crash isolation.
3. **Compression URL de partage** — pako seul ou pako + dictionary tuning ? Mesurer taille moyenne d'un pattern ~200 bytes gzippé.
4. **Gestion de la polyphonie dans les 4 voix** — chaque voix = monophonie stricte (une note à la fois) ou polyphonie limitée (2-3 voix par canal) ? PICO-8 est strictement mono par canal. Reste stricte pour fidélité.

### Produit

1. **Qui est l'utilisateur principal en beta v0.1 ?** Live coders existants (Tidal/Strudel users) ou chiptune makers (PICO-8 community) ? Ça influence le ton de la doc et le choix des exemples.
2. **Monétisation ?** Lib open-source gratuite. L'app Bloop pourrait monétiser autour (hosting de compositions, features sociales). Loom lui-même reste neutre.
3. **Licence ?** MIT par défaut pour maximiser l'adoption et l'embed dans d'autres projets. À confirmer.
4. **Nom final** — "Loom" est-il libre sur npm ? À vérifier avant publication. Fallbacks : `loom-lang`, `loom-chiptune`, `loom-dsl`.

### Communauté

1. **Intégration avec la communauté Strudel/Tidal** — annoncer Loom comme un "spin-off scope-limited" ? Risque de confusion ou opportunité de capter l'audience ?
2. **Intégration avec la communauté PICO-8** (BBS Lexaloffle, chiptune.com) — Loom peut servir de bridge "write patterns in code, export to your cart".

---

## 13. Annexes

### A — Glossaire

| Terme | Définition |
|---|---|
| **SFX** | Sound Effect — dans PICO-8, un pattern de 32 steps monophonique. Loom garde le nom par fidélité. |
| **Music pattern** | Stack de jusqu'à 4 SFX joués simultanément, un par canal |
| **Song** | Chain de Music patterns, avec optional loop markers |
| **Step** | Une cellule d'un SFX — contient pitch, instrument, volume, effect |
| **Cycle** | 1 unité de temps dans la pattern algebra. Un SFX = 1 cycle par défaut |
| **Tick** | 1/128 seconde. La `speed` d'un SFX est en ticks par step |
| **Hot-swap** | Remplacement atomique du pattern actif pendant la lecture, sans interruption audio |
| **Pattern algebra** | Formalisation d'un pattern comme fonction pure du temps (TidalCycles heritage) |
| **Mini-notation** | Syntaxe textuelle dense pour exprimer des rythmes courts (`"c3 [e3 g3] ~"`) |

### B — Références

- [PICO-8 Wiki — SFX Editor](https://pico-8.fandom.com/wiki/Sfx_Editor)
- [PICO-8 Wiki — Music Editor](https://pico-8.fandom.com/wiki/Music_Editor)
- [TidalCycles — pattern algebra foundation](https://tidalcycles.org/docs/)
- [Strudel — JS port of Tidal](https://strudel.cc/)
- [Godfried Toussaint — The Euclidean Algorithm Generates Traditional Musical Rhythms (2005)](https://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf)
- [Web Audio API best practices — scheduling](https://web.dev/audio-scheduling/)

### C — Évolutions à moyen terme (post-v1, non-planifiées)

- **Preset 16-bit** (Megadrive FM style) — nouveau module `loom/megadrive` avec sa propre palette d'instruments, mêmes primitives core
- **Preset Doom-MIDI** (OPL2) — module `loom/opl2` avec émulateur FM en WebAssembly
- **GUI visualiseur** — pattern grid overlay dans `loom serve` pour voir les events en temps réel
- **MIDI sync in** — suivre une horloge externe pour jouer en sync avec une machine hardware
- **Collaborative live coding** — plusieurs live coders qui éditent le même pattern en temps réel (Y.js / CRDT). Probablement dans Bloop, pas Loom
