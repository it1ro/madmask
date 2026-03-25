import { Controller } from "@hotwired/stimulus"

/**
 * Adds a class when the section enters the viewport so child cards can
 * animate (fade-in-up). Skips the observer when prefers-reduced-motion is set.
 */
export default class extends Controller {
  static classes = ["revealed"]

  connect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.element.classList.add(this.revealedClass)
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.element.classList.add(this.revealedClass)
            this.observer.disconnect()
            break
          }
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    )

    this.observer.observe(this.element)
  }

  disconnect() {
    this.observer?.disconnect()
  }
}
