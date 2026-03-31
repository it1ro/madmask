import { Controller } from "@hotwired/stimulus"

function isPlainLeftClick(event) {
  if (event.defaultPrevented) return false
  if (event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  return true
}

function closestAnchor(el) {
  if (!el) return null
  return el.closest?.("a[href]") || null
}

function isSameOriginUrl(href) {
  try {
    const url = new URL(href, window.location.href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

export default class extends Controller {
  static targets = ["list", "indicator"]

  connect() {
    this.boundClick = this.onClick.bind(this)
    this.boundTurboLoad = this.hide.bind(this)

    this.element.addEventListener("click", this.boundClick)
    document.addEventListener("turbo:load", this.boundTurboLoad)
  }

  disconnect() {
    this.element.removeEventListener("click", this.boundClick)
    document.removeEventListener("turbo:load", this.boundTurboLoad)
  }

  onClick(event) {
    if (!isPlainLeftClick(event)) return

    const a = closestAnchor(event.target)
    if (!a) return
    if (a.target && a.target !== "_self") return
    if (a.hasAttribute("download")) return
    if (!isSameOriginUrl(a.getAttribute("href"))) return

    this.show()
  }

  show() {
    if (this.hasIndicatorTarget) {
      this.indicatorTarget.classList.remove("hidden")
      this.indicatorTarget.classList.add("flex")
    }

    if (this.hasListTarget) {
      this.listTarget.setAttribute("aria-busy", "true")
      this.listTarget.classList.add("opacity-60")
    }
  }

  hide() {
    if (this.hasIndicatorTarget) {
      this.indicatorTarget.classList.add("hidden")
      this.indicatorTarget.classList.remove("flex")
    }

    if (this.hasListTarget) {
      this.listTarget.removeAttribute("aria-busy")
      this.listTarget.classList.remove("opacity-60")
    }
  }
}

