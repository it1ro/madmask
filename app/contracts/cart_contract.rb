class CartContract
  def initialize(session:)
    @session = session
  end

  def add(product_id)
    raise NotImplementedError
  end

  def remove(product_id)
    raise NotImplementedError
  end

  def update(product_id, qty)
    raise NotImplementedError
  end

  def list
    raise NotImplementedError
  end
end
