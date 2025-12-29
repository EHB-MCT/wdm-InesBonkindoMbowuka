<template>
  <header class="header">
    <nav>
      <router-link to="/HomePage">Home</router-link>
      <router-link to="/HelloWorld">Quiz</router-link>
      <router-link to="/StorePage">Store</router-link>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
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
