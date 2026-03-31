module ApplicationHelper
  include Pagy::Method
  include Pagy::NumericHelpers

  # Russian pluralization helper for small UI counters.
  # Example: russian_plural(3, "товар", "товара", "товаров") => "товара"
  def russian_plural(count, one, few, many)
    n = count.to_i.abs
    mod10 = n % 10
    mod100 = n % 100

    return many if mod100.between?(11, 14)
    return one if mod10 == 1
    return few if mod10.between?(2, 4)

    many
  end
end
