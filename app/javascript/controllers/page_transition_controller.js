import { Controller } from "@hotwired/stimulus"

/**
 * Fade-in for <main> after full page load and each Turbo Drive visit.
 * Respects prefers-reduced-motion (no translate; content visible without animation).
 */
export default class extends Controller {
  static classes = ["visible"]

  connect() {
    this.boundBeforeCache = this.resetForCache.bind(this)
    this.boundAnimate = this.animateIn.bind(this)
    document.addEventListener("turbo:before-cache", this.boundBeforeCache)
    document.addEventListener("turbo:load", this.boundAnimate)
    this.animateIn()
  }

  disconnect() {
    document.removeEventListener("turbo:before-cache", this.boundBeforeCache)
    document.removeEventListener("turbo:load", this.boundAnimate)
  }

  resetForCache() {
    this.element.classList.remove(this.visibleClass)
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
}
