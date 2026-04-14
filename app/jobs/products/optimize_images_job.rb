module Products
  class OptimizeImagesJob < ApplicationJob
    queue_as :default

    def perform(product_id, force: false)
      product = Product
        .with_attached_cover_image
        .with_attached_cover_image_optimized
        .with_attached_gallery_images
        .with_attached_gallery_images_optimized
        .find(product_id)

      Products::ImageOptimizer.new(product, force: force).call
    end
  end
end
