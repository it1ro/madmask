class ActuallyRemoveModelUrlFromProducts < ActiveRecord::Migration[8.1]
  def up
    return unless column_exists?(:products, :model_url)

    remove_column :products, :model_url, :string
  end

  def down
    add_column :products, :model_url, :string unless column_exists?(:products, :model_url)
  end
end
