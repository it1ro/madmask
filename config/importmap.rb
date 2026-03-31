# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# Three.js (same version for core + JSM addons; dynamic import from webgl_preview only on product show)
pin "three", to: "three/build/three.module.js"
pin "three/addons/controls/OrbitControls.js",
  to: "three/addons/controls/OrbitControls.js"
pin "three/addons/loaders/GLTFLoader.js",
  to: "three/addons/loaders/GLTFLoader.js"
pin "three/addons/loaders/RGBELoader.js",
  to: "three/addons/loaders/RGBELoader.js"

pin "three/addons/utils/BufferGeometryUtils.js",
  to: "three/addons/utils/BufferGeometryUtils.js"

pin "three/addons/lights/LightProbeGenerator.js",
  to: "three/addons/lights/LightProbeGenerator.js"
