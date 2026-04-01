import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "name",
    "phone",
    "email",
    "message",
    "submit",
    "nameError",
    "phoneError",
    "emailError",
    "messageError",
    "contactGroupError",
  ]

  connect() {
    this.refresh()
  }

  refresh() {
    const errors = this.validate()
    this.render(errors)
  }

  validate() {
    const errors = {}

    if (!this.value(this.nameTarget)) errors.name = "Укажи имя."
    if (!this.value(this.messageTarget)) errors.message = "Опиши задачу — хотя бы в пару слов."

    const phone = this.value(this.phoneTarget)
    const email = this.value(this.emailTarget)

    if (!phone && !email) {
      errors.contactGroup = "Укажи телефон или email — как удобнее."
    }

    if (email && !this.looksLikeEmail(email)) {
      errors.email = "Похоже, это не email."
    }

    return errors
  }

  render(errors) {
    this.setError(this.nameErrorTarget, errors.name)
    this.setError(this.messageErrorTarget, errors.message)
    this.setError(this.phoneErrorTarget, errors.phone)
    this.setError(this.emailErrorTarget, errors.email)

    if (this.hasContactGroupErrorTarget) {
      const has = Boolean(errors.contactGroup)
      this.contactGroupErrorTarget.classList.toggle("hidden", !has)
      if (has) this.contactGroupErrorTarget.textContent = errors.contactGroup
    }

    const canSubmit = Object.keys(errors).length === 0
    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = !canSubmit
      this.submitTarget.classList.toggle("opacity-60", !canSubmit)
      this.submitTarget.classList.toggle("cursor-not-allowed", !canSubmit)
    }
  }

  setError(element, message) {
    if (!element) return

    if (message) {
      element.textContent = message
      element.classList.remove("hidden")
    } else {
      element.textContent = ""
      element.classList.add("hidden")
    }
  }

  value(element) {
    return (element?.value || "").trim()
  }

  looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
}

