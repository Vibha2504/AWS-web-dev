import type { Metadata } from 'next'
import { ScannerPortal } from '@/components/scanner/scanner-portal'

export const metadata: Metadata = {
  title: 'Organizer Scanner',
  description: 'Verify signed CampusPass QR tickets at the gate in real time.',
  robots: { index: false },
}

export default function OrganizerScanPage() {
  return <ScannerPortal />
}
