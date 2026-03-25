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
end
