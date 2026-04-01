class AddConstraintsToTranslations < ActiveRecord::Migration[8.1]
  def up
    change_column_null :translations, :locale, false

    return if index_exists?(:translations, %i[translatable_type translatable_id locale], name: "index_translations_uniqueness")

    add_index(
      :translations,
      %i[translatable_type translatable_id locale],
      unique: true,
      name: "index_translations_uniqueness"
    )
  end

  def down
    if index_exists?(:translations, %i[translatable_type translatable_id locale], name: "index_translations_uniqueness")
      remove_index :translations, name: "index_translations_uniqueness"
    end

    change_column_null :translations, :locale, true
  end
end
