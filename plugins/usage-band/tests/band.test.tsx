import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'usage-band',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10 },
} as const

test('shows remaining usage on every surface', async ($, on) => {
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200000, used: 0, apiUsage: null },
      rateLimits: [{ kind: 'five_hour', percentUsed: 28 }],
    },
  }))
  on('clock.now', () => ({ value: 0 }))
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface } as any)
    const row = await ui.find({ type: 'Text', text: /72 % restant/ })
    expect(row === undefined).toBe(false)
    await ui.unmount()
  }
})

test('shows a placeholder with no data', async ($, on) => {
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200000, used: 0, apiUsage: null }, rateLimits: [] },
  }))
  const ui = await $.ui.mount({ ...BAND, surface: 'mobile' } as any)
  expect((await ui.find({ type: 'Text', text: /aucune donnée/ })) === undefined).toBe(false)
  await ui.unmount()
})
