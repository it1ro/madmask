ActiveSupport.on_load(:active_record) do
  next unless Rails.env.production?

  handler = ActiveRecord::Base.connection_handler

  handler.connection_pool_list.each do |pool|
    conn = pool.connection

    # Only the primary database has `products`.
    next unless pool.db_config.name.to_s == "primary"

    begin
      conn.execute("CREATE INDEX IF NOT EXISTS index_products_on_category ON products(category)")
      conn.execute("CREATE INDEX IF NOT EXISTS index_products_on_created_at ON products(created_at)")
    rescue ActiveRecord::StatementInvalid => e
      # If the table doesn't exist yet (first boot before migrations), skip quietly.
      Rails.logger.info("[ensure_products_indexes] Skipping: #{e.message}")
    end
  end
end

