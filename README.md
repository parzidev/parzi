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
