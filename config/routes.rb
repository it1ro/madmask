Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  get "sitemap.xml" => "sitemaps#show", as: :sitemap, defaults: { format: :xml }

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  scope "(:locale)", locale: /ru|en/ do
    devise_for :users

    resources :products, only: %i[index show]
    resources :inquiries, only: %i[new create] do
      collection do
        get :thanks
      end
    end

    resource :cart, only: :show, controller: "cart" do
      post :add
      post :remove
      patch :update
    end

    resource :wishlist, only: :show, controller: "wishlist" do
      post :toggle
    end

    namespace :admin do
      root to: "products#index"
      resources :products, except: :show
    end

    get "about", to: "pages#about", as: :about
    get "delivery-and-payment", to: "pages#delivery_payment", as: :delivery_and_payment
    get "lead-times-and-custom", to: "pages#lead_times_custom", as: :lead_times_and_custom
    get "materials-and-care", to: "pages#materials_care", as: :materials_and_care
    get "faq", to: "pages#faq", as: :faq
    get "contacts", to: "pages#contacts", as: :contacts

    root "pages#home"
  end

  # Backward-compatible redirects (no locale prefix).
  get "products", to: redirect("/#{I18n.default_locale}/products")
  get "products/:id", to: redirect("/#{I18n.default_locale}/products/%{id}")
  get "inquiries/new", to: redirect("/#{I18n.default_locale}/inquiries/new")
  get "inquiries/thanks", to: redirect("/#{I18n.default_locale}/inquiries/thanks")
  get "cart", to: redirect("/#{I18n.default_locale}/cart")
  get "wishlist", to: redirect("/#{I18n.default_locale}/wishlist")
  get "about", to: redirect("/#{I18n.default_locale}/about")
  get "delivery-and-payment", to: redirect("/#{I18n.default_locale}/delivery-and-payment")
  get "lead-times-and-custom", to: redirect("/#{I18n.default_locale}/lead-times-and-custom")
  get "materials-and-care", to: redirect("/#{I18n.default_locale}/materials-and-care")
  get "faq", to: redirect("/#{I18n.default_locale}/faq")
  get "contacts", to: redirect("/#{I18n.default_locale}/contacts")

  get "/", to: redirect("/#{I18n.default_locale}")
end
