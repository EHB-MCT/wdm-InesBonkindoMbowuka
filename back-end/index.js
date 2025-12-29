require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const path = require("path");
app.use(cors());
app.use(express.json());
const port = process.env.PORT;
const url = process.env.MONGO_URL;
const client = new MongoClient(url);
const { ObjectId } = require("mongodb");

let db;
let Users;

async function generateUsers(numUsers = 50) {
	try {
		const Users = db.collection("Users");
		const categories = ["cute", "boyish", "horror", "bright"];
		const users = [];

		for (let i = 0; i < numUsers; i++) {
			const tokens = Math.floor(Math.random() * 10) + 1;
			const baseSpeed = Math.floor(Math.random() * 5) + 1;
			const likeProbability = +(Math.random() * 0.5 + 0.5).toFixed(2);
			const dislikeProbability = +(Math.random() * 0.5).toFixed(2);

			users.push({
				username: `User${i + 1}`,
				password: "test123",
				tokens,
				baseSpeed,
				preference: categories[Math.floor(Math.random() * categories.length)],
				likeProbability,
				dislikeProbability,
				VotedFor: [],
			});
		}

		const result = await Users.insertMany(users);
		console.log(`Inserted ${result.insertedCount} users`);
	} catch (err) {
		console.error("Error generating users:", err);
	}
}

async function connectDB() {
	try {
		const client = new MongoClient(url);
		await client.connect();

		console.log("Connected to MongoDB");

		db = client.db("Voting");
		Users = db.collection("Users");
	} catch (err) {
		console.error("Error connecting to MongoDB:", err);
	}
}

app.get("/test", (req, res) => {
	res.send("Server is working");
});

app.get("/users", async (req, res) => {
	try {
		const data = await Users.find().toArray();
		res.json(data);
	} catch (err) {
		res.status(500).json({ error: "DB error" });
	}
});

app.use(express.static(path.join(__dirname, "public")));

connectDB().then(async () => {
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
	await generateUsers(50);
});

/*let users = [
	{ id: 1, name: "Ines", tokens: 5, preference: "cute", baseSpeed: 3 },
	{ id: 2, name: "Kenza", tokens: 3, preference: "boyish", baseSpeed: 2 },
	{ id: 3, name: "Chaima", tokens: 7, preference: "horror", baseSpeed: 4 },
	{ id: 4, name: "Filsan", tokens: 6, preference: "bright", baseSpeed: 3 },
	{ id: 5, name: "Khadija", tokens: 4, preference: "cute", baseSpeed: 2 },
	{ id: 6, name: "Hajar", tokens: 8, preference: "boyish", baseSpeed: 5 },
	{ id: 7, name: "Soundous", tokens: 2, preference: "horror", baseSpeed: 3 },
	{ id: 8, name: "Moussa", tokens: 5, preference: "bright", baseSpeed: 4 },
	{ id: 9, name: "Lisa", tokens: 3, preference: "cute", baseSpeed: 2 },
	{ id: 10, name: "Houriya", tokens: 6, preference: "boyish", baseSpeed: 1 },
];

const roundOptions = [
	["boyhood", "cutie pie", "horror maze", "summer"],
	["cutiness", "bright light", "boyz", "travel"],
	["school uniform", "boy uniform", "night horrors", "campy"],
	["cute dress", "bones and all", "bright room", "horror scene"],
];

const preferencePatterns = {
  cute: /cute/i,       
  boyish: /boy/i,      
  horror: /horror/i,    
  bright: /bright/i   
};

function matchesPreference(user, option) {
  return preferencePatterns[user.preference].test(option);
}


function tokensToSpend(user, option) {
  if (matchesPreference(user, option)) {
    return Math.min(user.tokens, Math.floor(Math.random() * 3) + 1);
  } else {
    if (Math.random() < 0.5) return 0;
    return 1;
  }
}

function weightedChoice(user, options) {
  let weighted = [];
  options.forEach(opt => {
    let weight = matchesPreference(user, opt) ? 5 : 1; 
    for (let i = 0; i < weight; i++) weighted.push(opt);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

const quizDiv = document.getElementById("quiz");
roundOptions.forEach((options, i) => {
	const qDiv = document.createElement("div");
	qDiv.className = "question";
	qDiv.id = `question-${i}`;

	const qTitle = document.createElement("h2");
	qTitle.textContent = `Question ${i + 1}`;
	qDiv.appendChild(qTitle);

	options.forEach((option) => {
		const optDiv = document.createElement("div");
		optDiv.className = "option";
		optDiv.textContent = option;
		qDiv.appendChild(optDiv);
	});

	const totalDiv = document.createElement("div");
	totalDiv.className = "totalTokens";
	totalDiv.id = `total-${i}`;
	qDiv.appendChild(totalDiv);

	quizDiv.appendChild(qDiv);
});

function showResults() {
	const simUsers = users.map((u) => ({ ...u })); 
	let votesLog = []; 

	roundOptions.forEach((options, roundIndex) => {
		let totalTokens = 0;

		simUsers.forEach((user) => {
			if (user.tokens <= 0) return;

			const choice = weightedChoice(user, options);
			const spend = tokensToSpend(user, choice);
			totalTokens += spend;
			user.tokens -= spend;

			let reason = "";
			if (spend === 0) {
				reason = "User hasn't cast a vote";
			} else if (matchesPreference(user, choice)) {
				reason = `Strong preference match ("${user.preference}" found in "${choice}")`;
			} else {
				reason = "No preference match, voted randomly";
			}

			votesLog.push({
				round: roundIndex + 1,
				user: user.name,
				choice: spend === 0 ? null : choice,
				tokensSpent: spend,
				reason: reason
			});
		});

		const totalDiv = document.getElementById(`total-${roundIndex}`);
		totalDiv.textContent = `Total Tokens Spent: ${totalTokens}`;
	});

	console.log("User Votes");
	votesLog.forEach((vote) => {
		if (vote.tokensSpent === 0) {
			console.log(`Round ${vote.round} | ${vote.user} hasn't cast a vote`);
		} else {
			console.log(
				`Round ${vote.round} | ${vote.user} voted for "${vote.choice}" | Tokens Spent: ${vote.tokensSpent} | Reason: ${vote.reason}`
			);
		}
	});
}

document.getElementById("showResultsBtn").addEventListener("click", showResults);*/
