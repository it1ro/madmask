require "application_system_test_case"

class HomePageTest < ApplicationSystemTestCase
  test "visiting the homepage" do
    visit root_path

    assert_text "Артефакты"
    assert_link("В каталог")
  end
end
