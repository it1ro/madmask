class Product < ApplicationRecord
  include Translatable

  has_one_attached :cover_image
  has_many_attached :gallery_images
  has_one_attached :model_file

  ASSET_ATTACHMENT_NAMES = %w[cover_image gallery_images model_file].freeze

  scope :order_assets_first, lambda {
    order(
      Arel.sql(
        <<~SQL.squish
          EXISTS (
            SELECT 1
            FROM active_storage_attachments asa
            WHERE asa.record_type = 'Product'
              AND asa.record_id = #{table_name}.id
              AND asa.name IN ('cover_image', 'gallery_images', 'model_file')
          ) DESC
        SQL
      )
    )
  }

  CATEGORIES = %w[fantasy horror sci-fi cyberpunk].freeze

  ALLOWED_MODEL_CONTENT_TYPES = %w[
    model/gltf-binary
    model/gltf+json
    application/octet-stream
  ].freeze

  ALLOWED_IMAGE_CONTENT_TYPES = %w[
    image/jpeg
    image/png
    image/gif
    image/webp
    image/avif
  ].freeze

  MAX_GALLERY_IMAGES = 10
  MAX_GALLERY_IMAGE_SIZE = 5.megabytes

  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validate :must_have_translated_name
  validate :model_file_must_be_gltf_or_glb, if: -> { model_file.attached? }
  validate :validate_gallery_images

  # Cover if present, else first gallery image — for catalog preview and hero fallback.
  def hero_image
    return cover_image if cover_image.attached?

    gallery_images.first
  end

  # Extra frames beyond the hero thumbnail (for "+N" badge on catalog cards).
  def gallery_extra_count
    if cover_image.attached?
      gallery_images.attachments.size
    elsif gallery_images.attached?
      gallery_images.attachments.size - 1
    else
      0
    end
  end

  # Ordered list for gallery UI: cover first (if any), then all gallery images — no duplicate rule in data.
  def preview_images_ordered
    images = []
    images << cover_image if cover_image.attached?
    gallery_images.each { |blob| images << blob }
    images
  end

  # URL for WebGL loader: only from attached GLB/GLTF (Active Storage).
  def effective_model_url
    return unless model_file.attached?

    Rails.application.routes.url_helpers.rails_blob_path(model_file, only_path: true)
  end

  private

  def must_have_translated_name
    return if translation_for(I18n.default_locale)&.name.present?
    return if self[:name].present? # legacy fallback while columns still exist

    errors.add(:translations, :blank)
    errors.add(:base, "Название на языке по умолчанию обязательно")
  end

  def validate_gallery_images
    return unless gallery_images.attached?

    if gallery_images.count > MAX_GALLERY_IMAGES
      errors.add(:gallery_images, :too_many, count: MAX_GALLERY_IMAGES)
      return
    end

    gallery_images.each do |blob|
      unless ALLOWED_IMAGE_CONTENT_TYPES.include?(blob.content_type)
        errors.add(:gallery_images, :invalid_image_type)
        break
      end

      if blob.byte_size > MAX_GALLERY_IMAGE_SIZE
        errors.add(:gallery_images, :too_large)
        break
      end
    end
  end

  def model_file_must_be_gltf_or_glb
    blob = model_file.blob
    ext = File.extname(blob.filename.to_s).downcase
    unless %w[.glb .gltf].include?(ext)
      errors.add(:model_file, :invalid_extension)
      return
    end

    return if ALLOWED_MODEL_CONTENT_TYPES.include?(blob.content_type)

    errors.add(:model_file, :invalid_content_type)
  end
end
