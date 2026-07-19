import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import './style.css'

// Import routes
import Home from './views/Home.vue'
import NotFound from './views/NotFound.vue'
import AdminFeatures from './views/AdminFeatures.vue'
import AdminPrompts from './views/AdminPrompts.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Woxza | Enterprise AI Voice Platform'
    }
  },
  {
    path: '/admin/features',
    name: 'AdminFeatures',
    component: AdminFeatures,
    meta: {
      title: 'Woxza | Feature Management'
    }
  },
  {
    path: '/admin/prompts',
    name: 'AdminPrompts',
    component: AdminPrompts,
    meta: {
      title: 'Woxza | Prompt Templates'
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
      top: 0
    }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Woxza'
  next()
})

const app = createApp(App)

app.use(router)

app.mount('#app')
