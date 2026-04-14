Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  get "sitemap.xml" => "sitemaps#show", as: :sitemap, defaults: { format: :xml }

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

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

  # Permanent redirects for legacy locale-prefixed URLs.
  get "/ru", to: redirect("/", status: 301)
  get "/ru/products", to: redirect("/products", status: 301)
  get "/ru/products/:id", to: redirect("/products/%{id}", status: 301)
  get "/ru/inquiries/new", to: redirect("/inquiries/new", status: 301)
  get "/ru/inquiries/thanks", to: redirect("/inquiries/thanks", status: 301)
  get "/ru/cart", to: redirect("/cart", status: 301)
  get "/ru/wishlist", to: redirect("/wishlist", status: 301)
  get "/ru/about", to: redirect("/about", status: 301)
  get "/ru/delivery-and-payment", to: redirect("/delivery-and-payment", status: 301)
  get "/ru/lead-times-and-custom", to: redirect("/lead-times-and-custom", status: 301)
  get "/ru/materials-and-care", to: redirect("/materials-and-care", status: 301)
  get "/ru/faq", to: redirect("/faq", status: 301)
  get "/ru/contacts", to: redirect("/contacts", status: 301)

  root "pages#home"
end
