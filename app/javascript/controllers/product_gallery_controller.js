import { Controller } from "@hotwired/stimulus"

// Thumbnail → main image swap, fullscreen lightbox with prev/next (buttons + arrow keys).
export default class extends Controller {
  static targets = ["main", "dialog", "lightboxImage", "prevButton", "nextButton"]
  static values = {
    slides: { type: Array, default: [] }
  }

  connect() {
    this.currentIndex = 0
    this.previousActiveElement = null
    this.boundKeydown = this.onKeydown.bind(this)
    this.updateNavVisibility()
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundKeydown)
    document.body.classList.remove("overflow-hidden")
    if (this.hasDialogTarget) {
      this.dialogTarget.classList.add("hidden")
      this.dialogTarget.classList.remove("flex", "items-center", "justify-center")
      this.dialogTarget.setAttribute("hidden", "")
    }
  }

  select(event) {
    const el = event.currentTarget
    const mainUrl =
      el.dataset.thumbMainUrl ||
      el.getAttribute("data-thumb-main-url") ||
      el.dataset.thumbUrl ||
      el.getAttribute("data-thumb-url")
    const srcset = el.dataset.thumbSrcset || el.getAttribute("data-thumb-srcset")
    if (!mainUrl || !this.hasMainTarget) return

    const idx = parseInt(el.getAttribute("data-gallery-index") || "0", 10)
    if (!Number.isNaN(idx)) this.currentIndex = idx

    this.mainTarget.src = mainUrl
    if (srcset && srcset.trim().length > 0) {
      this.mainTarget.srcset = srcset
    } else {
      this.mainTarget.removeAttribute("srcset")
    }

    this.element.querySelectorAll('[data-product-gallery-thumb="true"]').forEach((thumb) => {
      thumb.setAttribute("aria-selected", "false")
    })
    el.setAttribute("aria-selected", "true")
  }

  openLightbox(event) {
    event?.preventDefault()
    if (!this.hasDialogTarget || !this.hasLightboxImageTarget) return

    this.previousActiveElement = document.activeElement
    this.currentIndex = this.resolveCurrentIndexFromDom()
    this.applySlideToLightbox()

    this.dialogTarget.classList.remove("hidden")
    this.dialogTarget.classList.add("flex", "items-center", "justify-center")
    this.dialogTarget.removeAttribute("hidden")
    document.body.classList.add("overflow-hidden")
    document.addEventListener("keydown", this.boundKeydown)
    this.updateNavVisibility()

    requestAnimationFrame(() => {
      this.element.querySelector("[data-product-gallery-focus-on-open]")?.focus()
    })
  }

  closeLightbox() {
    if (!this.hasDialogTarget) return
    if (this.dialogTarget.classList.contains("hidden")) return

    this.dialogTarget.classList.add("hidden")
    this.dialogTarget.classList.remove("flex", "items-center", "justify-center")
    this.dialogTarget.setAttribute("hidden", "")
    document.body.classList.remove("overflow-hidden")
    document.removeEventListener("keydown", this.boundKeydown)
    this.previousActiveElement?.focus?.()
    this.previousActiveElement = null
  }

  stopPropagation(event) {
    event.stopPropagation()
  }

  onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      this.closeLightbox()
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      this.showPrevious()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      this.showNext()
    }
  }

  showPrevious(event) {
    event?.stopPropagation()
    if (this.slidesValue.length <= 1) return
    this.currentIndex = (this.currentIndex - 1 + this.slidesValue.length) % this.slidesValue.length
    this.applySlideToLightbox()
    this.syncMainWithLightboxSlide()
    this.syncThumbnailsAria()
  }

  showNext(event) {
    event?.stopPropagation()
    if (this.slidesValue.length <= 1) return
    this.currentIndex = (this.currentIndex + 1) % this.slidesValue.length
    this.applySlideToLightbox()
    this.syncMainWithLightboxSlide()
    this.syncThumbnailsAria()
  }

  applySlideToLightbox() {
    const slide = this.slidesValue[this.currentIndex]
    if (!slide || !this.hasLightboxImageTarget) return

    this.lightboxImageTarget.src = slide.src
    if (slide.srcset) {
      this.lightboxImageTarget.srcset = slide.srcset
    } else {
      this.lightboxImageTarget.removeAttribute("srcset")
    }
    if (this.hasMainTarget) {
      this.lightboxImageTarget.alt = this.mainTarget.alt
    }
  }

  syncMainWithLightboxSlide() {
    const slide = this.slidesValue[this.currentIndex]
    if (!slide || !this.hasMainTarget) return

    const thumb = this.element.querySelector(
      `[data-product-gallery-thumb="true"][data-gallery-index="${this.currentIndex}"]`
    )
    if (thumb) {
      const mainUrl =
        thumb.dataset.thumbMainUrl || thumb.getAttribute("data-thumb-main-url")
      const srcset = thumb.dataset.thumbSrcset || thumb.getAttribute("data-thumb-srcset")
      if (mainUrl) {
        this.mainTarget.src = mainUrl
        if (srcset && srcset.trim().length > 0) {
          this.mainTarget.srcset = srcset
        } else {
          this.mainTarget.removeAttribute("srcset")
        }
        return
      }
    }

    this.mainTarget.src = slide.src
    if (slide.srcset) {
      this.mainTarget.srcset = slide.srcset
    } else {
      this.mainTarget.removeAttribute("srcset")
    }
  }

  syncThumbnailsAria() {
    this.element.querySelectorAll('[data-product-gallery-thumb="true"]').forEach((el) => {
      const idx = parseInt(el.getAttribute("data-gallery-index") || "0", 10)
      el.setAttribute("aria-selected", String(idx === this.currentIndex))
    })
  }

  updateNavVisibility() {
    const multi = this.slidesValue.length > 1
    if (this.hasPrevButtonTarget) {
      this.prevButtonTarget.classList.toggle("hidden", !multi)
      this.prevButtonTarget.toggleAttribute("hidden", !multi)
      this.prevButtonTarget.disabled = !multi
    }
    if (this.hasNextButtonTarget) {
      this.nextButtonTarget.classList.toggle("hidden", !multi)
      this.nextButtonTarget.toggleAttribute("hidden", !multi)
      this.nextButtonTarget.disabled = !multi
    }
  }

  resolveCurrentIndexFromDom() {
    const selected = this.element.querySelector(
      '[data-product-gallery-thumb="true"][aria-selected="true"]'
    )
    if (selected) {
      const idx = parseInt(selected.getAttribute("data-gallery-index") || "0", 10)
      if (!Number.isNaN(idx)) return idx
    }
    return 0
  }
}
