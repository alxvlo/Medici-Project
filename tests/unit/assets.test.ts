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
