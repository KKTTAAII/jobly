"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");
const {
  ensureLoggedIn,
  authenticateAdmin,
  authenticateUserOrAdmin,
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 * Admin: yes
 **/

router.post(
  "/",
  ensureLoggedIn,
  authenticateAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const user = await User.register(req.body);
      const token = createToken(user);
      return res.status(201).json({ user, token });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 * Admin: yes
 **/

router.get(
  "/",
  ensureLoggedIn,
  authenticateAdmin,
  async function (req, res, next) {
    try {
      const users = await User.findAll();
      return res.json({ users });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get(
  "/:username",
  ensureLoggedIn,
  authenticateUserOrAdmin,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch(
  "/:username",
  ensureLoggedIn,
  authenticateUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 * Admin: yes
 **/

router.delete(
  "/:username",
  ensureLoggedIn,
  authenticateUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[username]/jobs/[id] => { applied: jobId }
 *
 * Authorization required: login
 * Authenticate: user or admin
 */
router.post(
  "/:username/jobs/:id",
  ensureLoggedIn,
  authenticateUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, id } = req.params;
      const userApplication = await User.apply(username, id);
      return res.json({ applied: userApplication.jobs.id });
    } catch (err) {
      if (err.code === "23505") {
        return next(new BadRequestError("already applied for this job", 400));
      }
      return next(err);
    }
  }
);

module.exports = router;