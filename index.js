const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middlewares //

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// VERIFY TOKEN //

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unothorized User Access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unothorized User Access" });
    }
    req.user = decoded;
    next();
  });
};

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
    // AUTH RELATED APIS //

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    const VolunteerNeedsNowCollections = client
      .db("VolunteerSphere")
      .collection("VolunteerNeedsNow");

    const NewsBlogsCollections = client
      .db("VolunteerSphere")
      .collection("NewsBlogs");

    const AllVolunteerNeedsPostsCollections = client
      .db("VolunteerSphere")
      .collection("AllVolunteerNeedsPosts");

    const AllVolunteersCollections = client
      .db("VolunteerSphere")
      .collection("AllVolunteers");

    // GET VOLUNTEER NEEDS NOW DATA //

    app.get("/volunteerNeedsNow", async (req, res) => {
      const cursor = VolunteerNeedsNowCollections.find().sort({ deadline: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET A VOLUNTEER NEEDS NOW DATA //

    app.get("/volunteerNeedsNow/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await VolunteerNeedsNowCollections.findOne(query);

      res.send(result);
    });

    // GET NEWS & BLOGS DATA //

    app.get("/newsBlogs", async (req, res) => {
      const cursor = NewsBlogsCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET ALL VOLUNTEER NEEDS POST DATA //

    app.get("/allVolunteerNeedsPosts", async (req, res) => {
      const result = await AllVolunteerNeedsPostsCollections.find().toArray();
      res.send(result);
    });

    // GET A SINGLE VOLUNTEER NEEDS POST DATA //

    app.get("/allVolunteerNeedsPosts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllVolunteerNeedsPostsCollections.findOne(query);
      res.send(result);
    });

    // GET ALL VOLUNTEER NEEDS POST DATA INDIVIDUAL USER EMAIL //

    app.get(
      "/allVolunteerNeedsPostsIndividually",
      verifyToken,
      async (req, res) => {
        const email = req.query.email;
        const query = { organizerEmail: email };
        if (req.user.email !== req.query.email) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        const result = await AllVolunteerNeedsPostsCollections.find(
          query
        ).toArray();
        res.send(result);
      }
    );

    // GET ALL VOLUNTEERS POST DATA //

    app.get("/allVolunteers", async (req, res) => {
      const result = await AllVolunteersCollections.find().toArray();
      res.send(result);
    });

    // GET ALL VOLUNTEERS POST DATA INDIVIDUAL USER EMAIL//

    app.get("/allVolunteersRequestDataIndividually", async (req, res) => {
      const email = req.query.email;
      const query = { volunteerEmail: email };
      const result = await AllVolunteersCollections.find(query).toArray();
      res.send(result);
    });

    // POST ALL VOLUNTEER NEEDS POST DATA
    app.post("/allVolunteerNeedsPosts", async (req, res) => {
      const newVolunteerNeedsPost = req.body;
      const result = await AllVolunteerNeedsPostsCollections.insertOne(
        newVolunteerNeedsPost
      );
      res.send(result);
    });

    // POST A VOLUNTEER DATA //

    app.post("/allVolunteers", async (req, res) => {
      const newVolunteer = req.body;
      const result = await AllVolunteersCollections.insertOne(newVolunteer);

      if (result.insertedId) {
        const updatedPost = await AllVolunteerNeedsPostsCollections.updateOne(
          { _id: new ObjectId(newVolunteer.postId) },
          { $inc: { volunteersNeeded: -1 } }
        );
        res.send({
          updatedPost,
        });
      }
    });

    // UPDATE A VOLUNTEER NEEDS POST DATA //

    app.put("/allVolunteerNeedsPosts/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedVolunteerNeedPost = req.body;

      const newVolunteerPost = {
        $set: {
          thumbnail_URL: updatedVolunteerNeedPost.thumbnail_URL,
          post_title: updatedVolunteerNeedPost.post_title,
          description: updatedVolunteerNeedPost.description,
          category: updatedVolunteerNeedPost.category,
          location: updatedVolunteerNeedPost.location,
          volunteersNeeded: updatedVolunteerNeedPost.volunteersNeeded,
          deadline: updatedVolunteerNeedPost.deadline,
        },
      };
      const result = await AllVolunteerNeedsPostsCollections.updateOne(
        filter,
        newVolunteerPost,
        options
      );
      res.send(result);
    });

    // DELETE A VOLUNTEER NEEDS POST DATA //

    app.delete("/allVolunteerNeedsPosts/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await AllVolunteerNeedsPostsCollections.deleteOne(query);
      res.send(result);
    });

    // DELETE A VOLUNTEER REQUEST POST DATA //

    app.delete("/allVolunteers/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await AllVolunteersCollections.deleteOne(query);
      res.send(result);
    });

    // FINALLY FINISH THE CODES //
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
