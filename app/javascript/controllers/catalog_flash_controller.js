import { Controller } from "@hotwired/stimulus"

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function hexToRgb(hex) {
  const cleaned = String(hex).trim().replace("#", "")
  if (![3, 6].includes(cleaned.length)) return null

  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned

  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return null

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgba(rgb, alpha) {
  const a = clamp(alpha, 0, 1)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
}

/**
 * One-shot "magic flash" for the hero CTA.
 * Plays only once per browser tab (sessionStorage) per full page session lifecycle.
 */
export default class extends Controller {
  connect() {
    this.storageKey = "madmask:catalogFlashDone:v1"

    // `sessionStorage` survives a hard reload, but we want the flash to
    // repeat after refresh. So we clear the flag only for full reloads.
    this.resetDoneFlagOnFullReload()

    this.hasFlashed =
      this.readDoneFromSession() ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Canvas cleanup handles should exist only while animation is running.
    this.canvasEl = null
    this.ctx = null
    this.rafId = null

    // Button vibration cleanup handles.
    this.vibrationRafId = null
    this.vibrationStartTime = null
    this.originalInlineTransform = null
    this.originalInlineFilter = null
  }

  flashOnce() {
    if (this.hasFlashed) return

    // Always mark as done immediately, so repeated mouseenter won't queue animations.
    this.markDoneInSession()

    if (this.prefersReducedMotion()) return

    // Slightly longer + stronger vibration feels more "energetic" on the initial flash.
    const durationMs = 1400
    this.startVibration(durationMs)
    this.runBurst(durationMs)
  }

  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }

  readDoneFromSession() {
    try {
      return window.sessionStorage.getItem(this.storageKey) === "1"
    } catch {
      // If storage is unavailable (privacy mode), just allow one run per connect().
      return false
    }
  }

  resetDoneFlagOnFullReload() {
    try {
      const nav = performance.getEntriesByType("navigation")?.[0]
      const isReload = nav?.type === "reload"

      // Fallback for older browsers.
      const legacyType = performance.navigation?.type
      const isLegacyReload = legacyType === 1 // 1 => TYPE_RELOAD

      if (isReload || isLegacyReload) {
        window.sessionStorage.removeItem(this.storageKey)
      }
    } catch {
      // Ignore failures (no-op).
    }
  }

  markDoneInSession() {
    this.hasFlashed = true
    try {
      window.sessionStorage.setItem(this.storageKey, "1")
    } catch {
      // Ignore write errors.
    }
  }

  runBurst(durationMs) {
    const rect = this.element.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    // Make the flash canvas cover the full current screen.
    const width = Math.max(1, Math.floor(window.innerWidth))
    const height = Math.max(1, Math.floor(window.innerHeight))
    const left = 0
    const top = 0

    const dpr = clamp(window.devicePixelRatio || 1, 1, 2)

    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.position = "fixed"
    canvas.style.left = `${left}px`
    canvas.style.top = `${top}px`
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "60" // above header (z-50)

    document.body.appendChild(canvas)
    this.canvasEl = canvas
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) {
      canvas.remove()
      this.canvasEl = null
      return
    }
    this.ctx = ctx
    ctx.scale(dpr, dpr)

    const styles = window.getComputedStyle(document.documentElement)
    const glowHex = styles.getPropertyValue("--color-accent-glow").trim()
    const cyberHex = styles.getPropertyValue("--color-accent-cyber-glow").trim()

    const glowRgb = hexToRgb(glowHex) ?? { r: 183, g: 111, b: 224 }
    const cyberRgb = hexToRgb(cyberHex) ?? { r: 102, g: 252, b: 241 }
    // Warm accents derived from glow (matches cursor smoke "torch" feeling).
    const torchRgb = {
      r: clamp(glowRgb.r + 75, 0, 255),
      g: clamp(glowRgb.g + 30, 0, 255),
      b: clamp(glowRgb.b - 160, 0, 255),
    }

    // Since the canvas is full-viewport and uses fixed coordinates,
    // getBoundingClientRect() coordinates are already in the same space.
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const particleCount = 52
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      // Fast at the beginning; we'll visually slow them down via strong velocity drag.
      const speed = 4.8 + Math.random() * 10.5
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed
      const life = 1
      // Slightly faster decay to ensure they fade before the edge.
      const decay = 0.016 + Math.random() * 0.018
      const size = 2.4 + Math.random() * 8.4

      // Blend between "glow" and "cyber" to match the existing smoke palette.
      const roll = Math.random()
      const rgb = roll < 0.55 ? glowRgb : roll < 0.88 ? cyberRgb : torchRgb

      particles.push({ x: centerX, y: centerY, vx, vy, life, decay, size, rgb })
    }

    const start = performance.now()
    const gravityY = 0.065
    // Strong per-frame damping: makes particles slow down quickly from the initial burst.
    // With ~60fps, 0.86^10 ~= 0.23 (visible slowdown within ~0.16s).
    const velocityDrag = 0.86

    const draw = () => {
      const now = performance.now()
      const elapsed = now - start

      if (!this.ctx || !this.canvasEl) return

      ctxSetForBurst(ctx)

      ctx.clearRect(0, 0, width, height)

      let alive = false
      for (const p of particles) {
        if (p.life <= 0) continue
        alive = true

        p.x += p.vx
        p.y += p.vy
        p.vy += gravityY
        p.vx *= velocityDrag
        p.vy *= velocityDrag
        p.life -= p.decay

        const t = clamp(p.life, 0, 1)
        const alphaCore = 1.0 * t
        const alphaOuter = 0.32 * t

        // Outer glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1.38 + (1 - t) * 0.58), 0, Math.PI * 2)
        ctx.fillStyle = rgba(p.rgb, alphaOuter)
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (0.62 + t * 0.45), 0, Math.PI * 2)
        ctx.fillStyle = rgba(p.rgb, alphaCore)
        ctx.fill()
      }

      const shouldStop = !alive || elapsed >= durationMs
      if (shouldStop) {
        this.cleanup()
        return
      }

      this.rafId = window.requestAnimationFrame(draw)
    }

    this.rafId = window.requestAnimationFrame(draw)
  }

  startVibration(durationMs) {
    if (this.vibrationRafId) window.cancelAnimationFrame(this.vibrationRafId)
    this.vibrationRafId = null
    this.vibrationStartTime = null

    const el = this.element
    this.originalInlineTransform = el.style.transform || ""
    this.originalInlineFilter = el.style.filter || ""

    // Hint to the browser that we will animate transforms.
    el.style.willChange = "transform"

    const start = performance.now()
    this.vibrationStartTime = start

    const frame = () => {
      if (!this.element) return
      const now = performance.now()
      const elapsed = now - start
      const t = elapsed / durationMs

      if (t >= 1) {
        el.style.transform = this.originalInlineTransform
        el.style.filter = this.originalInlineFilter
        el.style.willChange = ""
        this.vibrationRafId = null
        return
      }

      // Decaying amplitude: quick at start, fades out smoothly.
      const decay = 1 - t
      // More amplitude and a slower decay curve so it "hits" harder.
      const amp = 12 * Math.pow(decay, 1.35)

      const w = t * Math.PI * 2
      // Higher oscillation frequency for "energetic" feel.
      const tx = Math.sin(w * 8.2) * amp * 1.05
      const ty = Math.cos(w * 6.4) * amp * 0.8
      const rotDeg = Math.sin(w * 5.1) * amp * 0.14

      // Extra "kick" right at the beginning of the flash.
      const kick = clamp(1 - t / 0.16, 0, 1)

      // Slight brightness pump to make the effect feel "magic".
      const brightness = 1.12 + 0.32 * decay + 0.38 * kick
      const scale = 1 + 0.06 * decay + 0.1 * kick

      el.style.filter = `brightness(${brightness.toFixed(3)})`
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rotDeg.toFixed(
        2
      )}deg) scale(${scale.toFixed(3)})`

      this.vibrationRafId = window.requestAnimationFrame(frame)
    }

    this.vibrationRafId = window.requestAnimationFrame(frame)
  }

  cleanup() {
    if (this.rafId) window.cancelAnimationFrame(this.rafId)
    this.rafId = null

    if (this.canvasEl) this.canvasEl.remove()
    this.canvasEl = null
    this.ctx = null

    if (this.vibrationRafId) window.cancelAnimationFrame(this.vibrationRafId)
    this.vibrationRafId = null

    if (this.element) {
      this.element.style.transform = this.originalInlineTransform ?? ""
      this.element.style.filter = this.originalInlineFilter ?? ""
      this.element.style.willChange = ""
    }
  }

  disconnect() {
    this.cleanup()
  }
}

function ctxSetForBurst(ctx) {
  // Additive blending makes the flash read as "magic" without expensive blur.
  ctx.globalCompositeOperation = "lighter"
  ctx.globalAlpha = 1
}

