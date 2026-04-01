class WishlistController < ApplicationController
  def show
    @wishlist_product_ids = wishlist_contract.list
    @products = Product.where(id: @wishlist_product_ids)
  end

  def toggle
    product_id = normalized_product_id_param
    wishlist_contract.toggle(product_id) if product_id

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to(request.referer || products_path) }
    end
  end

  private

  def wishlist_contract
    @wishlist_contract ||= WishlistContract.new(session:)
  end

  def normalized_product_id_param
    id = params[:product_id].to_s.strip
    return nil if id.empty?

    id
  end
end

