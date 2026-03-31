require "json"

class FontAssetDebug
  LOG_PATH = Rails.root.join(".cursor/debug.log")

  def initialize(app)
    @app = app
  end

  def call(env)
    req = Rack::Request.new(env)
    return @app.call(env) unless req.path.start_with?("/assets/fonts/") && req.path.end_with?(".woff2")

    status, headers, body = @app.call(env)

    filename = req.path.split("/").last
    candidates = [
      Rails.root.join("app/assets/fonts/#{filename}"),
      Rails.root.join("app/assets/images/fonts/#{filename}"),
      Rails.root.join("app/assets/stylesheets/fonts/#{filename}"),
      Rails.root.join("public/assets/fonts/#{filename}")
    ]

    payload = {
      id: "font_asset_#{Time.now.to_f}",
      timestamp: (Time.now.to_f * 1000).to_i,
      runId: ENV.fetch("DEBUG_RUN_ID", "pre-fix"),
      hypothesisId: "A|B|C",
      location: "lib/middleware/font_asset_debug.rb",
      message: "Font asset request",
      data: {
        path: req.path,
        status: status,
        content_type: headers["content-type"],
        file: filename,
        exists_anywhere: candidates.any? { |p| File.exist?(p) },
        candidates: candidates.map { |p| { path: p.to_s, exists: File.exist?(p) } }
      }
    }

    begin
      File.open(LOG_PATH, "a") { |f| f.puts(payload.to_json) }
    rescue StandardError
      # Best-effort logging only
    end

    [status, headers, body]
  end
end

