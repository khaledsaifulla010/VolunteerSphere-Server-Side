const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// Middlewares //

app.use(cors());
app.use(express.json());

// Server Running //

app.get("/", (req, res) => {
  res.send("VolunteerSphere Server is Running");
});

app.listen(port, () => {
  console.log(`VolunteerSphere Server is Running on ${port}`);
});
