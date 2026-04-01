import { Controller } from "@hotwired/stimulus"

// Thumbnail → main image swap, fullscreen lightbox with prev/next (buttons + arrow keys).
export default class extends Controller {
  static targets = [
    "main",
    "imageButton",
    "webglHost",
    "counterMain",
    "dialog",
    "lightboxImage",
    "counterLightbox",
    "prevButton",
    "nextButton",
    "thumbStrip",
    "thumbScrollPrev",
    "thumbScrollNext"
  ]
  static values = {
    slides: { type: Array, default: [] }
  }

  connect() {
    this.normalizeSlidesValue()
    this.currentIndex = this.resolveCurrentIndexFromDom()
    this.previousActiveElement = null
    this.boundKeydown = this.onKeydown.bind(this)
    this.boundThumbStripScroll = this.updateThumbScrollButtons.bind(this)
    this.boundWindowResize = this.updateThumbScrollButtons.bind(this)
    this.applyCurrentSlideToMain()
    this.updateCounters()
    this.updateNavVisibility()
    this.setupThumbStripObservers()
  }

  disconnect() {
    this.teardownThumbStripObservers()
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
    const idx = parseInt(el.getAttribute("data-gallery-index") || "0", 10)
    if (!Number.isNaN(idx)) this.currentIndex = idx

    const slide = this.slidesValue[this.currentIndex]
    if (slide && slide.type === "webgl") {
      this.showWebglMain()
    } else {
      const mainUrl =
        el.dataset.thumbMainUrl ||
        el.getAttribute("data-thumb-main-url") ||
        el.dataset.thumbUrl ||
        el.getAttribute("data-thumb-url")
      const srcset = el.dataset.thumbSrcset || el.getAttribute("data-thumb-srcset")
      if (mainUrl && this.hasMainTarget) {
        this.showImageMain()
        this.mainTarget.src = mainUrl
        if (srcset && srcset.trim().length > 0) {
          this.mainTarget.srcset = srcset
        } else {
          this.mainTarget.removeAttribute("srcset")
        }
      }
    }

    this.element.querySelectorAll('[data-product-gallery-thumb="true"]').forEach((thumb) => {
      thumb.setAttribute("aria-selected", "false")
    })
    el.setAttribute("aria-selected", "true")

    this.maybeScrollStripForNeighborVisibility(el)
    this.updateCounters()
  }

  /** One thumbnail width + flex gap (px). */
  thumbStripHorizontalStep() {
    if (!this.hasThumbStripTarget) return 0
    const strip = this.thumbStripTarget
    const first = strip.querySelector('[data-product-gallery-thumb="true"]')
    if (!first) return 0
    const gapRaw = getComputedStyle(strip).columnGap || getComputedStyle(strip).gap || "0"
    const gap = parseFloat(gapRaw) || 0
    return first.offsetWidth + gap
  }

  isThumbFullyVisibleInStrip(strip, thumb) {
    const sr = strip.getBoundingClientRect()
    const r = thumb.getBoundingClientRect()
    const eps = 1.5
    return (
      r.left >= sr.left - eps &&
      r.right <= sr.right + eps &&
      r.top >= sr.top - eps &&
      r.bottom <= sr.bottom + eps
    )
  }

  /**
   * If the previous or next thumbnail is clipped by the strip, scroll by exactly one thumb+gap
   * (smooth) so the neighbor becomes reachable; prefers scrolling left when the left neighbor is hidden.
   */
  maybeScrollStripForNeighborVisibility(selectedThumb) {
    if (!this.hasThumbStripTarget) return
    const strip = this.thumbStripTarget
    const step = this.thumbStripHorizontalStep()
    if (step <= 0) return

    const prev = selectedThumb.previousElementSibling
    const next = selectedThumb.nextElementSibling
    const isThumb = (node) =>
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      node.matches?.('[data-product-gallery-thumb="true"]')

    const prevClipped = isThumb(prev) && !this.isThumbFullyVisibleInStrip(strip, prev)
    const nextClipped = isThumb(next) && !this.isThumbFullyVisibleInStrip(strip, next)

    if (prevClipped) {
      strip.scrollBy({ left: -step, behavior: "smooth" })
      return
    }
    if (nextClipped) {
      strip.scrollBy({ left: step, behavior: "smooth" })
    }
  }

  openLightbox(event) {
    event?.preventDefault()
    if (!this.hasDialogTarget || !this.hasLightboxImageTarget) return
    if (!this.isCurrentSlideImage()) return

    this.previousActiveElement = document.activeElement
    this.currentIndex = this.resolveCurrentIndexFromDom()
    if (!this.isCurrentSlideImage()) {
      this.currentIndex = this.firstImageSlideIndex() ?? 0
    }
    this.applySlideToLightbox()
    this.updateCounters()

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

  closeLightbox(event) {
    if (!this.hasDialogTarget) return
    if (this.dialogTarget.classList.contains("hidden")) return
    if (event) {
      const target = event.target
      if (target instanceof Element) {
        if (target.closest('[data-product-gallery-ignore-close="true"]')) return
        if (target.closest("header[role='banner']")) return
      }
    }

    this.dialogTarget.classList.add("hidden")
    this.dialogTarget.classList.remove("flex", "items-center", "justify-center")
    this.dialogTarget.setAttribute("hidden", "")
    document.body.classList.remove("overflow-hidden")
    document.removeEventListener("keydown", this.boundKeydown)
    this.previousActiveElement?.focus?.()
    this.previousActiveElement = null
  }

  setupThumbStripObservers() {
    if (!this.hasThumbStripTarget) return

    const strip = this.thumbStripTarget
    strip.addEventListener("scroll", this.boundThumbStripScroll, { passive: true })
    window.addEventListener("resize", this.boundWindowResize, { passive: true })

    this.thumbStripResizeObserver = new ResizeObserver(() => this.updateThumbScrollButtons())
    this.thumbStripResizeObserver.observe(strip)

    this.thumbImageLoadHandlers = []
    strip.querySelectorAll("img").forEach((img) => {
      const onLoad = () => this.updateThumbScrollButtons()
      if (img.complete) {
        requestAnimationFrame(onLoad)
      } else {
        img.addEventListener("load", onLoad, { once: true })
        this.thumbImageLoadHandlers.push([img, onLoad])
      }
    })

    requestAnimationFrame(() => this.updateThumbScrollButtons())
  }

  teardownThumbStripObservers() {
    if (this.hasThumbStripTarget) {
      this.thumbStripTarget.removeEventListener("scroll", this.boundThumbStripScroll)
    }
    window.removeEventListener("resize", this.boundWindowResize)
    this.thumbStripResizeObserver?.disconnect()
    this.thumbStripResizeObserver = null
    if (this.thumbImageLoadHandlers) {
      this.thumbImageLoadHandlers.forEach(([img, onLoad]) => {
        img.removeEventListener("load", onLoad)
      })
      this.thumbImageLoadHandlers = null
    }
  }

  scrollThumbsLeft(event) {
    event?.preventDefault()
    if (!this.hasThumbStripTarget) return
    const el = this.thumbStripTarget
    const delta = Math.max(96, Math.floor(el.clientWidth * 0.85))
    el.scrollBy({ left: -delta, behavior: "smooth" })
  }

  scrollThumbsRight(event) {
    event?.preventDefault()
    if (!this.hasThumbStripTarget) return
    const el = this.thumbStripTarget
    const delta = Math.max(96, Math.floor(el.clientWidth * 0.85))
    el.scrollBy({ left: delta, behavior: "smooth" })
  }

  updateThumbScrollButtons() {
    if (!this.hasThumbStripTarget) return
    if (!this.hasThumbScrollPrevTarget || !this.hasThumbScrollNextTarget) return

    const el = this.thumbStripTarget
    const { scrollLeft, scrollWidth, clientWidth } = el
    const canScroll = scrollWidth > clientWidth + 2
    const atStart = scrollLeft <= 2
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2

    const prev = this.thumbScrollPrevTarget
    const next = this.thumbScrollNextTarget

    const showPrev = canScroll && !atStart
    const showNext = canScroll && !atEnd

    prev.classList.toggle("hidden", !showPrev)
    next.classList.toggle("hidden", !showNext)

    prev.setAttribute("aria-hidden", showPrev ? "false" : "true")
    next.setAttribute("aria-hidden", showNext ? "false" : "true")

    if (showPrev) prev.removeAttribute("tabindex")
    else prev.setAttribute("tabindex", "-1")

    if (showNext) next.removeAttribute("tabindex")
    else next.setAttribute("tabindex", "-1")
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
    this.currentIndex = this.advanceIndex(-1, { imagesOnly: this.isLightboxOpen() })
    this.applySlideToLightbox()
    this.syncMainWithLightboxSlide()
    this.syncThumbnailsAria()
    this.updateCounters()
  }

  showNext(event) {
    event?.stopPropagation()
    if (this.slidesValue.length <= 1) return
    this.currentIndex = this.advanceIndex(1, { imagesOnly: this.isLightboxOpen() })
    this.applySlideToLightbox()
    this.syncMainWithLightboxSlide()
    this.syncThumbnailsAria()
    this.updateCounters()
  }

  applySlideToLightbox() {
    const slide = this.slidesValue[this.currentIndex]
    if (!slide || !this.hasLightboxImageTarget) return

    if (slide.type !== "image") return

    this.lightboxImageTarget.src = slide.src
    if (slide.srcset) this.lightboxImageTarget.srcset = slide.srcset
    else this.lightboxImageTarget.removeAttribute("srcset")
    if (this.hasMainTarget) {
      this.lightboxImageTarget.alt = this.mainTarget.alt
    }
  }

  syncMainWithLightboxSlide() {
    const slide = this.slidesValue[this.currentIndex]
    if (!slide || !this.hasMainTarget) return
    if (slide.type !== "image") return

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
    const multi = this.isLightboxOpen()
      ? (this.imageSlideIndices().length > 1)
      : (this.slidesValue.length > 1)
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

  updateCounters() {
    const totalAll = Array.isArray(this.slidesValue) ? this.slidesValue.length : 0
    const currentAll = totalAll > 0 ? this.currentIndex + 1 : 0

    let textMain = `${currentAll} / ${totalAll}`
    let textLightbox = textMain

    if (this.isLightboxOpen()) {
      const images = this.imageSlideIndices()
      const totalImages = images.length
      const pos = images.indexOf(this.currentIndex)
      const currentImage = totalImages > 0 ? (pos >= 0 ? pos + 1 : 1) : 0
      textLightbox = `${currentImage} / ${totalImages}`
    }

    if (this.hasCounterMainTarget) this.counterMainTarget.textContent = textMain
    if (this.hasCounterLightboxTarget) this.counterLightboxTarget.textContent = textLightbox
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

  normalizeSlidesValue() {
    if (!Array.isArray(this.slidesValue)) {
      this.slidesValue = []
      return
    }
    // Backward compatibility: old format was [{src, srcset}]
    this.slidesValue = this.slidesValue.map((s) => {
      if (!s || typeof s !== "object") return null
      if (s.type) return s
      if (s.src) return { type: "image", src: s.src, srcset: s.srcset }
      return null
    }).filter(Boolean)
  }

  currentSlide() {
    return this.slidesValue?.[this.currentIndex]
  }

  isCurrentSlideImage() {
    const slide = this.currentSlide()
    return !!slide && slide.type === "image"
  }

  firstImageSlideIndex() {
    const idxs = this.imageSlideIndices()
    return idxs.length ? idxs[0] : null
  }

  imageSlideIndices() {
    if (!Array.isArray(this.slidesValue)) return []
    const out = []
    this.slidesValue.forEach((s, i) => {
      if (s && s.type === "image") out.push(i)
    })
    return out
  }

  isLightboxOpen() {
    if (!this.hasDialogTarget) return false
    if (this.dialogTarget.classList.contains("hidden")) return false
    if (this.dialogTarget.hasAttribute("hidden")) return false
    return true
  }

  advanceIndex(direction, { imagesOnly }) {
    const n = this.slidesValue.length
    if (n <= 0) return 0

    let next = this.currentIndex
    for (let guard = 0; guard < n; guard++) {
      next = (next + direction + n) % n
      if (!imagesOnly) return next
      const s = this.slidesValue[next]
      if (s && s.type === "image") return next
    }
    return this.currentIndex
  }

  applyCurrentSlideToMain() {
    const slide = this.currentSlide()
    if (!slide) return
    if (slide.type === "webgl") {
      this.showWebglMain()
      return
    }
    if (slide.type === "image") {
      this.showImageMain()
      // In case DOM default differs from slidesValue (e.g. initial render), keep it.
      return
    }
  }

  showImageMain() {
    if (this.hasWebglHostTarget) {
      this.webglHostTarget.classList.add("hidden")
      this.webglHostTarget.setAttribute("hidden", "")
    }
    if (this.hasImageButtonTarget) {
      this.imageButtonTarget.classList.remove("hidden")
      this.imageButtonTarget.removeAttribute("hidden")
      this.imageButtonTarget.classList.add("cursor-zoom-in")
    }
  }

  showWebglMain() {
    if (this.hasImageButtonTarget) {
      this.imageButtonTarget.classList.add("hidden")
      this.imageButtonTarget.setAttribute("hidden", "")
      this.imageButtonTarget.classList.remove("cursor-zoom-in")
    }
    if (!this.hasWebglHostTarget) return

    this.webglHostTarget.classList.remove("hidden")
    this.webglHostTarget.removeAttribute("hidden")

    // Lazy activate Stimulus controller when 3D is actually selected.
    if (!this.webglHostTarget.getAttribute("data-controller")) {
      const modelUrl = (this.webglHostTarget.getAttribute("data-webgl-model-url") || "").trim()
      const coverUrl = (this.webglHostTarget.getAttribute("data-webgl-cover-url") || "").trim()
      this.webglHostTarget.setAttribute("data-controller", "webgl-preview")
      this.webglHostTarget.setAttribute("data-webgl-preview-model-url-value", modelUrl)
      this.webglHostTarget.setAttribute("data-webgl-preview-cover-image-url-value", coverUrl)
    }
  }
}
