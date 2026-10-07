'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { getAuditLog, getDemoToken, getGateStats, verifyTicket } from '@/lib/api'
import type { AuditLogEntry, VerificationResult } from '@/lib/types'
import { GateHeader } from '@/components/scanner/gate-header'
import { Viewfinder } from '@/components/scanner/viewfinder'
import { ScannerControls } from '@/components/scanner/scanner-controls'
import { VerificationHud } from '@/components/scanner/verification-hud'
import { AuditLogTable } from '@/components/scanner/audit-log-table'

export interface ScanOutcome {
  id: number
  result: VerificationResult
  scannedAt: string
}

const REPEAT_COOLDOWN_MS = 3000

export function ScannerPortal() {
  const stats = useSWR('gate-stats', getGateStats, { refreshInterval: 15_000 })
  const audit = useSWR('audit-log', getAuditLog, { refreshInterval: 15_000 })
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [pending, setPending] = useState(false)
  const now = useNow(20_000)
  const lastScan = useRef<{ token: string; at: number } | null>(null)
  const pendingRef = useRef(false)

  const verify = useCallback(
    async (token: string, method: AuditLogEntry['method']) => {
      const trimmed = token.trim()
      if (!trimmed || pendingRef.current) return
      const prev = lastScan.current
      if (method === 'camera' && prev && prev.token === trimmed && Date.now() - prev.at < REPEAT_COOLDOWN_MS) return

      lastScan.current = { token: trimmed, at: Date.now() }
      pendingRef.current = true
      setPending(true)
      try {
        const result = await verifyTicket(trimmed, method)
        setOutcome({ id: Date.now(), result, scannedAt: new Date().toISOString() })
        if (method === 'camera' && 'vibrate' in navigator) {
          navigator.vibrate(result.status === 'CHECKED_IN' ? 80 : [60, 60, 60])
        }
        await Promise.all([stats.mutate(), audit.mutate()])
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    },
    [stats, audit],
  )

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-10">
      <GateHeader stats={stats.data} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Viewfinder onDetect={(token) => verify(token, 'camera')} paused={pending} />
          <ScannerControls
            pending={pending}
            onManual={(token) => verify(token, 'manual')}
            onDemo={(kind) => verify(getDemoToken(kind), 'demo')}
          />
        </div>
        <VerificationHud outcome={outcome} pending={pending} now={now} onDismiss={() => setOutcome(null)} />
      </div>

      <AuditLogTable entries={audit.data} now={now} />
    </main>
  )
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
