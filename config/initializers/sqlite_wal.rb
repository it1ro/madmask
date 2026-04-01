ActiveSupport.on_load(:active_record) do
  next unless Rails.env.production?

  handler = ActiveRecord::Base.connection_handler

  handler.connection_pool_list.each do |pool|
    conn = pool.connection
    next unless conn.adapter_name == "SQLite"

    # WAL significantly improves concurrent reads with Rails 8 Solid* (cache/queue/cable use separate SQLite DBs).
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA busy_timeout = 5000")
  rescue StandardError => e
    Rails.logger.warn("[sqlite_wal] Failed to apply pragmas for #{pool.db_config.name}: #{e.class}: #{e.message}")
  end
end
