<template>
  <div class="login-container">
    <h2>Admin Login</h2>
    <form @submit.prevent="login">
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      message: ""
    };
  },
  methods: {
    async login() {
      try {
        const res = await fetch("http://localhost:5000/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const data = await res.json();

        if (!res.ok) {
          this.message = data.error || "Login failed";
        } else {
          this.message = "Login successful!";
          localStorage.setItem("admin", JSON.stringify(data.admin));
          this.$router.push("/AdminDashboard");
        }
      } catch (err) {
        console.error(err);
        this.message = "Server error";
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  width: 300px;
  margin: 50px auto;
}
input {
  margin-bottom: 10px;
  padding: 8px;
  width: 100%;
}
button {
  padding: 8px;
  width: 100%;
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
