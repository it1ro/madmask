class Inquiry < ApplicationRecord
  validates :contact, presence: true, length: { maximum: 255 }
  validates :message, presence: true, length: { maximum: 5_000 }
  validates :name, length: { maximum: 100 }, allow_blank: true
end
