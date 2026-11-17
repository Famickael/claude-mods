import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, [] as Limit[])
const isHidden = atom({ plugin: 'usage-band', key: 'isHidden' } as const, false)

const LABELS: Record<string, string> = {
  five_hour: '5 h',
  seven_day: '7 jours',
  spend_limit: 'Budget',
}

const BAR = 10

function bar(remaining: number): string {
  const full = Math.round((remaining / 100) * BAR)
  return '█'.repeat(full) + '░'.repeat(BAR - full)
}

function colorFor(remaining: number): 'success' | 'warning' | 'error' {
  if (remaining <= 10) return 'error'
  if (remaining <= 30) return 'warning'
  return 'success'
}

function resetIn(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return ` · reset ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return ` · reset ${hours} h ${String(minutes % 60).padStart(2, '0')}`
  return ` · reset ${Math.round(hours / 24)} j`
}

function summary(list: Limit[], now: number): string {
  return list
    .map(l => {
      const remaining = Math.max(0, Math.min(100, 100 - l.percentUsed))
      return `${LABELS[l.kind] ?? l.kind} : ${Math.round(remaining)} % restant${resetIn(l.resetsAt, now)}`
    })
    .join('  |  ')
}

let lastWarned = 100

async function publish($: EngineInterface, list: Limit[]) {
  if (list.length === 0) return
  const now = await $.clock.now()
  $.ui.status(summary(list, now))
  const lowest = Math.min(...list.map(l => 100 - l.percentUsed))
  if (lowest <= 20 && lowest < lastWarned - 5) {
    lastWarned = lowest
    $.ui.toast(`Attention : plus que ${Math.round(lowest)} % d'utilisation restante`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    await publish($, usage.rateLimits.map(l => ({ ...l })))
    await update($, limits, () => usage.rateLimits.map(l => ({ ...l })))
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => e.rateLimits.map(l => ({ ...l })))
      await publish($, e.rateLimits.map(l => ({ ...l })))
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }

    let list = await read($, limits)
    if (list.length === 0) {
      list = (await $.session.usage()).rateLimits.map(l => ({ ...l }))
    }

    const { Box, Text, Button } = $.ui.resolve(e)

    if (list.length === 0) {
      return (
        <Box flexDirection="row" gap={2}>
          <Text dimColor>Utilisation : aucune donnée de limite reçue pour l'instant</Text>
          <Button key="hide" label="Masquer" onPress={() => update($, isHidden, () => true)} />
        </Box>
      )
    }
    const now = await $.clock.now()

    return (
      <Box flexDirection="row" gap={2}>
        {list.map(l => {
          const remaining = Math.max(0, Math.min(100, 100 - l.percentUsed))
          return (
            <Text key={l.kind}>
              <Text dimColor>{LABELS[l.kind] ?? l.kind} </Text>
              <Text color={colorFor(remaining)}>{bar(remaining)}</Text>
              <Text> {Math.round(remaining)} % restant</Text>
              <Text dimColor>{resetIn(l.resetsAt, now)}</Text>
            </Text>
          )
        })}
        <Button key="hide" label="Masquer" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
