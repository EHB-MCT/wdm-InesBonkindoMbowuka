<template>
	<div id="app">
		<AppHeader v-if="showHeader" />
		<router-view />
	</div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

export default {
	name: "App",
	components: { AppHeader },

	setup() {
		const route = useRoute();
		const showHeader = computed(() => {
			return !["/Login", "/Register"].includes(route.path);
		});

		return { showHeader };
	},
};
</script>
<style>
  body{
    background-color: #42331f;
    color: #F8BBD0;
    font-family: "Wix Madefor Text", sans-serif;
    font-optical-sizing: auto;
    font-weight: 400;
    font-style: normal;
    font-size: small;
  }

  button{
  background-color: #FFF8F0;
  color:#F8BBD0;
  border: none;
  border-radius: 5px;
  margin: 5px;
}

button:hover{
  background-color: #F8BBD0;
  color: #FFF8F0;
  cursor: pointer;
}


input {
  padding: 8px 12px;
  border-radius: 10px;
  margin-top: 10px;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: "Wix Madefor Text", sans-serif;
  background-color: #F8BBD0;
  color: #FFF8F0;
  transition: all 0.3s ease;
}

input::placeholder {
  color: #FFF8F0;
  opacity: 0.7;
}

input:focus {
  background-color: #FFF8F0;
  color: #F8BBD0;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);

}
</style>
