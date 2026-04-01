class SitemapsController < ApplicationController
  layout false

  def show
    respond_to do |format|
      format.xml { render xml: build_xml }
    end
  end

  private

  def build_xml
    host = Rails.configuration.x.canonical_host
    protocol = "https"

    urls = []
    urls << { loc: root_url(host:, protocol:), lastmod: Time.current }
    urls << { loc: products_url(host:, protocol:), lastmod: Time.current }

    Product.select(:id, :updated_at).find_each do |product|
      urls << { loc: product_url(product, host:, protocol:), lastmod: product.updated_at }
    end

    xml = +"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    xml << "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    urls.each do |entry|
      xml << "  <url>\n"
      xml << "    <loc>#{ERB::Util.h(entry[:loc])}</loc>\n"
      xml << "    <lastmod>#{entry[:lastmod].utc.iso8601}</lastmod>\n"
      xml << "  </url>\n"
    end
    xml << "</urlset>\n"
    xml
  end
end
