# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.base_uri :self
    policy.object_src :none
    policy.frame_ancestors :self

    policy.script_src :self
    policy.style_src :self, "https://fonts.googleapis.com"
    policy.font_src :self, "https://fonts.gstatic.com", :data
    policy.img_src :self, :data, :blob
    policy.connect_src :self
  end

  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w(script-src style-src)
  config.content_security_policy_nonce_auto = true
end
