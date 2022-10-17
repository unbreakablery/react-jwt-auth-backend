const express = require("express");
const database = require("../models/users.js");
const ObjectId = require("mongodb").ObjectId;
const api = express.Router();
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

api.post("/signup", async (req, res) => {
  try {
    console.log(req.body.email);
    console.log(req.body.password);
    const { email, password, confirm_password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        message: "Need your email and password to sign up!",
      });
    }
    if (password != confirm_password) {
      return res.status(400).send({
        message: "Not matched password and confirmation!",
      });
    }

    //check if email already registered
    const db = await (await database.getDb()).collection;
    const result = await db.findOne({email: email});
    if (result && result._id != null) {
      return res.status(400).send({
        message: "Email was already registered!",
      });
    }
            
    bcrypt.hash(password, saltRounds, async function(err, hash) {
      const user = {
        email: email,
        password: hash,
      };
        
      const createdUser = await db.insertOne(user);
      return res.send({
        id: createdUser.insertedId,
        message: "You were signed up successfully!",
      });
    });
  } catch (err) {
    return res.status(500).send({
      message: "Server Error: " + err.message,
    });
  }
});

api.get("/signin", async (req, res) => {
  try {
    const { email, password } = req.query;
    if (!email || !password)  {
      return res.status(400).send({
        message: "Need your email and password to login!",
      });
    }

    const db = await (await database.getDb()).collection;
    const result = await db.findOne({email: email});
    if (!result || (result && result._id == null)) {
      return res.status(400).send({
        message: "User not found!",
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      result.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    var token = jwt.sign({ id: result._id }, secret, {
      expiresIn: '30m' // 86400 for 24 hours
    });

    return res.status(200).send({
      id: result._id,
      email: result.email,
      accessToken: token
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      message: "server error: " + err.message,
    });
  }
});

api.get("/", async (req, res) => {
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
