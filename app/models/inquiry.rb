class Inquiry < ApplicationRecord
  attr_accessor :website

  before_validation do
    self.name = name.to_s.strip.presence
    self.phone = phone.to_s.strip.presence
    self.email = email.to_s.strip.presence
    self.message = message.to_s.strip.presence
  end

  validates :name, presence: true, length: { maximum: 100 }
  validates :message, presence: true, length: { maximum: 5_000 }

  validates :phone, length: { maximum: 50 }, allow_blank: true
  validates :email,
    length: { maximum: 255 },
    allow_blank: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: "должен выглядеть как email" }

  validate :phone_or_email_present

  private

  def phone_or_email_present
    return if phone.present? || email.present?

    errors.add(:phone, "укажи телефон или email")
    errors.add(:email, "укажи телефон или email")
  end
end
