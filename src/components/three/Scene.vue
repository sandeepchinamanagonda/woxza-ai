<template>
  <div ref="container" class="scene"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

const container = ref(null)

let scene
let camera
let renderer
let head
let frame

const mouse = { x: 0, y: 0 }

function onPointerMove(e) {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
}

function resize() {
  if (!container.value) return

  camera.aspect =
    container.value.clientWidth /
    container.value.clientHeight

  camera.updateProjectionMatrix()

  renderer.setSize(
    container.value.clientWidth,
    container.value.clientHeight
  )
}

onMounted(() => {

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    35,
    container.value.clientWidth /
      container.value.clientHeight,
    0.1,
    100
  )

  camera.position.set(0, 0.15, 4.1)

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  })

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  )

  renderer.setSize(
    container.value.clientWidth,
    container.value.clientHeight
  )

  renderer.outputColorSpace =
    THREE.SRGBColorSpace

  container.value.appendChild(
    renderer.domElement
  )

  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      2
    )
  )

  const light = new THREE.DirectionalLight(
  0xffffff,
  7
)

const rim = new THREE.DirectionalLight(
  0x6EA8FF,
  3
)

rim.position.set(-4,2,-3)

scene.add(rim)

  light.position.set(3, 5, 5)

  scene.add(light)

  const loader = new GLTFLoader()

  loader.load(

    "/models/ai-head.glb",

    (gltf) => {

      head.scale.set(2.8, 2.8, 2.8)

head.position.set(-0.2, -0.35, 0)

head.rotation.set(0, 0, 0)

scene.add(head)

    },

    undefined,

    (err) => {

      console.error(err)

    }

  )

  const clock = new THREE.Clock()

  function animate() {

    frame = requestAnimationFrame(animate)

    const t = clock.getElapsedTime()

   if (head) {

  head.rotation.y =

    t * 0.25 +

    mouse.x * 0.18

  head.rotation.x =

    Math.sin(t * 0.8) * 0.06 +

    (-mouse.y * 0.08)

  head.position.y =

    -0.35 +

    Math.sin(t * 1.2) * 0.05

}
    camera.position.x +=
      (mouse.x * 0.4 - camera.position.x) *
      0.05

    camera.position.y +=
      (-mouse.y * 0.2 - camera.position.y) *
      0.05

    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)

  }

  animate()

  window.addEventListener(
    "resize",
    resize
  )

  window.addEventListener(
    "pointermove",
    onPointerMove
  )

})

onBeforeUnmount(() => {

  cancelAnimationFrame(frame)

  window.removeEventListener(
    "resize",
    resize
  )

  window.removeEventListener(
    "pointermove",
    onPointerMove
  )

  renderer?.dispose()

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