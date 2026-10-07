'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  CalendarDays,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Settings,
  Users,
  X,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/organizer/events', label: 'Events', icon: CalendarDays },
  { href: '/organizer/registrations', label: 'Registrations', icon: Users },
  { href: '/organizer/scan', label: 'Scan Passes', icon: ScanLine },
  { href: '/organizer/check-ins', label: 'Check-In History', icon: History },
  { href: '/organizer/settings', label: 'Settings', icon: Settings },
]

export function OrganizerSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const handleLogout = () => {
    toast.info('Organizer session active in demo mode')
  }

  return (
    <>
      {/* Mobile Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/organizer" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Organizer Portal</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/organizer" className="flex items-center gap-2.5">
            <Logo />
            <div>
              <div className="text-sm font-bold tracking-tight">CampusPass</div>
              <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <ShieldCheck className="size-3" />
                <span>Organizer Verified</span>
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
                {item.href === '/organizer/scan' && (
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                    Live
                  </span>
                )}
              </Link>
            )
          })}

          {/* Switch to Student Portal */}
          <div className="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            External
          </div>
          <Link
            href="/"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <span className="flex items-center gap-3">
              <CalendarDays className="size-4" />
              <span>Participant Portal</span>
            </span>
            <ArrowUpRight className="size-3.5 opacity-60" />
          </Link>
        </div>

        {/* Bottom Profile & Sign Out */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-bold text-primary">
                AR
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold leading-tight">Alex Rivera</div>
                <div className="text-[10px] text-muted-foreground">Lead Organizer</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
