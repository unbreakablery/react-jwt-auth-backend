const express = require("express");
const database = require("../models/docs.js");
const commentDB = require("../models/comments.js");
const ObjectId = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");
const api = express.Router();
const secret = process.env.JWT_SECRET;

function checkToken(req, res, next) {
  const token = req.headers['x-access-token'];
  
  jwt.verify(token, secret, function(err, decoded) {
      if (err) {
        return res.status(400).send({
          message: "Invaild token!",
        });
      }

      // Valid token send on the request
      next();
  });
}

api.post("/doc", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    try {
      const { html, type, name, author } = req.body;
      if (!html || !type || !name || !author) {
        return res.status(400).send({
          message: "Need name, type, html and author",
        });
      }
      const doc = {
        type,
        name,
        html,
        author
      };
      const db = await (await database.getDb()).collection;

      await db.insertOne(doc);
      return res.send({
        message: "Document has been saved successfully",
      });
    } catch (err) {
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.put("/doc", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    try {
      const { html, name, id, author, type } = req.body;
      if (!html || !type || !name || !id || !author) {
        return res.status(400).send({
          message: "Please send doc id, name, html and author in json body!",
        });
      }

      const filter = { _id: ObjectId(id) };

      const db = await (await database.getDb()).collection;

      const result = await db.findOne(filter);

      if (!result || (result && result._id == null)) {
        return res.status(400).send({
          message: "Document not found!",
        });
      }

      if (result.author !== author) {
        return res.status(400).send({
          message: "You have not permission for this document - " + result.name,
        });
      }

      await db.updateOne(filter, {
        $set: { type, name, html },
      });

      return res.send({
        message: "Document has been updated successfully",
      });
    } catch (err) {
      console.log("err", err);
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.get("/doc", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    try {
      const db = await database.getDb();
      const resultSet = await db.collection.find({}).toArray();

      return res.send(resultSet);
    } catch (err) {
      console.log("err", err);
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.delete("/doc", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).send({
          message: "Please send id in json body",
        });
      }
      
      const db = await (await database.getDb()).collection;

      const result = await db.findOne({_id: ObjectId(id)});

      if (!result || (result && result._id == null)) {
        return res.status(400).send({
          message: "Document not found!",
        });
      }

      await db.deleteOne({_id: ObjectId(id)});

      //delete all comments associated with this document
      const cDb = await (await commentDB.getDb()).collection;
      await cDb.deleteMany({docId: ObjectId(id)});

      return res.send({
        message: `Document(${result.name}) has been deleted successfully!`,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

module.exports = api;
