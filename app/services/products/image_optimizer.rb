require "image_processing/vips"

module Products
  class ImageOptimizer
    DEFAULT_MAX_DIMENSION = 2000
    DEFAULT_WEBP_QUALITY = 82

    def initialize(product, max_dimension: DEFAULT_MAX_DIMENSION, webp_quality: DEFAULT_WEBP_QUALITY)
      @product = product
      @max_dimension = max_dimension
      @webp_quality = webp_quality
    end

    def call
      optimize_cover_image
      optimize_gallery_images
    end

    private

    attr_reader :product, :max_dimension, :webp_quality

    def optimize_cover_image
      return unless product.cover_image.attached?

      source = product.cover_image.blob
      return if product.cover_image_optimized.attached? && optimized_from_same_source?(product.cover_image_optimized.blob, source)

      optimized_blob = build_optimized_webp_blob(source, basename: "cover")
      product.cover_image_optimized.attach(optimized_blob)
    end

    def optimize_gallery_images
      return unless product.gallery_images.attached?

      sources = product.gallery_images.blobs
      return if sources.empty?

      existing = product.gallery_images_optimized.blobs
      can_reuse_all = existing.size == sources.size && existing.zip(sources).all? do |optimized_blob, source_blob|
        optimized_from_same_source?(optimized_blob, source_blob)
      end
      return if can_reuse_all

      product.gallery_images_optimized.purge if product.gallery_images_optimized.attached?

      optimized_blobs = sources.map.with_index do |source, idx|
        build_optimized_webp_blob(source, basename: format("gallery_%02d", idx + 1))
      end

      product.gallery_images_optimized.attach(optimized_blobs)
    end

    def optimized_from_same_source?(optimized_blob, source_blob)
      optimized_blob&.metadata&.dig("source_checksum").to_s == source_blob&.checksum.to_s
    end

    def build_optimized_webp_blob(source_blob, basename:)
      tmp = nil

      source_blob.open do |file|
        pipeline = ImageProcessing::Vips
          .source(file)
          .resize_to_limit(max_dimension, max_dimension)
          .convert("webp")
          .saver(quality: webp_quality, strip: true)

        tmp = pipeline.call
      end

      filename = optimized_filename(source_blob, basename: basename, ext: ".webp")
      metadata = { "source_checksum" => source_blob.checksum }

      ActiveStorage::Blob.create_and_upload!(
        io: File.open(tmp.path, "rb"),
        filename: filename,
        content_type: "image/webp",
        metadata: metadata
      )
    ensure
      tmp&.close!
    end

    def optimized_filename(source_blob, basename:, ext:)
      base = "#{basename}-#{source_blob.id}"
      "#{base}#{ext}"
    end
  end
end

