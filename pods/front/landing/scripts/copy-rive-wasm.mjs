// Copia o rive.wasm da versão instalada para `public/rive/`.
//
// O runtime do Rive baixa esse binário de um CDN (unpkg, com fallback jsdelivr)
// e bloqueadores de anúncios barram ambos — daí servirmos do nosso domínio.
// Como o .wasm precisa casar com a versão do pacote JS, ele é copiado a cada
// `dev`/`build` em vez de ficar versionado no git.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("@rive-app/canvas/package.json"));

mkdirSync("public/rive", { recursive: true });
copyFileSync(join(pkgDir, "rive.wasm"), join("public", "rive", "rive.wasm"));
