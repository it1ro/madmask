class BackfillTranslationsForProductsRu < ActiveRecord::Migration[8.1]
  class Product < ActiveRecord::Base
    self.table_name = "products"
  end

  class Translation < ActiveRecord::Base
    self.table_name = "translations"
  end

  def up
    Product.reset_column_information
    Translation.reset_column_information

    Product.find_each do |product|
      next if product[:name].blank? && product[:description].blank?

      Translation.create_with(
        name: product[:name],
        description: product[:description],
        created_at: Time.current,
        updated_at: Time.current
      ).find_or_create_by!(
        translatable_type: "Product",
        translatable_id: product.id,
        locale: "ru"
      )
    end
  end

  def down
    Translation.where(translatable_type: "Product", locale: "ru").delete_all
  end
end
