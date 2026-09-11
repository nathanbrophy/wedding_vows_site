# The Stars Aligned

The ceremony site for Nathan & Tina Marie, September 20, 2026. Guests open it on their phones, and during the vows every screen in the room plays the same stardust sky in sync.

## How it works

- **Landing.** Stardust gathers into an N and T constellation, then the names fade in.
- **Primer.** *Ceremony* opens a short checklist: silence your phone, turn brightness up, wait for the officiant.
- **Countdown.** *Begin* schedules the start on the next 12-second boundary of the phone's clock, so everyone who taps within the same window starts at the same moment. Phones set their clocks from the network, so they usually agree to within a fraction of a second.
- **Ceremony.** Each line of the vows gets its own stardust choreography. The run is saved in `localStorage`, so reloading mid-ceremony rejoins at the right moment, and the screen is kept awake where the browser supports it.

## Layout

```
site/                          Everything GitHub Pages serves
  index.html
  styles.css
  app.js                       Sky + ceremony engine; the vows script is at the top
.github/workflows/pages.yml    Publishes site/ on every push to main
```

No build step and no dependencies. The only external request is the Cormorant Garamond font from Google Fonts.

## Editing the vows

The script is the `CEREMONY` array at the top of `site/app.js`. Each scene has how many seconds it holds (`d`), the line (`t`), an optional subline (`s`), and what the stardust does (`b`). Phones stay in sync as long as they all loaded the same version, so finish edits before guests arrive.

## Run locally

```bash
python -m http.server 8800 --directory site
```

Then open http://localhost:8800. To rehearse from the middle of the ceremony, run this in the browser console and reload (the number is how many seconds in to start):

```js
localStorage.setItem('sa_run', JSON.stringify({ mode: 'ceremony', start: Date.now() - 60 * 1000 }))
```

## Deploying

1. On GitHub, open the repository's **Settings → Pages** and set **Source** to **GitHub Actions**. Pages on a private repository needs a paid GitHub plan; on GitHub Free, make the repository public. Either way, the published site is public.
2. Push to `main`. The **Deploy site to GitHub Pages** workflow publishes `site/`, and its run page links to the live URL (normally https://nathanbrophy.github.io/wedding_vows_site/). It can also be started by hand from the Actions tab.

Design source: [The Stars Aligned](https://claude.ai/design/p/c270f2ca-33ac-45b3-8b5f-3559d962791d?file=The+Stars+Aligned.dc.html) in Claude Design.
