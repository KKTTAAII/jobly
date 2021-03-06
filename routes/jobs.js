"use strict";

/** routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, authenticateAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const router = new express.Router();

/**
 * POST / { job } => { job }
 *
 * job should return {id, title, salary, equity, company_handle}
 *
 */

router.post(
  "/",
  ensureLoggedIn,
  authenticateAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/**GET / =>
 * { jobs: [{title, salary, ...},...,...] }
 *
 * Can filter by:
 *  title,
 *  minSalary,
 *  hasEquity
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
  try {
    const filters = req.query;
    const jobs = await Job.findAll(filters);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /[id] => { job }
 *
 * job is { id, title, salary, equity, company_handle }
 *
 * Authorization required: none
 */
router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /[id] {inputdata1, inputdata2, ...} => { job }
 *
 * patches company data.
 *
 * fields can be: { title, salary, equity }
 *
 * returns { job }
 *
 * Authorization required: login
 * Admin: yes
 */
router.patch(
  "/:id",
  ensureLoggedIn,
  authenticateAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      if (req.body.id || req.body.company_handle) {
        throw new BadRequestError("restricted fields cannot be updated");
      }
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id] =>  { deleted: handle }
 *
 * Authorization: login
 * Admin: yes
 */
router.delete(
  "/:id",
  ensureLoggedIn,
  authenticateAdmin,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: `Job id ${req.params.id}` });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;