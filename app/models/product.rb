class Product < ApplicationRecord
  has_one_attached :cover_image

  CATEGORIES = %w[fantasy horror sci-fi cyberpunk].freeze

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
end
