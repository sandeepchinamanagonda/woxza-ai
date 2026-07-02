<template>

<div ref="container" class="three-head"></div>

</template>

<script setup>

import { ref,onMounted,onBeforeUnmount } from "vue"

import * as THREE from "three"

const container = ref()

let scene
let camera
let renderer

let head

let frame

let particles

let mouseX = 0
let mouseY = 0

const pointer = (e)=>{

mouseX = (e.clientX / window.innerWidth - .5) * 2
mouseY = (e.clientY / window.innerHeight - .5) * 2

}

onMounted(()=>{

scene = new THREE.Scene()

camera = new THREE.PerspectiveCamera(

40,

container.value.clientWidth /
container.value.clientHeight,

0.1,

100

)

camera.position.set(0,0,6)

renderer = new THREE.WebGLRenderer({

alpha:true,

antialias:true

})

renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

renderer.setSize(

container.value.clientWidth,

container.value.clientHeight

)

container.value.appendChild(renderer.domElement)
const ambient = new THREE.AmbientLight(
0xffffff,
1.6
)

scene.add(ambient)

const blue = new THREE.PointLight(
0x5B8CFF,
18,
40
)

blue.position.set(4,5,6)

scene.add(blue)

const rim = new THREE.PointLight(
0x7DD3FC,
10,
30
)

rim.position.set(-5,-2,4)

scene.add(rim)

const geometry = new THREE.IcosahedronGeometry(
1.35,
18
)

const material = new THREE.MeshPhysicalMaterial({

color:0xBFD8FF,

metalness:.15,

roughness:.05,

transmission:.92,

thickness:1.4,

clearcoat:1,

clearcoatRoughness:0,

ior:1.45,

emissive:new THREE.Color(0x3B82F6),

emissiveIntensity:.35,

transparent:true,

opacity:.96,

wireframe:false

})

head = new THREE.Mesh(
geometry,
material
)

scene.add(head)

const wire = new THREE.Mesh(

geometry,

new THREE.MeshBasicMaterial({

color:0x5B8CFF,

wireframe:true,

transparent:true,

opacity:.18

})

)

wire.scale.setScalar(1.02)

head.add(wire)
const particleGeometry = new THREE.BufferGeometry()

const count = 2200

const positions = new Float32Array(count * 3)

for(let i=0;i<count;i++){

const radius = 2 + Math.random() * 2.5

const theta = Math.random() * Math.PI * 2

const phi = Math.acos(2 * Math.random() - 1)

positions[i*3] =
radius *
Math.sin(phi) *
Math.cos(theta)

positions[i*3+1] =
radius *
Math.cos(phi)

positions[i*3+2] =
radius *
Math.sin(phi) *
Math.sin(theta)

}

particleGeometry.setAttribute(

"position",

new THREE.BufferAttribute(

positions,

3

)

)

const particleMaterial = new THREE.PointsMaterial({

size:.03,

color:0x5B8CFF,

transparent:true,

opacity:.8,

depthWrite:false,

blending:THREE.AdditiveBlending

})

particles = new THREE.Points(

particleGeometry,

particleMaterial

)

scene.add(particles)

const ring = new THREE.Mesh(

new THREE.TorusGeometry(

2,

0.015,

16,

240

),

new THREE.MeshBasicMaterial({

color:0x5B8CFF,

transparent:true,

opacity:.22

})

)

ring.rotation.x = Math.PI/2

scene.add(ring)

const ring2 = ring.clone()

ring2.rotation.y = Math.PI/2

scene.add(ring2)

const ring3 = ring.clone()

ring3.rotation.z = Math.PI/2

scene.add(ring3)
const clock = new THREE.Clock()

const animate = ()=>{

frame = requestAnimationFrame(animate)

const t = clock.getElapsedTime()

head.rotation.y += .003

head.rotation.x =
Math.sin(t*.6)*.08

head.rotation.z =
Math.cos(t*.4)*.04

head.rotation.y +=
(mouseX*0.015)

head.rotation.x +=
(-mouseY*0.01)

head.position.y =
Math.sin(t*.9)*.08

particles.rotation.y += .0008

particles.rotation.x += .00035

particles.rotation.z += .0002

ring.rotation.z += .003

ring2.rotation.x += .002

ring3.rotation.y += .0025

camera.position.x +=
(mouseX*1.2-camera.position.x)*.05

camera.position.y +=
(-mouseY*.8-camera.position.y)*.05

camera.lookAt(0,0,0)

renderer.render(

scene,

camera

)

}

animate()

const resize = ()=>{

camera.aspect =

container.value.clientWidth/

container.value.clientHeight

camera.updateProjectionMatrix()

renderer.setSize(

container.value.clientWidth,

container.value.clientHeight

)

}

window.addEventListener(

"resize",

resize

)

window.addEventListener(

"pointermove",

pointer

)
onBeforeUnmount(()=>{

cancelAnimationFrame(frame)

window.removeEventListener(

"pointermove",

pointer

)

renderer.dispose()

scene.traverse((child)=>{

if(child.geometry){

child.geometry.dispose()

}

if(child.material){

if(Array.isArray(child.material)){

child.material.forEach(m=>m.dispose())

}

else{

child.material.dispose()

}

}

})

})

</script>

<style scoped>

.three-head{

position:relative;

width:100%;

height:720px;

display:flex;

align-items:center;

justify-content:center;

overflow:hidden;

border-radius:40px;

background:

radial-gradient(

circle at center,

rgba(91,140,255,.10),

transparent 70%

);

}
.three-head::before{

content:"";

position:absolute;

inset:0;

background:

radial-gradient(

circle at center,

rgba(91,140,255,.18),

transparent 55%

);

filter:blur(80px);

animation:glowPulse 6s ease-in-out infinite;

pointer-events:none;

}

.three-head::after{

content:"";

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:620px;

height:620px;

border-radius:50%;

border:1px solid rgba(91,140,255,.08);

animation:rotateRing 40s linear infinite;

pointer-events:none;

}

canvas{

width:100%!important;

height:100%!important;

display:block;

}

@keyframes glowPulse{

0%,100%{

transform:scale(1);

opacity:.45;

}

50%{

transform:scale(1.08);

opacity:.9;

}

}

@keyframes rotateRing{

from{

transform:

translate(-50%,-50%)

rotate(0deg);

}

to{

transform:

translate(-50%,-50%)

rotate(360deg);

}

}
@media(max-width:1200px){

.three-head{

height:620px;

}

.three-head::after{

width:520px;

height:520px;

}

}

@media(max-width:992px){

.three-head{

height:520px;

}

.three-head::after{

width:420px;

height:420px;

}

}

@media(max-width:768px){

.three-head{

height:420px;

border-radius:28px;

}

.three-head::after{

width:320px;

height:320px;

}

}

@media(max-width:480px){

.three-head{

height:320px;

border-radius:20px;

}

.three-head::after{

width:220px;

height:220px;

}

}

.three-head canvas{

position:absolute;

inset:0;

}

.three-head{

isolation:isolate;

}

.three-head>*{

position:relative;

z-index:2;

}
