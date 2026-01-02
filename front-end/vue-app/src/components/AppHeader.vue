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
  nmae:"AppHeader",
 data() {
    return { currentUser: "null" };
  },

   created() {
    const user = localStorage.getItem("currentUser");
    if (user) this.currentUser = JSON.parse(user);
  },

  computed: {
    isAdmin() {
      return this.currentUser && this.currentUser.role === "admin";
    }
  },

  watch: {
    $route() {
      const user = localStorage.getItem("currentUser");
      this.currentUser = user ? JSON.parse(user) : null;
    }
  },

  methods: {
    logout() {
      localStorage.removeItem("currentUser");
      this.currentUser = null;
      this.$router.push("/login");
    }
  }
};

</script>

<style scoped>
.header {
  display: flex;
  justify-content: center;
  gap: 20px;
  background-color: #42b983;
  padding: 10px;
}

a {
  color: white;
  text-decoration: none;
  font-weight: bold;
}

a.router-link-active {
  text-decoration: underline;
}
</style>
