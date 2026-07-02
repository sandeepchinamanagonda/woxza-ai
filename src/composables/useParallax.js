import { onMounted,onUnmounted } from "vue"

export function useParallax(){

const move=(e)=>{

const x=(e.clientX/window.innerWidth-.5)*20
const y=(e.clientY/window.innerHeight-.5)*20

document.querySelectorAll(".glow").forEach((el,index)=>{

const strength=(index+1)*0.6

el.style.transform=`translate(${x*strength}px,${y*strength}px)`

})

}

onMounted(()=>{

window.addEventListener("mousemove",move)

})

onUnmounted(()=>{

window.removeEventListener("mousemove",move)

})

}