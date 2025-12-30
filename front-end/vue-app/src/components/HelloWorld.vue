<template>
  <div class="quiz-container">
    <h1>Quiz Simulation</h1>

    <div v-for="(options, roundIndex) in roundOptions" :key="roundIndex" class="question">
      <h2>Question {{ roundIndex + 1 }}</h2>

      <div v-for="option in options" :key="option" class="option">
        {{ option }}
      </div>

      <button @click="showResults(roundIndex)">Show Results</button>

      <div class="total-tokens">
        Total Tokens Spent: {{ totalTokens[roundIndex] || 0 }}
      </div>
      <div class="winning-option" v-if="winningOption[roundIndex]">
        Winning Option: {{ winningOption[roundIndex] }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [], 
      roundOptions: [
        ["boyhood", "cutie pie", "horror maze", "summer"],
        ["cutiness", "bright light", "boyz", "travel"],
        ["school uniform", "boy uniform", "night horrors", "campy"],
        ["cute dress", "bones and all", "bright room", "horror scene"]
      ],
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
    tokensToSpend(user, option) {
      if (this.matchesPreference(user, option)) {
        return Math.min(user.tokens, Math.floor(Math.random() * 10) + 1);
      } else {
        if (Math.random() < 0.5) return 0;
        return 1;
      }
    },
    weightedChoice(user, options) {
      let weighted = [];
      options.forEach(opt => {
        const weight = this.matchesPreference(user, opt) ? 5 : 1;
        for (let i = 0; i < weight; i++) weighted.push(opt);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    },
    showResults(roundIndex) {
      let total = 0;
      let votesPerOption = {};

      this.users.forEach(user => {
        if (user.tokens <= 0) return;

        const choice = this.weightedChoice(user, this.roundOptions[roundIndex]);
        const spend = this.tokensToSpend(user, choice);
        total += spend;
        user.tokens -= spend;

        let reason = spend === 0
          ? "User hasn't cast a vote"
          : this.matchesPreference(user, choice)
          ? `Preference match (${user.preference} in ${choice})`
          : "Voted randomly";

        if (spend === 0) {
          console.log(`Round ${roundIndex + 1} | ${user.username} hasn't cast a vote`);
        } else {
          console.log(
            `Round ${roundIndex + 1} | ${user.username} voted for "${choice}" | Tokens: ${spend} | Reason: ${reason}`
          );
        }

        if (!votesPerOption[choice]) votesPerOption[choice] = 0;
        votesPerOption[choice] += spend;
      });

      const sortedOptions = Object.entries(votesPerOption).sort((a, b) => b[1] - a[1]);
      const winner = sortedOptions.length ? sortedOptions[0][0] : null;

      this.totalTokens = { ...this.totalTokens, [roundIndex]: total };
      this.winningOption = { ...this.winningOption, [roundIndex]: winner };
    }
  },
  mounted() {
    this.fetchUsers();
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
