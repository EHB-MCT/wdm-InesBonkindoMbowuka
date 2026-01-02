<template>
	<div class="login-page">
		<h1>Login</h1>
		<input v-model="username" placeholder="Username" />
		<input type="password" v-model="password" placeholder="Password" />
         <p>Enter code if admin.</p>
        <input v-model="adminCode" type="password" placeholder="Admin code (optional)" />
		<button @click="login">Login</button>
		<p v-if="error" class="error">{{ error }}</p>
		<p>No account yet? <router-link to="/Register">Register</router-link></p>
	</div>
</template>

<script>
export default {
	data() {
		return {
        username: "",
        password: "",
        error: "",
        adminCode:""
    };
	},
	methods: {
		async login() {
			try {
				const res = await fetch("http://localhost:5000/Login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: this.username.trim(), password: this.password.trim(), adminCode: this.adminCode.trim() }),
				});

				const data = await res.json();
				if (!res.ok) {
					this.error = data.error || "Login failed";
					return;
				}
				localStorage.setItem("currentUser", JSON.stringify(data.user));

				if (data.user.role === "admin") this.$router.push("/AdminDashboard");
				else this.$router.push("/HomePage");
			} catch (err) {
				console.error(err);
				this.error = "Login failed, server error";
			}
		},
	},
};
</script>

<style scoped>
.login-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}
.error {
	color: red;
	font-weight: bold;
}
</style>
