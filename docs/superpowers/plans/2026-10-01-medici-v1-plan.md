# Medici v1 — Twenty Playable Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All twenty levels of the radtech game playable end to end in the browser on the client's delivered art, with "Awaiting client" wherever the case database is silent, ready for a preview URL.

**Architecture:** A Vite + React 19 single page with no router: one `useReducer` store drives a screen state machine (`title → levelSelect → level(n) → results(n)`) inside a fixed 960×640 `<Stage>` that is CSS-scaled to the viewport. A level is six stage components run in sequence by a `Level` runner. Each stage reports one piece of a `CaseResult`, and pure functions in `src/game/rules.ts` turn that into mistakes, stars, and the sealed film. Level content is twenty zod-validated JSON files; assets are resolved from `src/assets/` by `import.meta.glob`, keyed by the client's filenames.

**Tech Stack:** Node 22, npm, Vite, React 19, TypeScript, zod, vitest, Playwright (Chromium), ESLint.

**Spec:** `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`, revised 2026-10-01. Read §4.3–§4.5 (loop, film, debrief), §5 (data model, placeholder values, level table), §6 (scoring), §7 (assets) and §9 (acceptance criteria) before starting any task.

## Global Constraints

- Shell commands are PowerShell (Windows 11). Node 22, npm; `package-lock.json` is canonical — never pnpm/yarn/bun.
- Work on branch `feat/v1-playable`. Conventional Commits whose messages say why. **Never push, force-push, or open a PR.** Never commit `.env*` or anything under `Medici Project/`.
- Stack: Vite + React 19 + TypeScript, DOM-first; `zod` for level and save validation. No state library, no router, no UI kit, no component-testing library.
- **Deviation from spec §3, flag to Vai:** `motion` and `prettier` are not installed. CSS keyframes cover the three tweens the spec names (slide-in, pop, shake), and the gate has no format check. Add `motion` only when a tween CSS cannot do.
- Stage is 960×640 stage pixels, letterboxed with `transform: scale()`. The page never scrolls; only the level-select card list and the results debrief scroll, inside the stage.
- Save: one `localStorage` key `medici.save.v1`, shape `{ version: 1, unlocked: number, stars: Record<number, 0|1|2|3>, settings: { sound: boolean } }`. Missing or corrupt → fresh save, no crash.
- Scoring (spec §6): mistakes come only from position (max 1), kVp (1), mAs (1), and collimation (max 1, however many attempts). Stars: 0 → 3, 1–2 → 2, 3+ → 1. No fail state; finishing unlocks the next level; best stars are kept.
- The film is `filmFor(kvp, mas)` alone; `under` wins a low/high disagreement. **No `xray-*` asset may render before the results screen**, and neither may `findings`.
- Timers are always on: position 60 s, technique 45 s. No hints anywhere. Pose thumbnails carry no text label during play.
- Every `null` sentence in level data renders as the literal text **`Awaiting client`**. Never invent medical content to fill one.
- Asset ids are the client's filenames without extension (spec §7.1). Film ids are derived: `xray-<films.slug>-<good|under|over>`. Films are never generated, and their burned-in Radiopaedia credit is never cropped (`object-fit: contain`).
- Report criteria and outcome separately. Never write the bare word "verified". A check that never failed proves nothing; each task states what its tests are predicted to fail with before the implementation exists.

## Review Focus

The five conditions the spec implies but does not test, most likely to bite a real student first. Each has a test in the task named.

1. **Browser storage blocked or throwing** (private browsing, storage disabled): the game still boots on a fresh save and plays, and writes fail silently. → Task 5, `save.test.ts`.
2. **A hand-edited or future-version save** (`unlocked: 25`, a star count of 7): treated as corrupt and replaced by a fresh save, never an unlock past level 20. → Task 5, `save.test.ts`.
3. **Touch: a quick tap on a pose commits it; a long-press only previews it.** A student checking a pose on a phone must not lose the case to the preview gesture. → Task 7, `position.spec.ts` (mobile project).
4. **The mouse slides off the exposure button during rotor prep**: the exposure aborts with the hold prompt and never fires, so the film cannot be taken by accident. → Task 8, `case.spec.ts`.
5. **A double-tap on a pose or on Confirm** is counted and advanced once, and never skips the following stage. → Task 7 (`position.spec.ts`) and Task 8 (`case.spec.ts`).

## File map

```text
.gitignore                     + Medici Project/
.node-version                  22 (Cloudflare Pages reads it)
index.html  package.json  tsconfig.json  vite.config.ts  eslint.config.js  playwright.config.ts
src/
  main.tsx                     mounts <App/> inside <Stage/>
  styles.css                   all CSS, one file, appended task by task
  assets.ts                    manifest from src/assets/** by import.meta.glob; assetUrl(), filmId()
  assets/                      the client's 134 files: patients/ radtech/ backgrounds/ poses/ films/ ui/ sounds/
  audio.ts                     play(id), startAmbience(), setSound()
  app/  Stage.tsx  App.tsx  store.ts  save.ts
  game/ rules.ts               pure scoring: checkTechnique, filmFor, checkCollimation, mistakes, stars
  data/ schema.ts  levels.ts  levels/01-pulmonary-edema.json … 20-skull-fracture.json
  ui/   Img.tsx  Copy.tsx  Stars.tsx  OrderCard.tsx  TimerRing.tsx  Dial.tsx
  stages/ Level.tsx  Intake.tsx  Order.tsx  Position.tsx  Technique.tsx  Collimate.tsx  Expose.tsx
  screens/ Title.tsx  LevelSelect.tsx  Settings.tsx  Results.tsx
tests/
  unit/  stage.test.ts  assets.test.ts  rules.test.ts  schema.test.ts  levels.test.ts  save.test.ts  store.test.ts
  e2e/   helpers.ts  stage.spec.ts  shell.spec.ts  position.spec.ts  case.spec.ts
docs/client/level-content-sheet.md   rewritten in Task 9
```

---

### Task 1: Scaffold, the gate, and the letterboxed Stage

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`, `index.html`, `.node-version`, `src/main.tsx`, `src/styles.css`, `src/app/Stage.tsx`, `tests/unit/stage.test.ts`, `tests/e2e/stage.spec.ts`
- Modify: `.gitignore`, `CLAUDE.md` (Commands section)

**Interfaces:**
- Produces: `fitScale(viewportW: number, viewportH: number): number`, `STAGE_W = 960`, `STAGE_H = 640`, and `<Stage>{children}</Stage>` (renders `data-testid="stage"`) in `src/app/Stage.tsx`. npm scripts `dev`, `build`, `typecheck`, `lint`, `test`, `e2e`, `qa`.

- [ ] **Step 1: Commit the reconciled docs, then branch**

The spec reconciliation and this plan are uncommitted on `main`. Commit them there by path, because the rest of the plan builds on them, and then branch.

```powershell
git add CLAUDE.md CHANGELOG.md README.md docs/superpowers docs/brief/case-database-2026-09.md
git commit -m "docs: reconcile spec with the client's case list and art delivery, add v1 plan" -m "The client's LIST OF CASES.docx and art delivery changed level 1, the sections, and every asset name; the plan has to argue from a spec that matches them."
git switch -c feat/v1-playable
```

- [ ] **Step 2: Create the npm project and install dependencies**

```powershell
npm init -y
npm pkg set name=medici type=module
npm pkg set private=true --json
npm pkg delete main
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview" scripts.typecheck="tsc --noEmit" scripts.lint="eslint ." scripts.test="vitest run" scripts.e2e="playwright test" scripts.qa="npm run typecheck && npm run lint && npm run test && npm run e2e"
npm install react react-dom zod
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks globals
npx playwright install chromium
```

Expected: `package-lock.json` created and `node_modules/` populated; Chromium downloads.

- [ ] **Step 3: Write the config files**

`tsconfig.json` — one config for app, tests, and tool configs:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
})
```

`eslint.config.js` — only the two classic hook rules, because the plugin's newer `recommended` preset adds compiler rules this plan has not been written against:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
)
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-landscape', use: { ...devices['Pixel 5 landscape'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Radtech Simulator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.node-version`:

```text
22
```

Append to `.gitignore`:

```text

# client delivery — source docs and original art, kept locally (the art is copied into src/assets)
Medici Project/
```

- [ ] **Step 4: Write the failing tests**

`tests/unit/stage.test.ts` — the expected scales are hand-calculated from 960×640:

```ts
import { describe, it, expect } from 'vitest'
import { fitScale } from '../../src/app/Stage'

describe('fitScale', () => {
  it('fills a 3:2 viewport exactly', () => expect(fitScale(1920, 1280)).toBe(2))
  it('is limited by height in a wide viewport', () => expect(fitScale(1280, 640)).toBe(1))
  it('is limited by width in a tall viewport', () => expect(fitScale(480, 640)).toBe(0.5))
  it('shrinks below 1 on a phone in landscape', () => expect(fitScale(851, 393)).toBeCloseTo(393 / 640, 6))
})
```

`tests/e2e/stage.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('the stage is letterboxed at 3:2 and centred', async ({ page }) => {
  await page.goto('/')
  const box = (await page.getByTestId('stage').boundingBox())!
  const vp = page.viewportSize()!
  expect(box.width / box.height).toBeCloseTo(1.5, 2)
  expect(Math.min(vp.width - box.width, vp.height - box.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x - (vp.width - box.width) / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y - (vp.height - box.height) / 2)).toBeLessThanOrEqual(1)
})

test('portrait asks the player to rotate', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 })
  await page.goto('/')
  await expect(page.getByText('Turn your device sideways to play.')).toBeVisible()
})

test('landscape does not', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Turn your device sideways to play.')).toBeHidden()
})
```

- [ ] **Step 5: Add a naive Stage and watch the tests fail**

`src/app/Stage.tsx`, deliberately unscaled:

```tsx
import type { ReactNode } from 'react'

export const STAGE_W = 960
export const STAGE_H = 640
export const fitScale = (w: number, h: number) => (w > 0 && h > 0 ? 1 : 1)

export function Stage({ children }: { children: ReactNode }) {
  return <div data-testid="stage">{children}</div>
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage } from './app/Stage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Stage>
      <p>Radtech Simulator</p>
    </Stage>
  </StrictMode>,
)
```

`src/styles.css` (empty file for now).

Run: `npx vitest run tests/unit/stage.test.ts`
Expected: 3 FAIL with `expected 1 to be 2`, `expected 1 to be 0.5`, and `expected 1 to be close to 0.614…`; "is limited by height" passes, because 1 is its correct answer — it is a guard, not the proof.

Run: `npx playwright test tests/e2e/stage.spec.ts`
Expected: "letterboxed" FAILS on its ratio assertion (the unstyled div is full-width and short); "portrait asks" FAILS because the text is not on the page; "landscape does not" passes as a guard.

- [ ] **Step 6: Implement the Stage**

`src/app/Stage.tsx`:

```tsx
import { useLayoutEffect, useState, type ReactNode } from 'react'

export const STAGE_W = 960
export const STAGE_H = 640

/** The largest scale at which the whole 960×640 stage fits the viewport. */
export const fitScale = (w: number, h: number) => Math.min(w / STAGE_W, h / STAGE_H)

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(() => fitScale(window.innerWidth, window.innerHeight))
  useLayoutEffect(() => {
    const fit = () => setScale(fitScale(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="viewport">
      <div className="stage" data-testid="stage" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
      <div className="rotate">Turn your device sideways to play.</div>
    </div>
  )
}
```

`src/styles.css`:

```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; overflow: hidden; background: #1b1512; }
body { font-family: system-ui, sans-serif; color: #3a2a22; }

/* Flex centring also centres an overflowing child, so a stage scaled below 1 stays centred. */
.viewport { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
.stage {
  position: relative; flex: none; width: 960px; height: 640px; overflow: hidden;
  background: #efe6d8; touch-action: none; user-select: none; -webkit-user-select: none;
}
.rotate { display: none; }
@media (orientation: portrait) and (max-width: 900px) {
  .rotate {
    display: flex; position: fixed; inset: 0; z-index: 100; align-items: center; justify-content: center;
    padding: 24px; text-align: center; font-size: 20px; background: #1b1512; color: #efe6d8;
  }
}
```

- [ ] **Step 7: Run the tests and the whole gate**

Run: `npx vitest run tests/unit/stage.test.ts` → 4 PASS.
Run: `npm run qa`
Expected: typecheck, lint, 4 unit tests, and 6 e2e tests (3 × 2 projects) all PASS.

- [ ] **Step 8: Update CLAUDE.md's Commands section**

Replace the heading `## Commands (once scaffolded)` with `## Commands`, and add one line under its list:

```markdown
- `npm run build` — production build to `dist/` (Cloudflare Pages: build command `npm run build`, output `dist`)
```

- [ ] **Step 9: Commit**

```powershell
git add package.json package-lock.json tsconfig.json vite.config.ts eslint.config.js playwright.config.ts index.html .node-version .gitignore src tests CLAUDE.md
git commit -m "feat: scaffold the app with the qa gate and a letterboxed 960x640 stage" -m "Every later task is judged by npm run qa, so the gate and the fixed stage come first."
```

---

### Task 2: Client art in, asset manifest, and the placeholder box

**Files:**
- Create: `src/assets/**` (134 files copied), `src/assets.ts`, `src/ui/Img.tsx`, `tests/unit/assets.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, in `src/assets.ts`: `MANIFEST: Record<string, string>` (id → URL), `FILE_COUNT: number`, `assetUrl(id: string): string | undefined`, `filmId(slug: string, film: 'good' | 'under' | 'over'): string`. In `src/ui/Img.tsx`: `<Img id className? alt? style? />`, which renders `<img data-asset={id}>`, or a grey `div.placeholder` with `data-asset={id}` showing the id when the file is missing.

- [ ] **Step 1: Write the failing tests**

`tests/unit/assets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MANIFEST, FILE_COUNT, assetUrl, filmId } from '../../src/assets'
import { Img } from '../../src/ui/Img'

// Every id the shell and stages name directly; the per-level ids are checked in levels.test.ts.
const SHELL_IDS = [
  'logo', 'bg-title', 'bg-reception', 'bg-xray-room', 'bg-console', 'bg-viewer',
  'dial', 'dial-needle', 'knob', 'star-full', 'star-empty', 'icon-lock', 'icon-back', 'icon-settings',
  'chat-bubble', 'order-card', 'radtech-hand-button', 'radtech-hand-button-pressed',
  'sfx-click', 'sfx-wrong', 'sfx-correct', 'sfx-xray', 'ambience-clinic',
]

describe('asset manifest', () => {
  it('holds all 134 delivered files', () => expect(FILE_COUNT).toBe(134))
  it('has one id per file — no two files share a basename', () =>
    expect(Object.keys(MANIFEST)).toHaveLength(FILE_COUNT))
  it('resolves every id the shell uses', () =>
    expect(SHELL_IDS.filter((id) => !assetUrl(id))).toEqual([]))
  it('normalises the client filenames', () => {
    expect(assetUrl('btn-small')).toBeTruthy() // delivered as "btn-small (1).png"
    expect(assetUrl('btn-small (1)')).toBeUndefined()
  })
  it('returns undefined for an id nobody delivered', () => expect(assetUrl('not-delivered')).toBeUndefined())
  it('derives film ids from a slug', () => expect(filmId('ptb', 'under')).toBe('xray-ptb-under'))
})

describe('Img', () => {
  it('renders a labelled grey box for a missing file', () => {
    const html = renderToStaticMarkup(createElement(Img, { id: 'not-delivered' }))
    expect(html).toContain('class="placeholder"')
    expect(html).toContain('data-asset="not-delivered"')
    expect(html).toContain('>not-delivered<')
    expect(html).not.toContain('<img')
  })
  it('renders the file when it exists', () => {
    const html = renderToStaticMarkup(createElement(Img, { id: 'logo' }))
    expect(html).toContain('<img')
    expect(html).toContain('data-asset="logo"')
  })
})
```

- [ ] **Step 2: Copy the client's files into `src/assets/`**

Ids come from filenames, so normalise as the files are copied. Drop the ` (1)` download suffix, lowercase, and take the logo from `Web Game Logo.png`, skipping the interface folder's `logo.png`, which is a mislabelled JPEG (spec §7.1). Pose files arrive in region subfolders and are flattened.

```powershell
$src = 'Medici Project'
$groups = [ordered]@{
  'Asset_ Patients' = 'patients'; 'Asset_ Radtech' = 'radtech'; 'Asset_ Backgrounds' = 'backgrounds'
  'Asset_ Positioning Previews' = 'poses'; 'Asset_ X-ray Films' = 'films'; 'Asset_ Interface' = 'ui'; 'Asset_ Sounds' = 'sounds'
}
foreach ($g in $groups.GetEnumerator()) {
  $dest = "src/assets/$($g.Value)"
  New-Item -ItemType Directory -Force $dest | Out-Null
  Get-ChildItem -Recurse -File "$src/$($g.Key)" |
    Where-Object { -not ($g.Key -eq 'Asset_ Interface' -and $_.Name -eq 'logo.png') } |
    ForEach-Object { Copy-Item $_.FullName "$dest/$(($_.Name -replace ' \(1\)', '').ToLower())" }
}
Copy-Item "$src/Web Game Logo.png" 'src/assets/ui/logo.png'
(Get-ChildItem -Recurse -File src/assets).Count
```

Expected: `134` (8 patients + 3 radtech + 5 backgrounds + 28 poses + 60 films + 25 interface + 5 sounds).

- [ ] **Step 3: Add naive versions and watch the tests fail**

`src/assets.ts`, keyed by full path rather than by id:

```ts
const files = import.meta.glob('./assets/**/*.{png,jpg,mp3}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

export const FILE_COUNT = Object.keys(files).length
export const MANIFEST: Record<string, string> = files
export const assetUrl = (id: string): string | undefined => MANIFEST[id]
export const filmId = (slug: string, film: 'good' | 'under' | 'over') => `xray-${slug}-${film}`
```

`src/ui/Img.tsx`, with no placeholder:

```tsx
import { assetUrl } from '../assets'

export function Img({ id }: { id: string }) {
  return <img src={assetUrl(id)} data-asset={id} />
}
```

Run: `npx vitest run tests/unit/assets.test.ts`
Expected FAIL, three tests:
- "resolves every id the shell uses": `expected [ 'logo', … ] to equal []`, because the naive keys are full paths.
- "normalises the client filenames": `btn-small` is undefined, for the same reason.
- "renders a labelled grey box": `expected '<img data-asset="not-delivered"/>' to contain 'class="placeholder"'`.

The other five pass against the naive version and are guards: the count and collision tests on the copy step, the unknown-id and film-id tests on trivial code, and "renders the file when it exists", whose naive `<img>` already contains `<img`. Its `src` is only proven by the shell tests in Task 6 showing real art.

- [ ] **Step 4: Implement**

`src/assets.ts`:

```ts
/**
 * Every file under src/assets/, keyed by the client's filename without its extension (spec §7.1).
 * Built from disk, so there is no hand-kept list to drift from what was delivered.
 */
const files = import.meta.glob('./assets/**/*.{png,jpg,mp3}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

const idOf = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '')

export const FILE_COUNT = Object.keys(files).length
export const MANIFEST: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [idOf(path), url]),
)
export const assetUrl = (id: string): string | undefined => MANIFEST[id]
export const filmId = (slug: string, film: 'good' | 'under' | 'over') => `xray-${slug}-${film}`
```

`src/ui/Img.tsx`:

```tsx
import type { CSSProperties } from 'react'
import { assetUrl } from '../assets'

type Props = { id: string; className?: string; alt?: string; style?: CSSProperties }

/** An asset by id. A file nobody has delivered renders as a grey box labelled with its id (spec §7.4). */
export function Img({ id, className, alt = '', style }: Props) {
  const url = assetUrl(id)
  if (!url) {
    return (
      <div className={className ? `${className} placeholder` : 'placeholder'} style={style}
        data-asset={id} role="img" aria-label={`Missing art: ${id}`}>
        {id}
      </div>
    )
  }
  return <img src={url} className={className} style={style} alt={alt} data-asset={id} draggable={false} />
}
```

Append to `src/styles.css`:

```css
.placeholder {
  display: flex; align-items: center; justify-content: center; text-align: center; word-break: break-all;
  min-width: 40px; min-height: 40px; background: #9a9a9a; color: #222; border: 2px dashed #555;
  font: 12px/1.2 ui-monospace, monospace;
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/unit/assets.test.ts` → 8 PASS.
Run: `npm run qa` → PASS.

If vitest reports it cannot resolve the `?url` query, drop `query: '?url'` from both globs. A default import of an image is also its URL under Vite, and the tests do not change.

- [ ] **Step 6: Commit**

```powershell
git add src/assets src/assets.ts src/ui/Img.tsx src/styles.css tests/unit/assets.test.ts
git commit -m "feat: add the client's art under their own filenames with a disk-built manifest" -m "Adopting the client's names keeps both sides talking about the same files; a missing one shows as a labelled grey box instead of breaking the game."
```

---

### Task 3: Scoring rules

**Files:**
- Create: `src/game/rules.ts`, `tests/unit/rules.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, in `src/game/rules.ts`:
  - `type DialSpec = { target: number; tolerance: number; step: number }`
  - `type CollimationSpec = { target: { w: number; h: number }; tolerance: number }`
  - `type Film = 'good' | 'under' | 'over'`
  - `type CaseResult = { pose: string | null; kvp: number; mas: number; collimationFailures: number }` — `pose` is the chosen pose's image id, or `null` when the position timer ran out
  - `type ScoredLevel = { position: { options: { image: string; correct: boolean }[] }; technique: { kvp: DialSpec; mas: DialSpec } }` — the zod `Level` from Task 4 satisfies it structurally
  - `checkTechnique(value: number, d: DialSpec): boolean`
  - `filmFor(kvp: number, mas: number, t: { kvp: DialSpec; mas: DialSpec }): Film`
  - `checkCollimation(field: { w: number; h: number }, c: CollimationSpec): boolean`
  - `mistakes(r: CaseResult, level: ScoredLevel): number`
  - `stars(mistakeCount: number): 1 | 2 | 3`

- [ ] **Step 1: Write the failing tests**

Expected values come from spec §4.4, §5, §6, and hand arithmetic: level 1's kVp is 125 ± 13, so 112 and 138 are the inclusive edges; level 2's mAs is 2.5 ± 0.3, so 2.2 and 2.8 are.

`tests/unit/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkTechnique, filmFor, checkCollimation, mistakes, stars, type CaseResult } from '../../src/game/rules'

const kvp = { target: 125, tolerance: 13, step: 1 }
const mas = { target: 2.5, tolerance: 0.3, step: 0.1 }
const technique = { kvp, mas }
const level = {
  position: { options: [
    { image: 'pose-chest-ap', correct: false },
    { image: 'pose-chest-lateral', correct: false },
    { image: 'pose-chest-pa', correct: true },
  ] },
  technique,
}
const clean: CaseResult = { pose: 'pose-chest-pa', kvp: 125, mas: 2.5, collimationFailures: 0 }

describe('stars', () => {
  it('maps 0/1/2/3/4 mistakes to 3/2/2/1/1', () => expect([0, 1, 2, 3, 4].map(stars)).toEqual([3, 2, 2, 1, 1]))
})

describe('checkTechnique', () => {
  it('accepts the inclusive kVp edges', () => {
    expect(checkTechnique(112, kvp)).toBe(true)
    expect(checkTechnique(138, kvp)).toBe(true)
  })
  it('rejects one step outside kVp', () => {
    expect(checkTechnique(111, kvp)).toBe(false)
    expect(checkTechnique(139, kvp)).toBe(false)
  })
  it('accepts the inclusive mAs edges despite floating point (2.5 - 2.2 = 0.30000000000000027)', () => {
    expect(checkTechnique(2.2, mas)).toBe(true)
    expect(checkTechnique(2.8, mas)).toBe(true)
  })
  it('rejects one step outside mAs', () => {
    expect(checkTechnique(2.1, mas)).toBe(false)
    expect(checkTechnique(2.9, mas)).toBe(false)
  })
})

describe('filmFor', () => {
  it('is good when both are in tolerance', () => expect(filmFor(125, 2.5, technique)).toBe('good'))
  it('is under when kVp is low', () => expect(filmFor(100, 2.5, technique)).toBe('under'))
  it('is under when mAs is low', () => expect(filmFor(125, 2.0, technique)).toBe('under'))
  it('is over when kVp is high', () => expect(filmFor(140, 2.5, technique)).toBe('over'))
  it('is over when mAs is high', () => expect(filmFor(125, 3.0, technique)).toBe('over'))
  it('is under when kVp is low and mAs high — under wins (spec §4.4)', () =>
    expect(filmFor(100, 3.0, technique)).toBe('under'))
  it('is under when kVp is high and mAs low — under wins either way round', () =>
    expect(filmFor(140, 2.0, technique)).toBe('under'))
  it('takes kVp, mAs, and the technique spec only — position and collimation cannot reach it', () =>
    expect(filmFor.length).toBe(3))
})

describe('checkCollimation', () => {
  const c = { target: { w: 60, h: 70 }, tolerance: 5 }
  it('accepts both dimensions at the inclusive edges', () => {
    expect(checkCollimation({ w: 65, h: 75 }, c)).toBe(true)
    expect(checkCollimation({ w: 55, h: 65 }, c)).toBe(true)
  })
  it('rejects when only width is off', () => expect(checkCollimation({ w: 66, h: 70 }, c)).toBe(false))
  it('rejects when only height is off', () => expect(checkCollimation({ w: 60, h: 76 }, c)).toBe(false))
})

describe('mistakes', () => {
  it('is 0 for a clean case', () => expect(mistakes(clean, level)).toBe(0))
  it('is 1 for a wrong pose', () => expect(mistakes({ ...clean, pose: 'pose-chest-ap' }, level)).toBe(1))
  it('is 1, not 2, when the position timer ran out', () => expect(mistakes({ ...clean, pose: null }, level)).toBe(1))
  it('counts kVp and mAs separately', () => expect(mistakes({ ...clean, kvp: 100, mas: 3.0 }, level)).toBe(2))
  it('counts three failed collimation attempts as 1', () =>
    expect(mistakes({ ...clean, collimationFailures: 3 }, level)).toBe(1))
  it('costs nothing when the technique timer submits dials already in tolerance', () =>
    expect(mistakes({ ...clean, kvp: 112, mas: 2.8 }, level)).toBe(0))
  it('caps at 4', () =>
    expect(mistakes({ pose: null, kvp: 40, mas: 0.5, collimationFailures: 9 }, level)).toBe(4))
})
```

- [ ] **Step 2: Add naive rules and watch them fail**

`src/game/rules.ts` — the obvious first attempt, with every trap the spec warns about left in:

```ts
export type DialSpec = { target: number; tolerance: number; step: number }
export type CollimationSpec = { target: { w: number; h: number }; tolerance: number }
export type Film = 'good' | 'under' | 'over'
export type CaseResult = { pose: string | null; kvp: number; mas: number; collimationFailures: number }
export type ScoredLevel = {
  position: { options: { image: string; correct: boolean }[] }
  technique: { kvp: DialSpec; mas: DialSpec }
}

export const checkTechnique = (value: number, d: DialSpec) => Math.abs(value - d.target) <= d.tolerance

export function filmFor(kvp: number, mas: number, t: { kvp: DialSpec; mas: DialSpec }): Film {
  if (!checkTechnique(kvp, t.kvp)) return kvp < t.kvp.target ? 'under' : 'over'
  if (!checkTechnique(mas, t.mas)) return mas < t.mas.target ? 'under' : 'over'
  return 'good'
}

export const checkCollimation = (field: { w: number; h: number }, c: CollimationSpec) =>
  Math.abs(field.w - c.target.w) <= c.tolerance

export function mistakes(r: CaseResult, level: ScoredLevel): number {
  const correctPose = level.position.options.find((o) => o.correct)?.image
  return Number(r.pose !== correctPose) + Number(!checkTechnique(r.kvp, level.technique.kvp)) +
    Number(!checkTechnique(r.mas, level.technique.mas)) + r.collimationFailures
}

export const stars = (mistakeCount: number) => 3 - mistakeCount
```

Run: `npx vitest run tests/unit/rules.test.ts`
Expected FAIL, each for the reason named:
- `stars`: `expected [3, 2, 1, 0, -1] to equal [3, 2, 2, 1, 1]`.
- mAs edges: `checkTechnique(2.2)` returns `false` — the floating-point trap.
- "kVp is high and mAs low": `expected 'over' to be 'under'` — the naive tie-break only works one way round.
- "only height is off": `expected true to be false`.
- "three failed collimation attempts": `expected 3 to be 1`; "caps at 4": `expected 12 to be 4`.

The remaining tests pass against the naive version and are guards.

- [ ] **Step 3: Implement**

`src/game/rules.ts`:

```ts
/** Pure scoring rules (spec §4.4, §6). Nothing here knows about React or the DOM. */
export type DialSpec = { target: number; tolerance: number; step: number }
export type CollimationSpec = { target: { w: number; h: number }; tolerance: number }
export type Film = 'good' | 'under' | 'over'
/** `pose` is the chosen pose's image id, or null when the position timer ran out. */
export type CaseResult = { pose: string | null; kvp: number; mas: number; collimationFailures: number }
export type ScoredLevel = {
  position: { options: { image: string; correct: boolean }[] }
  technique: { kvp: DialSpec; mas: DialSpec }
}

type Band = 'below' | 'in' | 'above'

/** Compared in whole dial steps: with a 0.1 step, 2.5 - 2.2 is 0.30000000000000027 in floating point. */
function band(value: number, d: DialSpec): Band {
  const off = Math.round((value - d.target) / d.step)
  const tol = Math.round(d.tolerance / d.step)
  return off < -tol ? 'below' : off > tol ? 'above' : 'in'
}

export const checkTechnique = (value: number, d: DialSpec) => band(value, d) === 'in'

/** Under wins any low/high disagreement (spec §4.4). Takes kVp and mAs only: nothing else may change the film. */
export function filmFor(kvp: number, mas: number, t: { kvp: DialSpec; mas: DialSpec }): Film {
  const bands = [band(kvp, t.kvp), band(mas, t.mas)]
  if (bands.includes('below')) return 'under'
  if (bands.includes('above')) return 'over'
  return 'good'
}

export const checkCollimation = (field: { w: number; h: number }, c: CollimationSpec) =>
  Math.abs(field.w - c.target.w) <= c.tolerance && Math.abs(field.h - c.target.h) <= c.tolerance

/** At most one each from position, kVp, mAs, and collimation (spec §6). */
export function mistakes(r: CaseResult, level: ScoredLevel): number {
  const correctPose = level.position.options.find((o) => o.correct)?.image
  return (
    Number(r.pose !== correctPose) +
    Number(!checkTechnique(r.kvp, level.technique.kvp)) +
    Number(!checkTechnique(r.mas, level.technique.mas)) +
    Number(r.collimationFailures > 0)
  )
}

export const stars = (mistakeCount: number): 1 | 2 | 3 => (mistakeCount === 0 ? 3 : mistakeCount <= 2 ? 2 : 1)
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/rules.test.ts` → 23 PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/game/rules.ts tests/unit/rules.test.ts
git commit -m "feat: add the pure scoring rules for technique, film, collimation, and stars" -m "Comparing in dial steps rather than raw floats keeps a correct 2.2 mAs from being marked wrong."
```

---

### Task 4: Level schema and the twenty levels

**Files:**
- Create: `src/data/schema.ts`, `src/data/levels.ts`, `src/data/levels/01-pulmonary-edema.json` … `20-skull-fracture.json` (20 files), `tests/unit/schema.test.ts`, `tests/unit/levels.test.ts`

**Interfaces:**
- Consumes: `MANIFEST`, `filmId` from `src/assets.ts` (tests only).
- Produces:
  - `src/data/schema.ts`: `LevelSchema` (zod) and `type Level = z.infer<typeof LevelSchema>`. Shape as spec §5: `id, title, section ('chest' | 'upper-ext' | 'lower-ext' | 'abdomen' | 'skull' | 'refresher'), draft, patient{sprite,name,age,sex,habitus,dob,patientId,admitted,line}, order{complaint,history,diagnosis,exam,requested,mission,structures}, findings, position{options[3]{image,label,correct,why}}, technique{kvp,mas: {target,tolerance,min,max,step}, note,wrongKvp,wrongMas}, collimate{instruction,target{w,h},tolerance}, films{slug,underNote,overNote}, timers{position,technique}`. Nullable strings: `patient.line`, `order.history`, `order.structures`, `findings`, every option `why`, `technique.note/wrongKvp/wrongMas`, `films.underNote/overNote`.
  - `src/data/levels.ts`: `LEVELS: Level[]` sorted by id, parsed at import (a malformed file throws with its path and field); `levelById(id: number): Level`; `correctOption(level: Level)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/levels.test.ts` — expected values typed from `LIST OF CASES.docx` and spec §1/§5, never read back from the JSON:

```ts
import { describe, it, expect } from 'vitest'
import { LEVELS } from '../../src/data/levels'
import { MANIFEST, filmId } from '../../src/assets'

const FILMS = ['good', 'under', 'over'] as const

describe('shipped levels', () => {
  it('are exactly levels 1–20', () =>
    expect(LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1)))

  it('sit in the six sections, in order (spec §1)', () =>
    expect(LEVELS.map((l) => l.section)).toEqual([
      ...Array(3).fill('chest'), ...Array(3).fill('upper-ext'), ...Array(3).fill('lower-ext'),
      ...Array(3).fill('abdomen'), ...Array(3).fill('skull'), ...Array(5).fill('refresher'),
    ]))

  it('name only assets that were delivered — sprite, every pose, and three derived films', () => {
    expect(LEVELS).toHaveLength(20)
    const ids = LEVELS.flatMap((l) => [
      l.patient.sprite, ...l.position.options.map((o) => o.image), ...FILMS.map((f) => filmId(l.films.slug, f)),
    ])
    expect(ids.filter((id) => !(id in MANIFEST))).toEqual([])
  })

  it('produce sixty distinct film ids', () =>
    expect(new Set(LEVELS.flatMap((l) => FILMS.map((f) => filmId(l.films.slug, f)))).size).toBe(60))

  it('list position options alphabetically by image id (spec §5)', () => {
    expect(LEVELS).toHaveLength(20)
    for (const l of LEVELS) {
      const ids = l.position.options.map((o) => o.image)
      expect(ids, `level ${l.id}`).toEqual([...ids].sort())
    }
  })

  it('match the case database on spot-checked values', () => {
    const pick = (id: number) => {
      const l = LEVELS.find((x) => x.id === id)
      return [l?.patient.name, l?.technique.kvp.target, l?.technique.mas.target]
    }
    expect(pick(1)).toEqual(['Fernando R. Castillo', 125, 4])
    expect(pick(10)).toEqual(['Sofia M. Anderson', 70, 4])
    expect(pick(20)).toEqual(['Michael R. Aquino', 75, 16])
  })
})
```

`tests/unit/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { LevelSchema } from '../../src/data/schema'
import l2 from '../../src/data/levels/02-pneumothorax.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- these tests build malformed levels on purpose
type Loose = any
const accepts = (edit: (l: Loose) => void) => {
  const l: Loose = structuredClone(l2)
  edit(l)
  return LevelSchema.safeParse(l).success
}

describe('LevelSchema', () => {
  it('accepts a shipped level', () => expect(accepts(() => {})).toBe(true))
  it('rejects two correct positions', () => expect(accepts((l) => { l.position.options[0].correct = true })).toBe(false))
  it('rejects no correct position', () => expect(accepts((l) => { l.position.options[2].correct = false })).toBe(false))
  it('rejects a negative tolerance', () => expect(accepts((l) => { l.technique.kvp.tolerance = -1 })).toBe(false))
  it('rejects a target outside its dial', () => expect(accepts((l) => { l.technique.mas.target = 60 })).toBe(false))
  it('rejects the removed assess block', () => expect(accepts((l) => { l.assess = {} })).toBe(false))
  it('rejects the removed position.hint', () => expect(accepts((l) => { l.position.hint = 'x' })).toBe(false))
  it('rejects the removed expose block', () => expect(accepts((l) => { l.expose = {} })).toBe(false))
})
```

- [ ] **Step 2: Add a permissive schema and the loader, and watch the data tests fail**

`src/data/schema.ts`, accepting anything:

```ts
import { z } from 'zod'

export const LevelSchema = z.looseObject({})
export type Level = {
  id: number; title: string; section: string; draft: boolean
  patient: { sprite: string; name: string; age: number; sex: string; habitus: string; dob: string; patientId: string; admitted: string; line: string | null }
  order: { complaint: string; history: string | null; diagnosis: string; exam: string; requested: string; mission: string; structures: string | null }
  findings: string | null
  position: { options: { image: string; label: string; correct: boolean; why: string | null }[] }
  technique: {
    kvp: { target: number; tolerance: number; min: number; max: number; step: number }
    mas: { target: number; tolerance: number; min: number; max: number; step: number }
    note: string | null; wrongKvp: string | null; wrongMas: string | null
  }
  collimate: { instruction: string; target: { w: number; h: number }; tolerance: number }
  films: { slug: string; underNote: string | null; overNote: string | null }
  timers: { position: number; technique: number }
}
```

`src/data/levels.ts`:

```ts
import { LevelSchema, type Level } from './schema'

const files = import.meta.glob('./levels/*.json', { eager: true, import: 'default' })

/** Parsed at import: a malformed level stops the game loading, naming the file and the field. */
export const LEVELS: Level[] = Object.entries(files)
  .map(([path, json]) => {
    const r = LevelSchema.safeParse(json)
    if (!r.success) throw new Error(`${path}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
    return r.data as Level
  })
  .sort((a, b) => a.id - b.id)

export const levelById = (id: number): Level => {
  const level = LEVELS.find((l) => l.id === id)
  if (!level) throw new Error(`No level ${id}`)
  return level
}

export const correctOption = (level: Level) => level.position.options.find((o) => o.correct)!
```

Run: `npx vitest run tests/unit/levels.test.ts`
Expected: all 6 FAIL on assertions — `expected [] to equal [1, …, 20]`, the section list mismatch, `expected [] to have length 20` (twice), `expected 0 to be 60`, and `expected [undefined, undefined, undefined] to equal ['Fernando R. Castillo', 125, 4]`.

- [ ] **Step 3: Add the twenty level files**

Transcribed from `LIST OF CASES.docx` per spec §5, with the §5 placeholder values. Every `null` is a §12 gap. Create each file exactly as shown.

`src/data/levels/01-pulmonary-edema.json`:

```json
{
  "id": 1,
  "title": "Pulmonary edema",
  "section": "chest",
  "draft": true,
  "patient": {
    "sprite": "patient-old-man",
    "name": "Fernando R. Castillo",
    "age": 70,
    "sex": "Male",
    "habitus": "Hypersthenic",
    "dob": "09-May-1956",
    "patientId": "050956-70418",
    "admitted": "01-September-2026 1045H",
    "line": null
  },
  "order": {
    "complaint": "Increasing shortness of breath",
    "history": "Recently diagnosed with colon cancer",
    "diagnosis": "Dyspnea; patient with recent diagnosis of colon cancer",
    "exam": "Chest X-ray",
    "requested": "PA, Lateral",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": "Large volume left-sided pleural effusion. Moderate volume right-sided pleural effusion.",
  "position": {
    "options": [
      { "image": "pose-chest-ap", "label": "AP chest", "correct": false, "why": null },
      { "image": "pose-chest-lateral", "label": "Lateral chest", "correct": false, "why": null },
      { "image": "pose-chest-pa", "label": "PA chest", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 125, "tolerance": 13, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 4, "tolerance": 0.4, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to area of lung fields",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "pulmonaryedema", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/02-pneumothorax.json`:

```json
{
  "id": 2,
  "title": "Pneumothorax",
  "section": "chest",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Miguel A. Zamora",
    "age": 20,
    "sex": "Male",
    "habitus": "Asthenic",
    "dob": "11-January-2006",
    "patientId": "011106-20458",
    "admitted": "25-August-2026 1645H",
    "line": null
  },
  "order": {
    "complaint": "Chest pain and shortness of breath",
    "history": null,
    "diagnosis": "Suspected Pneumothorax",
    "exam": "Chest X-ray",
    "requested": "PA, Lateral",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": "Bilateral pneumothorax with a pleural line clearly visible without lung markings beyond. No mediastinal shift to suggest tension. Small volume of pleural fluid on the right with blunting of the costodiaphragmatic angle.",
  "position": {
    "options": [
      { "image": "pose-chest-ap", "label": "AP chest", "correct": false, "why": null },
      { "image": "pose-chest-lateral", "label": "Lateral chest", "correct": false, "why": null },
      { "image": "pose-chest-pa", "label": "PA chest", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 115, "tolerance": 12, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 2.5, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to area of lung fields",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "pneumothorax", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/03-scimitar-syndrome-papvr.json`:

```json
{
  "id": 3,
  "title": "Scimitar syndrome (PAPVR)",
  "section": "chest",
  "draft": true,
  "patient": {
    "sprite": "patient-young-woman",
    "name": "Patricia A. Villanueva",
    "age": 25,
    "sex": "Female",
    "habitus": "Sthenic",
    "dob": "16-June-2001",
    "patientId": "061601-25384",
    "admitted": "02-September-2026 0915H",
    "line": null
  },
  "order": {
    "complaint": "Mild shortness of breath on exertion (SOBOE) for 12 months",
    "history": "12-month history of mild shortness of breath on exertion",
    "diagnosis": "Dyspnea on exertion",
    "exam": "Chest X-ray",
    "requested": "PA, Lateral",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": "Curvilinear tubular opacity in the medial right lower zone paralleling the right heart border representing a scimitar. The right lung is slightly more dense and smaller than the left lung with decreased intercostal spacing. No pleural effusion. Heart size is normal.",
  "position": {
    "options": [
      { "image": "pose-chest-ap", "label": "AP chest", "correct": false, "why": null },
      { "image": "pose-chest-lateral", "label": "Lateral chest", "correct": false, "why": null },
      { "image": "pose-chest-pa", "label": "PA chest", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 120, "tolerance": 12, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 3, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to area of lung fields",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "scimitar", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/04-boxers-fracture.json`:

```json
{
  "id": 4,
  "title": "Boxer's fracture",
  "section": "upper-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Samuel R. Villanueva",
    "age": 40,
    "sex": "Male",
    "habitus": "Hypersthenic",
    "dob": "12-January-1986",
    "patientId": "011286-10432",
    "admitted": "31-Aug-2026 0915H",
    "line": null
  },
  "order": {
    "complaint": "Right hand and wrist pain with swelling after accidentally falling on an outstretched hand",
    "history": null,
    "diagnosis": "Suspected 5th metacarpal fracture",
    "exam": "Right hand X-ray",
    "requested": "PA, Lateral, Oblique",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-hand-ap", "label": "AP hand", "correct": false, "why": null },
      { "image": "pose-hand-lateral", "label": "Lateral hand", "correct": false, "why": null },
      { "image": "pose-hand-pa", "label": "PA hand", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 60, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 4, "tolerance": 0.4, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to outer margins of hand and wrist.",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "boxerfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/05-colles-fracture.json`:

```json
{
  "id": 5,
  "title": "Colles' fracture",
  "section": "upper-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-young-woman",
    "name": "Angela M. Reyes",
    "age": 20,
    "sex": "Female",
    "habitus": "Hyposthenic",
    "dob": "06-May-2006",
    "patientId": "050606-21876",
    "admitted": "31-Aug-2026 1030H",
    "line": null
  },
  "order": {
    "complaint": "Left wrist pain, swelling, and difficulty moving the wrist after falling onto an outstretched hand",
    "history": null,
    "diagnosis": "Suspected Colles' fracture of the distal radius",
    "exam": "Left wrist X-ray",
    "requested": "PA, Lateral, Oblique",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": "There is an impacted, dorsally displaced and angulated greenstick fracture involving the distal radius with possible fracture extension to the articular surface. There is associated overlying soft tissue swelling and deformity of the wrist. Further, there is a minimally displaced avulsion fracture of ulnar styloid process. The alignment of the carpal arches is within normal limits.",
  "position": {
    "options": [
      { "image": "pose-wrist-lateral", "label": "Lateral wrist", "correct": false, "why": null },
      { "image": "pose-wrist-oblique", "label": "Oblique wrist", "correct": false, "why": null },
      { "image": "pose-wrist-pa", "label": "PA wrist", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 55, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 2.5, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate to wrist on all four sides; include distal radius and ulna and midmetacarpal area.",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "collesfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/06-supracondylar-fracture.json`:

```json
{
  "id": 6,
  "title": "Supracondylar fracture",
  "section": "upper-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-child-boy",
    "name": "Miguel A. Santos",
    "age": 9,
    "sex": "Male",
    "habitus": "Hyposthenic",
    "dob": "22-November-2016",
    "patientId": "112216-30754",
    "admitted": "31-Aug-2026 1145H",
    "line": null
  },
  "order": {
    "complaint": "Left elbow pain and swelling with limited movement after falling from a playground",
    "history": null,
    "diagnosis": "Suspected supracondylar fracture of the humerus",
    "exam": "Left elbow X-ray",
    "requested": "AP, Lateral, Oblique",
    "mission": "Perform Lateral",
    "structures": null
  },
  "findings": "There is a displaced supracondylar of the left distal humerus, with raised anterior and posterior fat pad- elbow joint effusion",
  "position": {
    "options": [
      { "image": "pose-elbow-ap", "label": "AP elbow", "correct": false, "why": null },
      { "image": "pose-elbow-apoblique", "label": "AP oblique elbow", "correct": false, "why": null },
      { "image": "pose-elbow-lateral", "label": "Lateral elbow", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 55, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 1.6, "tolerance": 0.2, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to area of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "elbowfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/07-tibial-stress-fracture.json`:

```json
{
  "id": 7,
  "title": "Tibial stress fracture",
  "section": "lower-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "John D. Reyes",
    "age": 25,
    "sex": "Male",
    "habitus": "Hyposthenic",
    "dob": "14-March-2001",
    "patientId": "031401-25763",
    "admitted": "27-August-2026 0830H",
    "line": null
  },
  "order": {
    "complaint": "Gradual onset of lower leg pain that worsens with physical activity",
    "history": "Recreational runner; no history of trauma",
    "diagnosis": "Suspected Stress Fracture of the Tibia",
    "exam": "Tibia/Fibula X-ray",
    "requested": "AP, Lateral",
    "mission": "Perform AP",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-lowerext-apknee", "label": "AP knee", "correct": false, "why": null },
      { "image": "pose-lowerext-apleg", "label": "AP tibia-fibula", "correct": true, "why": null },
      { "image": "pose-lowerext-lateralleg", "label": "Lateral tibia-fibula", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 60, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 3.2, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on both sides to skin margins",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "stressfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/08-oblique-fibular-shaft-fracture.json`:

```json
{
  "id": 8,
  "title": "Oblique fibular shaft fracture",
  "section": "lower-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-young-woman",
    "name": "Maria L. Santos",
    "age": 32,
    "sex": "Female",
    "habitus": "Sthenic",
    "dob": "08-April-1994",
    "patientId": "040894-32617",
    "admitted": "28-August-2026 1415H",
    "line": null
  },
  "order": {
    "complaint": "Right ankle pain and swelling after twisting the ankle while stepping off a curb",
    "history": "Immediate pain and swelling over the lateral lower leg; able to bear some weight",
    "diagnosis": "Suspected Oblique Fracture of the Fibular Shaft",
    "exam": "Right Tibia and Fibula X-ray",
    "requested": "AP, Lateral",
    "mission": "Perform Lateral",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-lowerext-apleg", "label": "AP tibia-fibula", "correct": false, "why": null },
      { "image": "pose-lowerext-lateralknee", "label": "Lateral knee", "correct": false, "why": null },
      { "image": "pose-lowerext-lateralleg", "label": "Lateral tibia-fibula", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 62, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 4, "tolerance": 0.4, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on both sides to skin margins",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "obliquefibulafx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/09-comminuted-tibia-fibula-fracture.json`:

```json
{
  "id": 9,
  "title": "Comminuted tibia-fibula fracture",
  "section": "lower-ext",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Roberto M. Garcia",
    "age": 45,
    "sex": "Male",
    "habitus": "Hypersthenic",
    "dob": "12-February-1981",
    "patientId": "021281-45932",
    "admitted": "30-August-2026 1830H",
    "line": null
  },
  "order": {
    "complaint": "Severe lower leg pain, deformity, and inability to bear weight following a motorcycle accident",
    "history": "Motorcycle accident with direct impact to the lower leg",
    "diagnosis": "Comminuted Fractures of the Tibia and Fibula",
    "exam": "Right Tibia and Fibula X-ray",
    "requested": "AP, Lateral",
    "mission": "Perform AP",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-lowerext-apknee", "label": "AP knee", "correct": false, "why": null },
      { "image": "pose-lowerext-apleg", "label": "AP tibia-fibula", "correct": true, "why": null },
      { "image": "pose-lowerext-lateralleg", "label": "Lateral tibia-fibula", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 65, "tolerance": 7, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 6.3, "tolerance": 0.6, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on both sides to skin margins",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "communitedfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/10-foreign-body-button-battery.json`:

```json
{
  "id": 10,
  "title": "Foreign body (button battery)",
  "section": "abdomen",
  "draft": true,
  "patient": {
    "sprite": "patient-child-girl",
    "name": "Sofia M. Anderson",
    "age": 5,
    "sex": "Female",
    "habitus": "Sthenic",
    "dob": "22-June-2021",
    "patientId": "062221-51739",
    "admitted": "12-June-2026 1430H",
    "line": null
  },
  "order": {
    "complaint": "Suspected ingestion of a foreign body (button battery) within the last hour",
    "history": "Patient is asymptomatic; suspected accidental ingestion of a button battery",
    "diagnosis": "Suspected Foreign Body Ingestion (Button Battery)",
    "exam": "Foreign Body X-ray Series",
    "requested": "AP Upright, AP Supine, Cross Table Lateral",
    "mission": "Perform AP Supine",
    "structures": "Include the entire gastrointestinal tract from the nasopharynx to the pubic symphysis."
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-abd-ap", "label": "AP abdomen", "correct": true, "why": null },
      { "image": "pose-abd-lateral", "label": "Lateral abdomen", "correct": false, "why": null },
      { "image": "pose-abd-oblique", "label": "Oblique abdomen", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 70, "tolerance": 7, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 4, "tolerance": 0.4, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "fbi", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/11-renal-calculi.json`:

```json
{
  "id": 11,
  "title": "Renal calculi",
  "section": "abdomen",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "John C. Hopkins",
    "age": 25,
    "sex": "Male",
    "habitus": "Sthenic",
    "dob": "14-July-2001",
    "patientId": "071401-25481",
    "admitted": "02-September-2026 0900H",
    "line": null
  },
  "order": {
    "complaint": "Bilateral flank pain for several months",
    "history": null,
    "diagnosis": "Suspected Bilateral Renal Calculi (Kidney Stones)",
    "exam": "KUB X-ray",
    "requested": "AP Supine",
    "mission": "Perform AP Supine",
    "structures": "if possible, the diaphragm should be included superiorly\nthe abdomen should be free from rotation with symmetry of the:\nribs (superior)\niliac crests (middle)\nobturator foramen (inferior)\nno blurring of the bowel gas due to respiratory motion"
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-abd-ap", "label": "AP abdomen", "correct": true, "why": null },
      { "image": "pose-abd-lateral", "label": "Lateral abdomen", "correct": false, "why": null },
      { "image": "pose-abd-oblique", "label": "Oblique abdomen", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 75, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 16, "tolerance": 1.6, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "renalcalculi", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/12-sigmoid-volvulus.json`:

```json
{
  "id": 12,
  "title": "Sigmoid volvulus",
  "section": "abdomen",
  "draft": true,
  "patient": {
    "sprite": "patient-old-man",
    "name": "Antonio R. Mendoza",
    "age": 65,
    "sex": "Male",
    "habitus": "Hyposthenic",
    "dob": "18-May-1961",
    "patientId": "051861-78426",
    "admitted": "15-August-2026 1015H",
    "line": null
  },
  "order": {
    "complaint": "Abdominal distension and abdominal pain associated with chronic bowel problems",
    "history": "Cerebral palsy; history of chronic bowel problems",
    "diagnosis": "Suspected Sigmoid Volvulus",
    "exam": "Abdominal X-ray",
    "requested": "AP Upright, AP Supine",
    "mission": "Perform AP Supine",
    "structures": "Gas-filled dilated large bowel, with the sigmoid colon distended and demonstrating the coffee-bean sign"
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-abd-ap", "label": "AP abdomen", "correct": true, "why": null },
      { "image": "pose-abd-lateral", "label": "Lateral abdomen", "correct": false, "why": null },
      { "image": "pose-abd-oblique", "label": "Oblique abdomen", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 75, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 14, "tolerance": 1.4, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "volvulus", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/13-mild-scalp-contusion.json`:

```json
{
  "id": 13,
  "title": "Mild scalp contusion",
  "section": "skull",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Juan D. Cruz",
    "age": 22,
    "sex": "Male",
    "habitus": "Sthenic",
    "dob": "10-January-2004",
    "patientId": "011004-22461",
    "admitted": "02-September-2026 1100H",
    "line": null
  },
  "order": {
    "complaint": "Mild headache after accidentally bumping his head on a door",
    "history": "Recent minor head trauma from impact with a door",
    "diagnosis": "Suspected Minor Head Injury",
    "exam": "Skull X-ray",
    "requested": "AP, Lateral",
    "mission": "Perform Lateral",
    "structures": null
  },
  "findings": "No visible skull fracture or intracranial abnormality on the radiograph.",
  "position": {
    "options": [
      { "image": "pose-skull-ap", "label": "AP skull", "correct": false, "why": null },
      { "image": "pose-skull-lateral", "label": "Lateral skull", "correct": true, "why": null },
      { "image": "pose-skull-pa", "label": "PA skull", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 75, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 16, "tolerance": 1.6, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "contusion", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/14-nasal-bone-fracture.json`:

```json
{
  "id": 14,
  "title": "Nasal bone fracture",
  "section": "skull",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Daniel J. Cruz",
    "age": 20,
    "sex": "Male",
    "habitus": "Sthenic",
    "dob": "14-February-2006",
    "patientId": "021406-45219",
    "admitted": "31-Aug-2026 1300H",
    "line": null
  },
  "order": {
    "complaint": "Nasal pain, swelling, and tenderness following facial trauma during a recreational activity",
    "history": null,
    "diagnosis": "Suspected nasal bone fracture",
    "exam": "Nasal Bone X-ray",
    "requested": "Waters', Right & Left Lateral",
    "mission": "Perform Right Lateral",
    "structures": null
  },
  "findings": "Lucency is seen within the nasal bone with overlying soft tissue swelling depicting a nondisplaced fracture",
  "position": {
    "options": [
      { "image": "pose-skull-ap", "label": "AP skull", "correct": false, "why": null },
      { "image": "pose-skull-lateral", "label": "Lateral skull", "correct": true, "why": null },
      { "image": "pose-skull-pa", "label": "PA skull", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 70, "tolerance": 7, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 12.5, "tolerance": 1.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "nasalfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/15-pagets-disease.json`:

```json
{
  "id": 15,
  "title": "Paget's disease",
  "section": "skull",
  "draft": true,
  "patient": {
    "sprite": "patient-old-woman",
    "name": "Elena P. Navarro",
    "age": 80,
    "sex": "Female",
    "habitus": "Sthenic",
    "dob": "03-February-1946",
    "patientId": "020346-80642",
    "admitted": "20-July-2026 0900H",
    "line": null
  },
  "order": {
    "complaint": "Follow-up evaluation for Paget's disease involving the skull",
    "history": "Paget's disease of the skull; diabetes mellitus",
    "diagnosis": "Paget's Disease of Bone (Skull)",
    "exam": "Skull X-ray",
    "requested": "AP, AP Towne, PA Caldwell, Lateral",
    "mission": "Perform AP",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-skull-ap", "label": "AP skull", "correct": true, "why": null },
      { "image": "pose-skull-lateral", "label": "Lateral skull", "correct": false, "why": null },
      { "image": "pose-skull-pa", "label": "PA skull", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 80, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 20, "tolerance": 2, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "pagets", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/16-pulmonary-tuberculosis.json`:

```json
{
  "id": 16,
  "title": "Pulmonary tuberculosis",
  "section": "refresher",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Carlos B. Mendoza",
    "age": 50,
    "sex": "Male",
    "habitus": "Asthenic",
    "dob": "15-March-1976",
    "patientId": "031576-50284",
    "admitted": "02-September-2026 1430H",
    "line": null
  },
  "order": {
    "complaint": "Difficulty breathing for one week",
    "history": "Occasional dry cough for one month, night sweats, and unintentional weight loss for the past three months",
    "diagnosis": "Suspected Pulmonary Tuberculosis (PTB)",
    "exam": "Chest X-ray",
    "requested": "PA, Lateral",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-chest-ap", "label": "AP chest", "correct": false, "why": null },
      { "image": "pose-chest-lateral", "label": "Lateral chest", "correct": false, "why": null },
      { "image": "pose-chest-pa", "label": "PA chest", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 115, "tolerance": 12, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 2.5, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to area of lung fields",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "ptb", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/17-osteochondroma.json`:

```json
{
  "id": 17,
  "title": "Osteochondroma",
  "section": "refresher",
  "draft": true,
  "patient": {
    "sprite": "patient-teen-boy",
    "name": "Daniel M. Reyes",
    "age": 18,
    "sex": "Male",
    "habitus": "Hyposthenic",
    "dob": "12-June-2008",
    "patientId": "061208-18427",
    "admitted": "01-Sep-2026 0900H",
    "line": null
  },
  "order": {
    "complaint": "Painless swelling of the right upper arm",
    "history": null,
    "diagnosis": "Suspected Osteochondroma of the right humerus",
    "exam": "Right humerus X-ray",
    "requested": "AP, Lateral",
    "mission": "Perform AP",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-humerus-ap", "label": "AP humerus", "correct": true, "why": null },
      { "image": "pose-humerus-lateral", "label": "Lateral humerus", "correct": false, "why": null },
      { "image": "pose-humerus-transthoracic", "label": "Transthoracic humerus", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 60, "tolerance": 6, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 3.2, "tolerance": 0.3, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on sides to soft tissue borders of humerus and shoulder",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "osteochondroma", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/18-osteoporosis.json`:

```json
{
  "id": 18,
  "title": "Osteoporosis",
  "section": "refresher",
  "draft": true,
  "patient": {
    "sprite": "patient-old-woman",
    "name": "Andrea T. Perez",
    "age": 68,
    "sex": "Female",
    "habitus": "Hypersthenic",
    "dob": "24-July-1958",
    "patientId": "072458-68317",
    "admitted": "02-September-2026 1315H",
    "line": null
  },
  "order": {
    "complaint": "Chronic knee pain with decreased mobility",
    "history": "Postmenopausal; decreased mobility; history of a previous minor fall",
    "diagnosis": "Suspected Osteoporosis with Possible Degenerative Changes of the Knee",
    "exam": "Knee X-ray",
    "requested": "AP, Lateral, Oblique",
    "mission": "Perform AP",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-lowerext-apknee", "label": "AP knee", "correct": true, "why": null },
      { "image": "pose-lowerext-lateralknee", "label": "Lateral knee", "correct": false, "why": null },
      { "image": "pose-lowerext-obliqueknee", "label": "Oblique knee", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 65, "tolerance": 7, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 5, "tolerance": 0.5, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on both sides to skin margins at ends to IR borders.",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "osteoporosis", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/19-cholelithiasis.json`:

```json
{
  "id": 19,
  "title": "Cholelithiasis",
  "section": "refresher",
  "draft": true,
  "patient": {
    "sprite": "patient-old-woman",
    "name": "Teresa M. Flores",
    "age": 75,
    "sex": "Female",
    "habitus": "Hypersthenic",
    "dob": "21-February-1951",
    "patientId": "022151-75346",
    "admitted": "02-April-2026 1730H",
    "line": null
  },
  "order": {
    "complaint": "Sudden onset of severe right hypochondrial (right upper quadrant) abdominal pain",
    "history": "Acute severe pain localized to the right upper abdomen",
    "diagnosis": "Suspected Acute Cholecystitis / Gallbladder Pathology",
    "exam": "Abdominal X-ray",
    "requested": "AP Upright, AP Supine",
    "mission": "Perform AP Upright",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-abd-ap", "label": "AP abdomen", "correct": true, "why": null },
      { "image": "pose-abd-lateral", "label": "Lateral abdomen", "correct": false, "why": null },
      { "image": "pose-abd-oblique", "label": "Oblique abdomen", "correct": false, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 80, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 25, "tolerance": 2.5, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "chole", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

`src/data/levels/20-skull-fracture.json`:

```json
{
  "id": 20,
  "title": "Skull fracture",
  "section": "refresher",
  "draft": true,
  "patient": {
    "sprite": "patient-young-man",
    "name": "Michael R. Aquino",
    "age": 43,
    "sex": "Male",
    "habitus": "Asthenic",
    "dob": "09-April-1983",
    "patientId": "040983-43725",
    "admitted": "02-September-2026 1600H",
    "line": null
  },
  "order": {
    "complaint": "Head pain and swelling on the right side of the head after being punched at a pub",
    "history": "Recent blunt head trauma due to physical assault; localized swelling over the right side of the head",
    "diagnosis": "Suspected Skull Fracture",
    "exam": "Skull X-ray",
    "requested": "AP Axial (Towne), Lateral, PA Axial (Caldwell), PA",
    "mission": "Perform PA",
    "structures": null
  },
  "findings": null,
  "position": {
    "options": [
      { "image": "pose-skull-ap", "label": "AP skull", "correct": false, "why": null },
      { "image": "pose-skull-lateral", "label": "Lateral skull", "correct": false, "why": null },
      { "image": "pose-skull-pa", "label": "PA skull", "correct": true, "why": null }
    ]
  },
  "technique": {
    "kvp": { "target": 75, "tolerance": 8, "min": 40, "max": 150, "step": 1 },
    "mas": { "target": 16, "tolerance": 1.6, "min": 0.5, "max": 50, "step": 0.1 },
    "note": null,
    "wrongKvp": null,
    "wrongMas": null
  },
  "collimate": {
    "instruction": "Collimate on four sides to anatomy of interest",
    "target": { "w": 60, "h": 70 },
    "tolerance": 5
  },
  "films": { "slug": "skullfx", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

Run: `npx vitest run tests/unit/levels.test.ts` → 6 PASS. The data is now proven against the hand-typed expectations; the schema has not been tested yet.

- [ ] **Step 4: Watch the schema tests fail against the permissive schema**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: "accepts a shipped level" passes as a guard; the 7 rejection tests FAIL with `expected true to be false`.

- [ ] **Step 5: Implement the schema**

`src/data/schema.ts`:

```ts
import { z } from 'zod'

const text = z.string().min(1)
const awaiting = text.nullable() // null = not in the case database yet; rendered "Awaiting client"

const Dial = z
  .strictObject({ target: z.number(), tolerance: z.number().nonnegative(), min: z.number(), max: z.number(), step: z.number().positive() })
  .refine((d) => d.min <= d.target && d.target <= d.max, { message: 'target outside dial range' })

const Option = z.strictObject({ image: text, label: text, correct: z.boolean(), why: awaiting })

/** Strict objects throughout, so a level still carrying a retired block (assess, position.hint, expose) fails. */
export const LevelSchema = z.strictObject({
  id: z.number().int().min(1).max(20),
  title: text,
  section: z.enum(['chest', 'upper-ext', 'lower-ext', 'abdomen', 'skull', 'refresher']),
  draft: z.boolean(),
  patient: z.strictObject({
    sprite: text, name: text, age: z.number().int().nonnegative(), sex: z.enum(['Male', 'Female']),
    habitus: text, dob: text, patientId: text, admitted: text, line: awaiting,
  }),
  order: z.strictObject({
    complaint: text, history: awaiting, diagnosis: text, exam: text, requested: text, mission: text, structures: awaiting,
  }),
  findings: awaiting,
  position: z.strictObject({
    options: z.array(Option).length(3).refine((os) => os.filter((o) => o.correct).length === 1, {
      message: 'exactly one option must be correct',
    }),
  }),
  technique: z.strictObject({ kvp: Dial, mas: Dial, note: awaiting, wrongKvp: awaiting, wrongMas: awaiting }),
  collimate: z.strictObject({
    instruction: text,
    target: z.strictObject({ w: z.number().min(1).max(100), h: z.number().min(1).max(100) }),
    tolerance: z.number().nonnegative(),
  }),
  films: z.strictObject({ slug: z.string().regex(/^[a-z]+$/), underNote: awaiting, overNote: awaiting }),
  timers: z.strictObject({ position: z.number().int().positive(), technique: z.number().int().positive() }),
})

export type Level = z.infer<typeof LevelSchema>
```

In `src/data/levels.ts`, change `return r.data as Level` to `return r.data`.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/unit/schema.test.ts tests/unit/levels.test.ts` → 14 PASS.
Run: `npm run qa` → PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/data tests/unit/schema.test.ts tests/unit/levels.test.ts
git commit -m "feat: add the twenty levels from the client's case list with a strict schema" -m "Every level stays draft and keeps its gaps as nulls, so nothing medical is invented while the client answers spec 12."
```

---

### Task 5: Save file and the store

**Files:**
- Create: `src/app/save.ts`, `src/app/store.ts`, `tests/unit/save.test.ts`, `tests/unit/store.test.ts`

**Interfaces:**
- Consumes: `CaseResult` from `src/game/rules.ts`.
- Produces:
  - `src/app/save.ts`: `SAVE_KEY = 'medici.save.v1'`, `type Save`, `freshSave(): Save`, `loadSave(storage?: Store | null): Save`, `writeSave(save: Save, storage?: Store | null): void`, where `type Store = Pick<Storage, 'getItem' | 'setItem'>`. Both default to `window.localStorage` and survive its absence.
  - `src/app/store.ts`: `LEVEL_COUNT = 20`, `type Screen = { name: 'title' } | { name: 'levelSelect' } | { name: 'level'; id: number } | { name: 'results'; id: number; result: CaseResult }`, `type State = { screen: Screen; save: Save; settingsOpen: boolean }`, `type Action = { type: 'go'; screen: Screen } | { type: 'finish'; id: number; result: CaseResult; stars: 1 | 2 | 3 } | { type: 'openSettings' } | { type: 'closeSettings' } | { type: 'toggleSound' } | { type: 'resetProgress' }`, `reducer(s: State, a: Action): State`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/save.test.ts` — the last three `loadSave` cases and the refused-write case are Review Focus 1 and 2:

```ts
import { describe, it, expect } from 'vitest'
import { loadSave, writeSave, freshSave, SAVE_KEY, type Save } from '../../src/app/save'

function memory(raw?: string) {
  const m = new Map<string, string>()
  if (raw !== undefined) m.set(SAVE_KEY, raw)
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
const valid: Save = { version: 1, unlocked: 4, stars: { 1: 3, 2: 2, 3: 1 }, settings: { sound: false } }
const raw = (x: unknown) => memory(JSON.stringify(x))

describe('loadSave', () => {
  it('starts fresh with no save', () => expect(loadSave(memory())).toEqual(freshSave()))
  it('loads a valid save', () => expect(loadSave(raw(valid))).toEqual(valid))
  it('starts fresh on invalid JSON, without throwing', () => expect(loadSave(memory('{nope'))).toEqual(freshSave()))
  it('starts fresh on another version', () => expect(loadSave(raw({ ...valid, version: 2 }))).toEqual(freshSave()))
  it('drops the retired timers and hints settings', () =>
    expect(loadSave(raw({ ...valid, settings: { sound: false, timers: true, hints: false } }))).toEqual(valid))
  it('starts fresh when storage itself throws', () => {
    const blocked = { getItem: () => { throw new Error('SecurityError') }, setItem: () => {} }
    expect(loadSave(blocked)).toEqual(freshSave())
  })
  it('starts fresh on an unlock past level 20', () => expect(loadSave(raw({ ...valid, unlocked: 25 }))).toEqual(freshSave()))
  it('starts fresh on an impossible star count', () => expect(loadSave(raw({ ...valid, stars: { 1: 7 } }))).toEqual(freshSave()))
})

describe('writeSave', () => {
  it('round-trips through loadSave', () => {
    const s = memory()
    writeSave(valid, s)
    expect(loadSave(s)).toEqual(valid)
  })
  it('does not throw when storage refuses the write', () => {
    const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(() => writeSave(valid, full)).not.toThrow()
  })
})
```

`tests/unit/store.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { reducer, type State } from '../../src/app/store'
import { freshSave } from '../../src/app/save'
import type { CaseResult } from '../../src/game/rules'

const result: CaseResult = { pose: 'pose-chest-pa', kvp: 125, mas: 4, collimationFailures: 0 }
const at = (unlocked: number, stars: State['save']['stars'] = {}, sound = true): State => ({
  screen: { name: 'level', id: 1 }, settingsOpen: false,
  save: { ...freshSave(), unlocked, stars, settings: { sound } },
})

describe('reducer', () => {
  it('finishing a level unlocks the next and shows results', () => {
    const s = reducer(at(1), { type: 'finish', id: 1, result, stars: 2 })
    expect(s.save.unlocked).toBe(2)
    expect(s.save.stars[1]).toBe(2)
    expect(s.screen).toEqual({ name: 'results', id: 1, result })
  })
  it('never unlocks past level 20', () =>
    expect(reducer(at(20), { type: 'finish', id: 20, result, stars: 3 }).save.unlocked).toBe(20))
  it('keeps the best stars on a worse replay', () =>
    expect(reducer(at(5, { 1: 3 }), { type: 'finish', id: 1, result, stars: 1 }).save.stars[1]).toBe(3))
  it('replaying an early level does not lower the unlock', () =>
    expect(reducer(at(5), { type: 'finish', id: 2, result, stars: 3 }).save.unlocked).toBe(5))
  it('reset progress keeps the sound setting', () => {
    const s = reducer(at(9, { 1: 3 }, false), { type: 'resetProgress' })
    expect(s.save).toEqual({ ...freshSave(), settings: { sound: false } })
  })
  it('toggles sound', () => expect(reducer(at(1), { type: 'toggleSound' }).save.settings.sound).toBe(false))
})
```

- [ ] **Step 2: Add naive versions and watch them fail**

`src/app/save.ts` — no validation, no guards:

```ts
export const SAVE_KEY = 'medici.save.v1'
export type Save = { version: 1; unlocked: number; stars: Record<number, 0 | 1 | 2 | 3>; settings: { sound: boolean } }
type Store = Pick<Storage, 'getItem' | 'setItem'>

export const freshSave = (): Save => ({ version: 1, unlocked: 1, stars: {}, settings: { sound: true } })

export function loadSave(storage: Store | null = window.localStorage): Save {
  const raw = storage?.getItem(SAVE_KEY)
  return raw ? JSON.parse(raw) : freshSave()
}

export function writeSave(save: Save, storage: Store | null = window.localStorage) {
  storage?.setItem(SAVE_KEY, JSON.stringify(save))
}
```

`src/app/store.ts` — the obvious `finish`:

```ts
import { freshSave, type Save } from './save'
import type { CaseResult } from '../game/rules'

export const LEVEL_COUNT = 20
export type Screen =
  | { name: 'title' } | { name: 'levelSelect' } | { name: 'level'; id: number }
  | { name: 'results'; id: number; result: CaseResult }
export type State = { screen: Screen; save: Save; settingsOpen: boolean }
export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'finish'; id: number; result: CaseResult; stars: 1 | 2 | 3 }
  | { type: 'openSettings' } | { type: 'closeSettings' } | { type: 'toggleSound' } | { type: 'resetProgress' }

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'go': return { ...s, screen: a.screen }
    case 'finish':
      return { ...s, screen: { name: 'results', id: a.id, result: a.result },
        save: { ...s.save, unlocked: a.id + 1, stars: { ...s.save.stars, [a.id]: a.stars } } }
    case 'openSettings': return { ...s, settingsOpen: true }
    case 'closeSettings': return { ...s, settingsOpen: false }
    case 'toggleSound': return { ...s, save: { ...s.save, settings: { sound: !s.save.settings.sound } } }
    case 'resetProgress': return { ...s, save: freshSave() }
  }
}
```

Run: `npx vitest run tests/unit/save.test.ts tests/unit/store.test.ts`
Expected FAIL:
- "invalid JSON": throws `SyntaxError` — the very crash the requirement forbids.
- "another version", "unlock past 20", "impossible star count": the raw object comes back instead of a fresh save.
- "retired settings": the extra `timers` and `hints` keys survive.
- "storage itself throws": throws `SecurityError`; "refuses the write": throws `QuotaExceededError`.
- Store: "never unlocks past 20" (`expected 21 to be 20`), "keeps the best stars" (`expected 1 to be 3`), "does not lower the unlock" (`expected 3 to be 5`), "reset keeps sound" (`sound: true`).

The remaining cases pass as guards.

- [ ] **Step 3: Implement**

`src/app/save.ts`:

```ts
import { z } from 'zod'

export const SAVE_KEY = 'medici.save.v1'
export type Save = { version: 1; unlocked: number; stars: Record<number, 0 | 1 | 2 | 3>; settings: { sound: boolean } }
type Store = Pick<Storage, 'getItem' | 'setItem'>

// z.object strips unknown keys, which is how the retired timers/hints settings are dropped.
const SaveSchema = z.object({
  version: z.literal(1),
  unlocked: z.number().int().min(1).max(20),
  stars: z.record(z.string(), z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])),
  settings: z.object({ sound: z.boolean() }),
})

export const freshSave = (): Save => ({ version: 1, unlocked: 1, stars: {}, settings: { sound: true } })

/** Private browsing can make even reading window.localStorage throw. */
function browserStorage(): Store | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Anything missing, unreadable, or out of range gives a fresh save, never a crash (spec §6). */
export function loadSave(storage: Store | null = browserStorage()): Save {
  try {
    const raw = storage?.getItem(SAVE_KEY)
    if (!raw) return freshSave()
    const parsed = SaveSchema.safeParse(JSON.parse(raw))
    return parsed.success ? (parsed.data as Save) : freshSave()
  } catch {
    return freshSave()
  }
}

export function writeSave(save: Save, storage: Store | null = browserStorage()) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    // Storage full or blocked: progress lives in memory for this session only.
  }
}
```

In `src/app/store.ts`, replace the `finish` and `resetProgress` cases:

```ts
    case 'finish': {
      const best = Math.max(s.save.stars[a.id] ?? 0, a.stars) as 1 | 2 | 3
      return {
        ...s,
        screen: { name: 'results', id: a.id, result: a.result },
        save: {
          ...s.save,
          unlocked: Math.max(s.save.unlocked, Math.min(a.id + 1, LEVEL_COUNT)),
          stars: { ...s.save.stars, [a.id]: best },
        },
      }
    }
```

```ts
    case 'resetProgress': return { ...s, save: { ...freshSave(), settings: s.save.settings } }
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/save.test.ts tests/unit/store.test.ts` → 16 PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/save.ts src/app/store.ts tests/unit/save.test.ts tests/unit/store.test.ts
git commit -m "feat: add the versioned save and the screen store" -m "A blocked or tampered save must never stop a student playing, so every load path falls back to a fresh save."
```

---

### Task 6: The shell — title, level select, settings, sound

**Files:**
- Create: `src/app/App.tsx`, `src/screens/Title.tsx`, `src/screens/LevelSelect.tsx`, `src/screens/Settings.tsx`, `src/ui/Stars.tsx`, `src/audio.ts`, `tests/e2e/helpers.ts`, `tests/e2e/shell.spec.ts`
- Modify: `src/main.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `Stage` (Task 1), `Img`, `assetUrl` (Task 2), `LEVELS`, `Level` (Task 4), `reducer`, `State`, `Action`, `Screen`, `loadSave`, `writeSave`, `Save` (Task 5).
- Produces: `App` in `src/app/App.tsx`; `play(id: string)`, `startAmbience()`, `setSound(on: boolean)` in `src/audio.ts`; `<Stars n={0|1|2|3} />` in `src/ui/Stars.tsx`, labelled `"<n> of 3 stars"`; `seedSave(page, partial?)` in `tests/e2e/helpers.ts`. Level-select cards are buttons named `Level <id>: <title>`, with ` (locked)` appended when locked.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/helpers.ts`:

```ts
import type { Page } from '@playwright/test'

export const SAVE_KEY = 'medici.save.v1'

/** Seeds a save before the app loads, only if none exists, so a reload keeps what the game wrote. */
export async function seedSave(page: Page, save: Record<string, unknown> = {}) {
  const value = JSON.stringify({ version: 1, unlocked: 1, stars: {}, settings: { sound: false }, ...save })
  await page.addInitScript(([key, v]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, v)
  }, [SAVE_KEY, value] as const)
}
```

`tests/e2e/shell.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { seedSave } from './helpers'

test('title offers Start, Select Level, and Settings', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  for (const name of ['Start', 'Select Level', 'Settings']) await expect(page.getByRole('button', { name })).toBeVisible()
})

test('level select: L1 open, the rest locked, six sections, only Chest expanded', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.locator('section')).toHaveCount(6)
  for (const t of ['Chest', 'Upper extremity', 'Lower extremity', 'Abdomen', 'Skull', 'Refresher'])
    await expect(page.getByRole('heading', { name: new RegExp(`^${t}`) })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Level 1: Pulmonary edema' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax (locked)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Level 3: Scimitar syndrome (PAPVR) (locked)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Level 4:/ })).toHaveCount(0) // Upper extremity collapsed
})

test('the card list scrolls to level 20 without the stage moving', async ({ page }) => {
  await seedSave(page, { unlocked: 20 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Select Level' }).click()
  const stage = page.getByTestId('stage')
  const before = await stage.boundingBox()
  await page.getByTestId('card-list').hover()
  await page.mouse.wheel(0, 4000)
  await expect(page.getByRole('button', { name: 'Level 20: Skull fracture' })).toBeInViewport()
  expect(await stage.boundingBox()).toEqual(before)
  expect(await stage.evaluate((el) => el.scrollTop)).toBe(0)
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
})

test('settings has exactly sound and reset progress, and no timer or hint toggle', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog.getByRole('checkbox')).toHaveCount(1)
  await expect(dialog.getByRole('checkbox', { name: 'Sound' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Reset progress' })).toBeVisible()
  await expect(dialog.getByText(/timer|hint/i)).toHaveCount(0)
})

test('reset progress asks first, then relocks everything', async ({ page }) => {
  await seedSave(page, { unlocked: 5 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Reset progress' }).click()
  await page.getByRole('button', { name: 'Yes, reset' }).click()
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax (locked)' })).toBeDisabled()
})
```

Run: `npx playwright test tests/e2e/shell.spec.ts`
Expected: all 5 FAIL on both projects, each on its first assertion: `getByRole('button', { name: 'Start' })` / `'Select Level'` / `'Settings'` is not found, because `main.tsx` still renders only the boot text. This proves only that the shell is absent. The behavioural failures each test names are proven when Step 3 makes them pass.

- [ ] **Step 2: Implement the shell**

`src/audio.ts`:

```ts
import { assetUrl } from './assets'

let enabled = true
let ambience: HTMLAudioElement | null = null

export function setSound(on: boolean) {
  enabled = on
  if (!on) ambience?.pause()
  else if (ambience) void ambience.play().catch(() => {})
}

export function play(id: string) {
  const url = assetUrl(id)
  if (enabled && url) void new Audio(url).play().catch(() => {})
}

/** Browsers allow audio only after a user gesture, so the first click starts the loop. */
export function startAmbience() {
  const url = assetUrl('ambience-clinic')
  if (ambience || !url) return
  ambience = new Audio(url)
  ambience.loop = true
  ambience.volume = 0.3
  if (enabled) void ambience.play().catch(() => {})
}
```

`src/ui/Stars.tsx`:

```tsx
import { Img } from './Img'

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => <Img key={i} id={i <= n ? 'star-full' : 'star-empty'} className="star" />)}
    </span>
  )
}
```

`src/screens/Title.tsx`:

```tsx
import type { Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Save } from '../app/save'
import { Img } from '../ui/Img'

export function Title({ save, dispatch }: { save: Save; dispatch: Dispatch<Action> }) {
  return (
    <div className="screen title">
      <Img id="bg-title" className="bg" />
      <Img id="logo" className="logo" alt="Radtech Simulator" />
      <nav className="menu">
        <button className="btn" onClick={() => dispatch({ type: 'go', screen: { name: 'level', id: save.unlocked } })}>Start</button>
        <button className="btn" onClick={() => dispatch({ type: 'go', screen: { name: 'levelSelect' } })}>Select Level</button>
        <button className="btn" onClick={() => dispatch({ type: 'openSettings' })}>Settings</button>
      </nav>
    </div>
  )
}
```

`src/screens/LevelSelect.tsx`:

```tsx
import type { Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Save } from '../app/save'
import type { Level } from '../data/schema'
import { LEVELS } from '../data/levels'
import { Img } from '../ui/Img'
import { Stars } from '../ui/Stars'

const SECTIONS: { id: Level['section']; title: string }[] = [
  { id: 'chest', title: 'Chest' }, { id: 'upper-ext', title: 'Upper extremity' },
  { id: 'lower-ext', title: 'Lower extremity' }, { id: 'abdomen', title: 'Abdomen' },
  { id: 'skull', title: 'Skull' }, { id: 'refresher', title: 'Refresher' },
]

export function LevelSelect({ save, dispatch }: { save: Save; dispatch: Dispatch<Action> }) {
  return (
    <div className="screen level-select">
      <Img id="bg-title" className="bg" />
      <header>
        <button className="icon-btn" aria-label="Back" onClick={() => dispatch({ type: 'go', screen: { name: 'title' } })}>
          <Img id="icon-back" />
        </button>
        <h1>Select a case</h1>
        <button className="icon-btn" aria-label="Settings" onClick={() => dispatch({ type: 'openSettings' })}>
          <Img id="icon-settings" />
        </button>
      </header>
      <div className="card-list" data-testid="card-list">
        {SECTIONS.map((sec) => {
          const levels = LEVELS.filter((l) => l.section === sec.id)
          const done = levels.filter((l) => (save.stars[l.id] ?? 0) > 0).length
          // A section stays collapsed to its heading until its first level is unlocked (spec §4.2).
          const open = levels[0].id <= save.unlocked
          return (
            <section key={sec.id}>
              <h2>{sec.title} <span className="progress">{done}/{levels.length}</span></h2>
              {open && (
                <div className="cards">
                  {levels.map((l) => {
                    const locked = l.id > save.unlocked
                    return (
                      <button key={l.id} className="card" disabled={locked}
                        aria-label={`Level ${l.id}: ${l.title}${locked ? ' (locked)' : ''}`}
                        onClick={() => dispatch({ type: 'go', screen: { name: 'level', id: l.id } })}>
                        <span className="num">{l.id}</span>
                        <span className="name">{l.title}</span>
                        <span className="exam">{l.order.exam}</span>
                        {locked ? <Img id="icon-lock" className="lock" /> : <Stars n={save.stars[l.id] ?? 0} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
```

`src/screens/Settings.tsx`:

```tsx
import { useState, type Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Save } from '../app/save'

/** Sound and reset progress only: timers are mandatory and there are no hints (spec §4.2). */
export function Settings({ save, dispatch }: { save: Save; dispatch: Dispatch<Action> }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="overlay" role="dialog" aria-label="Settings">
      <div className="panel">
        <h2>Settings</h2>
        <label className="row">
          <input type="checkbox" checked={save.settings.sound} onChange={() => dispatch({ type: 'toggleSound' })} />
          Sound
        </label>
        {confirming ? (
          <div className="row">
            Erase all progress?
            <button className="btn" onClick={() => { dispatch({ type: 'resetProgress' }); setConfirming(false) }}>Yes, reset</button>
            <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirming(true)}>Reset progress</button>
        )}
        <button className="btn" onClick={() => dispatch({ type: 'closeSettings' })}>Close</button>
      </div>
    </div>
  )
}
```

`src/app/App.tsx`:

```tsx
import { useEffect, useReducer, type MouseEvent } from 'react'
import { Stage } from './Stage'
import { reducer, type State } from './store'
import { loadSave, writeSave } from './save'
import { play, setSound, startAmbience } from '../audio'
import { Title } from '../screens/Title'
import { LevelSelect } from '../screens/LevelSelect'
import { Settings } from '../screens/Settings'

const init = (): State => ({ screen: { name: 'title' }, save: loadSave(), settingsOpen: false })

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const { screen, save } = state
  useEffect(() => writeSave(save), [save])
  useEffect(() => setSound(save.settings.sound), [save.settings.sound])

  const onClickCapture = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) play('sfx-click')
    startAmbience()
  }

  return (
    <Stage>
      <div className="app" onClickCapture={onClickCapture}>
        {screen.name === 'title' && <Title save={save} dispatch={dispatch} />}
        {screen.name === 'levelSelect' && <LevelSelect save={save} dispatch={dispatch} />}
        {state.settingsOpen && <Settings save={save} dispatch={dispatch} />}
      </div>
    </Stage>
  )
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Append to `src/styles.css`:

```css
.app, .screen { position: absolute; inset: 0; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
button { font: inherit; cursor: pointer; color: inherit; }
.btn {
  min-width: 200px; padding: 12px 20px; border: 3px solid #3a2a22; border-radius: 10px;
  background: #f5d9a8; color: #3a2a22; font-size: 20px; font-weight: 700;
}
button:hover:not(:disabled) { filter: brightness(1.08); }
button:active:not(:disabled) { translate: 0 1px; }

.title .logo { position: absolute; left: 50%; top: 40px; width: 420px; translate: -50% 0; }
.menu { position: absolute; left: 50%; top: 330px; translate: -50% 0; display: flex; flex-direction: column; gap: 14px; }

.level-select header {
  position: absolute; inset: 0 0 auto; height: 64px; z-index: 1; display: flex; align-items: center;
  justify-content: space-between; padding: 0 16px; background: rgba(58, 42, 34, .88); color: #efe6d8;
}
.level-select h1 { font-size: 24px; margin: 0; }
.icon-btn { width: 44px; height: 44px; padding: 4px; border: 0; background: none; }
.icon-btn > * { width: 100%; height: 100%; min-width: 0; min-height: 0; }
.card-list { position: absolute; inset: 64px 0 0; overflow-y: auto; padding: 8px 24px 32px; touch-action: pan-y; }
.card-list h2 { margin: 16px 0 8px; color: #efe6d8; text-shadow: 0 1px 3px #000; }
.progress { margin-left: 8px; font-size: 14px; opacity: .85; }
.cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.card {
  height: 132px; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  border: 3px solid #3a2a22; border-radius: 10px; background: #f3e7d3;
}
.card:disabled { opacity: .55; cursor: not-allowed; }
.card .num { font-size: 22px; font-weight: 800; }
.card .name { font-size: 13px; font-weight: 700; text-align: center; }
.card .exam { font-size: 11px; }
.card .lock { width: 24px; height: 24px; min-width: 0; min-height: 0; }
.stars { display: inline-flex; gap: 2px; }
.star { width: 22px; height: 22px; min-width: 0; min-height: 0; }

.overlay { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .55); }
.panel {
  min-width: 420px; max-width: 640px; padding: 24px; display: flex; flex-direction: column; gap: 14px; align-items: center;
  text-align: center; border: 3px solid #3a2a22; border-radius: 14px; background: #f3e7d3;
}
.panel .row { display: flex; gap: 10px; align-items: center; font-size: 18px; }
```

- [ ] **Step 3: Run the tests**

Run: `npx playwright test tests/e2e/shell.spec.ts` → 10 PASS (5 × 2 projects).
Run: `npm run qa` → PASS.

- [ ] **Step 4: Commit**

```powershell
git add src tests/e2e/helpers.ts tests/e2e/shell.spec.ts
git commit -m "feat: add the title, level select, and settings screens" -m "Sections stay collapsed until reached, and settings offer only what the client allows: sound and reset."
```

---

### Task 7: Entering a case — intake, the order card, and positioning

**Files:**
- Create: `src/stages/Level.tsx`, `src/stages/Intake.tsx`, `src/stages/Order.tsx`, `src/stages/Position.tsx`, `src/ui/Copy.tsx`, `src/ui/OrderCard.tsx`, `src/ui/TimerRing.tsx`, `tests/e2e/position.spec.ts`
- Modify: `src/app/App.tsx`, `src/styles.css`, `tests/e2e/helpers.ts`

**Interfaces:**
- Consumes: `Level`, `levelById` (Task 4); `CaseResult`, `mistakes`, `stars` (Task 3); `Img` (Task 2); `play` (Task 6).
- Produces:
  - `src/stages/Level.tsx`: `<Level level onFinish={(r: CaseResult) => void} />`. Its root is `div.level[data-stage=<name>]` with `name` in `intake | order | position | technique | collimate | expose`; the docked order card shows from `position` onward. Task 8 adds the last three stages.
  - Stage contract: `({ level, onComplete })`. Intake and Order call `onComplete()`; Position calls `onComplete(pose: string | null)`.
  - `src/ui/Copy.tsx`: `AWAITING = 'Awaiting client'`, `<Copy text={string | null} />`.
  - `src/ui/OrderCard.tsx`: `<OrderCard level docked? />`, an `aside` labelled "Doctor's order".
  - `src/ui/TimerRing.tsx`: `useCountdown(seconds: number, running: boolean, onExpire: () => void): number` and `<TimerRing left total />`.
  - `tests/e2e/helpers.ts` gains `startLevel(page, id)`, `throughOrder(page)`, `poseButton(page, imageId)`, `stageOf(page)`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/helpers.ts`:

```ts
/** Seeds a save with `id` unlocked and presses Start, which opens the highest unlocked level. */
export async function startLevel(page: Page, id = 1) {
  await seedSave(page, { unlocked: id })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
}

export async function throughOrder(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Dock the order' }).click()
}

export const poseButton = (page: Page, imageId: string) => page.locator(`button.pose:has([data-asset="${imageId}"])`)
export const stageOf = (page: Page) => page.locator('[data-stage]')
```

`tests/e2e/position.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { startLevel, throughOrder, poseButton, stageOf } from './helpers'

test('intake shows the patient and "Awaiting client" for the missing line', async ({ page }) => {
  await startLevel(page, 1)
  await expect(page.locator('[data-asset="patient-old-man"]')).toBeVisible()
  await expect(page.getByText('Awaiting client')).toBeVisible()
})

test('the order card carries every patient field and no findings', async ({ page }) => {
  await startLevel(page, 1)
  await page.getByRole('button', { name: 'Continue' }).click()
  const card = page.getByRole('complementary', { name: "Doctor's order" })
  for (const value of ['Fernando R. Castillo', '70/Male', 'Hypersthenic', '09-May-1956', '050956-70418',
    '01-September-2026 1045H', 'Increasing shortness of breath', 'Recently diagnosed with colon cancer',
    'Chest X-ray', 'PA, Lateral', 'Perform PA'])
    await expect(card).toContainText(value)
  await expect(page.getByText('Large volume left-sided pleural effusion')).toHaveCount(0)
})

test('pose thumbnails carry no text label during play', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await expect(page.locator('.poses')).not.toContainText(/chest/i)
})

test('a correct pose advances with no popup', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})

test('a wrong pose explains, reveals the correct pose, and offers no retry', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-ap').click()
  const dialog = page.getByRole('dialog', { name: 'Wrong position' })
  await expect(dialog).toContainText('Awaiting client') // the "why" sentence is a §12 gap
  await expect(dialog.locator('[data-asset="pose-chest-pa"]')).toBeVisible()
  await expect(dialog.getByRole('button')).toHaveCount(1) // Continue, and nothing to pick again
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})

test('a double click on a wrong pose is counted once', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-ap').dblclick()
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('the position timer running out is scored as a wrong position', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await page.clock.runFor(61_000)
  await expect(page.getByRole('dialog', { name: 'Wrong position' })).toContainText("Time's up")
})

test('on touch, a long-press previews a pose without choosing it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch gesture')
  await startLevel(page, 1)
  await throughOrder(page)
  const pose = poseButton(page, 'pose-chest-ap')
  await pose.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await expect(page.getByTestId('pose-preview')).toBeVisible()
  await pose.dispatchEvent('pointerup', { pointerType: 'touch' })
  await pose.dispatchEvent('click')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'position')
})

test('on touch, a quick tap chooses the pose', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch gesture')
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').tap()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})
```

Run: `npx playwright test tests/e2e/position.spec.ts`
Expected: every test FAILS at its first level-specific step: `Start` dispatches `{ name: 'level' }`, which `App` does not render yet, so `[data-asset="patient-old-man"]` / the `Continue` button is not found. The skipped touch tests on desktop are reported as skipped.

- [ ] **Step 2: Implement the shared UI**

`src/ui/Copy.tsx`:

```tsx
export const AWAITING = 'Awaiting client'

/** Client copy: a null sentence is a §12 gap and says so rather than inventing anything. */
export function Copy({ text }: { text: string | null }) {
  return text === null ? <span className="awaiting">{AWAITING}</span> : <>{text}</>
}
```

`src/ui/OrderCard.tsx`:

```tsx
import type { Level } from '../data/schema'
import { Copy } from './Copy'
import { Img } from './Img'

/** The complete patient information from the case database (spec §4.3). Findings never appear here. */
export function OrderCard({ level, docked = false }: { level: Level; docked?: boolean }) {
  const { patient: p, order: o } = level
  const rows: [string, string | null][] = [
    ['Name', p.name], ['Age/Sex', `${p.age}/${p.sex}`], ['Body habitus', p.habitus],
    ['Date of birth', p.dob], ['Patient ID', p.patientId], ['Admitted', p.admitted],
    ['Chief complaint', o.complaint],
    ...(o.history === null ? [] : [['Relevant history', o.history] as [string, string]]),
    ['Provisional diagnosis', o.diagnosis], ['Examination requested', o.exam],
    ['Requested projection', o.requested], ['Mission', o.mission], ['Structures to show', o.structures],
  ]
  return (
    <aside className={docked ? 'order-card docked' : 'order-card'} aria-label="Doctor's order">
      <Img id="order-card" className="art" />
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd><Copy text={v} /></dd></div>
        ))}
      </dl>
    </aside>
  )
}
```

A null history is a faithful transcription, not a gap (spec §12), so that row is omitted rather than shown as "Awaiting client".

`src/ui/TimerRing.tsx`:

```tsx
import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Counts down from `seconds` while `running` and calls `onExpire` once at zero. It polls a fixed deadline
 * rather than chaining one timeout per render, so the whole countdown lives in a single interval: that keeps
 * it accurate when the tab is throttled, and lets Playwright's fake clock run it out with one `runFor`.
 */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(seconds)
  const expire = useRef(onExpire)
  useEffect(() => { expire.current = onExpire })
  useEffect(() => {
    if (!running) return
    const deadline = Date.now() + seconds * 1000
    const t = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) { window.clearInterval(t); expire.current() }
    }, 250)
    return () => window.clearInterval(t)
  }, [running, seconds])
  return left
}

export function TimerRing({ left, total }: { left: number; total: number }) {
  return (
    <div className="timer" role="timer" aria-label={`${left} seconds left`} style={{ '--p': left / total } as CSSProperties}>
      <span>{left}</span>
    </div>
  )
}
```

- [ ] **Step 3: Implement the stages and the runner**

`src/stages/Intake.tsx`:

```tsx
import type { Level } from '../data/schema'
import { Copy } from '../ui/Copy'
import { Img } from '../ui/Img'

export function Intake({ level, onComplete }: { level: Level; onComplete: () => void }) {
  return (
    <div className="screen intake">
      <Img id="bg-reception" className="bg" />
      <Img id={level.patient.sprite} className="patient" alt={level.patient.name} />
      <div className="bubble">
        <Img id="chat-bubble" className="art" />
        <p><Copy text={level.patient.line} /></p>
      </div>
      <button className="btn next" onClick={onComplete}>Continue</button>
    </div>
  )
}
```

`src/stages/Order.tsx`:

```tsx
import type { Level } from '../data/schema'
import { Img } from '../ui/Img'
import { OrderCard } from '../ui/OrderCard'

export function Order({ level, onComplete }: { level: Level; onComplete: () => void }) {
  return (
    <div className="screen order">
      <Img id="bg-reception" className="bg" />
      <OrderCard level={level} />
      <button className="btn next" onClick={onComplete}>Dock the order</button>
    </div>
  )
}
```

`src/stages/Position.tsx`:

```tsx
import { useRef, useState } from 'react'
import type { Level } from '../data/schema'
import { play } from '../audio'
import { Copy } from '../ui/Copy'
import { Img } from '../ui/Img'
import { TimerRing, useCountdown } from '../ui/TimerRing'

const LONG_PRESS_MS = 400

/** One attempt. A wrong pick (or the timer running out) explains, reveals the right pose, then advances (spec §4.3). */
export function Position({ level, onComplete }: { level: Level; onComplete: (pose: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [wrong, setWrong] = useState<{ pose: string | null } | null>(null)
  const [committed, setCommitted] = useState(false)
  const done = useRef(false) // guards a double click landing before the re-render
  const press = useRef<{ timer?: number; long: boolean }>({ long: false })
  const options = level.position.options
  const correct = options.find((o) => o.correct)!

  const commit = (pose: string | null) => {
    if (done.current) return
    done.current = true
    setCommitted(true)
    if (pose === correct.image) {
      play('sfx-correct')
      onComplete(pose)
    } else {
      play('sfx-wrong')
      setWrong({ pose })
    }
  }
  const left = useCountdown(level.timers.position, !committed, () => commit(null))
  const chosen = wrong && options.find((o) => o.image === wrong.pose)

  return (
    <div className="screen position">
      <Img id="bg-xray-room" className="bg" />
      <h2 className="prompt">Choose the patient position</h2>
      <TimerRing left={left} total={level.timers.position} />
      <div className={wrong ? 'poses wrong' : 'poses'}>
        {options.map((o, i) => (
          <button key={o.image} className="pose" aria-label={`Position option ${i + 1}`}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setPreview(o.image) }}
            onPointerLeave={() => setPreview(null)}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') return
              press.current.long = false
              press.current.timer = window.setTimeout(() => { press.current.long = true; setPreview(o.image) }, LONG_PRESS_MS)
            }}
            onPointerUp={() => {
              window.clearTimeout(press.current.timer)
              if (press.current.long) setPreview(null)
            }}
            onClick={() => {
              if (press.current.long) { press.current.long = false; return } // the end of a long-press, not a choice
              commit(o.image)
            }}
            onContextMenu={(e) => e.preventDefault()}>
            <Img id={o.image} />
          </button>
        ))}
      </div>
      {preview && !wrong && (
        <div className="pose-preview" data-testid="pose-preview"><Img id={preview} /></div>
      )}
      {wrong && (
        <div className="overlay" role="dialog" aria-label="Wrong position">
          <div className="panel">
            <h2>{chosen ? `${chosen.label} is not the right position` : "Time's up: no position was chosen"}</h2>
            {chosen && <p><Copy text={chosen.why} /></p>}
            <p>The correct position is {correct.label}.</p>
            <Img id={correct.image} className="correct-pose" />
            <button className="btn" onClick={() => onComplete(wrong.pose)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

The touch long-press test dispatches `pointerdown` and then waits on `pose-preview` becoming visible. Playwright's auto-wait covers the 400 ms, so no fixed sleep is needed.

`src/stages/Level.tsx`:

```tsx
import { useState } from 'react'
import type { Level as LevelData } from '../data/schema'
import type { CaseResult } from '../game/rules'
import { OrderCard } from '../ui/OrderCard'
import { Intake } from './Intake'
import { Order } from './Order'
import { Position } from './Position'

const STEPS = ['intake', 'order', 'position', 'technique', 'collimate', 'expose'] as const

/** Runs the six stages in order; each knows nothing of the others and reports one slice of the result. */
export function Level({ level, onFinish }: { level: LevelData; onFinish: (r: CaseResult) => void }) {
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<Partial<CaseResult>>({})
  const advance = (patch: Partial<CaseResult> = {}) => {
    const next = { ...result, ...patch }
    setResult(next)
    if (step === STEPS.length - 1) onFinish(next as CaseResult)
    else setStep(step + 1)
  }
  const name = STEPS[step]
  return (
    <div className="level" data-stage={name}>
      {name === 'intake' && <Intake level={level} onComplete={() => advance()} />}
      {name === 'order' && <Order level={level} onComplete={() => advance()} />}
      {name === 'position' && <Position level={level} onComplete={(pose) => advance({ pose })} />}
      {step >= 2 && <OrderCard level={level} docked />}
    </div>
  )
}
```

The technique, collimate, and expose steps render only the docked card until Task 8 adds them. Nothing calls `onFinish` yet.

In `src/app/App.tsx`, add the imports:

```tsx
import { levelById } from '../data/levels'
import { mistakes, stars } from '../game/rules'
import { Level } from '../stages/Level'
```

and render the level screen after the `levelSelect` line:

```tsx
        {screen.name === 'level' && (
          <Level key={screen.id} level={levelById(screen.id)}
            onFinish={(result) => dispatch({
              type: 'finish', id: screen.id, result, stars: stars(mistakes(result, levelById(screen.id))),
            })} />
        )}
```

Append to `src/styles.css`:

```css
.level { position: absolute; inset: 0; }
.next { position: absolute; right: 24px; bottom: 24px; }
.awaiting { padding: 0 4px; border-radius: 4px; background: #fff3cd; color: #8a6d3b; font-style: italic; }
.art { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; object-fit: fill; }

.intake .patient { position: absolute; left: 140px; bottom: 0; height: 540px; animation: slide-in 600ms ease-out; }
@keyframes slide-in { from { translate: -420px 0; opacity: 0; } }
.intake .bubble {
  position: absolute; left: 430px; top: 110px; width: 420px; padding: 28px 32px; isolation: isolate;
  font-size: 19px; animation: pop 300ms 500ms ease-out both;
}
@keyframes pop { from { scale: .6; opacity: 0; } }

.order-card {
  position: absolute; left: 50%; top: 30px; width: 540px; translate: -50% 0; padding: 30px 36px;
  isolation: isolate; font-size: 15px; animation: pop 300ms ease-out;
}
.order-card dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 0; }
.order-card dl div { display: contents; }
.order-card dt { font-weight: 700; }
.order-card dd { margin: 0; white-space: pre-line; }
.order-card.docked {
  left: 8px; top: 8px; width: 236px; max-height: 624px; translate: none; padding: 14px; z-index: 5;
  overflow-y: auto; font-size: 10.5px; animation: none; touch-action: pan-y;
}
.order-card.docked dl { grid-template-columns: 1fr; gap: 0; }
.order-card.docked dd { margin-bottom: 4px; }

.prompt {
  position: absolute; left: 260px; right: 110px; top: 18px; margin: 0; padding: 8px; text-align: center;
  font-size: 22px; font-weight: 800; border-radius: 10px; background: rgba(243, 231, 211, .92);
}
.timer {
  position: absolute; right: 24px; top: 12px; width: 64px; height: 64px; border-radius: 50%; display: grid;
  place-items: center; font-size: 20px; font-weight: 800;
  background: conic-gradient(#b8432f calc(var(--p) * 360deg), #e8d9c0 0);
}
.timer span { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: #f3e7d3; }

.poses { position: absolute; left: 260px; right: 24px; top: 170px; display: flex; justify-content: center; gap: 20px; }
.pose {
  width: 200px; height: 200px; padding: 0; overflow: hidden; border: 4px solid #3a2a22; border-radius: 12px;
  background: #fff; touch-action: manipulation; -webkit-touch-callout: none;
}
.pose > * { width: 100%; height: 100%; object-fit: cover; }
.pose-preview {
  position: absolute; left: 50%; top: 50%; z-index: 10; width: 440px; height: 440px; translate: -50% -50%;
  overflow: hidden; pointer-events: none; border: 4px solid #3a2a22; border-radius: 14px; background: #fff;
}
.pose-preview > * { width: 100%; height: 100%; object-fit: contain; }
.correct-pose { width: 220px; height: 220px; object-fit: cover; border-radius: 10px; }

/* Wrong-answer feedback: 400 ms red flash and shake (spec §6). */
.wrong { animation: shake 400ms, flash 400ms; }
@keyframes shake { 20%, 60% { translate: -8px 0; } 40%, 80% { translate: 8px 0; } }
@keyframes flash { 30% { background-color: rgba(192, 57, 43, .45); } }
```

- [ ] **Step 4: Run the tests**

Run: `npx playwright test tests/e2e/position.spec.ts`
Expected: 18 runs. Desktop: 7 PASS, 2 skipped (touch). Mobile: 9 PASS.
Run: `npm run qa` → PASS.

- [ ] **Step 5: Commit**

```powershell
git add src tests/e2e/helpers.ts tests/e2e/position.spec.ts
git commit -m "feat: add intake, the docked order card, and one-shot positioning" -m "The order card carries every patient field the client asked to keep; positioning explains a wrong pick once and never offers a retry."
```

---

### Task 8: Technique, collimation, exposure, and the debrief

**Files:**
- Create: `src/ui/Dial.tsx`, `src/stages/Technique.tsx`, `src/stages/Collimate.tsx`, `src/stages/Expose.tsx`, `src/screens/Results.tsx`, `tests/e2e/case.spec.ts`
- Modify: `src/stages/Level.tsx`, `src/app/App.tsx`, `src/styles.css`, `tests/e2e/helpers.ts`

**Interfaces:**
- Consumes: everything above; `checkTechnique`, `checkCollimation`, `filmFor`, `mistakes`, `stars` (Task 3); `filmId` (Task 2).
- Produces: `<Dial label value min max step onChange art wrong? unit? />`, whose range input is labelled `label` and whose step buttons are `<label> down` / `<label> up`. Technique calls `onComplete({ kvp, mas })`, Collimate `onComplete(failures: number)`, Expose `onComplete()`. Results lists one `tr.ok` / `tr.bad` per scored decision.

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/helpers.ts`:

```ts
import { expect } from '@playwright/test'

export async function setTechnique(page: Page, kvp: number, mas: number) {
  await page.getByLabel('kVp', { exact: true }).fill(String(kvp))
  await page.getByLabel('mAs', { exact: true }).fill(String(mas))
  await page.getByRole('button', { name: 'Confirm' }).click()
}

export async function collimate(page: Page, w = 60, h = 70) {
  await page.getByLabel('Width', { exact: true }).fill(String(w))
  await page.getByLabel('Height', { exact: true }).fill(String(h))
  await page.getByRole('button', { name: 'Set collimation' }).click()
}

/** Holds the exposure button until it fires. Pass `clock` when the test installed a fake clock. */
export async function expose(page: Page, clock = false) {
  await page.getByRole('button', { name: 'Hold to expose' }).hover()
  await page.mouse.down()
  if (clock) await page.clock.runFor(2_000)
  await expect(page.getByRole('status')).toHaveText(/Exposure taken/, { timeout: 5_000 })
  await page.mouse.up()
}

/** Plays level 1, right at every step unless told otherwise. */
export async function playL1(page: Page, o: { pose?: string; kvp?: number; mas?: number } = {}) {
  await throughOrder(page)
  await poseButton(page, o.pose ?? 'pose-chest-pa').click()
  if (o.pose && o.pose !== 'pose-chest-pa') await page.getByRole('button', { name: 'Continue' }).click()
  await setTechnique(page, o.kvp ?? 125, o.mas ?? 4)
  await collimate(page)
  await expose(page)
}
```

Move the new `import { expect }` line to the top of the file, beside the existing `import type { Page }`.

`tests/e2e/case.spec.ts` — level 1 is 125 kVp ± 13 and 4 mAs ± 0.4 (spec §5):

```ts
import { test, expect } from '@playwright/test'
import { startLevel, throughOrder, poseButton, stageOf, setTechnique, collimate, expose, playL1 } from './helpers'

const film = (page: import('@playwright/test').Page) => page.locator('[data-asset^="xray-"]')

test('a clean case: the good film only after the exposure, 3 stars, no ✗, and L2 unlocked across a reload', async ({ page }) => {
  await startLevel(page, 1)
  await playL1(page)
  await expect(page.locator('[data-asset="xray-pulmonaryedema-good"]')).toBeVisible()
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(0)
  await expect(page.getByText('Large volume left-sided pleural effusion')).toBeVisible()
  await page.getByRole('button', { name: 'Level select' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax' })).toBeEnabled()
  await page.reload()
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax' })).toBeEnabled()
})

test('film and findings stay sealed until the results screen', async ({ page }) => {
  await startLevel(page, 1)
  const sealed = async () => {
    await expect(film(page)).toHaveCount(0)
    await expect(page.getByText('Large volume left-sided pleural effusion')).toHaveCount(0)
  }
  await sealed()
  await throughOrder(page)
  await sealed()
  await poseButton(page, 'pose-chest-pa').click()
  await sealed()
  await setTechnique(page, 100, 4)
  await sealed()
  await collimate(page)
  await sealed()
  await expose(page)
  await expect(film(page)).toHaveCount(1)
})

test('a wrong position still yields the good film, with 2 stars and one ✗', async ({ page }) => {
  await startLevel(page, 1)
  await playL1(page, { pose: 'pose-chest-ap' })
  await expect(page.locator('[data-asset="xray-pulmonaryedema-good"]')).toBeVisible()
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('a low kVp shakes the console and says nothing; the film is underexposed and the debrief names 125', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('100')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.locator('.dial.wrong')).toHaveCount(1)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.technique')).not.toContainText(/correct|125/)
  await expect(film(page)).toHaveCount(0)
  await collimate(page)
  await expose(page)
  await expect(page.locator('[data-asset="xray-pulmonaryedema-under"]')).toBeVisible()
  await expect(page.locator('tr.bad', { hasText: 'kVp' })).toContainText('set 100 · correct 125')
})

test('three failed collimations then a good one cost one mistake, not three', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await setTechnique(page, 125, 4)
  for (let i = 0; i < 3; i++) await collimate(page, 100, 100)
  await collimate(page)
  await expose(page)
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('the position timer running out costs exactly one mistake', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await page.clock.runFor(61_000)
  await page.getByRole('button', { name: 'Continue' }).click()
  await setTechnique(page, 125, 4)
  await collimate(page)
  await expose(page, true)
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('the technique timer submits the dials as they stand', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('125')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  await page.clock.runFor(46_000)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'collimate')
  await collimate(page)
  await expose(page, true)
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
})

test('a double click on Confirm advances once, to collimation', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('125')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Confirm' }).dblclick()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'collimate')
})

test('sliding off the exposure button during prep aborts and never fires', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await setTechnique(page, 125, 4)
  await collimate(page)
  await page.getByRole('button', { name: 'Hold to expose' }).hover()
  await page.mouse.down()
  await page.mouse.move(5, 5)
  await expect(page.getByRole('status')).toHaveText(/Released too early/)
  await page.waitForTimeout(2_000) // longer than the 1.5 s prep: the exposure must not fire anyway
  await page.mouse.up()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'expose')
  await expect(film(page)).toHaveCount(0)
})
```

Run: `npx playwright test tests/e2e/case.spec.ts`
Expected: every test FAILS where it first reaches the technique stage: `getByLabel('kVp', { exact: true })` is not found, because Task 7 renders only the docked card there. "film and findings stay sealed" passes its first three `sealed()` checks before failing the same way.

- [ ] **Step 2: Implement the Dial and the three stages**

`src/ui/Dial.tsx`:

```tsx
import { Img } from './Img'

type Props = {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; art: 'dial' | 'knob'; wrong?: boolean; unit?: string
}

/** Drag (a native range input) or ± buttons. Values are rounded to the step's precision. */
export function Dial({ label, value, min, max, step, onChange, art, wrong = false, unit = '' }: Props) {
  const decimals = step < 1 ? 1 : 0
  const set = (v: number) => onChange(Number(Math.min(max, Math.max(min, v)).toFixed(decimals)))
  const turn = { transform: `rotate(${-135 + (270 * (value - min)) / (max - min)}deg)` }
  return (
    <div className={wrong ? 'dial wrong' : 'dial'}>
      <div className="dial-face">
        <Img id={art} style={art === 'knob' ? turn : undefined} />
        {art === 'dial' && <Img id="dial-needle" className="needle" style={turn} />}
      </div>
      <output className="readout">{value.toFixed(decimals)}{unit}</output>
      <div className="dial-controls">
        <button aria-label={`${label} down`} onClick={() => set(value - step)}>−</button>
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
          onChange={(e) => set(Number(e.target.value))} />
        <button aria-label={`${label} up`} onClick={() => set(value + step)}>+</button>
      </div>
      <span className="dial-label">{label}</span>
    </div>
  )
}
```

`src/stages/Technique.tsx`:

```tsx
import { useRef, useState } from 'react'
import type { Level } from '../data/schema'
import { checkTechnique } from '../game/rules'
import { play } from '../audio'
import { Dial } from '../ui/Dial'
import { Img } from '../ui/Img'
import { TimerRing, useCountdown } from '../ui/TimerRing'

const SHAKE_MS = 400

/**
 * One Confirm for both dials. A wrong value shakes its dial and nothing else: no explanation, no correct
 * value (spec §4.3). The dials start at their minimum so no level's answer is pre-set (spec §5).
 */
export function Technique({ level, onComplete }: { level: Level; onComplete: (v: { kvp: number; mas: number }) => void }) {
  const { kvp: k, mas: m } = level.technique
  const [kvp, setKvp] = useState(k.min)
  const [mas, setMas] = useState(m.min)
  const [wrong, setWrong] = useState({ kvp: false, mas: false })
  const [submitted, setSubmitted] = useState(false)
  const done = useRef(false)

  const submit = () => {
    if (done.current) return
    done.current = true
    setSubmitted(true)
    const w = { kvp: !checkTechnique(kvp, k), mas: !checkTechnique(mas, m) }
    if (!w.kvp && !w.mas) return onComplete({ kvp, mas })
    play('sfx-wrong')
    setWrong(w)
    window.setTimeout(() => onComplete({ kvp, mas }), SHAKE_MS)
  }
  // Expiry submits the dials as they stand, judged exactly like Confirm (spec §4.3).
  const left = useCountdown(level.timers.technique, !submitted, submit)

  return (
    <div className="screen technique">
      <Img id="bg-console" className="bg" />
      <h2 className="prompt">Set the exposure factors</h2>
      <TimerRing left={left} total={level.timers.technique} />
      <div className="console">
        <Dial art="dial" label="kVp" value={kvp} min={k.min} max={k.max} step={k.step} onChange={setKvp} wrong={wrong.kvp} />
        <Dial art="dial" label="mAs" value={mas} min={m.min} max={m.max} step={m.step} onChange={setMas} wrong={wrong.mas} />
      </div>
      <button className="btn next" onClick={submit} disabled={submitted}>Confirm</button>
    </div>
  )
}
```

`src/stages/Collimate.tsx`:

```tsx
import { useState } from 'react'
import type { Level } from '../data/schema'
import { checkCollimation } from '../game/rules'
import { correctOption } from '../data/levels'
import { play } from '../audio'
import { Dial } from '../ui/Dial'
import { Img } from '../ui/Img'

const SHAKE_MS = 400

/**
 * Untimed. Success advances silently; failure shakes and the player adjusts again (spec §4.3).
 * The view is the correct pose image: no separate collimation art was delivered (spec §7.2).
 */
export function Collimate({ level, onComplete }: { level: Level; onComplete: (failures: number) => void }) {
  const [w, setW] = useState(100)
  const [h, setH] = useState(100)
  const [failures, setFailures] = useState(0)
  const [shaking, setShaking] = useState(false)
  const { target } = level.collimate

  const check = () => {
    if (checkCollimation({ w, h }, level.collimate)) return onComplete(failures)
    play('sfx-wrong')
    setFailures(failures + 1)
    setShaking(true)
    window.setTimeout(() => setShaking(false), SHAKE_MS)
  }

  return (
    <div className="screen collimate">
      <Img id="bg-xray-room" className="bg" />
      <h2 className="prompt">{level.collimate.instruction}</h2>
      <div className={shaking ? 'collim-view wrong' : 'collim-view'}>
        <Img id={correctOption(level).image} />
        <div className="target" style={{ width: `${target.w}%`, height: `${target.h}%` }} />
        <div className="light" style={{ width: `${w}%`, height: `${h}%` }} />
      </div>
      <div className="knobs">
        <Dial art="knob" label="Width" value={w} min={10} max={100} step={1} onChange={setW} unit="%" />
        <Dial art="knob" label="Height" value={h} min={10} max={100} step={1} onChange={setH} unit="%" />
      </div>
      <button className="btn next" onClick={check}>Set collimation</button>
    </div>
  )
}
```

`src/stages/Expose.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { play } from '../audio'
import { Img } from '../ui/Img'

const PREP_MS = 1500
type Phase = 'idle' | 'prep' | 'fired' | 'aborted'
const PROMPT: Record<Phase, string> = {
  idle: 'Press and hold to take the exposure',
  prep: 'Rotor prep. Keep holding',
  fired: 'Exposure taken. Release the button',
  aborted: 'Released too early. Press and hold until the exposure fires.',
}

/** Press and hold: rotor prep, the exposure fires, then release. Letting go early aborts; it is never a mistake. */
export function Expose({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const timer = useRef<number | undefined>(undefined)
  const done = useRef(false)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const press = () => {
    if (phase === 'fired' || phase === 'prep') return
    setPhase('prep')
    timer.current = window.setTimeout(() => { play('sfx-xray'); setPhase('fired') }, PREP_MS)
  }
  const release = () => {
    window.clearTimeout(timer.current)
    if (phase === 'fired' && !done.current) { done.current = true; onComplete() }
    else if (phase === 'prep') setPhase('aborted')
  }
  const isKey = (k: string) => k === ' ' || k === 'Enter'

  return (
    <div className="screen expose">
      <Img id="bg-console" className="bg" />
      <p className="prompt" role="status">{PROMPT[phase]}</p>
      <button className="expose-button" aria-label="Hold to expose"
        onPointerDown={press} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
        onKeyDown={(e) => { if (isKey(e.key)) { e.preventDefault(); if (!e.repeat) press() } }}
        onKeyUp={(e) => { if (isKey(e.key)) release() }}
        onContextMenu={(e) => e.preventDefault()}>
        <Img id={phase === 'prep' || phase === 'fired' ? 'radtech-hand-button-pressed' : 'radtech-hand-button'} />
      </button>
    </div>
  )
}
```

In `src/stages/Level.tsx`, add the imports:

```tsx
import { Technique } from './Technique'
import { Collimate } from './Collimate'
import { Expose } from './Expose'
```

and the three stage lines after the `position` line:

```tsx
      {name === 'technique' && <Technique level={level} onComplete={(v) => advance(v)} />}
      {name === 'collimate' && <Collimate level={level} onComplete={(collimationFailures) => advance({ collimationFailures })} />}
      {name === 'expose' && <Expose onComplete={() => advance()} />}
```

- [ ] **Step 3: Implement the results screen**

`src/screens/Results.tsx`:

```tsx
import type { Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Level } from '../data/schema'
import { checkTechnique, filmFor, mistakes, stars, type CaseResult, type Film } from '../game/rules'
import { filmId } from '../assets'
import { correctOption } from '../data/levels'
import { Copy } from '../ui/Copy'
import { Img } from '../ui/Img'
import { Stars } from '../ui/Stars'

const FILM_LABEL: Record<Film, string> = { good: 'DIAGNOSTIC', under: 'UNDEREXPOSED', over: 'OVEREXPOSED' }

function Row({ name, ok, value, note }: { name: string; ok: boolean; value: string; note?: string | null }) {
  return (
    <tr className={ok ? 'ok' : 'bad'}>
      <th>{name}</th>
      <td aria-label={ok ? 'correct' : 'wrong'}>{ok ? '✓' : '✗'}</td>
      <td>{value}{note !== undefined && <p className="note"><Copy text={note} /></p>}</td>
    </tr>
  )
}

/** The film, the stars, then the debrief: everything the stages withheld (spec §4.5). */
export function Results({ level, result, dispatch }: { level: Level; result: CaseResult; dispatch: Dispatch<Action> }) {
  const t = level.technique
  const film = filmFor(result.kvp, result.mas, t)
  const correct = correctOption(level)
  const chosen = level.position.options.find((o) => o.image === result.pose)
  const poseOk = chosen?.correct ?? false
  const kvpOk = checkTechnique(result.kvp, t.kvp)
  const masOk = checkTechnique(result.mas, t.mas)
  const go = (id: number) => dispatch({ type: 'go', screen: { name: 'level', id } })

  return (
    <div className="screen results">
      <Img id="bg-viewer" className="bg" />
      <div className="lightbox">
        <Img id={filmId(level.films.slug, film)} className="film" alt={`${FILM_LABEL[film]} radiograph`} />
      </div>
      <div className="debrief">
        <h2>Level {level.id}: {level.title}</h2>
        <Stars n={stars(mistakes(result, level))} />
        <table>
          <tbody>
            <Row name="Position" ok={poseOk}
              value={poseOk ? correct.label : `${chosen ? chosen.label : 'No position chosen'} · correct ${correct.label}`}
              note={poseOk || !chosen ? undefined : chosen.why} />
            <Row name="kVp" ok={kvpOk} value={kvpOk ? `${result.kvp}` : `set ${result.kvp} · correct ${t.kvp.target}`}
              note={kvpOk ? undefined : t.wrongKvp} />
            <Row name="mAs" ok={masOk} value={masOk ? `${result.mas}` : `set ${result.mas} · correct ${t.mas.target}`}
              note={masOk ? undefined : t.wrongMas} />
            <Row name="Collimation" ok={result.collimationFailures === 0}
              value={result.collimationFailures === 0 ? 'First attempt' : `${result.collimationFailures + 1} attempts`} />
            <Row name="Film" ok={film === 'good'} value={FILM_LABEL[film]}
              note={film === 'under' ? level.films.underNote : film === 'over' ? level.films.overNote : undefined} />
          </tbody>
        </table>
        <p className="note"><Copy text={t.note} /></p>
        {level.findings && (
          <section className="findings">
            <h3>Radiologist's findings</h3>
            <p>{level.findings}</p>
          </section>
        )}
      </div>
      <div className="actions">
        {level.id < 20 && <button className="btn" onClick={() => go(level.id + 1)}>Next case</button>}
        <button className="btn" onClick={() => go(level.id)}>Repeat case</button>
        <button className="btn" onClick={() => dispatch({ type: 'go', screen: { name: 'levelSelect' } })}>Level select</button>
      </div>
    </div>
  )
}
```

In `src/app/App.tsx`, import `Results` from `'../screens/Results'` and render it after the level line:

```tsx
        {screen.name === 'results' && (
          <Results level={levelById(screen.id)} result={screen.result} dispatch={dispatch} />
        )}
```

Append to `src/styles.css`:

```css
.console { position: absolute; left: 260px; right: 24px; top: 100px; display: flex; justify-content: center; gap: 40px; }
.dial { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px; border-radius: 14px; background: rgba(243, 231, 211, .92); }
.dial-face { position: relative; width: 180px; height: 180px; }
.dial-face > * { position: absolute; inset: 0; width: 100%; height: 100%; min-width: 0; min-height: 0; transition: transform 120ms; }
.readout { font: 800 28px/1 ui-monospace, monospace; }
.dial-controls { display: flex; align-items: center; gap: 6px; }
.dial-controls button { width: 40px; height: 40px; border: 3px solid #3a2a22; border-radius: 8px; background: #f5d9a8; font-size: 22px; font-weight: 800; }
.dial-controls input { width: 160px; touch-action: pan-x; }
.dial-label { font-weight: 800; }

.collim-view { position: absolute; left: 260px; top: 80px; width: 400px; height: 400px; overflow: hidden; border: 4px solid #3a2a22; border-radius: 10px; background: #000; }
.collim-view > img, .collim-view > .placeholder { width: 100%; height: 100%; object-fit: cover; }
.collim-view .target, .collim-view .light { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
.collim-view .target { outline: 3px dashed #c0392b; }
.collim-view .light { background: rgba(255, 221, 87, .35); outline: 2px solid rgba(255, 221, 87, .9); }
.knobs { position: absolute; left: 680px; top: 80px; display: flex; flex-direction: column; gap: 8px; }
.knobs .dial-face { width: 90px; height: 90px; }
.knobs .readout { font-size: 18px; }

.expose-button { position: absolute; left: 50%; top: 140px; width: 320px; height: 320px; translate: -50% 0; padding: 0; border: 0; background: none; touch-action: none; -webkit-touch-callout: none; }
.expose-button > * { width: 100%; height: 100%; object-fit: contain; }

.results .lightbox { position: absolute; left: 24px; top: 24px; width: 400px; height: 592px; display: grid; place-items: center; border-radius: 10px; background: #111; }
.results .film { max-width: 100%; max-height: 100%; object-fit: contain; animation: develop 1200ms ease-out; }
@keyframes develop { from { opacity: 0; filter: brightness(3); } }
.debrief { position: absolute; left: 444px; right: 24px; top: 24px; bottom: 90px; overflow-y: auto; padding: 16px; border-radius: 12px; background: rgba(243, 231, 211, .95); touch-action: pan-y; }
.debrief h2 { margin: 0 0 6px; font-size: 20px; }
.debrief table { width: 100%; margin: 10px 0; border-collapse: collapse; }
.debrief th { width: 110px; padding: 4px; text-align: left; vertical-align: top; }
.debrief td { padding: 4px; vertical-align: top; }
.debrief tr.ok td:nth-child(2) { color: #2e7d32; }
.debrief tr.bad td:nth-child(2) { color: #c0392b; font-weight: 800; }
.note { margin: 4px 0 0; font-size: 13px; font-style: italic; }
.findings h3 { margin: 12px 0 4px; font-size: 15px; }
.findings p { margin: 0; font-size: 14px; }
.results .actions { position: absolute; left: 444px; right: 24px; bottom: 20px; display: flex; justify-content: flex-end; gap: 10px; }
.results .actions .btn { min-width: 0; font-size: 16px; }
```

- [ ] **Step 4: Run the tests**

Run: `npx playwright test tests/e2e/case.spec.ts` → 18 PASS (9 × 2 projects).
Run: `npm run qa` → PASS: typecheck, lint, all unit tests, and every e2e spec on both projects.

- [ ] **Step 5: Play it by hand once**

Run: `npm run dev`, open the printed URL, and play level 5 or later end to end on the real art. Automated tests cover level 1 only, and this is the one look at whether a pose, film, or patient renders as a grey box anywhere else. Note any layout problem as a follow-up, not a fix inside this task.

- [ ] **Step 6: Commit**

```powershell
git add src tests/e2e/helpers.ts tests/e2e/case.spec.ts
git commit -m "feat: add technique, collimation, exposure, and the case debrief" -m "The console stays silent on a wrong value and the film appears only after the exposure, so the debrief is the first place a student learns the right answer."
```

---

### Task 9: The client's question sheet and the status docs

**Files:**
- Modify (rewrite): `docs/client/level-content-sheet.md`
- Modify: `README.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: the twenty level files (Task 4).

- [ ] **Step 1: Generate the sheet from the level files**

The sheet repeats per level and must match the JSON exactly, so generate it rather than typing it. Save this as `$env:TEMP\content-sheet.mjs`; it is a one-off and is not committed:

```js
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = 'src/data/levels'
const levels = readdirSync(dir).sort().map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')))
const n = (x) => +x.toFixed(1)
const range = (d) => `${n(d.target - d.tolerance)} to ${n(d.target + d.tolerance)}`

const out = [
  '# Radtech Simulator: Level Content Sheet',
  '',
  'Updated 1 October 2026, for the twenty cases in your LIST OF CASES.',
  '',
  'The game is now built from your case list, and every case is playable. Your list does not cover everything the game needs, though, so for now it uses stand-in values, and wherever a sentence is missing the student sees the words "Awaiting client". This sheet collects only what is still missing. Nothing you already wrote is asked for again.',
  '',
  'Each level has two parts. **Please check** lists the stand-in values: answer yes if one is right, or write the correct value. **Please write** asks for the sentences the student reads. Most are read in the review at the end of the case, after the student has seen their X-ray, so write them as explanations rather than hints.',
  '',
  'One thing applies to every level: the kVp dial runs from 40 to 150 and the mAs dial from 0.5 to 50, the same on every case, as on a real console. Tell us if you would like different limits.',
  '',
]

for (const l of levels) {
  const right = l.position.options.find((o) => o.correct)
  const wrong = l.position.options.filter((o) => !o.correct)
  out.push(
    `## Level ${l.id}: ${l.title}`,
    '',
    `${l.patient.name}, ${l.patient.age}. ${l.order.mission}.`,
    '',
    '**Please check**',
    '',
    `- Wrong positions offered: ${wrong.map((o) => o.label).join(' and ')}. The right one is ${right.label}. Right? Yes / No, use instead:`,
    `- kVp: ${l.technique.kvp.target}, and anything from ${range(l.technique.kvp)} counts as correct. Right? Yes / No, use instead:`,
    `- mAs: ${l.technique.mas.target}, and anything from ${range(l.technique.mas)} counts as correct. Right? Yes / No, use instead:`,
    `- Collimation: the target box is ${l.collimate.target.w}% of the picture's width and ${l.collimate.target.h}% of its height. The size in centimetres, if you have it:`,
    '',
    '**Please write**',
    '',
    '- What the patient says when they walk in:',
    ...wrong.map((o) => `- Why ${o.label} is the wrong position:`),
    '- A tip on balancing kVp and mAs for this patient:',
    '- Why a wrong kVp is wrong for this case:',
    '- Why a wrong mAs is wrong for this case:',
    '- What the underexposed film fails to show:',
    '- What the overexposed film fails to show:',
    ...(l.order.structures ? [] : ['- The structures the film should show:']),
    '',
  )
}

out.push(
  '## Questions about the case list',
  '',
  '- **Level 1** is called "Pulmonary Edema", but its findings describe fluid around both lungs (pleural effusions). Which is it?',
  '- **Level 12**: the line marked "SS:" reads like a finding ("the sigmoid colon distended and demonstrating the coffee-bean sign"). It currently shows on the doctor\'s order, where it gives the answer away. Should it move to the findings shown at the end?',
  '- **Levels 10, 11, 12 and 19** use the same AP abdomen picture, but level 19 is upright and the others are lying down. Do you have an upright picture?',
  '- **Level 14** is a nasal bone lateral, shown with the whole-skull lateral picture. Is that close enough?',
  '- **Every level\'s doctor\'s order** includes the "Mission" line (for example "Perform PA"), which names the right position. Keep it, or hide it so students have to work out the position themselves?',
  '- **Positioning pictures**: most still show the collimation light and the "+" mark. Could you send cleaned copies under the same file names? They will drop straight in.',
  '- **The X-ray films** come from Radiopaedia, with their credit lines kept on each image. Is the game free to use, or will it ever be sold? Radiopaedia images usually allow free, non-commercial use only.',
  '',
)

writeFileSync('docs/client/level-content-sheet.md', out.join('\n'))
```

Run: `node $env:TEMP\content-sheet.mjs`
Expected: `docs/client/level-content-sheet.md` rewritten, about 450 lines. Open it and check two levels against their JSON by eye: level 2 should read "anything from 103 to 127" for kVp and "2.2 to 2.8" for mAs. Confirm the sheet has no bare `____` lines and no technical terms (JSON, schema, placeholder, null).

- [ ] **Step 2: Update the status docs**

In `README.md`, replace the Status section's phase line and the plan bullet:

```markdown
**Phase: first playable build. All twenty levels play end to end on the client's art; content gaps show "Awaiting client".**
```

```markdown
- Built from `docs/superpowers/plans/2026-10-01-medici-v1-plan.md`. `npm run qa` is the gate; `npm run dev` to play
- Waiting on the client: `docs/client/level-content-sheet.md` (reissued 2026-10-01 for the twenty cases)
- Next: Cloudflare Pages preview for the client (needs Vai to connect the GitHub repo)
```

In the README's layout block, change `The application (\`src/\`, \`tests/\`) is scaffolded as the first task of the implementation plan; its layout is defined in the spec §4.6.` to `The application is in \`src/\` and \`tests/\`; its layout is defined in the spec §4.6.`

Add under `## 2026-10-01` in `CHANGELOG.md`, after the existing paragraph:

```markdown

First playable build: all twenty levels, the full loop, the debrief, and the save, on the client's delivered art.
The level content sheet is reissued for the twenty cases, asking only for what the case list lacks plus
seven questions from spec §12. Not yet deployed.
```

- [ ] **Step 3: Run the gate and the build**

Run: `npm run qa` → PASS.
Run: `npm run build` → PASS, emitting `dist/`.

- [ ] **Step 4: Commit**

```powershell
git add docs/client/level-content-sheet.md README.md CHANGELOG.md
git commit -m "docs: reissue the content sheet for the twenty cases and record the first playable build" -m "The client can now answer against a playable game; the sheet asks only for what their case list does not carry."
```

- [ ] **Step 5: Stop and hand over**

Do not push, open a PR, or connect Cloudflare Pages. Report to Vai: the branch name, the commit list, the gate result with test counts, the hand-play notes from Task 8 Step 5, and the two deviations to confirm (`motion` and `prettier` not installed). Deploying needs Vai to push and connect the repository to Cloudflare Pages, with build command `npm run build` and output `dist`.
