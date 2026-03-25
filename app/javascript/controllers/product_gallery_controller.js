import { Controller } from "@hotwired/stimulus"

// Swaps main product image from thumbnail URLs; respects reduced motion via CSS (no JS transitions).
export default class extends Controller {
  static targets = ["main"]

  select(event) {
    const el = event.currentTarget
    const url = el.dataset.thumbUrl || el.getAttribute("data-thumb-url")
    if (!url || !this.hasMainTarget) return

    this.mainTarget.src = url
    this.mainTarget.removeAttribute("srcset")

    this.element.querySelectorAll('[data-product-gallery-thumb="true"]').forEach((el) => {
      el.setAttribute("aria-selected", "false")
    })
    event.currentTarget.setAttribute("aria-selected", "true")
  }
}
