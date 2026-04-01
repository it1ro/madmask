module Translatable
  extend ActiveSupport::Concern

  included do
    has_many :translations, as: :translatable, dependent: :destroy
    accepts_nested_attributes_for :translations, reject_if: :translation_blank?, allow_destroy: true
  end

  class_methods do
    # Declare which translation columns are exposed by `translated_*` helpers.
    #
    # Example:
    #   translatable_fields name: :name, description: :description
    #
    # This keeps the concern reusable for different models (e.g. Article with title/body).
    def translatable_fields(mapping)
      @translatable_fields_mapping = mapping.transform_keys(&:to_sym)
    end

    def translatable_fields_mapping
      @translatable_fields_mapping || { name: :name, description: :description }
    end
  end

  def translation_for(locale, build: false)
    loc = locale.to_s
    existing = translations.find { |t| t.locale.to_s == loc }
    return existing if existing
    return unless build

    translations.build(locale: loc)
  end

  def translated_attr(key, locale: I18n.locale, fallback_locale: I18n.default_locale)
    column = self.class.translatable_fields_mapping.fetch(key.to_sym)

    value_for(locale, column).presence ||
      value_for(fallback_locale, column).presence ||
      legacy_fallback_value(column)
  end

  def translated_name(locale = I18n.locale)
    translated_attr(:name, locale:)
  end

  def translated_description(locale = I18n.locale)
    translated_attr(:description, locale:)
  end

  private

  def value_for(locale, column)
    translation_for(locale)&.public_send(column)
  end

  def legacy_fallback_value(column)
    return "" unless respond_to?(:[])

    self[column].to_s
  end

  def translation_blank?(attrs)
    attrs["name"].blank? && attrs["description"].blank?
  end
end

