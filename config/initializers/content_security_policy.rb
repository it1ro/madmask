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
    # Turbo and some UI behaviors may apply `style=""` attributes at runtime.
    # CSP nonces do not cover style attributes, so we allow inline styles.
    policy.style_src :self, :unsafe_inline
    policy.font_src :self, :data
    policy.img_src :self, :data, :blob
    # Three.js / GLTFLoader may create blob: URLs for embedded textures (GLB).
    # Those are fetched internally, so we must allow blob: in connect-src.
    policy.connect_src :self, :blob
  end

  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  # Keep nonces for scripts; don't nonce style-src because it disables `unsafe-inline`
  # for style attributes (and Turbo uses inline styles in a few places).
  config.content_security_policy_nonce_directives = %w[script-src]
  config.content_security_policy_nonce_auto = true
end
