# A Day in the Life

A branching Twine story (Harlowe 3.3.9). You play Jordan over one day, from the morning alarm to whatever comes after. The choices you make lead to one of five endings.

**Play it:** open `index.html` in a browser, or import it into Twine 2 (Library → Import) to edit it on the story map.

## Files

| File | What it is |
| --- | --- |
| `a-day-in-the-life.twee` | The whole story: passages, stats, CSS, and the scenery/music code |
| `index.html` | The built, playable game (don't edit by hand, rebuild it) |
| `build.js` | Turns the `.twee` file into `index.html` |

To rebuild after editing the `.twee` file:

```sh
node build.js a-day-in-the-life.twee path/to/harlowe/format.js index.html
```

Harlowe's `format.js` comes from the Twine repo: `public/story-formats/harlowe-3.3.9/format.js`.

## Story map

```
MORNING        Alarm → Iron shirt / Snooze / Doomscroll → Out the door
COMMUTE        Bus stop (help Ms. Gloria or rehearse) · Corner shop (the guard)
               Run for the bus (police stop) · Rideshare
WORK           Lobby (badge check) → Elevator / Stairs → Presentation
               → Kyle takes credit (speak up / let it slide) → Lunch
               → Greg's unpaid committee → 5 PM (fired / leadership offer / nothing)
WALK HOME      Barbershop · Basketball court · Straight home
EVENING        Dre's offer ──┬─ Turn it down → Application / Night shift / Rest
                             └─ Take the job → Highway (stopped) / Back streets
                                               → "One time" / "I'm in" → Walk away / Step forward
```

## The five endings

| Ending | How to reach it |
| --- | --- |
| **Excellence** (the suburbs) | Iron the shirt, get to work early with energy left, have a *great* presentation, turn Dre down, write the application |
| **The Struggle** | The default: turn Dre down without the offer, get fired, or take Dre's money just once |
| **The System** (prison) | Take Dre's job and drive the highway |
| **The Crew** (gang) | Take the back streets, tell Dre "I'm in," then walk away from the fight |
| **Gone Too Soon** (death) | Step forward in the fight, *or* run your health low (skip lunch, let things slide) and push through the night shift |

Found endings are saved in the browser with Harlowe's `(save-game:)`, so the title screen gallery remembers them between plays.

## How it works, with examples

### Meters

The four meters are set up in `SYS Init`, a passage tagged `startup`. The `SYS HUD` passage is tagged `footer`, so it runs after every passage. It keeps each meter between 0 and 100, draws the bars, and sends you to the death ending if health reaches 0.

A choice's effects go at the top of the passage that choice leads to:

```harlowe
:: W04a Skip Lunch [scene-office music-work]
{
(set: $health to it - 15)
(set: $energy to it - 10)
(set: $log to it + (a: "Skipped lunch."))
}
```

### Text that changes based on earlier choices

```harlowe
(if: $choices's pressedShirt)[Crisp collar, clean lines.]
(else:)[Creases across the chest.]
```

### Choices that only appear sometimes

```harlowe
(if: $money >= 20)[[[Stop at Lou's barbershop->E00a Barbershop]]]
(if: $energy >= 20)[[[Shoot around at the court->E00b Court]]]
[[Go straight home->E01 Evening]]
```

### Random detail, so replays feel different

```harlowe
(either: "A church choir is practicing.", "Two old men are arguing about basketball.")
```

### A choice that can only be picked once

```harlowe
(unless: (history:) contains "E01a Ask Dre")[[[“What's in the bag, Dre?”->E01a Ask Dre]]]
```

### Scenery and music

Every passage has two tags: a `scene-…` tag and a `music-…` tag.

```
:: E00 Walk Home [scene-night music-night]
```

The code in the `Story JavaScript` passage watches for these tags. It cross-fades to the matching background, drawn as SVG in code, and switches to the matching music, generated live with the Web Audio API. There are no audio files, so all the music is original. The ♪ button mutes it.

- **Scenes:** title, bedroom, street, bus, shop, office, night, home, car, warehouse, gang, suburb, struggle, prison, death
- **Music:** title, morning, street, tense, work, night, suburb, struggle, prison, gang, death

### Adding a new ending

1. Write a passage tagged `ending`, plus a scene tag and a music tag.
2. At the top, save it: `{(set: _saved to (save-game: "ending-myname", "My Ending"))}`
3. End it with `(display: "SYS Ending Footer")`.
4. Add `"ending-myname"`, its name, and a hint to the three lists in `SYS Gallery`, and change "of 5" to the new total.

## Naming conventions

- `M` = morning, `C` = commute, `W` = work, `E` = evening, `END` = endings, `SYS` = system passages
- Branches get letters: `W04a`, `W04b`, ...
- Every choice is kept in the `$choices` datamap. Add new keys to `SYS Init` first, because Harlowe throws an error if you read a key that doesn't exist.
