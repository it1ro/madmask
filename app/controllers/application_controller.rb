class ApplicationController < ActionController::Base
  include Pagy::Method

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  helper_method(
    :cart_contract,
    :wishlist_contract,
    :cart_units_count,
    :wishlist_count,
    :in_wishlist?,
    :cart_qty,
    :cart_products_by_id,
    :cart_subtotal
  )

  private

  def cart_contract
    @cart_contract ||= CartContract.new(session:)
  end

  def wishlist_contract
    @wishlist_contract ||= WishlistContract.new(session:)
  end

  def cart_units_count
    cart_contract.list.sum { |row| row[:qty].to_i }
  end

  def wishlist_count
    wishlist_contract.list.size
  end

  def in_wishlist?(product_id)
    wishlist_contract.list.include?(product_id.to_s)
  end

  def cart_qty(product_id)
    id = product_id.to_s
    cart_contract.list.find { |row| row[:product_id] == id }&.fetch(:qty, 0).to_i
  end

  def cart_products_by_id
    return {} if cart_contract.list.empty?

    @cart_products_by_id ||= begin
      ids = cart_contract.list.map { |row| row[:product_id] }.uniq
      Product.where(id: ids).index_by { |p| p.id.to_s }
    end
  end

  def cart_subtotal
    items = cart_contract.list
    return 0 if items.empty?

    products = cart_products_by_id
    items.sum do |row|
      product = products[row[:product_id]]
      next 0 unless product

      product.price.to_i * row[:qty].to_i
    end
  end
end
