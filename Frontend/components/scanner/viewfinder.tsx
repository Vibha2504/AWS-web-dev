'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, CameraOff, Loader2, ScanLine, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CameraState = 'off' | 'starting' | 'on' | 'error'

interface ViewfinderProps {
  onDetect: (token: string) => void
  paused: boolean
}

export function Viewfinder({ onDetect, paused }: ViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number>(0)
  const onDetectRef = useRef(onDetect)
  const pausedRef = useRef(paused)
  const [state, setState] = useState<CameraState>('off')
  const [error, setError] = useState('')

  useEffect(() => {
    onDetectRef.current = onDetect
    pausedRef.current = paused
  })

  useEffect(() => stopStream, [])

  function stopStream() {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function tick() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA && !pausedRef.current) {
      const scale = Math.min(1, 640 / video.videoWidth)
      const w = Math.floor(video.videoWidth * scale)
      const h = Math.floor(video.videoHeight * scale)
      if (w && h) {
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h)
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })
          if (code?.data) onDetectRef.current(code.data)
        }
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error')
      setError('Camera API unavailable in this browser. Use the manual fallback below.')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setState('on')
      frameRef.current = requestAnimationFrame(tick)
    } catch (err) {
      stopStream()
      setState('error')
      const name = err instanceof DOMException ? err.name : ''
      setError(
        name === 'NotAllowedError'
          ? 'Camera permission blocked — common inside embedded previews. Open in a new tab or use the fallback below.'
          : name === 'NotFoundError'
            ? 'No camera detected on this device.'
            : 'Could not start the camera. Use the manual fallback below.',
      )
    }
  }

  function stop() {
    stopStream()
    if (videoRef.current) videoRef.current.srcObject = null
    setState('off')
  }

  const live = state === 'on'

  return (
    <section aria-label="QR scanner viewfinder" className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-[#05080F]">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn('absolute inset-0 size-full object-cover', !live && 'invisible')}
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {!live && (
          <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(circle,black,transparent_75%)]" />
        )}

        <div aria-hidden="true" className="pointer-events-none absolute inset-[12%]">
          <Corner className="top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" live={live} />
          <Corner className="top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" live={live} />
          <Corner className="bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" live={live} />
          <Corner className="right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg" live={live} />
          {state !== 'error' && (
            <div className="laser-line absolute inset-x-2 h-0.5 rounded-full bg-sky-400 shadow-[0_0_14px_3px_rgb(56_189_248/0.6)]" />
          )}
        </div>

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 font-mono text-[11px] uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={cn('size-1.5 rounded-full', live ? 'bg-danger' : 'bg-slate-600')} aria-hidden="true" />
            {live ? 'Rec · scanning' : state === 'starting' ? 'Initializing' : 'Standby'}
          </span>
          <span>CP1 · HMAC</span>
        </div>

        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {state === 'starting' ? (
              <Loader2 className="size-8 animate-spin text-info" aria-hidden="true" />
            ) : state === 'error' ? (
              <>
                <TriangleAlert className="size-8 text-warning" aria-hidden="true" />
                <p className="max-w-xs text-sm text-slate-300" role="alert">
                  {error}
                </p>
              </>
            ) : (
              <>
                <ScanLine className="size-8 text-slate-500" aria-hidden="true" />
                <p className="max-w-xs text-sm text-slate-400">Align the attendee&apos;s QR pass inside the brackets.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {live ? 'Camera active — passes verify automatically.' : 'Camera access may be limited in preview.'}
        </p>
        {live ? (
          <Button variant="outline" className="h-9 px-3" onClick={stop}>
            <CameraOff aria-hidden="true" />
            Stop camera
          </Button>
        ) : (
          <Button className="h-9 px-3" onClick={start} disabled={state === 'starting'}>
            <Camera aria-hidden="true" />
            {state === 'error' ? 'Retry camera' : 'Start camera'}
          </Button>
        )}
      </div>
    </section>
  )
}

function Corner({ className, live }: { className: string; live: boolean }) {
  return (
    <span
      className={cn('absolute size-8 sm:size-10', live ? 'border-sky-400' : 'border-slate-500', className)}
    />
  )
}
