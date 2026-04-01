class PagesController < ApplicationController
  def home
    @featured_products = Product.order(created_at: :desc).limit(4)
  end

  def about; end

  def delivery_payment; end

  def lead_times_custom; end

  def materials_care; end

  def faq; end

  def contacts; end
end
