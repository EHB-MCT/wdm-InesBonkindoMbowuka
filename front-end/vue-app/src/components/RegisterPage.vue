<template>
	<div class="register-container">
		<h1>Register</h1>
		<input v-model="username" placeholder="Username" />
		<input type="password" v-model="password" placeholder="Password" />
        <p>Enter code if admin.</p>
        <input v-model="adminCode" type="password" placeholder="Admin code (optional)" />
		<button @click="registerUser">Register</button>

		<p v-if="message" class="message">{{ message }}</p>
		<p>Already have an account? <router-link to="/Login">Login</router-link></p>
	</div>
</template>

<script>
export default {
	data() {
		return {
			username: "",
			password: "",
			message: "",
            adminCode: ""
		};
	},
	methods: {
		async registerUser() {
			if (!this.username || !this.password) {
				this.message = "Enter username and password";
				return;
			}

			try {
				const res = await fetch("http://localhost:5000/Register", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: this.username, password: this.password, adminCode: this.adminCode }),
				});

				const data = await res.json();

				if (!res.ok) {
					this.message = data.error || "Registration failed";
					return;
				}

				localStorage.setItem(
					"currentUser",
					JSON.stringify({
						username: data.user.username,
						role: data.user.role,
						tokens: data.user.tokens,
					})
				);

				this.$router.push("/HomePage");
			} catch (err) {
				console.error(err);
				this.message = "Error connecting to server";
			}
		},
	},
};
</script>

<style scoped>
.register-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	margin-top: 50px;
}

input {
	padding: 8px;
	width: 250px;
	border-radius: 5px;
}

button {
	padding: 8px 16px;
	background-color: #FFF8F0;
	border: none;
	border-radius: 5px;
	cursor: pointer;
}

.message {
	color: red;
}
</style>

 background-color: #FFF8F0;
  color: #F8BBD0