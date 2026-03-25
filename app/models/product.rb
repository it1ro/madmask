class Product < ApplicationRecord
  has_one_attached :cover_image
  has_one_attached :model_file

  CATEGORIES = %w[fantasy horror sci-fi cyberpunk].freeze

  ALLOWED_MODEL_CONTENT_TYPES = %w[
    model/gltf-binary
    model/gltf+json
    application/octet-stream
  ].freeze

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validate :model_file_must_be_gltf_or_glb, if: -> { model_file.attached? }

  # URL for WebGL loader: only from attached GLB/GLTF (Active Storage).
  def effective_model_url
    return unless model_file.attached?

    Rails.application.routes.url_helpers.rails_blob_path(model_file, only_path: true)
  end

  private

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
