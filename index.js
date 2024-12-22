const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

// Middlewares //

app.use(cors());
app.use(express.json());


// Connect With MongoDB //

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ugbxhsw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
  } finally {
    
  }
}
run().catch(console.dir);

// Server Running //

app.get("/", (req, res) => {
  res.send("VolunteerSphere Server is Running");
});

app.listen(port, () => {
  console.log(`VolunteerSphere Server is Running on ${port}`);
});
