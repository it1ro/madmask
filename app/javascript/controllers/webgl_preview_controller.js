import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    modelUrl: String
  }

  async connect() {
    try {
      await this.#initThree()
    } catch (err) {
      console.error("[webgl-preview] init failed", err)
      this.element.setAttribute("data-webgl-preview-state", "init-failed")
      this.element.innerHTML =
        '<p class="flex min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--color-text-secondary)]">Не удалось загрузить 3D. Проверьте сеть и обновите страницу.</p>'
    }
  }

  async #initThree() {
    const THREE = await import("three")
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js")
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js")

    if (typeof window !== "undefined") {
      window.THREE = THREE
      window.OrbitControls = OrbitControls
    }

    this.THREE = THREE
    this.OrbitControls = OrbitControls
    this.GLTFLoader = GLTFLoader

    if (!this.#hasWebGL()) {
      this.element.setAttribute("data-webgl-preview-state", "no-webgl")
      this.element.innerHTML =
        '<p class="flex min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--color-text-secondary)]">WebGL недоступен в этом браузере.</p>'
      return
    }

    const BG = 0x0a050f
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(BG)
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    this.camera.position.set(1.6, 1.2, 2.4)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(BG, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.element.appendChild(this.renderer.domElement)
    this.#styleCanvas(this.renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    this.scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(4, 8, 6)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xaaccff, 0.35)
    fill.position.set(-4, 2, -2)
    this.scene.add(fill)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.target.set(0, 0, 0)

    this.resizeObserver = new ResizeObserver(() => this.#resize())
    this.resizeObserver.observe(this.element)
    this.#resize()

    this._animationId = null
    this._boundAnimate = this.#animate.bind(this)
    this._animationId = requestAnimationFrame(this._boundAnimate)

    const url = (this.modelUrlValue || "").trim()
    if (url.length === 0) {
      this.#addFallbackCube()
    } else {
      await this.#loadModel(url)
    }
  }

  disconnect() {
    if (this._animationId != null) {
      cancelAnimationFrame(this._animationId)
      this._animationId = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }

    if (this.loadedRoot && this.scene) {
      this.#disposeObject3D(this.loadedRoot)
      this.scene.remove(this.loadedRoot)
      this.loadedRoot = null
    }

    if (this.fallbackMesh && this.scene) {
      this.#disposeObject3D(this.fallbackMesh)
      this.scene.remove(this.fallbackMesh)
      this.fallbackMesh = null
    }

    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement && this.renderer.domElement.parentNode === this.element) {
        this.element.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }

    this.scene = null
    this.camera = null
    this.THREE = null
  }

  #hasWebGL() {
    try {
      const canvas = document.createElement("canvas")
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    } catch {
      return false
    }
  }

  #styleCanvas(canvas) {
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.touchAction = "none"
  }

  #resize() {
    if (!this.element || !this.camera || !this.renderer) return
    const w = this.element.clientWidth || 1
    const h = this.element.clientHeight || 1
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  #animate() {
    this._animationId = requestAnimationFrame(this._boundAnimate)
    if (this.controls) this.controls.update()
    if (this.fallbackMesh) {
      this.fallbackMesh.rotation.x += 0.008
      this.fallbackMesh.rotation.y += 0.012
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  async #loadModel(url) {
    const THREE = this.THREE
    const loader = new this.GLTFLoader()
    const absoluteUrl = this.#resolveUrl(url)

    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(absoluteUrl, resolve, undefined, reject)
      })
      const root = gltf.scene || gltf.scenes[0]
      this.loadedRoot = root
      this.#fitModelToView(root)
      this.scene.add(root)
      this.element.setAttribute("data-webgl-preview-state", "model-loaded")
    } catch (err) {
      console.warn("[webgl-preview] Model load failed, using fallback cube", err)
      this.element.setAttribute("data-webgl-preview-state", "load-error")
      this.#addFallbackCube()
    }
  }

  #resolveUrl(url) {
    try {
      return new URL(url, window.location.href).href
    } catch {
      return url
    }
  }

  #fitModelToView(object) {
    const THREE = this.THREE
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    object.position.sub(center)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
    const scale = 1.8 / maxDim
    object.scale.setScalar(scale)

    const dist = maxDim * scale * 1.4
    this.camera.position.set(dist * 0.9, dist * 0.55, dist * 1.1)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  #addFallbackCube() {
    const THREE = this.THREE
    const geom = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6b5b95,
      metalness: 0.35,
      roughness: 0.45
    })
    this.fallbackMesh = new THREE.Mesh(geom, mat)
    this.scene.add(this.fallbackMesh)
    this.element.setAttribute("data-webgl-preview-state", "fallback-cube")
  }

  #disposeObject3D(object) {
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((m) => {
          if (m.map) m.map.dispose()
          if (m.normalMap) m.normalMap.dispose()
          if (m.roughnessMap) m.roughnessMap.dispose()
          if (m.metalnessMap) m.metalnessMap.dispose()
          if (m.aoMap) m.aoMap.dispose()
          if (m.emissiveMap) m.emissiveMap.dispose()
          m.dispose()
        })
      }
    })
  }
}
