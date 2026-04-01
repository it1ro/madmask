class AddPhoneAndEmailToInquiries < ActiveRecord::Migration[8.1]
  def change
    add_column :inquiries, :phone, :string unless column_exists?(:inquiries, :phone)
    add_column :inquiries, :email, :string unless column_exists?(:inquiries, :email)
  end
end
