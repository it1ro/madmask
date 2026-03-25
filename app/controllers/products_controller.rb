class ProductsController < ApplicationController
  before_action :set_product, only: :show

  def index
    @products = Product.order(created_at: :desc)
    if params[:category].present? && Product::CATEGORIES.include?(params[:category])
      @products = @products.where(category: params[:category])
    end
  end

  def show
    if turbo_frame_request?
      render partial: "products/product", locals: { product: @product }, layout: false
    end
  end

  private

  def set_product
    @product = Product.find(params[:id])
  end
end
