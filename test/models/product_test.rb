require "test_helper"

class ProductTest < ActiveSupport::TestCase
  test "effective_model_url is nil without attachment and uses blob path when attached" do
    product = products(:one)
    assert_nil product.effective_model_url

    product.model_file.attach(
      io: StringIO.new("glb-bytes"),
      filename: "upload.glb",
      content_type: "model/gltf-binary"
    )
    assert product.effective_model_url.start_with?("/rails/active_storage/blobs/")
  end

  test "rejects model_file with invalid extension" do
    product = products(:two)
    product.model_file.attach(
      io: StringIO.new("x"),
      filename: "bad.png",
      content_type: "image/png"
    )
    assert_not product.valid?
    assert product.errors.key?(:model_file)
  end

  test "rejects model_file with disallowed content type" do
    product = products(:two)
    product.model_file.attach(
      io: StringIO.new("x"),
      filename: "bad.glb",
      content_type: "image/png"
    )
    assert_not product.valid?
    assert product.errors.key?(:model_file)
  end
end
