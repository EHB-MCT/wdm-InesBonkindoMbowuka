<template>
  <div class="quiz-container">
    <h1 v-if="activeQuizzes.length">Active Quizzes</h1>
    <h1 v-else>Loading quiz…</h1>
    <div v-for="quiz in activeQuizzes" :key="quiz.id" class="quiz-block">
      <div
        v-for="(options, roundIndex) in quiz.rounds"
        :key="roundIndex"
        class="question"
      >
        <h2> {{ quiz.title }}</h2>

        <div v-for="option in options" :key="option" class="option">
          {{ option }}
        </div>

        <button @click="showResults(quiz, roundIndex)">
          Show Results
        </button>

        <div class="total-tokens">
          Total Tokens Spent: {{ totalTokens[quiz.id]?.[roundIndex] || 0 }}
        </div>

        <div
          class="winning-option"
          v-if="winningOption[quiz.id]?.[roundIndex]"
        >
          Winning Option: {{ winningOption[quiz.id][roundIndex] }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  data() {
    return {
    users: [],
    activeQuizzes: [],
    totalTokens: {},
    winningOption: {}
  };
  },

  methods: {
    async fetchUsers() {
      try {
        const res = await fetch("http://localhost:5000/users");
        this.users = await res.json();
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    },

    matchesPreference(user, option) {
      const preferencePatterns = {
        cute: /cute/i,
        boyish: /boy/i,
        horror: /horror/i,
        bright: /bright/i
      };
      return preferencePatterns[user.preference].test(option);
    },

    async fetchQuizzes() {
    const res = await fetch("http://localhost:5000/quizzes/active");
    this.activeQuizzes=await res.json();
  },

    tokensToSpend(user, option) {
      if (this.matchesPreference(user, option)) {
        return Math.min(user.tokens, Math.floor(Math.random() * 10) + 1);
      } else {
        if (Math.random() < 0.5) return 0;
        return 1;
      }
    },

    async vote(optionIndex, tokensSpent) {
      const res = await fetch("http://localhost:5000/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.user.username,
        quizId: this.quiz.id,
        round: this.currentRound,
        option: optionIndex,
        tokensSpent
      })
    });

    const data = await res.json();
    console.log("Vote response:", data);
},

    weightedChoice(user, options) {
      let weighted = [];
      options.forEach(opt => {
        const weight = this.matchesPreference(user, opt) ? 5 : 1;
        for (let i = 0; i < weight; i++) weighted.push(opt);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    },

    async showResults(quiz, roundIndex) {
  let total = 0;
  let votesPerOption = {};

  for (const user of this.users) {
    if (user.tokens <= 0) continue;

    const options = quiz.rounds[roundIndex];
    if (!options) return;

    const choice = this.weightedChoice(user, options);
    const optionIndex = options.indexOf(choice);
    const spend = this.tokensToSpend(user, choice);

    if (spend <= 0) continue;

    await fetch("http://localhost:5000/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        quizId: quiz.id,
        round: roundIndex,
        option: optionIndex,
        tokensSpent: spend
      })
    });
    
    console.log(
      `[VOTE] Quiz: ${quiz.title} (${quiz.id}) | Round: ${roundIndex + 1} ${user.username} voted for "${choice}" (option ${optionIndex}) Tokens spent: ${spend} `
    );
   

    total += spend;
    votesPerOption[choice] = (votesPerOption[choice] || 0) + spend;
  }

  const sorted = Object.entries(votesPerOption).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length ? sorted[0][0] : null;

  if (!this.totalTokens[quiz.id]) this.totalTokens[quiz.id] = {};
  if (!this.winningOption[quiz.id]) this.winningOption[quiz.id] = {};

  this.totalTokens[quiz.id][roundIndex] = total;
  this.winningOption[quiz.id][roundIndex] = winner;

  await this.fetchUsers();
}
},

  mounted() {
    this.fetchUsers();
    this.fetchQuizzes();
  }
};
</script>

<style scoped>
.question {
  margin-bottom: 20px;
}
.option {
  padding-left: 10px;
}
.total-tokens {
  margin-top: 5px;
  font-weight: bold;
}
.winning-option {
  margin-top: 5px;
  font-weight: bold;
  color: green;
}
</style>
