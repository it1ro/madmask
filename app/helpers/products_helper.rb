require "uri"

module ProductsHelper
  CATEGORY_CSS_VARS = {
    "fantasy" => "var(--color-category-fantasy)",
    "horror" => "var(--color-category-horror)",
    "sci-fi" => "var(--color-category-scifi)",
    "cyberpunk" => "var(--color-category-cyberpunk)"
  }.freeze

  CATEGORY_LABELS = {
    "fantasy" => "Fantasy",
    "horror" => "Horror",
    "sci-fi" => "Sci‑fi",
    "cyberpunk" => "Cyberpunk"
  }.freeze

  def product_category_css_var(category)
    CATEGORY_CSS_VARS[category] || "var(--color-accent-1)"
  end

  def product_category_label(category)
    CATEGORY_LABELS[category] || category.to_s.titleize
  end

  # Contact email: ENV wins, then credentials `madmask.contact_email`.
  # Used by product CTA mailto links.
  def madmask_contact_email
    env = ENV["MADMASK_CONTACT_EMAIL"].to_s.strip
    return env if env.present?

    Rails.application.credentials.dig(:madmask, :contact_email).to_s.strip.presence
  end

  # Returns a mailto URL with subject/body, or nil if no email is configured.
  def product_contact_mailto_url(product)
    email = madmask_contact_email
    return nil if email.blank?

    URI::MailTo.build(
      to: email,
      headers: [
        ["subject", "Запрос по товару: #{product.name}"],
        ["body", "#{product_url(product)}\n\n#{product.name}"]
      ]
    ).to_s
  end
end
