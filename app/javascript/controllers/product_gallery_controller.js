import { Controller } from "@hotwired/stimulus"

// Swaps main product image from thumbnail URLs; respects reduced motion via CSS (no JS transitions).
export default class extends Controller {
  static targets = ["main"]

  select(event) {
    const el = event.currentTarget
    const mainUrl =
      el.dataset.thumbMainUrl ||
      el.getAttribute("data-thumb-main-url") ||
      el.dataset.thumbUrl ||
      el.getAttribute("data-thumb-url")
    const srcset = el.dataset.thumbSrcset || el.getAttribute("data-thumb-srcset")
    if (!mainUrl || !this.hasMainTarget) return

    this.mainTarget.src = mainUrl
    if (srcset && srcset.trim().length > 0) {
      this.mainTarget.srcset = srcset
    } else {
      this.mainTarget.removeAttribute("srcset")
    }

    this.element.querySelectorAll('[data-product-gallery-thumb="true"]').forEach((el) => {
      el.setAttribute("aria-selected", "false")
    })
    event.currentTarget.setAttribute("aria-selected", "true")
  }
}
