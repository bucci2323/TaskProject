const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const passcode = require("../middleware/passcode");

const mySchema = Joi.object().keys({
  passcode: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().email().required(),
});

const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();

    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET
    );
    user.tokens = user.tokens.concat({ token });

    await user.save();
    res.status(201).send({ user, token });
  } catch (e) {
    console.log("err is ", e);
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { error, value } = mySchema.validate(req.body);

    if (error) {
      throw new Error(error.details[0].message);
    }
    const user = await User.findOne({ email: value.email });

    if (!user || user.passcode !== value.passcode) {
      throw new Error("unable to login!!");
    }

    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) {
      throw new Error("Unable to login");
    }

    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET
    );

    user.tokens = user.tokens.concat({ token });

    await user.save();

    res.send({ user, token });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, passcode, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "passcode"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: " Inavalid Updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, passcode, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
