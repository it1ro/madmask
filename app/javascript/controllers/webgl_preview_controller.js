import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    modelUrl: String,
    coverImageUrl: String
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

    this.#disposeEnvironment()

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
    if (!this.#hasWebGL()) {
      this.element.setAttribute("data-webgl-preview-state", "no-webgl")
      this.#renderNoWebglFallback()
      return
    }

    const THREE = await import("three")
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js")
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js")
    const { RGBELoader } = await import("three/addons/loaders/RGBELoader.js")

    if (typeof window !== "undefined") {
      window.THREE = THREE
      window.OrbitControls = OrbitControls
    }

    this.THREE = THREE
    this.OrbitControls = OrbitControls
    this.GLTFLoader = GLTFLoader
    this.RGBELoader = RGBELoader

    const BG = 0x0a050f
    this.scene = new THREE.Scene()
    // Keep canvas transparent so that container gradients remain visible.
    this.scene.background = null
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    this.camera.position.set(1.6, 1.2, 2.4)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.#updateRendererPixelRatio()
    // Transparent background to match DESIGN_GUIDELINES container gradients.
    this.renderer.setClearColor(BG, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    // Exposure tuned for dark scene readability (HDRI/environments can change perceived brightness).
    this.renderer.toneMappingExposure = 1.45

    this.element.appendChild(this.renderer.domElement)
    this.#styleCanvas(this.renderer.domElement)
    this.#buildOverlay()

    // Themed lighting for fantasy/horror + cyber accents (matches DESIGN_GUIDELINES §5).
    const hemi = new THREE.HemisphereLight(0x442266, 0x226688, 0.95)
    this.scene.add(hemi)

    // Rim/key from above to keep silhouettes readable.
    const rim = new THREE.DirectionalLight(0xb76fe0, 1.25)
    rim.position.set(4, 8, 6)
    this.scene.add(rim)

    // Back/fill from the side for more even PBR shading.
    const fill = new THREE.DirectionalLight(0x226688, 0.7)
    fill.position.set(-4, 2, -2)
    this.scene.add(fill)

    await this.#initEnvironment()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.target.set(0, 0, 0)
    this.#configureControlsForInputType()

    this.resizeObserver = new ResizeObserver(() => this.#resize())
    this.resizeObserver.observe(this.element)
    this.#resize()

    this._animationId = null
    this._boundAnimate = this.#animate.bind(this)
    this._animationId = requestAnimationFrame(this._boundAnimate)

    const url = (this.modelUrlValue || "").trim()
    await this.#loadModel(url)
  }

  async #initEnvironment() {
    if (!this.renderer || !this.scene || !this.THREE || !this.RGBELoader) return

    // Default candidate locations: project can optionally ship real HDRIs under /public/hdr/.
    const candidates = ["/hdr/madmask_env_1.hdr", "/hdr/madmask_env_2.hdr"]

    const THREE = this.THREE

    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer)

      // Load HDRI first; fall back to a procedural equirectangular gradient if missing.
      let envMap = null

      for (const candidate of candidates) {
        try {
          const texture = await new Promise((resolve, reject) => {
            const loader = new this.RGBELoader()
            loader.load(
              candidate,
              (tex) => resolve(tex),
              undefined,
              (err) => reject(err)
            )
          })

          // Convert HDRI into a prefiltered radiance environment map.
          const rt = pmrem.fromEquirectangular(texture)
          envMap = rt.texture
          this._hdrTextureToDispose = texture
          if (typeof rt.dispose === "function") rt.dispose()

          break
        } catch (err) {
          console.warn("[webgl-preview] HDRI load failed:", candidate, err)
        }
      }

      if (!envMap) {
        const procedural = this.#createProceduralEquirectangular()
        const rt = pmrem.fromEquirectangular(procedural)
        envMap = rt.texture
        this._proceduralEnvTextureToDispose = procedural
        if (typeof rt.dispose === "function") rt.dispose()
      }

      // Keep the filtered env map for the lifetime of the controller.
      this._envMapToDispose = envMap
      this.scene.environment = envMap

      pmrem.dispose()
      this._pmremGenerator = null
    } catch (err) {
      console.warn("[webgl-preview] environment init failed, fallback to lights only.", err)
    }
  }

  #createProceduralEquirectangular() {
    const THREE = this.THREE
    const w = 512
    const h = 256
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: false })

    // Base vertical gradient: top purple glow -> bottom dark back.
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, "rgba(183,111,224,0.95)")
    gradient.addColorStop(0.5, "rgba(34,102,136,0.55)")
    gradient.addColorStop(1, "rgba(10,5,15,1)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Subtle horizontal bands to avoid "flat" reflections on very simple models.
    ctx.globalAlpha = 0.15
    for (let i = 0; i < 18; i++) {
      const y = Math.round((i / 18) * h)
      ctx.fillStyle = i % 2 === 0 ? "rgba(0,200,176,0.9)" : "rgba(183,111,224,0.9)"
      ctx.fillRect(0, y, w, 2)
    }
    ctx.globalAlpha = 1

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
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

  #renderNoWebglFallback() {
    const coverUrl = (this.coverImageUrlValue || "").trim()
    if (!coverUrl.length) {
      this.#renderStaticMessage(
        "no-webgl",
        "WebGL недоступен в этом браузере. Откройте страницу в другом браузере или обновите.",
        false
      )
      return
    }

    const absoluteCoverUrl = this.#resolveUrl(coverUrl)
    this.element.innerHTML = `
      <div class="relative h-full w-full">
        <img
          src="${absoluteCoverUrl}"
          alt="Статичное изображение товара"
          loading="eager"
          class="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div class="absolute inset-0 bg-[rgba(10,5,15,0.35)] pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center gap-1 border-t border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)]/95 px-3 py-2 text-center backdrop-blur-sm">
          <p class="text-xs text-[var(--color-text-secondary)]">
            WebGL недоступен в этом браузере. Показана статичная обложка.
          </p>
        </div>
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
      if (typeof window === "undefined") return false
      const supportsWebGLApi =
        typeof window.WebGLRenderingContext !== "undefined" ||
        typeof window.WebGL2RenderingContext !== "undefined"
      if (!supportsWebGLApi) return false

      const canvas = document.createElement("canvas")
      const contextAttributes = {
        antialias: true,
        failIfMajorPerformanceCaveat: true
      }

      return !!(
        canvas.getContext("webgl2", contextAttributes) ||
        canvas.getContext("webgl", contextAttributes) ||
        canvas.getContext("experimental-webgl", contextAttributes)
      )
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
    this.#updateRendererPixelRatio()
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  #configureControlsForInputType() {
    if (!this.controls || !this.THREE) return
    const isTouchDevice = this.#isTouchPrimaryInput()
    this.controls.enablePan = false

    if (isTouchDevice) {
      // Improve mobile UX: predictable one-finger rotate + two-finger zoom/rotate.
      this.controls.rotateSpeed = 0.72
      this.controls.zoomSpeed = 0.9
      this.controls.touches = {
        ONE: this.THREE.TOUCH.ROTATE,
        TWO: this.THREE.TOUCH.DOLLY_ROTATE
      }
    }
  }

  #updateRendererPixelRatio() {
    if (!this.renderer) return
    const deviceRatio = window.devicePixelRatio || 1
    const maxPixelRatio = this.#isTouchPrimaryInput() ? 1 : 2
    this.renderer.setPixelRatio(Math.min(deviceRatio, maxPixelRatio))
  }

  #isTouchPrimaryInput() {
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    const maxTouchPoints = navigator.maxTouchPoints || 0
    return coarsePointer || maxTouchPoints > 0
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

      // Improve reflections readability for typical PBR materials.
      this.#applyEnvMapIntensityToMaterials(root)

      this.element.setAttribute("data-webgl-preview-state", "model-loaded")
    } catch (err) {
      console.warn("[webgl-preview] Model load failed", err)
      this.#hideOverlay()
      this.element.setAttribute("data-webgl-preview-state", "load-error")
      this.#showLoadErrorPanel()
    }
  }

  #applyEnvMapIntensityToMaterials(object) {
    const THREE = this.THREE
    if (!object || !THREE) return

    const targetIntensity = 1.35
    object.traverse((child) => {
      if (!child || !child.isMesh) return

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((m) => {
        if (!m) return
        // Keep it narrow to PBR materials to avoid unexpected side effects.
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
          m.envMapIntensity = targetIntensity
          m.needsUpdate = true
        }
      })
    })
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

  #disposeEnvironment() {
    try {
      if (this.scene) this.scene.environment = null
      if (this._envMapToDispose) {
        this._envMapToDispose.dispose()
        this._envMapToDispose = null
      }
      if (this._hdrTextureToDispose) {
        this._hdrTextureToDispose.dispose()
        this._hdrTextureToDispose = null
      }
      if (this._proceduralEnvTextureToDispose) {
        this._proceduralEnvTextureToDispose.dispose()
        this._proceduralEnvTextureToDispose = null
      }
      if (this._pmremGenerator) {
        this._pmremGenerator.dispose()
        this._pmremGenerator = null
      }
    } catch (err) {
      console.warn("[webgl-preview] environment dispose failed", err)
    }
  }
}
