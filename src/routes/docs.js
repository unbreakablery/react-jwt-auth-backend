const express = require("express");
const database = require("../models/docs.js");
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
      const { html, name } = req.body;
      if (!html || !name) {
        return res.status(400).send({
          message: "Please send name and html in json body",
        });
      }
      const doc = {
        name,
        html,
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
      const { html, name, id } = req.body;
      if (!html || !name || !id) {
        return res.status(400).send({
          message: "Please send name and html and id in json body",
        });
      }

      const filter = { _id: ObjectId(id) };

      const db = await (await database.getDb()).collection;

      await db.updateOne(filter, {
        $set: { name, html },
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

module.exports = api;
