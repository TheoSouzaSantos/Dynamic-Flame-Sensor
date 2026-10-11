# Third-party assets

## flame.json

- Source: https://lottiefiles.com/free-animation/loop-fire-ugiVI2xXSb
- Author: Christopher Moran
- License: [Lottie Simple License](https://lottiefiles.com/page/license) — free for commercial use, no attribution required, modification permitted (derivative must carry the same license terms).
- Modification: removed two layers ("Layer 4", "Layer 5") that were a pair of crossed stick/log shapes at the base of the flame (not wanted for this use — the badge is just the flame, no campfire logs). Everything else (the 16 remaining flicker-tongue/base-glow shape layers) is unmodified and runs at the asset's own native `ip`/`op`.
- Previously used a different, simpler single-shape-morph flame from the same site (by Denis Senyushkin, same license) — replaced because trimming its composition to remove a blank tail cut off the fade-out that masked its loop seam, causing a visible shape "snap" each cycle. This asset doesn't have that problem: it's a proper multi-layer flicker loop, not a pop-in/morph/pop-out single shape.

## gas.json

- Source: https://lottiefiles.com/free-animation/smoke-NCJOmMtOdC
- Author: Bùi Vịnh
- License: [Lottie Simple License](https://lottiefiles.com/page/license) — same terms as above.
- Modification: none. 35 instances of one shared "smoke puff" shape, each scaling in from 0 and staggered in start time across the loop, so (like the flame asset) there's no single moment the whole thing has to hard-cut — used at its native `ip`/`op`.
- Note: this file is larger (~550 KB) than `flame.json` (~40 KB) — the AE export baked per-frame keyframes for each of the 35 instances rather than sparse keyframes with easing. Still small in absolute terms for a bundled app asset, but worth knowing if asset size becomes a concern later.
