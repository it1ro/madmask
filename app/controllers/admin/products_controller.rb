module Admin
  class ProductsController < Admin::ApplicationController
    before_action :set_product, only: %i[edit update destroy]

    def index
      products_scope = Product
        .with_attached_cover_image
        .with_attached_gallery_images
        .with_attached_model_file
        .order(created_at: :desc)
      @pagy, @products = pagy(:offset, products_scope, limit: 20, size: [1, 2, 2, 1])
      @product = Product.new
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
          format.html { redirect_to admin_products_path, notice: "Товар добавлен." }
        end
      else
        respond_to do |format|
          format.turbo_stream do
            render turbo_stream: turbo_stream.replace(
              "product_form_container",
              partial: "admin/products/product_form_container",
              locals: { product: @product }
            ), status: :unprocessable_entity
          end
          format.html { render :new, status: :unprocessable_entity }
        end
      end
    end

    def update
      if params.dig(:product, :remove_model_file) == "1"
        @product.model_file.purge
      end

      purge_requested_gallery_images

      if @product.update(product_params)
        respond_to do |format|
          format.turbo_stream
          format.html { redirect_to admin_product_path(@product), notice: "Товар обновлён." }
        end
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @product.destroy

      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to admin_products_path, notice: "Товар удалён." }
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

    def purge_requested_gallery_images
      ids = Array(params.dig(:product, :remove_gallery_image_signed_ids)).map(&:presence).compact
      return if ids.empty?

      ids.each do |signed_id|
        att = ActiveStorage::Attachment.find_signed(signed_id)
        next unless att && att.record == @product && att.name == "gallery_images"

        att.purge
      end
    end

    def product_params
      params.require(:product).permit(
        :name,
        :description,
        :price,
        :category,
        :cover_image,
        :model_file,
        gallery_images: []
      )
    end
  end
end
