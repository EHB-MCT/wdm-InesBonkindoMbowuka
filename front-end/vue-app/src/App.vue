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
    background-color: #f8f1e8;
  }
</style>
