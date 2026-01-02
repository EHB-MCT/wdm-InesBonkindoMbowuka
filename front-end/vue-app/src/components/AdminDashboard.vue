<template>
    <div>
        <h1>Admin Dashboard</h1>

        <div v-if="!admin">
            <p>Loading admin...</p>
        </div>

        <div v-else>
            <p>Welcome, {{ admin.username }}</p>
            <button @click="logout">Logout</button>
            <button @click="giveAllUsersTokens">Give All Users 1000 Tokens</button>

            <div class="tabs">
                <button :class="{ active: page === 'quizzes' }" @click="page = 'quizzes'">Quizzes</button>
                <button :class="{ active: page === 'users' }" @click="page = 'users'">Users</button>
                <button :class="{ active: page === 'stats' }" @click="page = 'stats'">Quiz Management</button>
                <button :class="{ active: page === 'store' }" @click="page = 'store'">Store Management</button>
                <button :class="{ active: page === 'visual' }" @click="page = 'visual'">User Visualization</button>
            </div>

            <div v-show="page === 'quizzes'">
                <section>
                    <h2>Create Quiz</h2>
                    <input v-model="newQuiz.title" placeholder="Quiz Title" />
                    <div class="time-inputs">
                        <label>
                            Start Time:
                            <input type="datetime-local" :value="toDateTimeLocal(newQuiz.startTime)" @input="newQuiz.startTime = $event.target.value" />

                            <button type="button" @click="newQuiz.startTime = ''">Reset</button>
                        </label>

                        <label>
                            End Time:
                            <input type="datetime-local" :value="toDateTimeLocal(newQuiz.endTime)" @input="newQuiz.endTime = $event.target.value" />
                            <button type="button" @click="resetEndTime">Reset</button>
                        </label>
                    </div>
                    <div v-for="(round, rIndex) in newQuiz.rounds" :key="rIndex" class="round">
                        <h4>Round {{ rIndex + 1 }}</h4>
                        <div v-for="(option, oIndex) in round.options" :key="oIndex" class="option">
                            <input v-model="round.options[oIndex]" placeholder="Option text" />
                            <button @click="removeOption(rIndex, oIndex)">Remove Option</button>
                        </div>
                        <button @click="addOption(rIndex)">Add Option</button>
                        <button @click="removeRound(rIndex)">Remove Round</button>
                    </div>

                    <button @click="addRound">Add Round</button>
                    <button @click="createQuiz">Create Quiz</button>
                </section>

                <section>
                    <section>
                        <h2>Ongoing Quizzes</h2>
                        <div v-for="quiz in activeQuizzes" :key="quiz.id" class="quiz-item">
                            <div v-if="editingQuiz && editingQuiz.id === quiz.id">
                                <input v-model="editingQuiz.title" placeholder="Quiz Title" />
                                <div class="time-inputs">
                                    <label>
                                        Start Time:
                                        <input type="datetime-local" :value="toDateTimeLocal(editingQuiz.startTime)" @input="editingQuiz.startTime = $event.target.value" />
                                    </label>
                                    <label>
                                        End Time:
                                        <input type="datetime-local" :value="toDateTimeLocal(editingQuiz.endTime)" @input="editingQuiz.endTime = $event.target.value" />
                                    </label>
                                </div>
                                <div v-for="(round, rIndex) in editingQuiz.rounds" :key="rIndex" class="round">
                                    <h4>Round {{ rIndex + 1 }}</h4>

                                    <div v-for="(option, oIndex) in round.options" :key="oIndex" class="option">
                                        <input v-model="round.options[oIndex]" placeholder="Option text" />
                                        <button type="button" @click="removeEditOption(rIndex, oIndex)">Remove Option</button>
                                    </div>

                                    <button type="button" @click="addEditOption(rIndex)">Add Option</button>
                                    <button type="button" @click="removeEditRound(rIndex)">Remove Round</button>
                                </div>

                                <button type="button" @click="addEditRound">Add Round</button>
                                <button type="button" @click="saveQuiz(editingQuiz.id)">Save Changes</button>
                                <button type="button" @click="cancelEdit">Cancel</button>
                            </div>

                            <div v-else>
                                <h3>{{ quiz.title }} (ID: {{ quiz.id }})</h3>
                                <p>Start: {{ quiz.startTime || "—" }} | End: {{ quiz.endTime || "—" }}</p>

                                <div v-for="(round, rIndex) in quiz.rounds" :key="rIndex" class="round">
                                    <h4>Round {{ rIndex + 1 }}</h4>
                                    <ul>
                                        <li v-for="option in round.options" :key="option">{{ option }}</li>
                                    </ul>
                                </div>
                                <button @click="startEdit(quiz)">Edit</button>
                                <button @click="deleteQuiz(quiz.id)">Delete</button>
                            </div>
                        </div>
                    </section>
                </section>
            </div>

            <div v-show="page === 'users'">
                <section>
                    <h2>All Users</h2>
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Tokens</th>
                                <th>Tokens Spent</th>
                                <th>Top 3 Most Spent On</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in rankedUsers" :key="user._id">
                                <td>{{ user.username }}</td>
                                <td>{{ user.tokens }}</td>
                                <td>{{ user.totalSpent }}</td>
                                <td>
                                    <ul>
                                        <li v-for="option in user.topOptions" :key="option">{{ option }}</li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>
            <div v-show="page === 'stats'">
                <section>
                    <h2>Active Quiz</h2>

                    <div v-if="quizzes.length === 0">
                        <p>No quizzes available</p>
                    </div>
                    <div v-else>
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Current amount of Tokens spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="quiz in activeQuizzes" :key="quiz.id">
                                    <td>{{ quiz.title }}</td>
                                    <td>{{ tokensSpentForQuiz(quiz.id) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section>
                    <h2>Past Results</h2>

                    <div v-if="quizzes.length === 0">
                        <p>No quizzes available</p>
                    </div>

                    <div v-else>
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Quiz ID</th>
                                    <th>Name Quiz</th>
                                    <th>Top 3 Voters</th>
                                    <th>Winner</th>
                                    <th>Total tokens spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="quiz in pastQuizzes" :key="quiz.id">
                                    <td>{{ quiz.id }}</td>
                                    <td>{{ quiz.title }}</td>
                                    <td>
                                        <ul>
                                            <li v-for="user in topSpendersForQuiz(quiz.id)" :key="user.username">{{ user.username }} ({{ user.spent }})</li>
                                        </ul>
                                    </td>

                                    <td>{{ winningOptionForQuiz(quiz.id) }}</td>
                                    <td>{{ tokensSpentForQuiz(quiz.id) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <section>
                <div v-show="page === 'store'">
                    <section>
                        <h2>Store Packs</h2>

                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Tokens</th>
                                    <th>Price</th>
                                    <th>Times Bought</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="pack in storePacks" :key="pack._id">
                                    <td v-if="editingPack && editingPack._id === pack._id">
                                        <input v-model="editingPack.name" />
                                    </td>
                                    <td v-else>{{ pack.name }}</td>

                                    <td v-if="editingPack && editingPack._id === pack._id">
                                        <input type="number" v-model.number="editingPack.tokens" />
                                    </td>
                                    <td v-else>{{ pack.tokens }}</td>

                                    <td v-if="editingPack && editingPack._id === pack._id">
                                        <input type="number" v-model.number="editingPack.price" />
                                    </td>
                                    <td v-else>{{ pack.price }}</td>

                                    <td>{{ packPurchaseCount(pack._id) }}</td>

                                    <td>
                                        <template v-if="editingPack && editingPack._id === pack._id">
                                            <button @click="savePack">Save</button>
                                            <button @click="editingPack = null">Cancel</button>
                                        </template>

                                        <template v-else>
                                            <button @click="startEditPack(pack)">Edit</button>
                                            <button @click="deletePack(pack._id)">Delete</button>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2>Create New Pack</h2>
                        <input v-model="newPack.name" placeholder="Pack Name" />
                        <input type="number" v-model.number="newPack.tokens" placeholder="Tokens" />
                        <input type="number" v-model.number="newPack.price" placeholder="Price" />
                        <button @click="createPack">Create Pack</button>
                    </section>
                </div>
            </section>
            <div v-show="page === 'visual'">
                <h2>User Behavior Visualization</h2>
                <select v-model="selectedUsername" @change="loadProfile">
                    <option disabled value="">Select user</option>
                    <option v-for="u in users" :key="u._id" :value="u.username">
                        {{ u.username }}
                    </option>
                </select>
                <div style="display: flex; align-items: flex-start; gap: 20px; margin-top: 20px">
                    <canvas ref="canvas" width="600" height="400" style="border: 1px solid #ccc"></canvas>

                    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6">
                        <div style="display: flex; align-items: center; gap: 5px">
                            <div style="width: 20px; height: 20px; background-color: #4488ff"></div>
                            Voted randomly
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px">
                            <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid #44ff88; transform: rotate(180deg)"></div>
                            Voted for Preference
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px">
                            <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #ff4444"></div>
                            Voted for something they disliked
                        </div>
                    </div>
                </div>
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
            newQuiz: { title: "", startTime: "", endTime: "", rounds: [{ options: [""] }] },
            editingQuiz: null,
            storePacks: [],
            purchases: [],
            newPack: { name: "", tokens: 0, price: 0 },
            editingPack: null,
            selectedUsername: "",
            selectedProfile: null,
        };
    },
    mounted() {
        const stored = localStorage.getItem("admin");
        if (!stored) this.$router.push("/AdminLogin");
        else {
            this.admin = JSON.parse(stored);
            this.fetchQuizzes();
            this.fetchUsers();
            this.fetchStorePacks();
            this.fetchPurchases();
        }
    },
    methods: {
        logout() {
            localStorage.removeItem("admin");
            this.$router.push("/AdminLogin");
        },

        async giveAllUsersTokens() {
            try {
                const res = await fetch("http://localhost:5000/users/giveTokens", { method: "POST" });
                const data = await res.json();
                console.log(data.message);
                await this.fetchUsers();
            } catch (err) {
                console.error(err);
            }
        },
        async fetchQuizzes() {
            try {
                const res = await fetch("http://localhost:5000/quizzes");
                const data = await res.json();
                this.quizzes = data.map((q) => ({
                    ...q,
                    rounds: q.rounds.map((r) => ({ options: r })),
                }));
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

        async fetchStorePacks() {
            const res = await fetch("http://localhost:5000/store/packs");
            this.storePacks = await res.json();
        },

        async fetchPurchases() {
            const res = await fetch("http://localhost:5000/store/purchases/recent");
            this.purchases = await res.json();
        },

        packPurchaseCount(packId) {
            return this.purchases.filter((p) => p.packId === packId).length;
        },

        startEditPack(pack) {
            if (!pack._id) return console.error("Pack has no id");
            this.editingPack = { ...pack };
        },

        async savePack() {
            if (!this.editingPack) return;

            try {
                const res = await fetch(`http://localhost:5000/store/packs/${this.editingPack._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.editingPack),
                });

                if (res.ok) {
                    this.storePacks = this.storePacks.map((p) => (p._id === this.editingPack._id ? { ...this.editingPack } : p));
                    this.editingPack = null;
                } else {
                    const data = await res.json();
                    console.error(data.error || "Failed to save pack");
                }
            } catch (err) {
                console.error(err);
            }
        },

        async createPack() {
            try {
                const res = await fetch("http://localhost:5000/store/packs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.newPack),
                });

                const data = await res.json();
                if (res.ok) {
                    this.storePacks.push(data.pack);
                    this.newPack = { name: "", tokens: 0, price: 0 };
                } else {
                    console.error(data.error || "Failed to create pack");
                }
            } catch (err) {
                console.error(err);
            }
        },

        async deletePack(id) {
            if (!confirm("Delete this pack?")) return;

            try {
                const res = await fetch(`http://localhost:5000/store/packs/${id}`, {
                    method: "DELETE",
                });

                if (res.ok) {
                    this.storePacks = this.storePacks.filter((p) => p._id !== id);
                } else {
                    console.error("Failed to delete pack");
                }
            } catch (err) {
                console.error(err);
            }
        },

        totalTokensSpent(user) {
            if (!user.VotedFor) return 0;
            return user.VotedFor.reduce((sum, v) => sum + (v.tokensSpent || 0), 0);
        },

        addStartTime() {
            this.newQuiz.startTime = "";
        },

        resetEndTime() {
            this.newQuiz.endTime = "";
        },

        updateStartTime(event) {
            this.newQuiz.startTime = event.target.value;
        },

        updateEndTime(event) {
            this.newQuiz.endTime = event.target.value;
        },

        toDateTimeLocal(isoString) {
            if (!isoString) return "";
            const date = new Date(isoString);
            const pad = (n) => n.toString().padStart(2, "0");
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        },

        toISOStringLocal(dateTimeLocal) {
            if (!dateTimeLocal) return null;

            return dateTimeLocal || null;
        },

        addRound() {
            this.newQuiz.rounds.push({ options: [""] });
        },

        removeRound(rIndex) {
            this.newQuiz.rounds.splice(rIndex, 1);
        },

        addOption(rIndex) {
            this.newQuiz.rounds[rIndex].options.push("");
        },

        removeOption(rIndex, oIndex) {
            this.newQuiz.rounds[rIndex].options.splice(oIndex, 1);
        },

        drawPainting(user) {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext("2d");

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
                let rot = (Math.PI / 2) * 3;
                let x = cx;
                let y = cy;
                let step = Math.PI / spikes;

                ctx.beginPath();
                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outerRadius;
                    y = cy + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = cx + Math.cos(rot) * innerRadius;
                    y = cy + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(cx, cy - outerRadius);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
            }

            const votes = Array.isArray(user.VotedFor) ? user.VotedFor : [];

            votes.forEach((vote) => {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = 8;
                const optionText = (vote.option ?? "").toString();
                const preference = (user.preference ?? "").toString();

                if (optionText.toLowerCase().includes(preference.toLowerCase())) {
                    drawStar(x, y, 5, radius, radius / 2, "#44ff88");
                } else if (Math.random() < user.dislikeProbability) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = "#ff4444";
                    ctx.fill();
                } else {
                    ctx.fillStyle = "#4488ff";
                    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
                }
            });
        },
        async loadProfile() {
            if (!this.selectedUsername) return;

            const res = await fetch(`http://localhost:5000/users/${this.selectedUsername}`);
            const profile = await res.json();

            if (profile.error) {
                console.warn("User not found:", this.selectedUsername);
                return;
            }

            console.log("Loaded profile:", profile);
            this.drawPainting(profile);
        },
        async createQuiz() {
            try {
                const payload = {
                    title: this.newQuiz.title,
                    startTime: this.toISOStringLocal(this.newQuiz.startTime),
                    endTime: this.toISOStringLocal(this.newQuiz.endTime),
                    rounds: this.newQuiz.rounds.map((r) => r.options),
                };
                const res = await fetch("http://localhost:5000/quizzes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (res.ok) {
                    this.quizzes.push({
                        ...data.quiz,
                        rounds: data.quiz.rounds.map((r) => ({ options: r })),
                    });
                    this.newQuiz = { title: "", startTime: "", endTime: "", rounds: [{ options: [""] }] };
                    alert("Quiz created successfully!");
                } else console.error(data.error);
            } catch (err) {
                console.error(err);
            }
        },

        deleteQuiz(id) {
            fetch(`http://localhost:5000/quizzes/${id}`, { method: "DELETE" })
                .then((res) => {
                    if (res.ok) this.quizzes = this.quizzes.filter((q) => q.id !== id);
                })
                .catch(console.error);
        },

        startEdit(quiz) {
            this.editingQuiz = {
                id: quiz.id,
                title: quiz.title,
                startTime: quiz.startTime,
                endTime: quiz.endTime,
                rounds: quiz.rounds.map((r) => ({ options: [...r.options] })),
            };
        },

        addEditRound() {
            this.editingQuiz.rounds.push({ options: [""] });
        },

        removeEditRound(rIndex) {
            this.editingQuiz.rounds.splice(rIndex, 1);
        },

        addEditOption(rIndex) {
            this.editingQuiz.rounds[rIndex].options.push("");
        },

        removeEditOption(rIndex, oIndex) {
            this.editingQuiz.rounds[rIndex].options.splice(oIndex, 1);
        },

        cancelEdit() {
            this.editingQuiz = null;
        },

        async saveQuiz(id) {
            try {
                const payload = {
                    title: this.editingQuiz.title,
                    startTime: this.toISOStringLocal(this.editingQuiz.startTime),
                    endTime: this.toISOStringLocal(this.editingQuiz.endTime),
                    rounds: this.editingQuiz.rounds.map((r) => r.options),
                };
                const res = await fetch(`http://localhost:5000/quizzes/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (res.ok) {
                    this.quizzes = this.quizzes.map((q) =>
                        q.id === id
                            ? {
                                    ...q,
                                    title: payload.title,
                                    startTime: payload.startTime,
                                    endTime: payload.endTime,
                                    rounds: payload.rounds.map((r) => ({ options: r })),
                              }
                            : q
                    );
                    this.editingQuiz = null;
                    alert("Quiz saved successfully!");
                } else console.error(data.error);
            } catch (err) {
                console.error(err);
            }
        },

        getOptionText(quizId, roundIndex, optionIndex) {
            const quiz = this.quizzes.find((q) => q.id === quizId);
            if (!quiz) return "—";

            const round = quiz.rounds[roundIndex];
            if (!round || !round.options) return "—";

            return round.options[optionIndex] ?? "—";
        },
        tokensSpentForQuiz(quizId) {
            let total = 0;

            this.users.forEach((user) => {
                if (!user.VotedFor) return;

                user.VotedFor.forEach((vote) => {
                    if (vote.quizId === quizId) {
                        total += vote.tokensSpent || 0;
                    }
                });
            });

            return total;
        },

        winningOptionForQuiz(quizId) {
            const counts = {};

            this.users.forEach((user) => {
                if (!user.VotedFor) return;

                user.VotedFor.forEach((vote) => {
                    if (vote.quizId === quizId) {
                        const key = `${vote.round}-${vote.option}`;

                        counts[key] = (counts[key] || 0) + (vote.tokensSpent || 0);
                    }
                });
            });

            let winningKey = null;
            let max = 0;

            for (const key in counts) {
                if (counts[key] > max) {
                    max = counts[key];
                    winningKey = key;
                }
            }

            if (!winningKey) return "—";

            const [roundIndex, optionIndex] = winningKey.split("-").map(Number);

            return this.getOptionText(quizId, roundIndex, optionIndex);
        },
        topSpendersForQuiz(quizId) {
            const spenders = this.users
                .filter((u) => u.VotedFor)
                .map((u) => {
                    const spent = u.VotedFor.filter((v) => v.quizId === quizId).reduce((sum, v) => sum + (v.tokensSpent || 0), 0);
                    return { username: u.username, spent };
                })
                .filter((u) => u.spent > 0)
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 3);
            return spenders;
        },

        spendTokens(user, amount) {
            if (!user.tokens) user.tokens = 0;
            user.tokens -= amount;
            if (user.tokens < 0) user.tokens = 0;
        },

        checkTokenTopUp(user, threshold = 10, topUpAmount = 100) {
            if (user.tokens <= threshold) {
                user.money += topUpAmount;
            }
        },

        top3Options(user) {
            if (!user.VotedFor) return [];

            const counts = {};

            user.VotedFor.forEach((vote) => {
                if (vote.quizId == null || vote.round == null || vote.option == null) return;

                const optionText = this.getOptionText(vote.quizId, vote.round, vote.option);

                if (optionText === "—") return;

                counts[optionText] = (counts[optionText] || 0) + (vote.tokensSpent || 0);
            });

            return Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([option]) => option);
        },
    },

    computed: {
        activeQuizzes() {
            const now = new Date();
            return this.quizzes.filter((q) => {
                const start = q.startTime ? new Date(q.startTime) : null;
                const end = q.endTime ? new Date(q.endTime) : null;
                return (!start || start <= now) && (!end || end > now);
            });
        },
        pastQuizzes() {
            const now = new Date();
            return this.quizzes.filter((q) => {
                if (!q.endTime) return false;
                return new Date(q.endTime) <= now;
            });
        },

        rankedUsers() {
            return [...this.users]
                .map((u) => ({
                    ...u,
                    totalSpent: this.totalTokensSpent(u),
                    topOptions: this.top3Options(u),
                }))
                .sort((a, b) => b.totalSpent - a.totalSpent);
        },
    },
};
</script>

<style scoped>
.tabs {
    margin: 20px 0;
}
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

.quiz-item {
    border: 1px solid #ccc;
    padding: 10px;
    margin-bottom: 10px;
}
.round {
    margin-bottom: 10px;
}
.option {
    display: flex;
    gap: 5px;
    margin-bottom: 5px;
}

.users-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}
.users-table th,
.users-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
}
.users-table th {
    background-color: #f0f0f0;
}
.users-table tbody tr:nth-child(even) {
    background-color: #fafafa;
}
</style>
