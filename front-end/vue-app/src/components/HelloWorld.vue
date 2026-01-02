<template>
	<div class="quiz-container">
		<section>
			<h2>Ongoing Quizzes</h2>
			<div v-for="quiz in activeQuizzes" :key="quiz.id" class="quiz-block">
				<h3>{{ quiz.title }}</h3>
				<div v-for="(round, rIndex) in quiz.rounds" :key="rIndex" class="round">
					<h4>Round {{ rIndex + 1 }}</h4>
					<div v-for="(option, oIndex) in round" :key="oIndex" class="option">
						<label>
							<input type="radio" :name="'quiz-' + quiz.id + '-round-' + rIndex" :value="option" v-model="userVotes[quiz.id][rIndex]" />
							{{ option }}
						</label>
					</div>
					<input type="number" v-model.number="tokensToSpendByUser[quiz.id][rIndex]" placeholder="Tokens to spend" min="1" />
					<button @click="submitAdminVote(quiz.id, rIndex)">Vote</button>
					<p>Total Tokens Spent: {{ totalTokens[quiz.id]?.[rIndex] || 0 }}</p>
					<p>Winning Option: {{ winningOption[quiz.id]?.[rIndex] || "—" }}</p>
				</div>
			</div>
		</section>
	</div>
</template>
<script>
export default {
	data() {
		return {
			users: [],
			activeQuizzes: [],
			totalTokens: {},
			winningOption: {},
			userVotes: {},
			tokensToSpendByUser: {},
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
				bright: /bright/i,
			};
			return preferencePatterns[user.preference].test(option);
		},

		async fetchQuizzes() {
			try {
				const res = await fetch("http://localhost:5000/quizzes/active");
				this.activeQuizzes = await res.json();
				this.initVoteObjects();
			} catch (err) {
				console.error("Failed to fetch quizzes:", err);
			}
		},

		initVoteObjects() {
			this.activeQuizzes.forEach((quiz) => {
				if (!this.userVotes[quiz.id]) this.userVotes[quiz.id] = {};
				if (!this.tokensToSpendByUser[quiz.id]) this.tokensToSpendByUser[quiz.id] = {};
				quiz.rounds.forEach((round, rIndex) => {
					if (this.userVotes[quiz.id][rIndex] === undefined) this.userVotes[quiz.id][rIndex] = null;
					if (this.tokensToSpendByUser[quiz.id][rIndex] === undefined) this.tokensToSpendByUser[quiz.id][rIndex] = 0;
				});
			});
		},
		async submitAdminVote(quizId, roundIndex) {
			const option = this.userVotes[quizId][roundIndex];
			const tokens = this.tokensToSpendByUser[quizId][roundIndex];

			if (!option || !tokens || tokens <= 0) return alert("Select an option and enter tokens!");
			if (tokens > this.currentUser.tokens) return alert("Not enough tokens!");

			const round = this.activeQuizzes.find((q) => q.id === quizId).rounds[roundIndex];
			const optionIndex = round.indexOf(option);
			this.currentUser.tokens -= tokens;
			await fetch("http://localhost:5000/vote", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: this.currentUser.username,
					quizId,
					round: roundIndex,
					option: optionIndex,
					tokensSpent: tokens,
				}),
			});
			if (!this.totalTokens[quizId]) this.totalTokens[quizId] = {};
			if (!this.winningOption[quizId]) this.winningOption[quizId] = {};

			this.totalTokens[quizId][roundIndex] = (this.totalTokens[quizId][roundIndex] || 0) + tokens;

			const votesPerOption = {};
			this.users.forEach((u) => {
				u.VotedFor?.forEach((v) => {
					if (v.quizId === quizId && v.round === roundIndex) {
						votesPerOption[v.option] = (votesPerOption[v.option] || 0) + v.tokensSpent;
					}
				});
			});
			votesPerOption[optionIndex] = (votesPerOption[optionIndex] || 0) + tokens;

			const winnerIndex = Number(Object.entries(votesPerOption).sort((a, b) => b[1] - a[1])[0][0]);
			this.winningOption[quizId][roundIndex] = round[winnerIndex];

			alert(`Voted for "${option}" spending ${tokens} tokens`);
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
					tokensSpent,
				}),
			});

			const data = await res.json();
			console.log("Vote response:", data);
		},

		weightedChoice(user, options) {
			let weighted = [];
			options.forEach((opt) => {
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
						tokensSpent: spend,
					}),
				});

				console.log(`[VOTE] Quiz: ${quiz.title} (${quiz.id}) | Round: ${roundIndex + 1} ${user.username} voted for "${choice}" (option ${optionIndex}) Tokens spent: ${spend} `);

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
		},

		async simulateVoting(quiz, roundIndex) {
			for (const user of this.users) {
				if (user.tokens <= 0) continue;
				const options = quiz.rounds[roundIndex];
				const choice = this.weightedChoice(user, options);
				const optionIndex = options.indexOf(choice);
				const spend = this.tokensToSpend(user, choice);
				if (spend <= 0) continue;

				const delay = this.voteDelay(user, choice);
				await new Promise((resolve) => setTimeout(resolve, delay));

				await fetch("http://localhost:5000/vote", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						username: user.username,
						quizId: quiz.id,
						round: roundIndex,
						option: optionIndex,
						tokensSpent: spend,
					}),
				});
				console.log(`[VOTE] ${user.username} voted "${choice}" in ${Math.round(delay)}ms (spent ${spend})`);
			}
			await this.showResults(quiz, roundIndex);
		},

		voteDelay(user, option) {
			if (this.matchesPreference(user, option)) {
				return Math.random() * 400 + 100;
			}
			return Math.random() * 2000 + 1000;
		},
	},

	async mounted() {
		const saved = localStorage.getItem("currentUser");
		if (saved) this.currentUser = JSON.parse(saved);
		await this.fetchUsers();
		await this.fetchQuizzes();

		for (const quiz of this.activeQuizzes) {
			quiz.rounds.forEach((_, roundIndex) => {
				setTimeout(() => {
					this.simulateVoting(quiz, roundIndex);
				}, Math.random() * 5000);
			});
		}
	},
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
