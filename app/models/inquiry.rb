class Inquiry < ApplicationRecord
  attr_accessor :website

  has_many_attached :attachments

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
  validate :attachments_within_limits

  private

  def phone_or_email_present
    return if phone.present? || email.present?

    errors.add(:phone, "укажи телефон или email")
    errors.add(:email, "укажи телефон или email")
  end

  def attachments_within_limits
    return unless attachments.attached?

    if attachments.size > 5
      errors.add(:attachments, "можно прикрепить не больше 5 файлов")
    end

    attachments.each do |attachment|
      next unless attachment.blob&.byte_size

      if attachment.blob.byte_size > 10.megabytes
        errors.add(:attachments, "размер каждого файла должен быть до 10 МБ")
        break
      end
    end
  end
end
