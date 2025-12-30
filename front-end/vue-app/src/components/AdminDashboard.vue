<template>
  <div>
    <h1>Admin Dashboard</h1>

    <div v-if="!admin">
      <p>Loading admin...</p>
    </div>

    <div v-else>
      <p>Welcome, {{ admin.username }}</p>
      <button @click="logout">Logout</button>

      <section>
        <h2>Create Quiz</h2>
        <h3>add</h3>
      </section>

      <section>
        <h2>Manage Store</h2>
        <h3>edit</h3>
      </section>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      admin: null
    };
  },
  mounted() {
  const stored = localStorage.getItem("admin");
  if (!stored) {
    this.$router.push("/AdminLogin");
  } else {
    this.admin = JSON.parse(stored);
  }
},
  methods: {
    logout() {
      localStorage.removeItem("admin");
      this.$router.push("/AdminLogin");
    }
  }
};
</script>
