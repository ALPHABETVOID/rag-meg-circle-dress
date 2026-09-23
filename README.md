# Rag Meg — Circle Dress

A browser game by ALPHABETVOID. Open `index.html` or play on GitHub Pages.

The nine-act journey keeps Meg as a faceless cloth rag inside her circle dress. Acts III–IX add 23 areas, 47 puzzles and 102 persistent puzzle stages:

- III: rotating house interiors and water-weight plates
- IV: remembered cloth folds, moving laundry hangers and dryer air
- V: dye fountains, primary-color mixing and patterned color platforms
- VI: water ballast, wind, aerial water delivery, gliding and spring landings
- VII: cloth silhouettes, moving frames and combined spatial requirements
- VIII: recordings that replay Meg’s motion and occupy reflection pads
- IX: three branches, a final circuit and a clear ending with credits

After completing **The Door Remembers** in **Home, Differently**, enter the new inside-out door. Existing saves continue without resetting. The old homecoming is no longer the final ending. The final coat hook ends Act IX; wandering remains available afterward.

Controls and room-specific guidance are in Settings. MAP travels to visited rooms. New controls unlock during progression: FOLD / F and ECHO / E. On touch screens, use the joystick, FLY, POKE and SQUEEZE. Dye colors also have symbols.

## Verification

```sh
npm install --no-save @napi-rs/canvas
node tests/campaign.cjs
```

The tests run the game in a Node VM with a minimal DOM and real canvas. They exercise all campaign stages with the actual cloth/dress integrator, prerequisite gates, water and color restrictions, recordings, save migration, partial progress, the ending, the original seam/dress transition, map rendering and reset. They also render representative scenes to the system temporary directory. This is not a browser or iOS automation suite, and is not a timed human playthrough.

Progress uses the existing `rag-meg-circle-dress-save-v3` key. Each new puzzle stage is saved independently. Echo recordings are temporary and are cleared on travel; completed echo puzzle stages remain saved.
