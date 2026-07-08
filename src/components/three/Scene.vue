<template>
  <div ref="container" class="scene"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer
} from "three"

const container = ref(null)

let scene
let camera
let renderer
let head
let frame
let disposed = false
let observer
let visible = true
let lastFrameAt = 0
const FRAME_INTERVAL = 1000 / 30

function resize() {
  if (!container.value || !camera || !renderer) return

  camera.aspect =
    container.value.clientWidth /
    container.value.clientHeight

  camera.updateProjectionMatrix()

  renderer.setSize(
    container.value.clientWidth,
    container.value.clientHeight
  )
}

function disposeObject(object) {
  object?.traverse?.((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }

    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]

      materials.forEach((material) => material.dispose?.())
    }
  })
}

function applyHead(object, scale) {
  if (disposed) {
    disposeObject(object)
    return
  }

  if (head) {
    scene.remove(head)
    disposeObject(head)
  }

  head = object
  head.scale.setScalar(scale)
  head.position.set(-0.2, -0.35, 0)
  head.rotation.set(0, 0, 0)
  scene.add(head)
}

function createProceduralHead() {
  const group = new Group()

  const glass = new MeshStandardMaterial({
    color: 0xbfd8ff,
    metalness: 0.2,
    roughness: 0.16,
    emissive: new Color(0x2563eb),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.92
  })

  const shell = new Mesh(
    new SphereGeometry(0.92, 36, 28),
    glass
  )

  shell.scale.set(0.9, 1.18, 0.72)
  shell.position.y = 0.1
  group.add(shell)

  const jaw = new Mesh(
    new SphereGeometry(0.72, 32, 20),
    glass.clone()
  )

  jaw.scale.set(0.9, 0.56, 0.7)
  jaw.position.y = -0.68
  group.add(jaw)

  const visor = new Mesh(
    new BoxGeometry(1.24, 0.18, 0.06),
    new MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.82
    })
  )

  visor.position.set(0, 0.26, 0.66)
  group.add(visor)

  const lineMaterial = new LineBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.55
  })

  for (let i = -2; i <= 2; i++) {
    const x = i * 0.22
    const points = [
      new Vector3(x, 0.82, 0.5),
      new Vector3(x * 0.78, 0.42, 0.68),
      new Vector3(x * 0.62, -0.2, 0.72),
      new Vector3(x * 0.5, -0.72, 0.48)
    ]

    group.add(
      new Line(
        new BufferGeometry().setFromPoints(points),
        lineMaterial.clone()
      )
    )
  }

  const orbitMaterial = new MeshBasicMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.22
  })

  const orbit = new Mesh(
    new TorusGeometry(1.35, 0.008, 10, 96),
    orbitMaterial
  )

  orbit.rotation.x = Math.PI / 2
  group.add(orbit)

  const orbit2 = orbit.clone()
  orbit2.rotation.y = Math.PI / 2
  group.add(orbit2)

  return group
}

onMounted(() => {

  disposed = false

  scene = new Scene()

  camera = new PerspectiveCamera(
    35,
    container.value.clientWidth /
      container.value.clientHeight,
    0.1,
    100
  )

  camera.position.set(0, 0.15, 4.1)

  renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  })

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.2)
  )

  renderer.setSize(
    container.value.clientWidth,
    container.value.clientHeight
  )

  renderer.outputColorSpace =
    SRGBColorSpace

  container.value.appendChild(
    renderer.domElement
  )

  scene.add(
    new AmbientLight(
      0xffffff,
      2
    )
  )

  const light = new DirectionalLight(0xffffff, 7)
  const rim = new DirectionalLight(0x6ea8ff, 3)

  rim.position.set(-4, 2, -3)
  scene.add(rim)

  light.position.set(3, 5, 5)

  scene.add(light)

  applyHead(createProceduralHead(), 1.08)

  const startedAt = performance.now()

  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  }, {
    threshold: 0.05
  })

  observer.observe(container.value)

  function animate(now = performance.now()) {

    frame = requestAnimationFrame(animate)

    if (!visible) return

    if (now - lastFrameAt < FRAME_INTERVAL) return

    lastFrameAt = now

    const t = (now - startedAt) / 1000

    if (head) {
      head.rotation.y = t * 0.12
      head.rotation.x = Math.sin(t * 0.7) * 0.025
      head.position.y = -0.35 + Math.sin(t * 0.9) * 0.024
    }
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)

  }

  animate()

  window.addEventListener(
    "resize",
    resize
  )

})

onBeforeUnmount(() => {

  disposed = true

  cancelAnimationFrame(frame)

  window.removeEventListener(
    "resize",
    resize
  )

  observer?.disconnect()

  renderer?.dispose()

  disposeObject(head)

})
</script>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
