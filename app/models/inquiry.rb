class Inquiry < ApplicationRecord
  validates :name, presence: true, length: { maximum: 100 }
  validates :phone, presence: true, length: { maximum: 50 }
  validates :email, length: { maximum: 255 }, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :message, presence: true, length: { maximum: 5_000 }
end
