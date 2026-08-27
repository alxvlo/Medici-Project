# Tooling research — engines, AI assets, MCPs, hosting

**Date:** 2026-08-27
**Method:** background research agent, web search + fetch. Summarised; the decision it fed is recorded in the design spec (`docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md` §2).

## Engines / frameworks

| Option | Verdict |
|---|---|
| **Phaser 4** (v4.0 Apr 2026, v4.1 Apr 30) | Best canvas option. All-text code, Vite+TS template, best iOS Safari performance of the JS trio, fewest AI hallucinations per Phaser's own and jslegenddev's independent comparison. Official agent skill files exist. Caveat: 4 months old, so models mostly know Phaser 3. |
| **Plain React/DOM + CSS** | Best fit for this game. Papers Please / GPGP-style play is ~90% UI (sliders, buttons, drag, dialogue); DOM gives free text rendering, touch, accessibility. Claude Code is strongest at React/TS. Weakness: particles/juice and precise-timing QTEs are clumsier than canvas (doable with `requestAnimationFrame`). |
| **PixiJS v8** + pixi-react | Renderer only, no scenes/input/tweens/audio. Good as a canvas layer under React; more glue than Phaser. |
| **Godot 4.6** | Best "real engine" for agents (`.tscn`/`.gd` are text). But web export is a multi-MB WASM blob, iOS Safari needs single-threaded export, audio/focus quirks in iframes, hot reload = re-export. Overkill for UI-first. |
| **Unity 6 WebGL** | Runtime fee cancelled Sep 2024; free under $200k. Empty build ~10.7 MB. Editor-driven scenes. First-party Unity MCP exists. Wrong tool for a small 2D browser game. |
| **Kaplay** (v4000 alpha) | Easiest API, least scalable, most AI hallucinations. Jam only. |
| **Excalibur** (0.31 alpha) | No differentiator vs Phaser, worse AI recall. |

**What vibecoders report:** representation beats model — text-defined engines work; editor-driven ones fight the agent. Regrets are about process, not engine: agents ignore player cognitive load / UX unless told, timing mechanics need hand tuning, onboarding needed human work. Expect to build a screenshot loop (Playwright) so the agent can see its own output.

## AI asset generation (2D cartoon)

| Tool | Verdict / pricing |
|---|---|
| **Nano Banana 2 / Pro** (Gemini 3.1 Flash Image) | Consistency workhorse: holds up to 5 characters / 14 reference objects across edits; ~$0.14/img Pro via API; free in the Gemini app. Use for turnarounds, expression sheets, prop sets from one reference. |
| **GPT Image 1.5 / 2** | Best anatomy and reference→new-pose fidelity in 2026 head-to-heads; ~$0.13/img. Hero character sheets. |
| **FLUX.2 Pro** | ~$0.035/img; strongest backgrounds. |
| **Scenario** | $15/$45/$75 per mo; 50 free daily credits (personal use). Pro trains a style LoRA from 10–30 images — the answer to style drift across 100+ assets. |
| **Layer.ai** | $10/mo, no real free tier; studio-oriented. |
| **Ludo.ai** | Indie $20, Pro $50 with API+MCP. One-stop but generic. |
| **Midjourney** | $10–120/mo, no free tier, weak API. Mood boards only. |
| **Leonardo** | Free 150 tokens/day (public images). Budget option. |
| **PixelLab / Retro Diffusion** | Pixel-art only. Skip. |
| **SFX: ElevenLabs** | Free tier includes SFX (~50/mo) + TTS; Starter $6/mo. `loop` param for ambience. |
| **Music: Suno v5** | Free = non-commercial; Pro $10/mo for commercial rights. ElevenLabs Music bundled in ElevenLabs sub. |

**Consistency recipe:** one canonical reference → GPT Image or Nano Banana Pro for a turnaround sheet → reuse that sheet as the reference in every later prompt → optional Scenario LoRA once 20+ good frames exist. Budget for a human pass.

## MCP servers / Claude Code plugins

- **Phaser Game Agent MCP** (phaser.io/agent/mcp, Jul 2026): cloud workspace, $0.01/min. Prototype only.
- **Phaser skill files** (official + Chong-U's): cheapest high-value add if Phaser is ever embedded.
- **Playwright** skill for screenshot-driven QA — recommended regardless of engine.
- **Godot MCP** (godot-ai, GDAI, StraySpark $39.99): known auto-reload and scene-tree divergence issues. N/A.
- **Unity MCP**: first-party in `com.unity.ai.assistant`. N/A.
- **Image-gen MCPs**: `shinpr/mcp-image` (Nano Banana + GPT Image + Seedream, prompt optimisation) — pick one defaulting to `gemini-3.1-flash-image` (the 2.5 preview was shut down Jan 2026). Retro Diffusion MCP, Ludo MCP (Pro), Higgsfield MCP.
- **context7** (installed) for React/Vite/Motion docs.

## Hosting

| Host | Verdict |
|---|---|
| **Cloudflare Pages** | Best general static host: unlimited bandwidth, 500 builds/mo free, `_headers` for custom headers, preview URL per branch. **Chosen.** |
| **itch.io** | Best for a game: 1 GB zip, mobile-friendly flag, built-in audience, free. Iframe quirks. Optional second front door. |
| **GitHub Pages** | Free, no custom headers. Fine for React. |
| **Vercel** | Hobby tier is non-commercial only; a client project doesn't qualify. Avoid. |

## Not verified

Phaser 4 gzip bundle (only P3 numbers found); PixelLab / Retro Diffusion pricing from third-party pages; some Medium sources paywalled, details second-hand via snippets; no first-hand Reddit r/vibecoding regret threads found — most accounts were blogs, HN, and Phaser's own site (biased).

## Sources

- https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework
- https://jslegenddev.substack.com/p/i-tried-3-web-game-frameworks-so
- https://phaser.io/news/2026/07/phaser-game-agent-mcp-setup
- https://vivecuervo7.github.io/dev-blog/p/claude-code-godot/
- https://www.strayspark.studio/blog/godot-mcp-setup-claude-code-2026
- https://news.ycombinator.com/item?id=48884984
- https://vibedex.ai/blog/best-ai-image-generator-game-art-2026
- https://www.scenario.com/pricing · https://elevenlabs.io/pricing · https://www.layer.ai/pricing
- https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365
- https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.7/manual/integration/unity-mcp-get-started.html
- https://github.com/shinpr/mcp-image
- https://itch.io/t/2025776/experimental-sharedarraybuffer-support
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://vercel.com/docs/plans/hobby
