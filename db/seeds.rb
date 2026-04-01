require "bigdecimal"

desired_count = 80
existing_count = Product.count
missing_count = [ desired_count - existing_count, 0 ].max

if missing_count.positive?
  start_index = existing_count

  missing_count.times do |i|
    n = start_index + i + 1
    category = Product::CATEGORIES[(n - 1) % Product::CATEGORIES.length]

    Product.create!(
      name: "Seed product ##{n}",
      category: category,
      price: BigDecimal((900 + (n * 37) % 8_000).to_s),
      description:
        "Seeded item for pagination and catalog UX checks. " \
        "Category: #{category}. " \
        "Index: #{n}."
    )
  end
end
