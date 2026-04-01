require "test_helper"

class CartContractTest < ActiveSupport::TestCase
  def setup
    @session = {}
    @contract = CartContract.new(session: @session)
  end

  test "add increments quantity and normalizes product_id to string" do
    assert_equal [], @contract.list

    @contract.add(1)
    assert_equal([{ product_id: "1", qty: 1 }], @contract.list)
    assert_equal({ "1" => 1 }, @session[:cart_items])

    @contract.add("1")
    assert_equal([{ product_id: "1", qty: 2 }], @contract.list)
    assert_equal({ "1" => 2 }, @session[:cart_items])
  end

  test "remove deletes item and is noop for blank product_id" do
    @contract.add("1")
    @contract.add("2")
    assert_equal 2, @contract.list.size

    @contract.remove("1")
    assert_equal([{ product_id: "2", qty: 1 }], @contract.list)
    assert_equal({ "2" => 1 }, @session[:cart_items])

    assert_equal([{ product_id: "2", qty: 1 }], @contract.remove("   "))
  end

  test "update sets qty, and qty <= 0 removes" do
    @contract.update("1", 3)
    assert_equal([{ product_id: "1", qty: 3 }], @contract.list)
    assert_equal({ "1" => 3 }, @session[:cart_items])

    @contract.update("1", 0)
    assert_equal [], @contract.list
    assert_equal({}, @session[:cart_items])

    @contract.update("2", -10)
    assert_equal [], @contract.list
    assert_equal({}, @session[:cart_items])
  end

  test "update treats non-integer qty as removal" do
    @contract.update("1", "nope")
    assert_equal [], @contract.list
    assert_equal({}, @session[:cart_items])
  end

  test "list sanitizes malformed session data (no blanks, no non-positive qty, no non-hash)" do
    @session[:cart_items] = ["bad"]
    assert_equal [], @contract.list

    @session[:cart_items] = {
      " 1 " => "2",
      "" => 5,
      "3" => "bad",
      "4" => 0,
      5 => 1
    }

    assert_equal(
      [
        { product_id: "1", qty: 2 },
        { product_id: "5", qty: 1 }
      ],
      @contract.list
    )
  end
end

