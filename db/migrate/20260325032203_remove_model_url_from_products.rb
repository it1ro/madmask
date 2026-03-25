class RemoveModelUrlFromProducts < ActiveRecord::Migration[8.1]
  def change
    remove_column :products, :model_url, :string
  end
end
