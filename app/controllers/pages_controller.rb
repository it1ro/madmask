class PagesController < ApplicationController
  def home
    @featured_products = Product
      .with_attached_cover_image
      .with_attached_cover_image_optimized
      .with_attached_gallery_images
      .with_attached_gallery_images_optimized
      .includes(:model_file_attachment)
      .order(created_at: :desc)
      .limit(4)
  end

  def about; end

  def delivery_payment; end

  def lead_times_custom; end

  def materials_care; end

  def faq; end

  def contacts; end
end
