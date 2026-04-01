class CreateTranslations < ActiveRecord::Migration[8.1]
  def change
    create_table :translations do |t|
      t.references :translatable, polymorphic: true, null: false
      t.string :locale
      t.string :name
      t.text :description

      t.timestamps
    end
  end
end
