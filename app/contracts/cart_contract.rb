class CartContract
  SESSION_KEY = :cart_items

  def initialize(session:)
    @store = SessionStore.new(session)
  end

  def add(product_id)
    id = normalize_product_id(product_id)
    return list if id.nil?

    items = session_items
    items[id] = (items[id] || 0) + 1
    write_session_items!(items)
    list
  end

  def remove(product_id)
    id = normalize_product_id(product_id)
    return list if id.nil?

    items = session_items
    items.delete(id)
    write_session_items!(items)
    list
  end

  def update(product_id, qty)
    id = normalize_product_id(product_id)
    return list if id.nil?

    qty_int = normalize_qty(qty)
    items = session_items

    if qty_int <= 0
      items.delete(id)
    else
      items[id] = qty_int
    end

    write_session_items!(items)
    list
  end

  def list
    session_items.map do |product_id, qty|
      { product_id:, qty: }
    end
  end

  private

  attr_reader :store

  def session_items
    raw = store.read(SESSION_KEY)

    return {} unless raw.is_a?(Hash)

    raw.each_with_object({}) do |(k, v), acc|
      id = normalize_product_id(k)
      next if id.nil?

      qty = normalize_qty(v)
      next if qty <= 0

      acc[id] = qty
    end
  end

  def write_session_items!(items)
    store.write(SESSION_KEY, items)
  end

  def normalize_product_id(product_id)
    id = product_id.to_s.strip
    return nil if id.empty?

    id
  end

  def normalize_qty(qty)
    Integer(qty)
  rescue ArgumentError, TypeError
    0
  end
end
