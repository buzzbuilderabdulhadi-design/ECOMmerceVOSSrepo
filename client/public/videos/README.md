# Video slots

Two optional background videos are referenced. **Neither file is committed.**

| Slot | Path | Used by |
| --- | --- | --- |
| Hero | `client/public/videos/hero.mp4` | `client/src/components/shared/HeroSection.tsx` |
| Lookbook | `client/public/videos/editorial.mp4` | `client/src/components/home/LookbookEditorial.tsx` |

## Current state

Until a file is added, each component renders its poster image with the
cinematic overlay instead. The `<video>` element hides itself on `error`, on
refused autoplay, and whenever the visitor has
`prefers-reduced-motion: reduce` enabled, so a missing file degrades gracefully
instead of leaving a black frame.

A missing file shows up only as a benign `net::ERR_ABORTED` entry for the
`/videos/*.mp4` request in the network tab. There is no console error and no
layout shift.

## To activate a video

1. Drop an MP4 at the path in the table above.
2. Recommended encoding: H.264 (avc1) + AAC, 1920×1080, ~6–10s loop.
3. Keep the file under ~4 MB, or the section will look soft on slow connections.
4. To swap sources, pass `videoSrc` to `<HeroSection />` or `<LookbookEditorial />`
   from `client/src/app/page.tsx`.

No code changes and no `next.config` entries are required.

