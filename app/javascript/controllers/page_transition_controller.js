import { Controller } from "@hotwired/stimulus"

/**
 * Fade-in for <main> after full page load and each Turbo Drive visit.
 * Respects prefers-reduced-motion (no translate; content visible without animation).
 */
export default class extends Controller {
  static classes = ["visible"]

  connect() {
    this.boundBeforeCache = this.resetForCache.bind(this)
    this.boundOnLoad = this.onTurboLoad.bind(this)
    document.addEventListener("turbo:before-cache", this.boundBeforeCache)
    document.addEventListener("turbo:load", this.boundOnLoad)
    this.onTurboLoad()
  }

  disconnect() {
    document.removeEventListener("turbo:before-cache", this.boundBeforeCache)
    document.removeEventListener("turbo:load", this.boundOnLoad)
  }

  resetForCache() {
    this.element.classList.remove(this.visibleClass)
  }

  onTurboLoad() {
    this.sanitizeScrollLock()
    this.animateIn()
  }

  animateIn() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.element.classList.add(this.visibleClass)
      return
    }

    this.element.classList.remove(this.visibleClass)
    requestAnimationFrame(() => {
      this.element.classList.add(this.visibleClass)
    })
  }

  sanitizeScrollLock() {
    const body = document.body
    if (!body?.classList?.contains("overflow-hidden")) return

    const hasOpenOverlay = Boolean(
      document.querySelector(
        [
          "dialog[open]",
          ".product-gallery-lightbox:not(.hidden):not([hidden])",
          '[role="dialog"][aria-modal="true"]:not(.hidden):not([hidden])'
        ].join(",")
      )
    )

    if (hasOpenOverlay) return

    body.classList.remove("overflow-hidden")
  }
}
