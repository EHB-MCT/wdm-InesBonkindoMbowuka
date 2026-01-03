import { createRouter, createWebHistory } from "vue-router";
import Home from "../components/HomePage.vue";
import HelloWorld from "../components/HelloWorld.vue";
import Store from "../components/StorePage.vue";
import AdminDashboard from "../components/AdminDashboard.vue";
import LoginPage from "../components/LoginPage.vue";
import RegisterPage from "../components/RegisterPage.vue";

const routes = [
    { path: "/", redirect: "/Login" },
	{ path: "/HomePage", name: "Home", component: Home },
	{ path: "/HelloWorld", name: "HelloWorld", component: HelloWorld },
	{ path: "/StorePage", name: "Store", component: Store },
	{ path: "/AdminDashboard", name: "Dashboard", component: AdminDashboard },
	{ path: "/Login", name: "Login", component: LoginPage },
	{ path: "/Register", name: "Register", component: RegisterPage },

    {
    path: "/AdminDashboard",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAdmin: true }
  }
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const user = localStorage.getItem("currentUser");

    if (!user) return next("/Login");

    const parsed = JSON.parse(user);
    if (parsed.role !== "admin") return next("/HomePage");
  }

  next();
});

export default router;

