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
 * Cursor-following "magic smoke" trail using a lightweight canvas.
 * - No DOM elements created per frame (only draw on canvas).
 * - Animation runs only while particles exist (then stops automatically).
 * - Respects prefers-reduced-motion.
 */
export default class extends Controller {
  connect() {
    if (!this.element) return

    // Run the effect only on the landing page.
    if (window.location.pathname !== "/") {
      this.element.style.display = "none"
      return
    }

    if (this.prefersReducedMotion()) {
      this.element.style.display = "none"
      return
    }

    this.ctx = this.element.getContext("2d", { alpha: true })
    if (!this.ctx) return

    // Visual tuning (keep conservative for performance).
    this.outerRadiusMul = 1.55
    this.coreRadiusMul = 0.45
    // Simple physics tuning: make the smoke trail rise a bit,
    // then sag down due to gravity.
    this.gravityBase = 0.05
    // Slightly less damping so vertical fall becomes visible.
    this.dragXMul = 0.99
    this.dragYMul = 0.988

    // Spark tuning: short-lived bright particles on quick braking.
    this.sparkDrag = 0.92
    this.sparkGravityMul = 0.22
    this.decelToStrength = 25
    this.minDecelStrength = 0.18
    this.maxSparkPerBurst = 12

    this.colors = this.readBrandColors()

    this.particles = []
    this.maxParticles = this.computeMaxParticles()

    this.pixelRatio = this.computePixelRatio()

    this.cssWidth = 1
    this.cssHeight = 1
    this.offsetLeft = 0
    this.offsetTop = 0

    this.ctx.imageSmoothingEnabled = true

    this.boundPointerMove = this.onPointerMove.bind(this)
    this.boundTouchMove = this.onTouchMove.bind(this)
    this.boundResize = this.onResize.bind(this)
    this.boundTick = this.tick.bind(this)
    this.boundBeforeCache = this.pause.bind(this)
    this.boundAfterCache = this.resume.bind(this)

    this.resizeCanvas()
    this.mouseX = this.cssWidth / 2
    this.mouseY = this.cssHeight / 2
    this.lastX = this.mouseX
    this.lastY = this.mouseY
    // Motion state for deceleration detection (cursor braking).
    this.prevMoveX = this.mouseX
    this.prevMoveY = this.mouseY
    this.prevMoveTime = null
    this.prevSpeed = 0
    this.addListeners()
    window.addEventListener("resize", this.boundResize)

    document.addEventListener("turbo:before-cache", this.boundBeforeCache)
    document.addEventListener("turbo:load", this.boundAfterCache)
  }

  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }

  readBrandColors() {
    const styles = window.getComputedStyle(document.documentElement)
    const glowHex = styles.getPropertyValue("--color-accent-glow").trim()
    const cyberGlowHex = styles.getPropertyValue("--color-accent-cyber-glow").trim()

    const glowRgb = hexToRgb(glowHex) ?? { r: 183, g: 111, b: 224 } // fallback: #B76FE0
    const cyberRgb = hexToRgb(cyberGlowHex) ?? { r: 102, g: 252, b: 241 } // fallback: #66FCF1

    return { glowRgb, cyberRgb }
  }

  computePixelRatio() {
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const dpr = typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1
    return coarse ? 1 : Math.min(2, dpr)
  }

  computeMaxParticles() {
    const cores = navigator.hardwareConcurrency ?? 4
    const mem = navigator.deviceMemory ?? 4 // GB (may be undefined in some browsers)

    // 35–40 on decent devices; lower on weak devices.
    if (cores <= 4 || mem <= 4) return 26
    if (cores <= 8 || mem <= 8) return 35
    return 40
  }

  addListeners() {
    if (this.hasListeners) return
    this.hasListeners = true

    // pointermove covers mouse/pen; touchmove handles touch explicitly.
    window.addEventListener("pointermove", this.boundPointerMove, { passive: true })
    window.addEventListener("touchmove", this.boundTouchMove, { passive: true })
  }

  removeListeners() {
    if (!this.hasListeners) return
    this.hasListeners = false
    window.removeEventListener("pointermove", this.boundPointerMove)
    window.removeEventListener("touchmove", this.boundTouchMove)
  }

  onResize() {
    // Avoid resizing too often; it's usually enough to resize on next frame.
    if (this.pendingResize) return
    this.pendingResize = true
    window.requestAnimationFrame(() => {
      this.pendingResize = false
      this.pixelRatio = this.computePixelRatio()
      this.resizeCanvas()
      // Canvas size changed: redraw current frame if running.
      if (this.running) this.draw()
    })
  }

  resizeCanvas() {
    const rect = this.element.getBoundingClientRect()
    this.cssWidth = Math.max(1, Math.floor(rect.width))
    this.cssHeight = Math.max(1, Math.floor(rect.height))
    this.offsetLeft = rect.left
    this.offsetTop = rect.top

    const w = Math.floor(this.cssWidth * this.pixelRatio)
    const h = Math.floor(this.cssHeight * this.pixelRatio)

    if (this.element.width !== w) this.element.width = w
    if (this.element.height !== h) this.element.height = h

    // Map CSS pixels → canvas pixels.
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
  }

  onPointerMove(e) {
    if (e.pointerType === "touch") return
    const rect = this.element.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    this.maybeEmitSparks(cx, cy)
    this.addParticle(e.clientX, e.clientY)
  }

  onTouchMove(e) {
    const touch = e.touches?.[0]
    if (!touch) return
    const rect = this.element.getBoundingClientRect()
    const cx = touch.clientX - rect.left
    const cy = touch.clientY - rect.top
    this.maybeEmitSparks(cx, cy)
    this.addParticle(touch.clientX, touch.clientY)
  }

  maybeEmitSparks(cx, cy) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return

    const now = performance.now()
    if (this.prevMoveTime == null) {
      this.prevMoveTime = now
      this.prevMoveX = cx
      this.prevMoveY = cy
      this.prevSpeed = 0
      return
    }

    const dtMs = now - this.prevMoveTime
    if (dtMs <= 0) return

    const dx = cx - this.prevMoveX
    const dy = cy - this.prevMoveY
    const dist = Math.hypot(dx, dy)

    // Speed in canvas pixels per ms.
    const speed = dist / dtMs

    // Deceleration estimate: how much the speed dropped since last move.
    const decel = Math.max(0, this.prevSpeed - speed)
    const strength = clamp(decel * this.decelToStrength, 0, 1)

    // Update motion state now for next delta.
    this.prevSpeed = speed
    this.prevMoveTime = now
    this.prevMoveX = cx
    this.prevMoveY = cy

    if (strength < this.minDecelStrength) return

    const dirMag = Math.hypot(dx, dy)
    let dirX = 0
    let dirY = -1
    if (dirMag > 0.0001) {
      dirX = dx / dirMag
      dirY = dy / dirMag
    }
    const perpX = -dirY
    const perpY = dirX

    const sparkCount = clamp(
      Math.round(2 + strength * (this.maxSparkPerBurst - 2)),
      1,
      this.maxSparkPerBurst
    )
    const kick = 0.6 + strength * 3.0

    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift()

      const jitter = 0.4 + Math.random() * 0.9
      // Scatter mostly sideways (perp) + a bit opposite to motion (brake feel).
      const vx =
        perpX * (kick * 0.75) +
        -dirX * (kick * 0.25) +
        (Math.random() - 0.5) * jitter
      const vy =
        perpY * (kick * 0.75) +
        -dirY * (kick * 0.25) +
        (Math.random() - 0.5) * (jitter * 0.6) -
        0.5 * strength

      const radius = 1 + Math.random() * (1.5 + strength * 1.5)
      const alpha = 0.35 + strength * 0.5
      const fadeSpeed = 0.07 + Math.random() * 0.05 + strength * 0.01

      this.particles.push({
        kind: "spark",
        x: cx,
        y: cy,
        radius,
        alpha,
        life: 1,
        fadeSpeed,
        driftX: vx,
        driftY: vy,
        gravityY: this.gravityBase * (0.6 + Math.random() * 0.8) * this.sparkGravityMul
      })
    }

    this.start()
  }

  addParticle(x, y) {
    // Convert viewport coordinates → canvas-local coordinates.
    const rect = this.element.getBoundingClientRect()
    const cx = x - rect.left
    const cy = y - rect.top

    // Only emit when movement is noticeable.
    const dx = cx - this.lastX
    const dy = cy - this.lastY
    const distance = Math.hypot(dx, dy)
    if (distance < 3 && this.particles.length > 0) return

    this.lastX = cx
    this.lastY = cy
    this.mouseX = cx
    this.mouseY = cy

    if (this.particles.length >= this.maxParticles) {
      this.particles.shift()
    }

    const radius = 10 + Math.random() * 10
    const baseAlpha = 0.18 + Math.random() * 0.22

    this.particles.push({
      x: cx,
      y: cy,
      radius,
      alpha: baseAlpha,
      life: 1,
      fadeSpeed: 0.02 + Math.random() * 0.03,
      driftX: (Math.random() - 0.5) * 0.9,
      // Initial velocity (slight upward lift), then gravity takes over.
      driftY: (Math.random() - 0.5) * 0.6 - 0.12,
      gravityY: this.gravityBase * (0.95 + Math.random() * 0.9),
    })

    this.start()
  }

  start() {
    if (this.running) return
    this.running = true
    this.animationFrameId = window.requestAnimationFrame(this.boundTick)
  }

  pause() {
    this.removeListeners()
    if (this.animationFrameId) window.cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
    this.running = false
    // Clear state so Turbo cache doesn't keep running work visually.
    this.particles = []
    this.prevMoveTime = null
    this.prevSpeed = 0
    this.clear()
  }

  resume() {
    if (this.prefersReducedMotion()) return
    this.addListeners()
    if (this.particles.length > 0) this.start()
    else this.clear()
  }

  tick() {
    if (!this.running) return

    this.updateParticles()
    this.draw()

    if (this.particles.length === 0) {
      this.running = false
      this.animationFrameId = null
      this.clear()
      return
    }

    this.animationFrameId = window.requestAnimationFrame(this.boundTick)
  }

  updateParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      const kind = p.kind || "smoke"
      p.life -= p.fadeSpeed
      // Integrate particle motion with a tiny acceleration.
      // Keep it cheap (no dt): we already run at rAF.
      if (kind === "spark") {
        p.driftX *= this.sparkDrag
        const gravityY =
          p.gravityY ?? this.gravityBase * this.sparkGravityMul
        p.driftY = (p.driftY + gravityY) * this.sparkDrag
        p.x += p.driftX
        p.y += p.driftY
      } else {
        p.driftX *= this.dragXMul
        const gravityY = p.gravityY ?? this.gravityBase
        p.driftY = (p.driftY + gravityY) * this.dragYMul
        p.x += p.driftX
        p.y += p.driftY
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1)
        i--
      }
    }
  }

  clear() {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)
  }

  draw() {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)

    // Use additive blending for glow-like highlights.
    this.ctx.globalCompositeOperation = "lighter"

    for (const p of this.particles) {
      const t = Math.max(0, p.life)
      let a = p.alpha * t
      const kind = p.kind || "smoke"

      // Soft edge fading: particles are clipped by canvas bounds.
      // Fade them out gradually before the boundary to avoid "hard" disappearance.
      const w = this.cssWidth
      const h = this.cssHeight
      const distToEdge = Math.min(p.x, w - p.x, p.y, h - p.y)
      const fadeMargin = Math.max(
        kind === "spark" ? 22 : 46,
        p.radius * (kind === "spark" ? 6 : 3.5)
      )
      const edgeSoft = Math.pow(clamp(distToEdge / fadeMargin, 0, 1), 1.12)
      a *= edgeSoft

      if (kind === "spark") {
        // Streak aligned with velocity gives a "spark" feel.
        const speed = Math.hypot(p.driftX, p.driftY)
        const len = clamp(speed * 8, 2, 12)
        if (speed > 0.0001) {
          const ux = p.driftX / speed
          const uy = p.driftY / speed
          const x1 = p.x - ux * len * 0.65
          const y1 = p.y - uy * len * 0.65
          const x2 = p.x + ux * len * 0.2
          const y2 = p.y + uy * len * 0.2

          this.ctx.strokeStyle = rgba(this.colors.cyberRgb, a * 0.9)
          this.ctx.lineWidth = Math.max(1, p.radius * 0.6)
          this.ctx.beginPath()
          this.ctx.moveTo(x1, y1)
          this.ctx.lineTo(x2, y2)
          this.ctx.stroke()
        }

        // Outer glow.
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2)
        this.ctx.fillStyle = rgba(this.colors.glowRgb, a * 0.25)
        this.ctx.fill()

        // Bright center.
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.radius * 1.05, 0, Math.PI * 2)
        this.ctx.fillStyle = rgba(this.colors.cyberRgb, a * 0.95)
        this.ctx.fill()
      } else {
        // Outer glow layer.
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.radius * this.outerRadiusMul, 0, Math.PI * 2)
        this.ctx.fillStyle = rgba(this.colors.glowRgb, a * 0.22)
        this.ctx.fill()

        // Core smoke layer.
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        this.ctx.fillStyle = rgba(this.colors.glowRgb, a * 0.45)
        this.ctx.fill()

        // Bright kernel.
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.radius * this.coreRadiusMul, 0, Math.PI * 2)
        this.ctx.fillStyle = rgba(this.colors.cyberRgb, a * 0.85)
        this.ctx.fill()
      }
    }

    this.ctx.globalCompositeOperation = "source-over"
  }

  disconnect() {
    if (this.boundBeforeCache) {
      document.removeEventListener("turbo:before-cache", this.boundBeforeCache)
    }
    if (this.boundAfterCache) {
      document.removeEventListener("turbo:load", this.boundAfterCache)
    }
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize)
    }
    this.removeListeners()

    if (this.animationFrameId) window.cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null

    this.running = false
    this.particles = []
    this.prevMoveTime = null
    this.prevSpeed = 0

    this.clear()
  }
}

