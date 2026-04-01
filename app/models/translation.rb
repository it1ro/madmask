class Translation < ApplicationRecord
  belongs_to :translatable, polymorphic: true

  validates :locale, presence: true, inclusion: { in: I18n.available_locales.map(&:to_s) }
  validate :must_have_any_content
  validates :name, presence: true, if: :product_translation?

  private

  def product_translation?
    translatable_type == "Product"
  end

  def must_have_any_content
    return if name.present? || description.present?

    errors.add(:base, "Перевод не может быть пустым")
  end
end
