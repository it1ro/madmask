class CartController < ApplicationController
  def show
    @cart_items = cart_contract.list
    product_ids = @cart_items.map { |row| row[:product_id] }
    @products_by_id = Product.where(id: product_ids).index_by { |p| p.id.to_s }
  end

  def add
    product_id = normalized_product_id_param
    cart_contract.add(product_id) if product_id

    respond_after_mutation(fallback_path: request.referer || products_path)
  end

  def remove
    product_id = normalized_product_id_param
    cart_contract.remove(product_id) if product_id

    respond_after_mutation(fallback_path: request.referer || products_path)
  end

  def update
    product_id = normalized_product_id_param
    qty = normalized_qty_param
    cart_contract.update(product_id, qty) if product_id

    respond_after_mutation(fallback_path: request.referer || products_path)
  end

  private

  def cart_contract
    @cart_contract ||= CartContract.new(session:)
  end

  def normalized_product_id_param
    id = params[:product_id].to_s.strip
    return nil if id.empty?

    id
  end

  def normalized_qty_param
    Integer(params[:qty])
  rescue ArgumentError, TypeError
    nil
  end

  def respond_after_mutation(fallback_path:)
    if turbo_stream_request?
      render turbo_stream: []
    else
      redirect_to fallback_path
    end
  end
end

