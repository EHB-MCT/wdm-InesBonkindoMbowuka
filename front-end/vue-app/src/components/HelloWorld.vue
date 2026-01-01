<template>
  <div class="quiz-container">
    <h1 v-if="activeQuiz">{{ activeQuiz.title }}</h1>
    <h1 v-else>Loading quiz…</h1>
    <div v-if="activeQuiz">
      <div
        v-for="(options, roundIndex) in activeQuiz.rounds"
        :key="roundIndex"
        class="question"
      >
        <h2>Round {{ roundIndex + 1 }}</h2>

        <div v-for="option in options" :key="option" class="option">
          {{ option }}
        </div>

        <button @click="showResults(roundIndex)">
          Show Results
        </button>

        <div class="total-tokens">
          Total Tokens Spent: {{ totalTokens[roundIndex] || 0 }}
        </div>

        <div
          class="winning-option"
          v-if="winningOption[roundIndex]"
        >
          Winning Option: {{ winningOption[roundIndex] }}
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
    activeQuiz: null,
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
    const quizzes = await res.json();
    this.activeQuiz = quizzes[0] || null;
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

    async showResults(roundIndex) {
      let total = 0;
      let votesPerOption = {};

    for (const user of this.users) {
      if (user.tokens <= 0) continue;

      const choice = this.weightedChoice(user, this.activeQuiz.rounds[roundIndex]);
      const optionIndex = this.activeQuiz.rounds[roundIndex].indexOf(choice);
      const spend = this.tokensToSpend(user, choice);

      if (spend <= 0) continue;

      await fetch("http://localhost:5000/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          quizId: this.activeQuiz.id,
          round: roundIndex,
          option: optionIndex,
          tokensSpent: spend
        })
      });

      total += spend;

      votesPerOption[choice] = (votesPerOption[choice] || 0) + spend;

      console.log(
        `Round ${roundIndex + 1} | ${user.username} voted for "${choice}" | Tokens: ${spend}`
      );
  }

    const sorted = Object.entries(votesPerOption).sort((a, b) => b[1] - a[1]);
    const winner = sorted.length ? sorted[0][0] : null;

    this.totalTokens = { ...this.totalTokens, [roundIndex]: total };
    this.winningOption = { ...this.winningOption, [roundIndex]: winner };

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
