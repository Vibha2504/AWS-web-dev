'use client'

import { useState } from 'react'
import {
  Bell,
  Camera,
  Check,
  Lock,
  Save,
  Server,
  Settings,
  Shield,
  Volume2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { toast } from 'sonner'

export default function OrganizerSettingsPage() {
  const [gateName, setGateName] = useState('Gate #1 - Main Entrance')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [cooldown, setCooldown] = useState(3)
  const [cryptoEngine, setCryptoEngine] = useState('HMAC-SHA256')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Gate scanner configuration updated successfully!')
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Gate Scanner & System Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure admission station telemetry, audio feedback, and verification parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Gate Station Identity */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Camera className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Station Identity & Viewfinder
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gateName" className="text-xs">Gate Station Label</Label>
              <Input
                id="gateName"
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                placeholder="e.g. Gate #1 - Main Entrance"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cooldown" className="text-xs">Duplicate Scan Cooldown (Seconds)</Label>
              <Input
                id="cooldown"
                type="number"
                min={1}
                max={15}
                value={cooldown}
                onChange={(e) => setCooldown(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Audio & Haptics */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Volume2 className="size-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Scanner Feedback & Telemetry
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
              <div>
                <div className="text-xs font-semibold text-foreground">Synthesized Audio Chimes</div>
                <div className="text-[11px] text-muted-foreground">
                  Play distinct sound frequencies for Valid, Duplicate, and Invalid scans.
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
              <div>
                <div className="text-xs font-semibold text-foreground">Haptic Vibration on Mobile</div>
                <div className="text-[11px] text-muted-foreground">
                  Trigger tactile vibration pulse on physical smartphone camera scans.
                </div>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Security Engine */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Shield className="size-4 text-indigo-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Cryptographic Security Protocol
            </h2>
          </div>

          <div className="rounded-lg bg-secondary/40 p-3.5 border border-border text-xs flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Cryptographic Primitive:</span>
              <span className="font-mono text-emerald-400 font-semibold">{cryptoEngine}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Side-Channel Protection:</span>
              <span className="text-foreground font-medium">Constant-Time Timing-Safe Equal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anti-Duplication Enforcement:</span>
              <span className="text-foreground font-medium">Atomic State Mutation</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className={buttonVariants({ variant: 'default' })}>
            <Save className="size-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  )
}
