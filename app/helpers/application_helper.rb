module ApplicationHelper
  include Pagy::Method
  include Pagy::NumericHelpers

  def canonical_host
    Rails.configuration.x.canonical_host
  end

  def canonical_protocol
    "https"
  end

  def canonical_base_url
    "#{canonical_protocol}://#{canonical_host}"
  end

  def canonical_url
    return request.original_url if canonical_host.blank?

    uri = URI.parse(request.original_url)
    uri.scheme = canonical_protocol
    uri.host = canonical_host
    uri.to_s
  end

  def absolute_url(path_or_url)
    value = path_or_url.to_s
    return canonical_base_url if value.blank?
    return value if value.match?(/\Ahttps?:\/\//)
    return value if canonical_host.blank?

    value = "/#{value}" unless value.start_with?("/")
    "#{canonical_base_url}#{value}"
  end

  def noindex_page?
    path = request.path.sub(%r{\A/(ru|en)(?=/|$)}, "")

    return true if path.start_with?("/admin")
    return true if path == "/cart" || path.start_with?("/cart/")
    return true if path == "/wishlist" || path.start_with?("/wishlist/")
    return true if path == "/up"
    return true if path.start_with?("/users")
    return true if path == "/inquiries/thanks"

    false
  end

  def meta_robots_content
    content_for(:meta_robots).presence || (noindex_page? ? "noindex, follow" : nil)
  end

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
