class Inquiry < ApplicationRecord
  attr_accessor :website

  before_validation do
    self.name = name.to_s.strip.presence
    self.phone = phone.to_s.strip.presence
    self.email = email.to_s.strip.presence
    self.message = message.to_s.strip.presence
  end

  validates :name, presence: true, length: { maximum: 100 }
  validates :phone, presence: true, length: { maximum: 50 }
  validates :email, length: { maximum: 255 }, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :message, presence: true, length: { maximum: 5_000 }
end
