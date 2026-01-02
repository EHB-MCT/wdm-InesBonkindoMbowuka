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
let Quizzes;

async function connectDB() {
	try {
		
		await client.connect();

		console.log("Connected to MongoDB");

		db = client.db("Voting");
		Users = db.collection("Users");
		Quizzes = db.collection("Quizzes");

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

app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  console.log("User selected:", username);

  try {
    const user = await Users.findOne(
      { username: new RegExp(`^${username}$`, "i") },
      { projection: { password: 0 } }
    );

    if (!user) {
      console.log("User not found:", username);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.username);
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

app.post("/store/buy", async (req, res) => {
  const { username, packId } = req.body;

  const tokenPacks = {
    small: { tokens: 5, price: 5 },
    medium: { tokens: 15, price: 12 },
    large: { tokens: 40, price: 30 }
  };

  const pack = tokenPacks[packId];
  if (!pack) {
    return res.status(400).json({ error: "Invalid pack" });
  }

  try {
    const user = await Users.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.money < pack.price) {
      return res.status(400).json({ error: "Not enough money" });
    }

    await Users.updateOne(
      { username },
      {
        $inc: {
          money: -pack.price,
          tokens: pack.tokens
        }
      }
    );

    res.json({
      message: "Purchase successful",
      packId,
      tokensGained: pack.tokens,
      moneySpent: pack.price
    });

  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: "Server error during purchase" });
  }
});


app.post("/vote", async (req, res) => {
  const { username, quizId, round, option, tokensSpent } = req.body;

  if (!username || quizId == null || round == null || option == null || tokensSpent == null) {
    return res.status(400).json({ error: "Missing vote data" });
  }
  try {
    const user = await Users.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.tokens<tokensSpent) {
      return res.status(400).json({ error: "Not enough tokens" });
    }

	const updateFields = {
      $inc: { tokens: -tokensSpent },
      $push: {
        VotedFor: {
          quizId,
          round,
          option,
          tokensSpent,
          timestamp: new Date()
        }
      }
    };

    if (user.tokens - tokensSpent <= 10) {
      updateFields.$inc.money = 10;
    }


    await Users.updateOne({ username }, updateFields);
	
    await Quizzes.updateOne(
      { id: quizId },
      {
        $inc: { "results.totalTokens": tokensSpent },
        $push: {
          "results.votes": {
            username,
            round,
            option,
            tokensSpent,
            timestamp: new Date()
          }
        }
      }
    );
    res.json({ message: "Vote recorded" , tokens: user.tokens, money: user.money  });

  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Server error during vote" });
  }
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const admin = await Users.findOne({ username: "admin" });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", admin: { username: admin.username } });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/quizzes", async (req, res) => {
  try {
    const quizzesCollection = db.collection("Quizzes");
    const quizzes = await quizzesCollection.find().toArray();
    res.json(quizzes);
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

app.post("/quizzes", async (req, res) => {
  const { title, rounds, startTime, endTime } = req.body;

  const lastQuiz = await Quizzes.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = lastQuiz.length ? lastQuiz[0].id + 1 : 1;

  const newQuiz = {
  id: nextId,
  title,
  rounds,
  startTime: startTime ? new Date(startTime) : new Date(),
  endTime: endTime
    ? new Date(endTime)
    : new Date(Date.now() + 1000 * 60 * 60),
  createdAt: new Date(),
  results: {
    totalTokens: 0,
    votes: []
  }
};

  await Quizzes.insertOne(newQuiz);
  res.json({ message: "Quiz created", quiz: newQuiz });
});

app.post("/users/giveTokens", async (req, res) => {
  try {
    const allUsers = await Users.find({}).toArray();
    const bulkOps = allUsers.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { tokens: 1000 } }
      }
    }));

    if (bulkOps.length > 0) {
      await Users.bulkWrite(bulkOps);
    }
    res.json({ message: "All users now have 1000 tokens!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/quizzes/active", async (req, res) => {
  try {
    const now = new Date();

    const activeQuizzes = await Quizzes.find({
      startTime: { $lte: now },
      endTime: { $gte: now }
    }).toArray();

    res.json(activeQuizzes);
  } catch (err) {
    console.error("Error fetching active quizzes:", err);
    res.status(500).json({ error: "Failed to fetch active quizzes" });
  }
});

app.put("/quizzes/:id", async (req, res) => {
  const quizId = parseInt(req.params.id);
  const { title, rounds, startTime, endTime } = req.body;

  const result = await db.collection("Quizzes").updateOne(
    { id: quizId },
    { $set: { title, rounds, startTime: new Date(startTime), endTime: new Date(endTime) } }
  );
});

app.delete("/quizzes/:id", async (req, res) => {
  const quizId = parseInt(req.params.id);

  try {
    const result = await db.collection("Quizzes").deleteOne({ id: quizId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({ message: "Quiz deleted" });
  } catch (err) {
    console.error("Error deleting quiz:", err);
    res.status(500).json({ error: "Server error deleting quiz" });
  }
});

app.use(express.static(path.join(__dirname, "public")));

connectDB().then(async () => {
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
});

/*setInterval(async () => {
  try {
    const allUsers = await Users.find({ username: { $ne: "admin" } }).toArray();

    const roundOptions = [
      ["boyhood", "cutie pie", "horror maze", "summer"],
      ["cutiness", "bright light", "boyz", "travel"],
      ["school uniform", "boy uniform", "night horrors", "campy"],
      ["cute dress", "bones and all", "bright room", "horror scene"]
    ];

    const tokenPacks = {
      small: { tokens: 5, price: 5 },
      medium: { tokens: 15, price: 12 },
      large: { tokens: 40, price: 30 }
    };

    for (const user of allUsers) {

      roundOptions.forEach(async (options, roundIndex) => {
        if (user.tokens > 0) { 
          const choice = options[Math.floor(Math.random() * options.length)];
          const tokensToSpend = Math.min(user.tokens, Math.floor(Math.random() * 10) + 1);

          await Users.updateOne(
            { _id: user._id },
            {
              $push: { VotedFor: { round: roundIndex + 1, choice, tokensSpent: tokensToSpend } },
              $inc: { tokens: -tokensToSpend }
            }
          );

          console.log(`User ${user.username} voted for "${choice}" in round ${roundIndex + 1}, spent ${tokensToSpend} tokens`);
        }
      });

      if (Math.random() < user.spendingProbability && user.money > 0) {
        const affordable = Object.entries(tokenPacks)
          .filter(([id, pack]) => pack.price <= user.money);

        if (affordable.length > 0) {
          const [packId, pack] = affordable[Math.floor(Math.random() * affordable.length)];

          await Users.updateOne(
            { _id: user._id },
            { $inc: { money: -pack.price, tokens: pack.tokens } }
          );

          console.log(`User ${user.username} bought ${packId} pack for $${pack.price}, gaining ${pack.tokens} tokens`);
        }
      }
    }
  } catch (err) {
    console.error("Error simulating dummy users:", err);
  }
}, 60000);*/









//code made to generate 50 users in my dabatase.
/*async function generateUsers(numUsers = 50) {
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
		//await generateUsers(50);
}*/


//update users data 
/*async function updateUsers() {
  try {
    if (!Users) throw new Error("Users collection not initialized");

    const allUsers = await Users.find().toArray();

    for (const user of allUsers) {
      const update = {};

      if (user.money === undefined) update.money = Math.floor(Math.random() * 50) + 20;
      if (user.spendingProbability === undefined) update.spendingProbability = +(Math.random() * 0.5 + 0.25).toFixed(2);
      if (user.VotedFor === undefined) update.VotedFor = [];

      if (Object.keys(update).length > 0) {
        await Users.updateOne({ _id: user._id }, { $set: update });
      }
    }

    console.log("All users updated with new fields where necessary");
  } catch (err) {
    console.error("Error updating users:", err);
  }
	//await updateUsers();
}*/