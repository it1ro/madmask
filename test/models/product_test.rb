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

  test "hero_image prefers cover when both cover and gallery exist" do
    product = products(:two)
    product.cover_image.attach(
      io: StringIO.new("cover-bytes"),
      filename: "cover.png",
      content_type: "image/png"
    )
    product.gallery_images.attach(
      io: StringIO.new("g"), filename: "g.png", content_type: "image/png"
    )
    assert product.save
    assert_equal product.cover_image.blob.id, product.hero_image.id
  end

  test "hero_image uses first gallery image when no cover" do
    product = products(:two)
    product.gallery_images.attach(
      io: StringIO.new("g1"),
      filename: "g1.png",
      content_type: "image/png"
    )
    product.gallery_images.attach(
      io: StringIO.new("g2"),
      filename: "g2.png",
      content_type: "image/png"
    )
    assert product.save
    assert_equal product.gallery_images.blobs.first.id, product.hero_image.id
  end

  test "gallery_extra_count counts gallery when cover exists" do
    product = products(:two)
    product.cover_image.attach(
      io: StringIO.new("c"),
      filename: "c.png",
      content_type: "image/png"
    )
    2.times do |i|
      product.gallery_images.attach(
        io: StringIO.new("x#{i}"),
        filename: "g#{i}.png",
        content_type: "image/png"
      )
    end
    assert_equal 2, product.gallery_extra_count
  end

  test "gallery_extra_count excludes hero when only gallery images" do
    product = products(:two)
    3.times do |i|
      product.gallery_images.attach(
        io: StringIO.new("x#{i}"),
        filename: "g#{i}.png",
        content_type: "image/png"
      )
    end
    assert_equal 2, product.gallery_extra_count
  end

  test "rejects gallery_images with invalid content type" do
    product = products(:two)
    product.gallery_images.attach(
      io: StringIO.new("x"),
      filename: "bad.exe",
      content_type: "application/octet-stream"
    )
    assert_not product.valid?
    assert product.errors.key?(:gallery_images)
  end

  test "rejects more than MAX_GALLERY_IMAGES gallery images" do
    product = products(:two)
    Product::MAX_GALLERY_IMAGES.times do |i|
      product.gallery_images.attach(
        io: StringIO.new("x#{i}"),
        filename: "g#{i}.png",
        content_type: "image/png"
      )
    end
    assert product.save

    product.gallery_images.attach(
      io: StringIO.new("overflow"),
      filename: "overflow.png",
      content_type: "image/png"
    )
    assert_not product.save
    assert product.errors.key?(:gallery_images)
  end
end
