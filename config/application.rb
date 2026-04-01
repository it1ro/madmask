require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Madmask
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])
    config.eager_load_paths << Rails.root.join("lib")

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Optional; primary resolution is ENV/credentials in ProductsHelper#madmask_contact_email
    config.x.contact_email = ENV.fetch("MADMASK_CONTACT_EMAIL", "").presence

    # I18n
    config.i18n.available_locales = %i[ru en]
    config.i18n.default_locale = :ru

    # SEO: canonical host used for redirects, canonical URLs, and sitemap.
    default_canonical_host = Rails.env.development? ? "localhost:3000" : "madmask.ilmir.tech"
    config.x.canonical_host = ENV.fetch("APP_HOST", default_canonical_host)
  end
end
