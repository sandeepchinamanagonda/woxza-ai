import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { gsap } from 'gsap'

import App from './App.vue'
import './style.css'

// Import routes
import Home from './views/Home.vue'
import NotFound from './views/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'VoiceIQ - Enterprise AI Voice Platform'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }

    return {
      top: 0,
      behavior: 'smooth'
    }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'VOXA'
  next()
})

const app = createApp(App)

app.config.globalProperties.$gsap = gsap

app.use(router)

app.mount('#app')