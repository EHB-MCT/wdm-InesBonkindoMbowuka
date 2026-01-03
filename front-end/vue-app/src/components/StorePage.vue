<template>
	<div class="store-container">
		<h1>Token Store</h1>

		<div class="packs-grid">
			<div class="pack" v-for="pack in packs" :key="pack.id">
				<h2>{{ pack.name }}</h2>
				<p>Tokens: {{ pack.tokens }}</p>
				<p>Price: ${{ pack.price }}</p>
				<button :disabled="pack.price > 100" @click="buyPack(pack._id, pack.name)">Buy</button>
			</div>
		</div>

		<div v-if="message" class="message">{{ message }}</div>
	</div>
</template>

<script>
export default {
	name: "StorePage",
	data() {
		return {
			user: null,
			packs: [],
			message: "",
		};
	},
	methods: {
		async fetchAdmin() {
			try {
				const res = await fetch("http://localhost:5000/users/admin");
				if (!res.ok) throw new Error("Admin user not found");
				const data = await res.json();

				data.money = Number(data.money);
				data.tokens = Number(data.tokens);

				this.user = data;
			} catch (err) {
				console.error(err);
				this.message = "Error fetching admin user";
			}
		},
		async buyPack(packId, name) {
			console.log(this.user.username, "Bought the", name);
			try {
				const res = await fetch("http://localhost:5000/store/buy", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: this.user.username, packId }),
				});

				const data = await res.json();

				if (!res.ok) {
					this.message = data.error || "Purchase failed";
					return;
				}
				if (data.updatedUser) {
					this.user.money = Number(data.updatedUser.money);
					this.user.tokens = Number(data.updatedUser.tokens);
				} else {
					this.user.money -= Number(data.spent);
					this.user.tokens += Number(data.tokensGained);
				}

				this.message = `You purchased the ${name} and gained ${data.tokensGained} tokens.`;
			} catch (err) {
				console.error(err);
				this.message = "Error contacting server";
			}
		},

		async fetchPacks() {
			try {
				const res = await fetch("http://localhost:5000/store/packs");
				if (!res.ok) throw new Error("Failed to fetch packs");
				const data = await res.json();
				this.packs = data;
			} catch (err) {
				console.error(err);
				this.message = "Error fetching store packs";
			}
		},
	},

	mounted() {
		this.fetchAdmin();
		this.fetchPacks();
	},
};
</script>

<style scoped>
.store-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
}

.packs-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20px;
	justify-content: center;
}

.pack {
	border: 1px solid #F8BBD0;
	padding: 15px;
	width: 250px;
	text-align: center;
	border-radius: 8px;
}

button {
	background-color: #F8BBD0;
    color: #FFF8F0;
	padding: 8px 12px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
}

button:disabled {
	background-color: gray;
	cursor: not-allowed;
}

.message {
	margin-top: 20px;
	font-weight: bold;
	color:chartreuse;
}
</style>
