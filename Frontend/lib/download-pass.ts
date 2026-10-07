import { formatEventDate, formatTimeRange } from './format'
import type { CampusEvent, Ticket } from './types'

const W = 1200
const H = 520
const STUB_X = 820

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}

/** Renders the pass onto a canvas and triggers a PNG download. */
export async function downloadPass(qrCanvas: HTMLCanvasElement, ticket: Ticket, event: CampusEvent) {
  await document.fonts?.ready
  const dpr = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const font = getComputedStyle(document.body).fontFamily || 'sans-serif'
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

  ctx.fillStyle = '#090D16'
  ctx.fillRect(0, 0, W, H)
  roundRect(ctx, 20, 20, W - 40, H - 40, 28)
  ctx.fillStyle = '#0F172A'
  ctx.fill()
  ctx.strokeStyle = '#1E293B'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.setLineDash([8, 8])
  ctx.beginPath()
  ctx.moveTo(STUB_X, 50)
  ctx.lineTo(STUB_X, H - 50)
  ctx.stroke()
  ctx.setLineDash([])
  for (const y of [20, H - 20]) {
    ctx.beginPath()
    ctx.arc(STUB_X, y, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#090D16'
    ctx.fill()
  }

  ctx.fillStyle = '#64748B'
  ctx.font = `600 14px ${mono}`
  ctx.fillText('CAMPUSPASS  ·  ADMIT ONE', 64, 80)

  ctx.fillStyle = '#F1F5F9'
  ctx.font = `600 36px ${font}`
  ctx.fillText(truncate(ctx, event.title, STUB_X - 120), 64, 130)

  ctx.fillStyle = '#818CF8'
  ctx.font = `500 16px ${font}`
  ctx.fillText(event.category.toUpperCase(), 64, 162)

  const fields: [string, string][] = [
    ['ATTENDEE', ticket.attendee.fullName],
    ['STUDENT ID', ticket.attendee.studentId],
    ['DEPARTMENT', ticket.attendee.department],
    ['SEAT', ticket.seat],
    ['DATE', formatEventDate(event.startsAt)],
    ['TIME', formatTimeRange(event.startsAt, event.endsAt)],
  ]
  fields.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 64 + col * 360
    const y = 230 + row * 76
    ctx.fillStyle = '#64748B'
    ctx.font = `500 13px ${font}`
    ctx.fillText(label, x, y)
    ctx.fillStyle = '#E2E8F0'
    ctx.font = `600 20px ${font}`
    ctx.fillText(truncate(ctx, value, 330), x, y + 28)
  })

  ctx.fillStyle = '#94A3B8'
  ctx.font = `500 15px ${font}`
  ctx.fillText(truncate(ctx, event.venue, STUB_X - 120), 64, H - 56)

  const qrSize = 240
  const qrX = STUB_X + (W - 20 - STUB_X - qrSize) / 2
  roundRect(ctx, qrX - 16, 84, qrSize + 32, qrSize + 32, 18)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.drawImage(qrCanvas, qrX, 100, qrSize, qrSize)

  ctx.textAlign = 'center'
  const cx = qrX + qrSize / 2
  ctx.fillStyle = '#F1F5F9'
  ctx.font = `700 22px ${mono}`
  ctx.fillText(ticket.code, cx, 404)
  ctx.fillStyle = '#10B981'
  ctx.font = `500 13px ${mono}`
  ctx.fillText(`SIGNED · ${ticket.signature.slice(0, 12)}`, cx, 432)

  const link = document.createElement('a')
  link.download = `${ticket.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
