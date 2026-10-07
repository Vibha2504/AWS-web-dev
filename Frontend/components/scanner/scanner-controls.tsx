'use client'

import { useState } from 'react'
import { FlaskConical, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DemoKind = 'valid' | 'duplicate' | 'tampered'

const DEMOS: { kind: DemoKind; label: string; dot: string; ring: string }[] = [
  { kind: 'valid', label: 'Test Valid Ticket', dot: 'bg-success', ring: 'hover:border-success/50 hover:bg-success/10' },
  { kind: 'duplicate', label: 'Test Duplicate Scan', dot: 'bg-warning', ring: 'hover:border-warning/50 hover:bg-warning/10' },
  { kind: 'tampered', label: 'Test Tampered / Counterfeit', dot: 'bg-danger', ring: 'hover:border-danger/50 hover:bg-danger/10' },
]

interface ScannerControlsProps {
  pending: boolean
  onManual: (token: string) => void
  onDemo: (kind: DemoKind) => void
}

export function ScannerControls({ pending, onManual, onDemo }: ScannerControlsProps) {
  const [token, setToken] = useState('')

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onManual(token)
          setToken('')
        }}
      >
        <Label htmlFor="manual-token" className="flex items-center gap-1.5 text-sm">
          <KeyRound className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Manual Token Fallback
        </Label>
        <div className="flex gap-2">
          <Input
            id="manual-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="CP1.TKT-HACK-84920.… or TKT-HACK-84920"
            autoComplete="off"
            spellCheck={false}
            className="h-10 font-mono text-sm"
          />
          <Button type="submit" className="h-10 px-4" disabled={pending || !token.trim()}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Verify
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <FlaskConical className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Demo Verification Tests
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEMOS.map((d) => (
            <Button
              key={d.kind}
              variant="outline"
              disabled={pending}
              onClick={() => onDemo(d.kind)}
              className={`h-10 justify-start px-3 text-left text-xs sm:text-sm ${d.ring}`}
            >
              <span className={`size-2 shrink-0 rounded-full ${d.dot}`} aria-hidden="true" />
              <span className="truncate">{d.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
