const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello From CareerCompass");
});
// Verify token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("coming token from client", token);
  if (!token) {
    return res.status(401).send({ message: "unathorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decode;
    next();
  });
};

// MongoDB functionalities
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nkzn5jr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // Create new database with collection
    const allCategoryJobCollection = client
      .db("AllJobs")
      .collection("AllJobsCategory");
    const appliedJobsApplicantCollection = client
      .db("AllJobs")
      .collection("ApplicantsList");
    // Get All job information from database
    app.get("/allJobsCategory", async (req, res) => {
      const allJobsList = await allCategoryJobCollection.find().toArray();
      res.send(allJobsList);
    });

    // Token configuration and set cookie
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("email from jwt", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10d",
      });
      // console.log(token);
      res.cookie("token", token, cookieOptions).send({ success: true });
    });
    // clear cookie
    // app.post("/logout", async (req, res) => {
    //   console.log('email from logout',req.body)
    //   res
    //     .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    //     .send({ success: true });
    // });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { maxAge: 0, sameSite: "none", secure: true })
        .send({ success: true });
    });

    // Get single job data
    app.get("/allJobsCategory/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      // console.log(typeof id);
      const query = { _id: new ObjectId(id) };
      const result = await allCategoryJobCollection.findOne(query);
      res.send(result);
    });
    // Get my jobs
    app.get("/myPostedJobs", verifyToken, async (req, res) => {
      // console.log(req.query.email)
      const email = req.query.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const filter = { ownerEmail: email };
      const result = await allCategoryJobCollection.find(filter).toArray();
      res.send(result);
    });
    // routes for job summary page
    app.get("/appliedApplicantsDetails/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appliedJobsApplicantCollection.findOne(query);
      res.send(result);
    });
    // Add job information at mongoDB
    app.post("/allJobsCategory", async (req, res) => {
      const jobInfo = req.body;
      // console.log(jobInfo);
      const result = await allCategoryJobCollection.insertOne(jobInfo);
      res.send(result);
    });
    // increase applicant number
    app.patch("/allJobsCategory/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(req.body);
      const applicantInfo = req.body;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: {
          applicantNumber: 1,
        },
      };
      const result = allCategoryJobCollection.updateOne(filter, updateDoc);
      const appliedApplicant =
        appliedJobsApplicantCollection.insertOne(applicantInfo);
      res.send(result);
    });
    // update myposted job data
    app.post("/allJobsCategory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedInfo = req.body;
      // console.log(id, updatedInfo);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updatedInfo,
      };
      const result = await allCategoryJobCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    // get applied applicants list
    app.get("/appliedApplicants", verifyToken, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      console.log(req.user);
      if (email !== req.user.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const filter = { email };
      const result = await appliedJobsApplicantCollection
        .find(filter)
        .toArray();
      res.send(result);
    });
    // Delete my posted job
    app.delete("/myPostedJobs/:id", async (req, res) => {
      // console.log(req.params.id);
      // console.log("deleted");
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await allCategoryJobCollection.deleteOne(filter);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
