ActiveSupport.on_load(:active_record) do
  next unless Rails.env.production?

  handler = ActiveRecord::Base.connection_handler

  handler.connection_pool_list.each do |pool|
    pool.with_connection do |conn|
      next unless conn.adapter_name == "SQLite"

      # WAL significantly improves concurrent reads with Rails 8 Solid* (cache/queue/cable use separate SQLite DBs).
      busy_ms = Integer(ENV.fetch("SQLITE_BUSY_TIMEOUT_MS", "20000"), 10)
      conn.execute("PRAGMA journal_mode = WAL")
      conn.execute("PRAGMA synchronous = NORMAL")
      conn.execute("PRAGMA busy_timeout = #{busy_ms}")
    end
  rescue StandardError => e
    Rails.logger.warn("[sqlite_wal] Failed to apply pragmas for #{pool.db_config.name}: #{e.class}: #{e.message}")
  end
end
