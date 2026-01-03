<template>
  <div class="home-page">
    <h1>Welcome, {{ currentUser.username }}!</h1>
    <p>Your token balance: {{ currentUser.tokens }}</p>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  data() {
    return {
      currentUser: {
        username: "Guest",
        tokens: 0,
      },
    };
  },
  async mounted() {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.currentUser = parsed;
      } catch (err) {
        console.warn("Failed to parse currentUser from localStorage", err);
      }
    }
  },
};
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 50px;
  font-family: Arial, sans-serif;
}
</style>
