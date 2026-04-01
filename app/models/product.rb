class Product < ApplicationRecord
  include Translatable

  has_one_attached :cover_image
  has_one_attached :cover_image_optimized
  has_many_attached :gallery_images
  has_many_attached :gallery_images_optimized
  has_one_attached :model_file

  ASSET_ATTACHMENT_NAMES = %w[
    cover_image
    cover_image_optimized
    gallery_images
    gallery_images_optimized
    model_file
  ].freeze

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

  CATEGORIES = %w[ fantasy horror sci-fi cyberpunk ].freeze

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

  MIN_DESCRIPTION_CHARS = 200

  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validate :must_have_translated_name
  validate :must_have_translated_description
  validate :model_file_must_be_gltf_or_glb, if: -> { model_file.attached? }
  validate :validate_gallery_images

  # Cover if present, else first gallery image — for catalog preview and hero fallback.
  def hero_image
    return cover_image_optimized.blob if cover_image_optimized.blob.present?
    return cover_image.blob if cover_image.blob.present?

    gallery_images_optimized.blobs.first || gallery_images.blobs.first
  end

  # Extra frames beyond the hero thumbnail (for "+N" badge on catalog cards).
  def gallery_extra_count
    cover_present = cover_image_optimized.attached? || cover_image.attached?
    gallery_count = if gallery_images_optimized.attached?
      gallery_images_optimized.attachments.size
    elsif gallery_images.attached?
      gallery_images.attachments.size
    else
      0
    end

    if cover_present
      gallery_count
    elsif gallery_count.positive?
      gallery_count - 1
    else
      0
    end
  end

  # Ordered list for gallery UI: cover first (if any), then all gallery images — no duplicate rule in data.
  def preview_images_ordered
    images = []

    if cover_image_optimized.attached?
      images << cover_image_optimized
    elsif cover_image.attached?
      images << cover_image
    end

    if gallery_images_optimized.attached?
      gallery_images_optimized.each { |blob| images << blob }
    else
      gallery_images.each { |blob| images << blob }
    end

    images
  end

  # URL for WebGL loader: only from attached GLB/GLTF (Active Storage).
  def effective_model_url
    return unless model_file.attachment.present?

    blob = model_file.blob
    blob.save! if blob&.new_record?

    Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true)
  end

  private

  def must_have_translated_name
    return if translation_for(I18n.default_locale)&.name.present?
    return if self[:name].present? # legacy fallback while columns still exist

    errors.add(:translations, :blank)
    errors.add(:base, "Название на языке по умолчанию обязательно")
  end

  def must_have_translated_description
    desc = translation_for(I18n.default_locale)&.description.to_s
    return if desc.present? && desc.length >= MIN_DESCRIPTION_CHARS
    return if self[:description].to_s.length >= MIN_DESCRIPTION_CHARS # legacy fallback while columns still exist

    errors.add(:translations, :blank)
    errors.add(
      :base,
      "Описание на языке по умолчанию обязательно (минимум #{MIN_DESCRIPTION_CHARS} символов)"
    )
  end

  def validate_gallery_images
    return unless gallery_images.attachments.any?

    if gallery_images.attachments.size > MAX_GALLERY_IMAGES
      errors.add(:gallery_images, :too_many, count: MAX_GALLERY_IMAGES)
      return
    end

    gallery_images.blobs.each do |blob|
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
    unless %w[ .glb .gltf ].include?(ext)
      errors.add(:model_file, :invalid_extension)
      return
    end

    return if ALLOWED_MODEL_CONTENT_TYPES.include?(blob.content_type)

    errors.add(:model_file, :invalid_content_type)
  end
end
