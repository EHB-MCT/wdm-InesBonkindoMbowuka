import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/HomePage.vue';
import HelloWorld from '../components/HelloWorld.vue';
import Store from '../components/StorePage.vue';

const routes = [
  { path: '/HomePage', name: 'Home', component: Home },
  { path: '/HelloWorld', name: 'HelloWorld', component: HelloWorld },
  { path: '/StorePage', name: 'Store', component: Store },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
