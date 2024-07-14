import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth/login',
      name: 'Login',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/auth/invite',
      name: 'Invite',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/arena',
      name: 'Arena',
      component: () => import('../views/ArenaView.vue')
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/ratings',
      name: 'Ratings',
      component: () => import('../views/RatingsView.vue')
    },
    {
      path: '/training',
      name: 'Training',
      component: () => import('../views/TrainingView.vue')
    },
    {
      path: '/training/fight',
      name: 'Training fight',
      component: () => import('../views/FightView.vue')
    },
    {
      path: '/training/punch',
      name: 'Punch',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/PunchView.vue')
    },
    {
      path: '/privacy',
      name: 'Privacy',
      component: () => import('../views/PageView.vue')
    }
  ]
})

export default router
