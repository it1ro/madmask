class Translation < ApplicationRecord
  belongs_to :translatable, polymorphic: true

  validates :locale, presence: true, inclusion: { in: I18n.available_locales.map(&:to_s) }
end
