import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "name",
    "phone",
    "email",
    "message",
    "attachments",
    "attachmentsSummary",
    "submit",
    "nameError",
    "phoneError",
    "emailError",
    "messageError",
    "contactGroupError",
  ]

  connect() {
    this.refresh()
    this.filesChanged()
  }

  refresh() {
    const errors = this.validate()
    this.render(errors)
  }

  filesChanged() {
    if (!this.hasAttachmentsTarget || !this.hasAttachmentsSummaryTarget) return

    const files = Array.from(this.attachmentsTarget.files || [])
    if (files.length === 0) {
      this.attachmentsSummaryTarget.textContent = "Файлы не выбраны"
      return
    }

    const names = files.map((file) => file.name).filter(Boolean)
    const joined = names.join(", ")
    this.attachmentsSummaryTarget.textContent = joined || `Выбрано файлов: ${files.length}`
  }

  validate() {
    const errors = {}

    if (!this.value(this.nameTarget)) errors.name = "Укажите имя."
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

