<template>
  <div class="store-container">
    <h1>Token Store (Admin)</h1>

    <div v-if="!user">
      <p>Loading admin user...</p>
    </div>

    <div v-else>
      <p>Username: {{ user.username }}</p>
      <p>Money: ${{ user.money }}</p>
      <p>Tokens: {{ user.tokens }}</p>

      <div class="pack" v-for="pack in packs" :key="pack.id">
        <h2>{{ pack.name }}</h2>
        <p>Tokens: {{ pack.tokens }}</p>
        <p>Price: ${{ pack.price }}</p>
        <button 
          :disabled="user.money < pack.price"
          @click="buyPack(pack.id)"
        >
          Buy
        </button>
      </div>

      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "StorePage",
  data() {
    return {
      user: null,
      packs: [
        { id: "small", name: "Small Pack", tokens: 5, price: 5 },
        { id: "medium", name: "Medium Pack", tokens: 15, price: 12 },
        { id: "large", name: "Large Pack", tokens: 40, price: 30 }
      ],
      message: ""
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
    async buyPack(packId) {
      try {
        const res = await fetch("http://localhost:5000/store/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: this.user.username, packId })
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

        this.message = `Purchased ${data.pack}! Tokens gained: ${data.tokensGained}, Money spent: $${data.spent}`;
      } catch (err) {
        console.error(err);
        this.message = "Error contacting server";
      }
    }
  },
  mounted() {
    this.fetchAdmin();
  }
};
</script>

<style scoped>
.store-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.pack {
  border: 1px solid #42b983;
  padding: 15px;
  width: 250px;
  text-align: center;
  border-radius: 8px;
}

button {
  background-color: #42b983;
  color: white;
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
  color: #d9534f;
}
</style>
