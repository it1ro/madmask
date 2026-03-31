ActiveSupport.on_load(:active_record) do
  next unless Rails.env.production?

  # During image build (`assets:precompile`) there's no database. This initializer is
  # only a safety net for runtime boots in production, so skip in build-like contexts.
  next if ENV["SECRET_KEY_BASE_DUMMY"].present?

  handler = ActiveRecord::Base.connection_handler

  handler.connection_pool_list.each do |pool|
    # Only the primary database has `products`.
    next unless pool.db_config.name.to_s == "primary"

    pool.with_connection do |conn|
      begin
        conn.execute("CREATE INDEX IF NOT EXISTS index_products_on_category ON products(category)")
        conn.execute("CREATE INDEX IF NOT EXISTS index_products_on_created_at ON products(created_at)")
      rescue ActiveRecord::StatementInvalid => e
        # If the table doesn't exist yet (first boot before migrations), skip quietly.
        Rails.logger.info("[ensure_products_indexes] Skipping: #{e.message}")
      end
    end
  end
end

