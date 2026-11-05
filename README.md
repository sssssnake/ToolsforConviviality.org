# Tools for Conviviality

The source of [toolsforconviviality.org](https://toolsforconviviality.org), a directory of small, independent software scored from 0 to 5 on six questions taken from Ivan Illich's book *Tools for Conviviality* (1973). It is made by Jeffrey Humble in Berlin.

The site is plain static files served from this repository, with no server, no database and no accounts. If the domain or the host ever goes away, anyone can rebuild and host the site from this repository, which is the reason it is built this way.

## How it is put together

The whole app lives in one file, `scripts/shell.html`: a single page of vanilla JavaScript, with the data held in arrays near the top (`CATS` for categories, `TOOLS` for directory entries, `BENCH` for reviews of big products, `HL` for each tool's three highlights, `CATCOPY` for category text and `PAIRS` for side-by-side comparisons). A build step opens every route in a headless browser and saves the finished page as a real HTML file, so the content is there for search engines and for anyone with scripts off. The app script itself is written once to `assets/app.<hash>.js`, and every page links to that one file.

The generated files are committed, because GitHub Pages serves them straight from the `main` branch. That means most of the files in this repository are build output: edit `scripts/shell.html`, `data/tools.json` and the other files in `scripts/`, then rebuild.

## Building

You need Node 22 and a Chromium or Chrome browser.

```
npm ci
npx playwright install chromium     # or set CHROME_PATH to a browser you already have
node scripts/prerender.mjs
```

The prerender step rewrites every page, the sitemap, the 404 page and the badges in `badges/`. It takes a couple of minutes. To preview the result, serve the repository root with any static file server and make sure unknown addresses return `404.html`.

## Adding or changing a tool

Edit the arrays in `scripts/shell.html`. A new tool needs an entry in `TOOLS` and an `HL` entry with three bullet points, and a new category also needs a `CATCOPY` entry. Mind that `BENCH` ends with `].map(...)` and not a plain `];`. Add the tool to `data/tools.json` as well (its slug, name, website and, if it has one, its GitHub `repo`), because the image capture and the health check both read that file. Then run the prerender step.

The capture bot commits to `main` often, so run `git pull --rebase origin main` before you push.

## Pictures

`scripts/capture.mjs` collects a screenshot, an icon and a colour for each tool in `data/tools.json`. It identifies itself, obeys each site's `robots.txt`, visits one tool at a time with a pause between them, and skips any tool whose entry says `"images": false`, which is how a maker opts out. A GitHub Action runs it whenever `data/tools.json` changes. `npm run capture:test` runs it against a local fixture.

## Weekly health check

`scripts/health.mjs` visits every tool's website and asks GitHub whether a listed `repo` is archived or has gone quiet for a year. A GitHub Action runs it on Mondays and opens, updates or closes one issue with what it found.

## Hosting somewhere else

GitHub Pages serves this from the root of `main`, and the `CNAME` file sets the custom domain. Any static host works if it serves `404.html` for unknown addresses. To use another domain, search for `toolsforconviviality.org` in `scripts/`, `CNAME`, `robots.txt` and `llms.txt`, change it, and run the prerender step.

## Licences

The code is under the MIT licence (`LICENSE`). The written reviews, scores and directory data are under CC BY 4.0 (`CONTENT-LICENSE.md`). That licence does not cover the logos, icons and screenshots of the tools we review, which belong to their makers, nor the project's name and mark.

The fonts in `fonts/` are Instrument Sans, IBM Plex Mono and Oswald, each released under the SIL Open Font License 1.1 by its designers. The licence texts are not copied into this repository yet.
