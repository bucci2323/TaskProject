const passcode = async (req, res, next) => {
  try {
    if (req.user.passcode !== req.body.passcode) {
      throw new Error("unable to login!!!!");
    }
    next();
  } catch (e) {
    res.status(401).send({ error: "Invalid Passcode" });
  }
};
module.exports = passcode;
