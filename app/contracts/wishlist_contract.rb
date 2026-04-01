class WishlistContract
  def initialize(session:)
    @session = session
  end

  def toggle(product_id)
    raise NotImplementedError
  end

  def list
    raise NotImplementedError
  end
end
