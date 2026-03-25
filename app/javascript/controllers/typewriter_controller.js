import { Controller } from "@hotwired/stimulus"

/**
 * Types text into output target when the block enters the viewport.
 * Skips animation when prefers-reduced-motion is set (full text at once).
 */
export default class extends Controller {
  static targets = ["output", "cursor"]
  static values = { text: String, speed: { type: Number, default: 42 } }

  connect() {
    const full = this.textValue
    if (!full) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.outputTarget.textContent = full
      if (this.hasCursorTarget) this.cursorTarget.hidden = true
      return
    }

    this.outputTarget.textContent = ""
    if (this.hasCursorTarget) this.cursorTarget.hidden = false

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.observer.disconnect()
            this.startTyping(full)
            break
          }
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
    )

    this.observer.observe(this.element)
  }

  startTyping(full) {
    let i = 0
    const step = () => {
      if (i < full.length) {
        this.outputTarget.textContent += full[i]
        i++
        this.timeoutId = window.setTimeout(step, this.speedValue)
      } else if (this.hasCursorTarget) {
        this.cursorTarget.hidden = true
      }
    }
    this.timeoutId = window.setTimeout(step, 180)
  }

  disconnect() {
    clearTimeout(this.timeoutId)
    this.observer?.disconnect()
  }
}
