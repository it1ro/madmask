class CreateInquiries < ActiveRecord::Migration[8.1]
  def change
    create_table :inquiries do |t|
      t.string :name
      t.string :contact
      t.text :message

      t.timestamps
    end
  end
end
