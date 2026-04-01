class WishlistContract
  SESSION_KEY = :wishlist_product_ids

  def initialize(session:)
    @session = session
  end

  def toggle(product_id)
    id = normalize_product_id(product_id)
    return list if id.nil?

    ids = session_ids

    if ids.include?(id)
      ids.delete(id)
    else
      ids << id
    end

    write_session_ids!(ids)
    list
  end

  def list
    session_ids
  end

  private

  attr_reader :session

  def session_ids
    raw = session[SESSION_KEY]
    return [] unless raw.is_a?(Array)

    raw.filter_map do |v|
      normalize_product_id(v)
    end.uniq
  end

  def write_session_ids!(ids)
    session[SESSION_KEY] = ids
  end

  def normalize_product_id(product_id)
    id = product_id.to_s.strip
    return nil if id.empty?

    id
  end
end
