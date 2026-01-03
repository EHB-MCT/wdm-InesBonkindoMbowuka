<template>
	<header class="header">
		<nav>
			<router-link to="/HomePage">Home</router-link>
			<router-link to="/HelloWorld">Quiz</router-link>
			<router-link to="/StorePage">Store</router-link>
			<router-link v-if="isAdmin" to="/AdminDashboard">Admin</router-link>
			<button v-if="currentUser" @click="logout">Logout</button>
		</nav>
	</header>
</template>

<script>
export default {
	name: "AppHeader",
	data() {
		return { currentUser: null };
	},

	created() {
		this.loadUser();
	},

	computed: {
		isAdmin() {
			return this.currentUser && this.currentUser.role === "admin";
		},
	},

	watch: {
		$route() {
			this.loadUser();
		},
	},

	methods: {
		loadUser() {
			try {
				const userStr = localStorage.getItem("currentUser");
				if (userStr && userStr !== "undefined") {
					this.currentUser = JSON.parse(userStr);
				} else {
					this.currentUser = null;
				}
			} catch (err) {
				console.warn("Failed to parse currentUser from localStorage:", err);
				this.currentUser = null;
			}
		},

		logout() {
			localStorage.removeItem("currentUser");
			this.currentUser = null;
			this.$router.push("/Login");
		},
	},
};
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Coiny&family=Wix+Madefor+Text:ital,wght@0,400..800;1,400..800&display=swap');

.header {
	display: flex;
	justify-content: center;
	background-color: #F8BBD0;
	padding: 10px;
  font-family: "Wix Madefor Text", sans-serif;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
  font-size: x-large;
}

.header nav{
  display: flex;
  gap: 150px;
  align-items: center;
}
button{
  background-color: #FFF8F0;
  color:#F8BBD0;
  border: none;
  border-radius: 20px;
}

button:hover{
  background-color: #F8BBD0;
  color: #FFF8F0;
  cursor: pointer;
}

a {
	color: #FFF8F0;
	text-decoration: none;
	font-weight: bold;
}

a.router-link-active {
	text-decoration: underline;
}
</style>
