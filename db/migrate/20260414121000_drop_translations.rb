class DropTranslations < ActiveRecord::Migration[8.1]
  def up
    drop_table :translations, if_exists: true
  end

  def down
    create_table :translations do |t|
      t.string :locale, null: false
      t.references :translatable, polymorphic: true, null: false
      t.string :name
      t.text :description
      t.timestamps
    end

    add_index :translations,
              %i[translatable_type translatable_id locale],
              unique: true,
              name: "index_translations_uniqueness"
    add_index :translations,
              %i[translatable_type translatable_id],
              name: "index_translations_on_translatable"
  end
end
