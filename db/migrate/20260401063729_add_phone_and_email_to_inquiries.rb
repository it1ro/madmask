class AddPhoneAndEmailToInquiries < ActiveRecord::Migration[8.1]
  def change
    add_column :inquiries, :phone, :string
    add_column :inquiries, :email, :string
  end
end
