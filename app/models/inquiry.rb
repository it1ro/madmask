class Inquiry < ApplicationRecord
  attr_accessor :website

  before_validation do
    self.name = name.to_s.strip.presence
    self.contact = contact.to_s.strip.presence
    self.message = message.to_s.strip.presence
  end

  validates :name, presence: true, length: { maximum: 100 }
  validates :contact, presence: true, length: { maximum: 255 }
  validates :message, presence: true, length: { maximum: 5_000 }
end
