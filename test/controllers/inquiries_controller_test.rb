require "test_helper"

class InquiriesControllerTest < ActionDispatch::IntegrationTest
  test "should create inquiry" do
    assert_difference("Inquiry.count", 1) do
      post inquiries_url, params: { inquiry: { name: "Test", contact: "test@example.com", message: "Hello" } }
    end

    assert_redirected_to root_url(anchor: "contact")
  end
end
