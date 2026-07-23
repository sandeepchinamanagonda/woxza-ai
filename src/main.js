import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import './style.css'

// Import routes
import Home from './views/Home.vue'
import NotFound from './views/NotFound.vue'
import AdminFeatures from './views/AdminFeatures.vue'
import AdminPrompts from './views/AdminPrompts.vue'
import AdminDebug from './views/AdminDebug.vue'
import AdminLogin from './views/AdminLogin.vue'
import AdminChangePassword from './views/AdminChangePassword.vue'

const routes = [
  { path:'/admin/login', name:'AdminLogin', component:AdminLogin, meta:{ title:'Woxza | Admin sign in' } },
  { path:'/admin/change-password', name:'AdminChangePassword', component:AdminChangePassword, meta:{ title:'Woxza | Set admin password' } },
  {
    path: '/admin/debug',
    name: 'AdminDebug',
    component: AdminDebug,
    meta: { title: 'Woxza | Production debug' }
  },
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

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || 'Woxza'
  if (to.path.startsWith('/admin/') && to.path !== '/admin/login') {
    try { const response=await fetch('/api/admin/session'); if (!response.ok) return next({ path:'/admin/login', query:{ next:to.fullPath } }); const session=await response.json(); if (session.mustChangePassword && to.path !== '/admin/change-password') return next('/admin/change-password'); if (!session.mustChangePassword && to.path === '/admin/change-password') return next('/admin/debug'); } catch { return next({ path:'/admin/login', query:{ next:to.fullPath } }) }
  }
  next()
})

const app = createApp(App)

app.use(router)

app.mount('#app')
