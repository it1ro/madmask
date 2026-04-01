require "test_helper"

class WishlistContractTest < ActiveSupport::TestCase
  def setup
    @session = {}
    @contract = WishlistContract.new(session: @session)
  end

  test "toggle adds/removes and normalizes product_id to string" do
    assert_equal [], @contract.list

    @contract.toggle(1)
    assert_equal [ "1" ], @contract.list
    assert_equal [ "1" ], @session[:wishlist_product_ids]

    @contract.toggle("1")
    assert_equal [], @contract.list
    assert_equal [], @session[:wishlist_product_ids]
  end

  test "toggle is noop for blank product_id" do
    assert_equal [], @contract.toggle("   ")
    assert_equal({}, @session)
  end

  test "list sanitizes malformed session data and uniqs ids" do
    @session[:wishlist_product_ids] = "bad"
    assert_equal [], @contract.list

    @session[:wishlist_product_ids] = [ " 1 ", "1", "", "  ", 2, 2, "3" ]
    assert_equal [ "1", "2", "3" ], @contract.list
  end
end
