import { createRouter, createWebHistory } from "vue-router";
import Home from "../components/HomePage.vue";
import HelloWorld from "../components/HelloWorld.vue";
import Store from "../components/StorePage.vue";
import AdminLogin from "../components/AdminLogin.vue";
import AdminDashboard from "../components/AdminDashboard.vue";
import LoginPage from "../components/LoginPage.vue";
import RegisterPage from "../components/RegisterPage.vue";

const routes = [
	{ path: "/HomePage", name: "Home", component: Home },
	{ path: "/HelloWorld", name: "HelloWorld", component: HelloWorld },
	{ path: "/StorePage", name: "Store", component: Store },
	{ path: "/AdminLogin", name: "Login", component: AdminLogin },
	{ path: "/AdminDashboard", name: "Dashboard", component: AdminDashboard },
	{ path: "/Login", name: "Login", component: LoginPage },
	{ path: "/Register", name: "Register", component: RegisterPage },
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
