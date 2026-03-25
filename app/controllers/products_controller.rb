class ProductsController < ApplicationController
  before_action :set_product, only: %i[show edit update destroy]

  def index
    @products = Product.order(created_at: :desc)
    @product = Product.new
  end

  def show
    if turbo_frame_request?
      render partial: "products/product", locals: { product: @product }, layout: false
    end
  end

  def new
    @product = Product.new
  end

  def edit
  end

  def create
    @product = Product.new(product_params)

    if @product.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to products_path, notice: "Товар добавлен." }
      end
    else
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "product_form_container",
            partial: "products/form",
            locals: { product: @product }
          ), status: :unprocessable_entity
        end
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @product.update(product_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to product_path(@product), notice: "Товар обновлён." }
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @product.destroy

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to products_path, notice: "Товар удалён." }
    end
  end

  private

  def set_product
    @product = Product.find(params[:id])
  end

  def product_params
    params.require(:product).permit(:name, :description, :price, :category, :model_url, :cover_image)
  end
end
