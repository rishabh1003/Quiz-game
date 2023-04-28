// Set up a Node.js app with Express
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const session = require("express-session");
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Set up a database connection (for example, using Mongoose)
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/myDatabase");

// Define a schema for the questions
const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  answer: Number,
});

// Create a model for the questions
const Question = mongoose.model("Question", questionSchema);

// Endpoint for adding new questions to the database
app.post("/questions", async (req, res) => {
  const question = new Question(req.body);
  console.log(req.body);
  await question.save();
  res.send(question);
});

app.get("/quiz", async (req, res) => {
  // Retrieve five random questions from the database
  const questions = await Question.aggregate([{ $sample: { size: 5 } }]);

  // Render the quiz page
  res.render("index", { questions });
});

app.get("/quiz/submit", async (req, res) => {
  let score = 0;
  for (let i = 0; i < 5; i++) {
    const answer = parseInt(req.query["answer" + i]);
    const question = await Question.findOne().skip(i);
    if (answer === question.answer) {
      score++;
    }
  }
  res.redirect("/score?score=" + score);
});

app.get("/quiz/:questionIndex", async (req, res) => {
  const questionIndex = parseInt(req.params.questionIndex);
  const answer = parseInt(req.query.answer);

  // Retrieve the question from the database
  const question = await Question.findOne().skip(questionIndex);

  // Check if the answer is correct and update the score
  let score = req.session.score || 0;
  if (answer === question.answer) {
    score++;
    req.session.score = score;
  }

  console.log(req.session.score);
  // If all questions have been answered, redirect to the score page
  if (questionIndex === 4) {
    res.redirect("/score");
  } else {
    res.redirect("/quiz/" + (questionIndex + 1));
  }
});

app.get("/score", (req, res) => {
  const score = req.session.score;
  delete req.session.score;
  console.log(score);
  // Render the score page
  res.render("score", { score: score || 3 });
});

app.set("view engine", "ejs");
app.set("views", "./view");

// Start the server
app.listen(5050, () => console.log("Server started"));
