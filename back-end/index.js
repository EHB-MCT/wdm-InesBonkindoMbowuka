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
let StorePacks;
let Purchases;


async function connectDB() {
	try {
		
		await client.connect();

		console.log("Connected to MongoDB");

		db = client.db("Voting");
		Users = db.collection("Users");
		Quizzes = db.collection("Quizzes");
		StorePacks = db.collection("StorePacks");
	 	Purchases = db.collection("Purchases"); 


	} catch (err) {
		console.error("Error connecting to MongoDB:", err);
	}
}

app.get("/test", (req, res) => {
	res.send("Server is working");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const user = await Users.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { _id, money, tokens } = user;
    const role = username.toLowerCase() === "admin" ? "admin" : "user";

    res.json({
      message: "Login successful",
      user: { _id, username, money, tokens, role }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
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

  try {
    const user = await Users.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const pack = await StorePacks.findOne({ _id: new ObjectId(packId) });
    if (!pack) return res.status(400).json({ error: "Pack not found" });

    if (user.money < pack.price) {
      return res.status(400).json({ error: "Not enough money" });
    }

    await Users.updateOne(
      { username },
      { $inc: { money: -pack.price, tokens: pack.tokens } }
    );

    await Purchases.insertOne({
      username,
      packId: pack._id,
      packName: pack.name,
      tokens: pack.tokens,
      moneySpent: pack.price,
      timestamp: new Date()
    });

    res.json({
      message: "Purchase successful",
      tokensGained: pack.tokens,
      moneySpent: pack.price
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during purchase" });
  }
});

app.get("/store/packs", async (req, res) => {
  try {
    const packs = await StorePacks.find().toArray();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/store/packs", async (req, res) => {
  const { name, tokens, price } = req.body;

  try {
    const result = await StorePacks.insertOne({ name, tokens, price });
    res.json({
      message: "Pack created",
      pack: { _id: result.insertedId, name, tokens, price }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/store/packs/:id", async (req, res) => {
  const id = req.params.id;
  const { name, tokens, price } = req.body;
  try {
    await StorePacks.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, tokens, price } }
    );
    res.json({ message: "Pack updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/store/packs/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await StorePacks.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Pack deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/store/purchases/recent", async (req, res) => {
  try {
    const recent = await Purchases.find().sort({ timestamp: -1 }).limit(20).toArray();
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: err.message });
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