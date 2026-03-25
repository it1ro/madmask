# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# Three.js (same version for core + JSM addons; dynamic import from webgl_preview only on product show)
pin "three", to: "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
pin "three/addons/controls/OrbitControls.js",
  to: "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js"
pin "three/addons/loaders/GLTFLoader.js",
  to: "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js"
pin "three/addons/loaders/RGBELoader.js",
  to: "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/RGBELoader.js"
