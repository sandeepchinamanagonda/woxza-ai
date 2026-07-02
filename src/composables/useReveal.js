import { onMounted } from "vue"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function useReveal(){

onMounted(()=>{

const sections=gsap.utils.toArray("main section")

sections.forEach(section=>{

gsap.fromTo(

section,

{
opacity:1,
y:40
},

{
opacity:1,
y:0,
duration:.9,
ease:"power3.out",

scrollTrigger:{
trigger:section,
start:"top 85%",
toggleActions:"play none none none"
}

}

)

})

})

}