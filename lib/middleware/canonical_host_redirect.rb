module Middleware
  class CanonicalHostRedirect
    def initialize(app, canonical_host:)
      @app = app
      @canonical_host = canonical_host
    end

    def call(env)
      req = ActionDispatch::Request.new(env)

      if needs_redirect?(req)
        target = canonical_url_for(req)
        return [ 301, { "Location" => target, "Content-Type" => "text/html" }, [ "Moved Permanently" ] ]
      end

      @app.call(env)
    end

    private

    def needs_redirect?(req)
      return false if req.path == "/up"
      @canonical_host.present? && req.host.present? && req.host != @canonical_host
    end

    def canonical_url_for(req)
      uri = URI.parse(req.original_url)
      uri.scheme = "https"
      uri.host = @canonical_host
      uri.to_s
    end
  end
end

# Backward compatibility: allow referencing without namespace.
CanonicalHostRedirect = Middleware::CanonicalHostRedirect
