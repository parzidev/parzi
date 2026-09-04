# Parzi

> Engineering README reviewed from the repository state on 2026-09-05. Observed facts are separated from items that still need manual verification.

**Repository:** [parzidev/parzi](https://github.com/parzidev/parzi)  
**Visibility:** public  
**Default branch:** `main`  
**Latest GitHub push observed:** `2026-09-04T21:42:55Z`  
**Scanned HEAD:** `51d67a43556e222c5bda8a47327fe62e59077089`  
**Repository description:** Not set on GitHub.

## Purpose and scope

A long-running collection of personal websites, browser experiments, mini-games, assets, and GitHub Pages content.

The repository currently contains **1782** source-tree files, including **179** code-like files. This README describes the repository as it exists in the scanned snapshot; it is not a claim that every historical or runtime path is still active.

## Capability inventory

### README evidence

The source README exposes these sections: `Parzi Web Projects`, `What this project includes`, `Technology`, `Repository structure`, `Getting started`, `Usage notes`, `Configuration and data`, `Development and validation`, `Security and responsible use`, `Project status`, `License`.

### Detected technology profile

| `HTML` | 76 code-like files |
| `JavaScript` | 56 code-like files |
| `CSS` | 21 code-like files |
| `Python` | 14 code-like files |
| `TypeScript` | 9 code-like files |
| `TypeScript/TSX` | 3 code-like files |

### Project structure

Top-level paths observed:

- `.DS_Store`
- `.gitattributes`
- `.github`
- `.gitignore`
- `.nojekyll`
- `.vscode`
- `.well-known`
- `2311.html`
- `404.html`
- `405game.html`
- `CNAME`
- `README.md`
- `_config.yml`
- `ada`
- `adajaponcabebekx`
- `adamc`
- `ai.js`
- `aistickermarketing`
- `aistickerprivacy`
- `aistickersupport`
- `aistickerterms`
- `animatedtext.js`
- `aricimustafa`
- `assets`
- `badapple`
- `baktamammi.html`
- `banabak.html`
- `benimgozler`
- `bosklasor`
- `boxinbox`
- `brotato.html`
- `cat.js`
- `cdfaf992e56cc2ee68fadaf2fdca4e7a.html`
- `cicek`
- `cihaz.js`
- `cikarmisin`
- `colorboxes.js`
- `css`
- `cursor.js`
- `cv.html`
- `cv1.html`
- `cv2.html`
- `data`
- `dc.html`
- `dcbotdavet`
- `dckey.html`
- `deryadugun.html`
- `dogumgunu`
- `egg.html`
- `enn`
- `feetlesunum`
- `foca.html`
- `hacked_warning.jpg`
- `hacklendim.html`
- `hakanabirank`
- `havadurumu.html`
- `havadurumu.js`
- `helloworld`
- `icons`
- `images`
- `index.html`
- `ipozel.html`
- `isp.html`
- `js`
- `karpuz.html`
- `keyboardevent.js`
- `kitap.html`
- `link.html`
- `log.html`
- `logxd.html`
- `lululu`
- `monitorhz`
- `myfilms.html`
- `notlar`
- `obsranks`
- `oldindex.html`
- `p5.js`
- `password.html`
- `pixelfight`
- `pong.html`

Key entrypoint candidates:

- `ada/index.html`
- `adajaponcabebekx/index.html`
- `adamc/index.html`
- `aistickermarketing/index.html`
- `aistickerprivacy/index.html`
- `aistickersupport/index.html`
- `aistickerterms/index.html`
- `aricimustafa/index.html`
- `badapple/index.html`
- `benimgozler/index.html`
- `boxinbox/index.html`
- `boxinbox/main.js`
- `cicek/index.html`
- `cikarmisin/index.html`
- `dcbotdavet/index.html`
- `dogumgunu/index.html`
- `enn/index.html`
- `feetlesunum/index.html`
- `hakanabirank/index.html`
- `helloworld/index.html`
- `index.html`
- `js/ip-routes.json`
- `js/main.js`
- `js/server.js`
- `lululu/index.html`
- `monitorhz/index.html`
- `notlar/anayasa/index.html`
- `obsranks/index.html`
- `oldindex.html`
- `pixelfight/index.html`
- `redball/.pages-src/index.html`
- `redball/.pages-src/main.tsx`
- `redball/index.html`
- `sarkisozuseks/app.js`
- `sarkisozuseks/index.html`
- `sims/index.html`
- `tiklama/index.html`
- `ywrh/index.html`

## Architecture and runtime shape

| Area | Observed evidence |
| --- | --- |
| Entrypoint candidates | `ada/index.html`, `adajaponcabebekx/index.html`, `adamc/index.html`, `aistickermarketing/index.html`, `aistickerprivacy/index.html`, `aistickersupport/index.html`, `aistickerterms/index.html`, `aricimustafa/index.html`, `badapple/index.html`, `benimgozler/index.html` |
| Build/config manifests | `.github/workflows/static.yml`, `.github/workflows/update-github-activity.yml`, `redball/package.json` |

Interpretation boundary: filenames and manifests show where a component may start, but they do not prove deployment topology, request flow, persistence semantics, or production readiness. Those items should be confirmed against the implementation before making operational claims about the project.

## Code-level signals

The following patterns were extracted from readable code files. They are navigation aids for the next human review, not a substitute for reading the implementation:

_No code-level signals were available from the local checkout; this may be an API-only tree scan._

## Setup and operation

The most relevant source README material is reproduced below:

## Getting started

For browser-based content, serve the relevant directory over HTTP:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000/` or the selected subdirectory.

## Usage notes

- Treat each top-level project as independent unless its files indicate otherwise.
- Serve the repository locally to preserve browser fetch behavior and relative paths.
- Avoid global formatting or asset moves that could break unrelated historical pages.

## Configuration and data

- GitHub Pages publishes according to the configured branch and `CNAME`.
- Check hard-coded domain/API references before deploying a fork.
- The repository is large; use sparse checkout for one subproject.

Static setup/deployment evidence:

- Docker files: none detected
- Build/config manifests: `.github/workflows/static.yml`, `.github/workflows/update-github-activity.yml`, `redball/package.json`
- Configuration-like paths: `.vscode/settings.json`, `_config.yml`, `redball/tsconfig.json`, `redball/vite.config.ts`

### Command evidence

```bash
python3 -m http.server 8000
```

## API, integrations, and data flow

No API/integration section was detected in the source README. External boundaries require code-level review before publication.

Before publishing a public README, confirm the following from code and deployment configuration:

- inbound routes, ports, webhooks, and authentication middleware;
- outbound providers, rate limits, retries, and failure behavior;
- persistence files/databases and backup/restore expectations;
- whether any endpoint can mutate external state.

## Configuration and secrets

Detected names (names only; values were intentionally excluded):

No conventional environment-variable names were detected in the sampled manifests/entrypoints.

Configuration paths observed:

- `.vscode/settings.json`
- `_config.yml`
- `redball/tsconfig.json`
- `redball/vite.config.ts`

Do not paste real tokens, passwords, private keys, cookies, or production URLs into this README or a public README. Replace them with placeholders and document where the operator should provision them.

## Security and privacy

## Security and responsible use

- Do not add credentials to static JavaScript: GitHub Pages content is public.
- Review dependencies, remote scripts, analytics identifiers, and legacy forms before reuse.
- Confirm redistribution rights for bundled third-party media.

Minimum publication checklist:

- document trust boundaries and the intended network exposure;
- explain authentication and authorization separately;
- state whether logs, uploads, identifiers, or third-party data are retained;
- include a responsible-use note where the project interacts with Steam, Kick, Riot, Spotify, Cloudflare, or other external platforms;
- keep example configuration values synthetic.

## Validation and maintenance

## Development and validation

- Run the Python test suite with `python -m pytest` after installing development dependencies.
- Keep changes focused on the relevant module or subproject and verify the user-facing path manually before publishing.
- Do not commit generated build output, local environments, caches, logs, or credentials unless an artifact is intentionally retained as source material.

Test-like paths were detected, but no tests were executed during this documentation-only scan.

Test-like paths observed:

- `notlar/anayasa/test.html`
- `redball/assets/SpecialWorld3D-D2CmK6sw.js`
- `redball/assets/SpecialWorld3D-DDTxSiYx.js`
- `redball/assets/SpecialWorld3D-DzICDwBq.js`
- `redball/assets/SpecialWorld3D-SiWYfx6x.js`
- `redball/src/SpecialWorld3D.tsx`
- `redball/tests/cheat.test.ts`
- `redball/tests/levels.test.ts`
- `redball/tests/progress.test.ts`
- `redball/tests/rendered-html.test.mjs`
- `redball/tests/special-playability.test.ts`
- `sarkisozuseks/test.html`
- `sarkisozuseks/test_chord_extraction.py`
- `sarkisozuseks/test_chords/A#.svg`
- `sarkisozuseks/test_chords/A.svg`
- `sarkisozuseks/test_chords/A7.svg`
- `sarkisozuseks/test_chords/Ab.svg`
- `sarkisozuseks/test_chords/Am.svg`
- `sarkisozuseks/test_chords/Asus2.svg`
- `sarkisozuseks/test_chords/B.svg`
- `sarkisozuseks/test_chords/B7.svg`
- `sarkisozuseks/test_chords/Bb.svg`
- `sarkisozuseks/test_chords/Bm.svg`
- `sarkisozuseks/test_chords/C#.svg`
- `sarkisozuseks/test_chords/C#m.svg`
- `sarkisozuseks/test_chords/C.svg`
- `sarkisozuseks/test_chords/C7.svg`
- `sarkisozuseks/test_chords/Cm.svg`
- `sarkisozuseks/test_chords/D#m.svg`
- `sarkisozuseks/test_chords/D.svg`
- `sarkisozuseks/test_chords/D7.svg`
- `sarkisozuseks/test_chords/Db.svg`
- `sarkisozuseks/test_chords/Dm.svg`
- `sarkisozuseks/test_chords/Dsus2.svg`
- `sarkisozuseks/test_chords/E.svg`
- `sarkisozuseks/test_chords/E7.svg`
- `sarkisozuseks/test_chords/Eb.svg`
- `sarkisozuseks/test_chords/Em.svg`
- `sarkisozuseks/test_chords/Esus4.svg`
- `sarkisozuseks/test_chords/F#.svg`
- `sarkisozuseks/test_chords/F#m.svg`
- `sarkisozuseks/test_chords/F.svg`
- `sarkisozuseks/test_chords/Fm.svg`
- `sarkisozuseks/test_chords/G#.svg`
- `sarkisozuseks/test_chords/G#m.svg`
- `sarkisozuseks/test_chords/G.svg`
- `sarkisozuseks/test_chords/G7.svg`
- `sarkisozuseks/test_chords/Gb.svg`
- `sarkisozuseks/test_chords/Gm.svg`
- `sarkisozuseks/test_chords_viewer.html`
- `sarkisozuseks/test_format_lyrics.js`
- `sarkisozuseks/test_svg.py`
- `test.mp3`
- `testip.html`
- `tests/github-activity.test.mjs`
- `tiklama/test.png`

CI/workflow and maintenance evidence should be verified before adding badges or claiming release guarantees.

## Known gaps and verification notes

- source tree obtained from GitHub recursive tree API because the local shallow checkout failed during large repository transfer
- This was a static documentation scan; no repository code, containers, network services, or test suites were executed.
- “Detected” means a filename, README section, manifest, or sampled entrypoint matched the scanner; it is not a security audit.
- README sections may describe an older state than the current code. Compare the published README with the latest default-branch files before committing it upstream.

## Reference README material (sanitized)

The relevant source README is retained below as reference material, with credential-shaped values removed.

# Parzi Web Projects

A long-running collection of personal websites, browser experiments, mini-games, assets, and GitHub Pages content.

Rather than one framework application, this repository acts as a public web-project monorepo and historical archive. Top-level directories host largely independent experiences, while shared root files support the main domain and GitHub Pages publishing.

## What this project includes

- Multiple independent static websites and experiments
- Browser games and interactive prototypes
- Large collection of web assets
- Custom-domain and GitHub Pages configuration
- Long history documenting ongoing creative work

## Technology

- HTML
- CSS
- JavaScript
- Static media
- GitHub Pages

## Repository structure

- `index.html` — Main site entry.
- `CNAME` — Custom-domain configuration.
- `<project directories>/` — Independent sites and games.
- `assets/` — Shared media where present.

## Getting started

For browser-based content, serve the relevant directory over HTTP:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000/` or the selected subdirectory.

## Usage notes

- Treat each top-level project as independent unless its files indicate otherwise.
- Serve the repository locally to preserve browser fetch behavior and relative paths.
- Avoid global formatting or asset moves that could break unrelated historical pages.

## Configuration and data

- GitHub Pages publishes according to the configured branch and `CNAME`.
- Check hard-coded domain/API references before deploying a fork.
- The repository is large; use sparse checkout for one subproject.

## Development and validation

- Run the Python test suite with `python -m pytest` after installing development dependencies.
- Keep changes focused on the relevant module or subproject and verify the user-facing path manually before publishing.
- Do not commit generated build output, local environments, caches, logs, or credentials unless an artifact is intentionally retained as source material.

## Security and responsible use

- Do not add credentials to static JavaScript: GitHub Pages content is public.
- Review dependencies, remote scripts, analytics identifiers, and legacy forms before reuse.
- Confirm redistribution rights for bundled third-party media.

## Project status

An actively evolving personal archive. Individual subprojects may be finished, experimental, or retained for history.

## License

No repository-wide license file is currently provided. Unless the owner grants permission, all rights are reserved.
