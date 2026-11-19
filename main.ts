// Vice Story entry program (Node 22, standard library only).
//
// It hands the app in: copy this repo's app/ and screenshots/ into the output
// directory and write dossier.json there, built by the vendored make.fun
// library (vendor/makefun-app.ts, unchanged). The grader runs this program
// twice in a fresh container with no network; both runs must write the same
// bytes. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The app itself is plain static files under app/: index.html plus its ES
// modules, the Anton font (SIL OFL) and two image-model sample photos. It
// opens offline in desktop Chrome and never uploads a photo.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Dossier caps mirror the gate: at most 4 screenshots of 256 KiB, app/ at
// most 993 files and 48 MiB, and the dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
