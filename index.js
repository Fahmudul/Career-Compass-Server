const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello From CareerCompass");
});
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
    // Get single job data
    app.get("/allJobsCategory/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(typeof id);
      const query = { _id: new ObjectId(id) };
      const result = await allCategoryJobCollection.findOne(query);
      res.send(result);
    });
    // Get my jobs
    app.get("/myPostedJobs", async (req, res) => {
      // console.log(req.query.email)
      const email = req.query.email;
      const filter = { ownerEmail: email };
      const result = await allCategoryJobCollection.find(filter).toArray();
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
      console.log(id);
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
    // get applied applicants list
    app.get("/appliedApplicants", async (req, res) => {
      const email = req.query.email;
      const filter = { email };
      const result = await appliedJobsApplicantCollection
        .find(filter)
        .toArray();
      res.send(result);
    });
    // Delete my posted job
    app.delete("/myPostedJobs/:id", async (req, res) => {
      console.log(req.params.id);
      console.log("deleted");
    });
    // update myposted job data
    app.patch("/myPostedJobs/:id", async (req, res) => {
      console.log(req.params.id);
      console.log("updated");
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
