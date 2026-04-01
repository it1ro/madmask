require "test_helper"

class InquiryTest < ActiveSupport::TestCase
  test "requires phone or email" do
    inquiry = Inquiry.new(name: "Test", message: "Hello", phone: "", email: "")
    assert_not inquiry.valid?
    assert_includes inquiry.errors[:phone], "укажи телефон или email"
    assert_includes inquiry.errors[:email], "укажи телефон или email"
  end

  test "valid with phone only" do
    inquiry = Inquiry.new(name: "Test", message: "Hello", phone: "+79990000000")
    assert inquiry.valid?
  end

  test "valid with email only" do
    inquiry = Inquiry.new(name: "Test", message: "Hello", email: "test@example.com")
    assert inquiry.valid?
  end

  test "invalid with malformed email" do
    inquiry = Inquiry.new(name: "Test", message: "Hello", email: "not-an-email")
    assert_not inquiry.valid?
    assert inquiry.errors[:email].any?
  end
end
