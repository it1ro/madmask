class ProductsController < ApplicationController
  before_action :set_product, only: :show

  def index
    @current_category = params[:category].presence
    @current_category = nil unless @current_category && Product::CATEGORIES.include?(@current_category)

    @products = Product
      .with_attached_cover_image
      .with_attached_gallery_images
      .with_attached_model_file
      .order(created_at: :desc)

    if @current_category.present?
      @products = @products.where(category: @current_category)
    end

    @results_count = @products.size
  end

  def show
    if turbo_frame_request?
      render partial: "products/product", locals: { product: @product }, layout: false
    end
  end

  private

  def set_product
    @product = Product
      .with_attached_cover_image
      .with_attached_gallery_images
      .with_attached_model_file
      .find(params[:id])
  end
end
