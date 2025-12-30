<template>
  <div>
    <h1>Admin Dashboard</h1>

    <div v-if="!admin">
      <p>Loading admin...</p>
    </div>

    <div v-else>
      <p>Welcome, {{ admin.username }}</p>
      <button @click="logout">Logout</button>

      <div class="tabs">
        <button :class="{ active: page==='quizzes' }" @click="page='quizzes'">Quizzes</button>
        <button :class="{ active: page==='users' }" @click="page='users'">Users</button>
      </div>

      <div v-show="page==='quizzes'">
        <section>
          <h2>Create Quiz</h2>
          <input v-model="newQuiz.title" placeholder="Quiz Title" />

          <div v-for="(round, rIndex) in newQuiz.rounds" :key="rIndex" class="round">
            <h4>Round {{ rIndex + 1 }}</h4>
            <div v-for="(option, oIndex) in round.options" :key="oIndex" class="option">
              <input v-model="newQuiz.rounds[rIndex].options[oIndex]" placeholder="Option text" />
              <button @click="removeOption(rIndex, oIndex)">Remove Option</button>
            </div>
            <button @click="addOption(rIndex)">Add Option</button>
            <button @click="removeRound(rIndex)">Remove Round</button>
          </div>

          <button @click="addRound">Add Round</button>
          <button @click="createQuiz">Create Quiz</button>
        </section>

        <section>
          <h2>Existing Quizzes</h2>
          <div v-for="quiz in quizzes" :key="quiz.id" class="quiz-item">
            <div v-if="editingQuiz && editingQuiz.id === quiz.id">
              <input v-model="editingQuiz.title" placeholder="Quiz Title" />

              <div v-for="(round, rIndex) in editingQuiz.rounds" :key="rIndex" class="round">
                <h4>Round {{ rIndex + 1 }}</h4>
                <div v-for="(option, oIndex) in round" :key="oIndex" class="option">
                  <input v-model="editingQuiz.rounds[rIndex][oIndex]" placeholder="Option text" />
                  <button @click="removeEditOption(rIndex, oIndex)">Remove Option</button>
                </div>
                <button @click="addEditOption(rIndex)">Add Option</button>
                <button @click="removeEditRound(rIndex)">Remove Round</button>
              </div>

              <button @click="addEditRound">Add Round</button>
              <button @click="saveQuiz(editingQuiz.id)">Save Changes</button>
              <button @click="cancelEdit">Cancel</button>
            </div>

            <div v-else>
              <h3>{{ quiz.title }} (ID: {{ quiz.id }})</h3>
              <div v-for="(round, rIndex) in quiz.rounds" :key="rIndex" class="round">
                <h4>Round {{ rIndex + 1 }}</h4>
                <div v-for="option in round" :key="option">{{ option }}</div>
              </div>
              <button @click="startEdit(quiz)">Edit</button>
              <button @click="deleteQuiz(quiz.id)">Delete</button>
            </div>
          </div>
        </section>
      </div>

      <div v-show="page==='users'">
        <section>
          <h2>All Users</h2>
          <table class="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Tokens</th>
                <th>Total Tokens Spent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id">
                <td>{{ user.username }}</td>
                <td>{{ user.tokens }}</td>
                <td>{{ totalTokensSpent(user) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      admin: null,
      page: "quizzes", 
      quizzes: [],
      users: [],
      newQuiz: { title: "", rounds: [{ options: [""] }] },
      editingQuiz: null,
    };
  },
  mounted() {
    const stored = localStorage.getItem("admin");
    if (!stored) this.$router.push("/AdminLogin");
    else {
      this.admin = JSON.parse(stored);
      this.fetchQuizzes();
      this.fetchUsers();
    }
  },
  methods: {
    logout() {
      localStorage.removeItem("admin");
      this.$router.push("/AdminLogin");
    },

    async fetchQuizzes() {
      try {
        const res = await fetch("http://localhost:5000/quizzes");
        this.quizzes = await res.json();
      } catch (err) {
        console.error(err);
      }
    },
    async fetchUsers() {
      try {
        const res = await fetch("http://localhost:5000/users");
        this.users = await res.json();
      } catch (err) {
        console.error(err);
      }
    },

    totalTokensSpent(user) {
      if (!user.VotedFor) return 0;
      return user.VotedFor.reduce((sum, v) => sum + (v.tokensSpent || 0), 0);
    },

    addRound() { this.newQuiz.rounds.push({ options: [""] }); },
    removeRound(rIndex) { this.newQuiz.rounds.splice(rIndex, 1); },
    addOption(rIndex) { this.newQuiz.rounds[rIndex].options.push(""); },
    removeOption(rIndex, oIndex) { this.newQuiz.rounds[rIndex].options.splice(oIndex, 1); },
    async createQuiz() {
      try {
        const res = await fetch("http://localhost:5000/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: this.newQuiz.title, rounds: this.newQuiz.rounds.map(r => r.options) }),
        });
        const data = await res.json();
        if (res.ok) {
          this.quizzes.push(data.quiz);
          this.newQuiz = { title: "", rounds: [{ options: [""] }] };
        } else console.error(data.error);
      } catch (err) { console.error(err); }
    },

    deleteQuiz(id) {
      fetch(`http://localhost:5000/quizzes/${id}`, { method: "DELETE" })
        .then(res => res.ok && (this.quizzes = this.quizzes.filter(q => q.id !== id)))
        .catch(console.error);
    },

    startEdit(quiz) { this.editingQuiz = JSON.parse(JSON.stringify(quiz)); },
    cancelEdit() { this.editingQuiz = null; },
    addEditRound() { this.editingQuiz.rounds.push([""]); },
    removeEditRound(rIndex) { this.editingQuiz.rounds.splice(rIndex, 1); },
    addEditOption(rIndex) { this.editingQuiz.rounds[rIndex].push(""); },
    removeEditOption(rIndex, oIndex) { this.editingQuiz.rounds[rIndex].splice(oIndex, 1); },
    async saveQuiz(id) {
      try {
        const res = await fetch(`http://localhost:5000/quizzes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: this.editingQuiz.title, rounds: this.editingQuiz.rounds }),
        });
        if (res.ok) {
          const index = this.quizzes.findIndex(q => q.id === id);
          this.quizzes.splice(index, 1, JSON.parse(JSON.stringify(this.editingQuiz)));
          this.editingQuiz = null;
        }
      } catch (err) { console.error(err); }
    },
  },
};
</script>

<style scoped>
.tabs { margin: 20px 0; }
.tabs button {
  padding: 10px 20px;
  margin-right: 5px;
  cursor: pointer;
  background-color: #eee;
  border: none;
  border-radius: 5px 5px 0 0;
}
.tabs button.active {
  background-color: #42b983;
  color: white;
}

.quiz-item { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
.round { margin-bottom: 10px; }
.option { display: flex; gap: 5px; margin-bottom: 5px; }

.users-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.users-table th, .users-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
.users-table th { background-color: #f0f0f0; }
.users-table tbody tr:nth-child(even) { background-color: #fafafa; }
</style>
