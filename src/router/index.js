import { createRouter, createWebHistory } from "vue-router";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home'
    },
    {
      path: '/auth/login',
      name: 'Login',
      component: () => import("/src/views/AuthView.vue"),
      meta: {requiresAuth: false} // не требует авторизации
    },
    {
      path: '/auth/invite',
      name: 'Invite',
      component: () => import("/src/views/AuthView.vue"),
      meta: {requiresAuth: false} // не требует авторизации
    },
    {
      path: '/privacy',
      name: 'Privacy',
      component: () => import("/src/views/PageView.vue"),
      meta: {requiresAuth: false} // не требует авторизации
    },

    {
      path: '/arena',
      name: 'Arena',
      component: () => import("/src/views/ArenaView.vue")
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import("/src/views/ProfileView.vue")
    },
    {
      path: '/ratings',
      name: 'Ratings',
      component: () => import("/src/views/RatingsView.vue")
    },
    {
      path: '/training',
      name: 'Training',
      component: () => import("/src/views/TrainingView.vue")
    },
    {
      path: '/training/fight',
      name: 'Training fight',
      component: () => import("/src/views/FightView.vue")
    },
    {
      path: '/training/punch',
      name: 'Punch',
      component: () => import("/src/views/PunchView.vue")
    },
    // {
    //     path: '/:pathMatch(.*)*',
    //     name: 'NotFound',
    //     component: () => import("/src/views/NotFoundView.vue"),
    //     meta: {requiresAuth: false} // не требует авторизации
    // }
  ]
})

// Добавляем навигационный гвард
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);

  // const isAuthenticated = store.getters['user/getToken'];
  const isAuthenticated = true

  if (to.name === 'Home') {
    if (isAuthenticated) {
      next({name: 'Profile'});
    } else {
      next({name: 'Invite'});
    }
  } else if (requiresAuth && !isAuthenticated) {
    console.log('Redirecting to Invite page');
    next({name: 'Invite'});
  } else {
    next();
  }
});

export default router;