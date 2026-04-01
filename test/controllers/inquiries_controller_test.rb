require "test_helper"

class InquiriesControllerTest < ActionDispatch::IntegrationTest
  test "should create inquiry" do
    assert_difference("Inquiry.count", 1) do
      assert_emails 1 do
        post inquiries_url, params: { inquiry: { name: "Test", email: "test@example.com", message: "Hello" } }
      end
    end

    assert_redirected_to thanks_inquiries_url
  end

  test "should not send email when honeypot is filled" do
    assert_no_emails do
      assert_no_difference("Inquiry.count") do
        post inquiries_url, params: { inquiry: { name: "Spam", email: "spam@example.com", message: "Spam", website: "https://spam.example" } }
      end
    end

    assert_redirected_to new_inquiry_url
  end
end
