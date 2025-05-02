import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Define routes
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/SignupView.vue')
  },
  {
    path: '/app',
    component: () => import('../views/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('../views/TasksView.vue')
      },
      {
        path: 'achievements',
        name: 'Achievements',
        component: () => import('../views/AchievementsView.vue')
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('../views/FriendsView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/SettingsView.vue')
      },
      {
        path: '',
        name: 'AppLayout',
        redirect: '/app/tasks'
      }
    ]
  }
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const token = localStorage.getItem('token');

  if (requiresAuth && !token) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/signup') && token) {
    next('/app/tasks');
  } else {
    next();
  }
});

export default router;
