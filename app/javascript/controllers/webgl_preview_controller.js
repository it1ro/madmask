import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    modelUrl: String
  }

  async connect() {
    const url = (this.modelUrlValue || "").trim()
    if (!url.length) return

    try {
      await this.#initThree()
    } catch (err) {
      console.error("[webgl-preview] init failed", err)
      this.element.setAttribute("data-webgl-preview-state", "init-failed")
      this.#renderStaticMessage(
        "init-failed",
        "Не удалось инициализировать 3D. Проверьте сеть и попробуйте снова.",
        true
      )
    }
  }

  retry() {
    const state = this.element.getAttribute("data-webgl-preview-state")
    if (state === "load-error") {
      this.#retryModelLoad()
      return
    }
    window.location.reload()
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

    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement && this.renderer.domElement.parentNode === this.element) {
        this.element.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }

    this.#removeOverlay()
    this.#removeErrorPanel()

    this.scene = null
    this.camera = null
    this.THREE = null
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
      this.#renderStaticMessage(
        "no-webgl",
        "WebGL недоступен в этом браузере. Откройте страницу в другом браузере или обновите.",
        true
      )
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
    this.#buildOverlay()

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
    await this.#loadModel(url)
  }

  #buildOverlay() {
    this.#removeOverlay()
    const wrap = document.createElement("div")
    wrap.className = "webgl-preview__overlay absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
    wrap.setAttribute("data-webgl-overlay", "true")
    wrap.innerHTML = `
      <div class="webgl-preview__spinner" aria-hidden="true"></div>
      <div class="h-1 w-[min(18rem,85%)] overflow-hidden rounded-full bg-[var(--color-border)]" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-webgl-progress-wrap>
        <div class="h-full rounded-full bg-[var(--color-accent-glow)] transition-[width] duration-150 ease-out" style="width:0%" data-webgl-progress-bar></div>
      </div>
      <span class="sr-only" data-webgl-progress-label>Загрузка модели</span>
    `
    this.element.appendChild(wrap)
    this._overlayEl = wrap
    this._progressBarEl = wrap.querySelector("[data-webgl-progress-bar]")
    this._progressWrapEl = wrap.querySelector("[data-webgl-progress-wrap]")
  }

  #removeOverlay() {
    if (this._overlayEl && this._overlayEl.parentNode === this.element) {
      this.element.removeChild(this._overlayEl)
    }
    this._overlayEl = null
    this._progressBarEl = null
    this._progressWrapEl = null
  }

  #setProgress(fraction) {
    if (!this._progressBarEl || !this._progressWrapEl) return
    const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100)
    this._progressBarEl.style.width = `${pct}%`
    this._progressWrapEl.setAttribute("aria-valuenow", String(pct))
  }

  #hideOverlay() {
    this.#removeOverlay()
  }

  #renderStaticMessage(state, message, withRetry) {
    this.element.innerHTML = `
      <div class="flex min-h-[12rem] flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <p class="text-sm text-[var(--color-text-secondary)]">${message}</p>
        ${
          withRetry
            ? `<button type="button" data-action="click->webgl-preview#retry" class="inline-flex min-h-[44px] min-w-[10rem] items-center justify-center rounded-lg border border-[var(--color-accent-cyber)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-2)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-glow)] focus-visible:outline-offset-2 active:scale-[0.98]" style="font-family: var(--font-orbitron)">Повторить</button>`
            : ""
        }
      </div>
    `
  }

  #removeErrorPanel() {
    const el = this.element.querySelector("[data-webgl-error-panel]")
    if (el) el.remove()
  }

  #showLoadErrorPanel() {
    this.#removeErrorPanel()
    const panel = document.createElement("div")
    panel.setAttribute("data-webgl-error-panel", "true")
    panel.className =
      "absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-2 border-t border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)]/95 px-3 py-2 text-center backdrop-blur-sm"
    panel.innerHTML = `
      <p class="text-xs text-[var(--color-text-secondary)]">Не удалось загрузить модель. Проверьте сеть.</p>
      <button type="button" data-action="click->webgl-preview#retry" class="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--color-accent-cyber)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-2)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-glow)] focus-visible:outline-offset-2 active:scale-[0.98]" style="font-family: var(--font-orbitron)">Повторить</button>
    `
    this.element.appendChild(panel)
  }

  async #retryModelLoad() {
    const url = (this.modelUrlValue || "").trim()
    if (!url || !this.scene || !this.THREE) {
      window.location.reload()
      return
    }

    this.element.setAttribute("data-webgl-preview-state", "loading")
    this.#removeErrorPanel()

    this.#buildOverlay()
    this.#setProgress(0)
    await this.#loadModel(url)
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
        loader.load(
          absoluteUrl,
          resolve,
          (xhr) => {
            if (xhr.lengthComputable && xhr.total > 0) {
              this.#setProgress(xhr.loaded / xhr.total)
            } else if (xhr.total === 0 && xhr.loaded > 0) {
              this.#setProgress(0.5)
            }
          },
          reject
        )
      })

      this.#hideOverlay()
      this.#removeErrorPanel()

      if (this.loadedRoot && this.scene) {
        this.#disposeObject3D(this.loadedRoot)
        this.scene.remove(this.loadedRoot)
        this.loadedRoot = null
      }

      const root = gltf.scene || gltf.scenes[0]
      this.loadedRoot = root
      this.#fitModelToView(root)
      this.scene.add(root)
      this.element.setAttribute("data-webgl-preview-state", "model-loaded")
    } catch (err) {
      console.warn("[webgl-preview] Model load failed", err)
      this.#hideOverlay()
      this.element.setAttribute("data-webgl-preview-state", "load-error")
      this.#showLoadErrorPanel()
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
