import { onMounted,onUnmounted } from "vue"

export function useMagnetic(){

let buttons=[]

const move=(e)=>{

buttons.forEach(btn=>{

const rect=btn.getBoundingClientRect()

const x=e.clientX-(rect.left+rect.width/2)
const y=e.clientY-(rect.top+rect.height/2)

const distance=Math.sqrt(x*x+y*y)

if(distance<180){

btn.style.transform=`translate(${x*0.18}px,${y*0.18}px)`

}else{

btn.style.transform="translate(0,0)"

}

})

}

onMounted(()=>{

buttons=[...document.querySelectorAll(".btn-primary,.btn-secondary,.consult")]

window.addEventListener("mousemove",move)

})

onUnmounted(()=>{

window.removeEventListener("mousemove",move)

})

}