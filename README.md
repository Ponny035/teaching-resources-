# Teaching Resources

Interactive, dependency-free web pages for teaching. Plain HTML/CSS/JS — no build step — so it works as-is on GitHub Pages.

## Layout

```
index.html                    Hub: lists every subject
assets/
  css/site.css                Shared styles (light + dark, chart colours)
  js/chart.js                 Tiny SVG chart/slider helper (window.TR)
microeconomics/               ← one folder per subject
  index.html                  Course page: lists the sessions
  01-consumer-choice/         Each session = index.html + app.js
  02-demand-supply/
  03-firms-costs/
  04-market-power/
  05-game-theory-externalities/
```

## Adding a new resource

**New session in an existing subject**
1. Copy a session folder (e.g. `microeconomics/03-firms-costs/`) to `microeconomics/06-your-topic/`.
2. Edit its `index.html` (text) and `app.js` (interactive bits).
3. Add a card for it in `microeconomics/index.html`.

**New subject** (e.g. `macroeconomics/`)
1. Create the folder with its own `index.html` (copy `microeconomics/index.html`; asset links are `../assets/...`).
2. Add a card for it in the root `index.html`.

Pages in `subject/session/` load shared files with `../../assets/...`. Always use **relative** links so the site works under a `github.io/<repo>/` sub-path.

## Chart helper (`assets/js/chart.js`)

```js
var c = TR.chart('#my-chart', { xmax: 100, ymax: 100, xlabel: 'Quantity', ylabel: 'Price' });
c.render = function (c) {                 // draw in DATA coordinates
  c.line(0, 90, 90, 0, 'demand', { drag: 'D' });   // draggable line
  c.poly([[0,90],[40,50],[0,50]], 'demand');       // shaded area
  c.handle('D', 20, 70);                           // grab handle
};
c.onDrag = function (id, x, y, start) { /* update state */ c.draw(); };
c.draw();
```

Also: `TR.slider`, `TR.seg` (button group), `TR.button`, `TR.stats`, `TR.message`, `TR.legend`.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish on GitHub Pages

Repo **Settings → Pages → Deploy from a branch →** pick your branch (`main`/`master`) and folder `/ (root)`. The site appears at `https://<user>.github.io/<repo>/`.

## Colour conventions

Demand/consumers = blue · supply/MC/producers = orange · MR/AVC = aqua · ATC/social cost = violet · AFC = magenta · loss/DWL = red · profit = green · tax revenue = gold.
