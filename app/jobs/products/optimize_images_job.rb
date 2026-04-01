module Products
  class OptimizeImagesJob < ApplicationJob
    queue_as :default

    def perform(product_id)
      product = Product
        .with_attached_cover_image
        .with_attached_cover_image_optimized
        .with_attached_gallery_images
        .with_attached_gallery_images_optimized
        .find(product_id)

      Products::ImageOptimizer.new(product).call
    end
  end
end

