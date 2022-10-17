const express = require("express");
const database = require("../models/comments.js");
const docDB = require("../models/docs.js");
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

async function checkDoc(req, res, next) {
  const docId = req.body?.docId;

  if (!docId) {
    return res.status(400).send({
      message: "Need doc id in json body!",
    });
  }

  const db = await (await docDB.getDb()).collection;

  const result = await db.findOne({ _id: ObjectId(docId) });
  if (!result || (result && result._id == null)) {
    return res.status(400).send({
      message: "Document not found!",
    });
  }

  next();
}

api.post("/comment", 
  (req, res, next) => checkToken(req, res, next),
  (req, res, next) => checkDoc(req, res, next),
  async (req, res) => {
    try {
      const { docId, author, comment } = req.body;
      if (!author || !comment) {
        return res.status(400).send({
          message: "Please send author and comment in json body",
        });
      }
      const commentObj = {
        docId: ObjectId(docId),
        author,
        comment
      };
      const db = await (await database.getDb()).collection;

      await db.insertOne(commentObj);
      return res.send({
        message: "Comment has been saved successfully",
      });
    } catch (err) {
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.put("/comment", 
  (req, res, next) => checkToken(req, res, next),
  (req, res, next) => checkDoc(req, res, next),
  async (req, res) => {
    try {
      const { id, docId, author, comment } = req.body;
      if (!id || !author || !comment) {
        return res.status(400).send({
          message: "Please send comment id, author and comment in json body!",
        });
      }

      const filter = { _id: ObjectId(id) };

      const db = await (await database.getDb()).collection;

      const result = await db.findOne(filter);

      if (!result || (result && result._id == null)) {
        return res.status(400).send({
          message: "Comment not found!",
        });
      }

      if (result.author !== author) {
        return res.status(400).send({
          message: "You have not permission for this comment.",
        });
      }

      await db.updateOne(filter, {
        $set: { docId, author, comment },
      });

      return res.send({
        message: "Comment has been updated successfully",
      });
    } catch (err) {
      console.log("err", err);
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.get("/comment", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const docId = req.query?.docId;
    if (!docId) {
      return res.status(400).send({
        message: "Need doc id in query",
      });
    }

    try {
      const db = await database.getDb();
      const resultSet = await db.collection.find({docId: ObjectId(docId)}).toArray();

      return res.send(resultSet);
    } catch (err) {
      console.log("err", err);
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

api.delete("/comment", 
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).send({
          message: "Need id in json body",
        });
      }
      
      const db = await (await database.getDb()).collection;

      const result = await db.findOne({_id: ObjectId(id)});

      if (!result || (result && result._id == null)) {
        return res.status(400).send({
          message: "Comment not found!",
        });
      }

      await db.deleteOne({_id: ObjectId(id)});
      return res.send({
        message: `Comment has been deleted successfully!`,
      });
    } catch (err) {
      return res.status(500).send({
        message: "server error",
      });
    }
  }
);

module.exports = api;
