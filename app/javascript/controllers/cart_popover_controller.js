import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["trigger", "panel"]

  static values = {
    hideDelay: { type: Number, default: 200 },
  }

  connect() {
    this.hideTimeout = null
    this.isOpen = false

    this.boundOnDocumentPointerDown = this.onDocumentPointerDown.bind(this)
    this.boundOnDocumentKeyDown = this.onDocumentKeyDown.bind(this)

    document.addEventListener("pointerdown", this.boundOnDocumentPointerDown, true)
    document.addEventListener("keydown", this.boundOnDocumentKeyDown, true)

    this.applyState()
  }

  disconnect() {
    this.clearHideTimeout()
    document.removeEventListener("pointerdown", this.boundOnDocumentPointerDown, true)
    document.removeEventListener("keydown", this.boundOnDocumentKeyDown, true)
  }

  show() {
    this.clearHideTimeout()
    this.isOpen = true
    this.applyState()
  }

  scheduleHide() {
    this.clearHideTimeout()
    this.hideTimeout = window.setTimeout(() => {
      this.isOpen = false
      this.applyState()
    }, this.hideDelayValue)
  }

  cancelHide() {
    this.clearHideTimeout()
  }

  hide() {
    this.clearHideTimeout()
    this.isOpen = false
    this.applyState()
  }

  onDocumentPointerDown(event) {
    if (!this.isOpen) return
    if (this.element.contains(event.target)) return
    this.hide()
  }

  onDocumentKeyDown(event) {
    if (!this.isOpen) return
    if (event.key !== "Escape") return
    this.hide()
    this.triggerTarget?.focus?.()
  }

  clearHideTimeout() {
    if (!this.hideTimeout) return
    window.clearTimeout(this.hideTimeout)
    this.hideTimeout = null
  }

  applyState() {
    if (this.hasPanelTarget) {
      this.panelTarget.classList.toggle("invisible", !this.isOpen)
      this.panelTarget.classList.toggle("opacity-0", !this.isOpen)
      this.panelTarget.classList.toggle("pointer-events-none", !this.isOpen)
    }

    if (this.hasTriggerTarget) {
      this.triggerTarget.setAttribute("aria-expanded", String(this.isOpen))
    }
  }
}

