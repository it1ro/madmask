class BackfillProductsFromRuTranslations < ActiveRecord::Migration[8.1]
  class Product < ActiveRecord::Base
    self.table_name = "products"
  end

  class Translation < ActiveRecord::Base
    self.table_name = "translations"
  end

  LEGACY_NAME_VALUES = [
    "MyString"
  ].freeze

  LEGACY_DESCRIPTION_VALUES = [
    "MyText"
  ].freeze

  def up
    Product.reset_column_information
    Translation.reset_column_information

    say_with_time "Backfill products.name and products.description from RU translations" do
      updated_rows = 0

      Translation
        .where(translatable_type: "Product", locale: "ru")
        .find_each do |translation|
          product = Product.find_by(id: translation.translatable_id)
          next unless product

          attrs = {}

          translated_name = translation.name.to_s.strip
          if should_replace?(product[:name], LEGACY_NAME_VALUES) && translated_name.present?
            attrs[:name] = translated_name
          end

          translated_description = translation.description.to_s.strip
          if should_replace?(product[:description], LEGACY_DESCRIPTION_VALUES) && translated_description.present?
            attrs[:description] = translated_description
          end

          next if attrs.empty?

          attrs[:updated_at] = Time.current if Product.column_names.include?("updated_at")
          updated_rows += 1 if product.update_columns(attrs)
        end

      updated_rows
    end
  end

  def down
    # no-op: cannot safely restore previous legacy/empty values
  end

  private

  def should_replace?(value, legacy_values)
    normalized = value.to_s.strip
    normalized.blank? || legacy_values.include?(normalized)
  end
end
