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
}*/



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
}*/



connectDB().then(async () => {
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
	//await updateUsers();
	//await generateUsers(50);
});