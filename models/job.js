"use strict";
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */
  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
      `SELECT *
        FROM jobs 
        WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
      [title, salary, equity, company_handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job at ${company_handle}: ${title}`);

    const result = await db.query(
      `INSERT INTO jobs
         (title, salary, equity, company_handle)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];

    return job;
  }

  /**
   * find all jobs in DB
   *
   * RETURN [{id, title, salary...}, {id, title, salaray}]
   */
  static async findAll(filters) {
    const filterNames = Object.keys(filters);
    /**check if the req.query/filters has any key that is
     * not either title, minSalary, hasEquity */
    for (const name of filterNames) {
      if (!["title", "minSalary", "hasEquity"].includes(name)) {
        throw new BadRequestError("Cannot include inappropriate filter");
      }
    }

    /**filtered by all three filters - title, minSalary, hasEquity */
    if (filters.title && filters.minSalary && filters.hasEquity === "true") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          AND salary >= ${parseInt(filters.minSalary)} 
          AND equity != 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by all three filters - title, minSalary, !hasEquity */
    if (filters.title && filters.minSalary && filters.hasEquity === "false") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          AND salary >= ${parseInt(filters.minSalary)} 
          AND equity = 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by title and minSalary */
    if (filters.title && filters.minSalary) {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          AND salary >= ${parseInt(filters.minSalary)} 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by title and hasEquity */
    if (filters.title && filters.hasEquity === "true") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          AND equity != 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by title and !hasEquity */
    if (filters.title && filters.hasEquity === "false") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          AND equity = 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by minSalary and hasEquity */
    if (filters.minSalary && filters.hasEquity === "true") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE salary >= ${parseInt(filters.minSalary)}
          AND equity != 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by minSalary and !hasEquity */
    if (filters.minSalary && filters.hasEquity === "false") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE salary >= ${parseInt(filters.minSalary)}
          AND equity = 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filtered by title */
    if (filters.title) {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE title ILIKE '%${filters.title}%' 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filter by minSalary */
    if (filters.minSalary) {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE salary >= ${parseInt(filters.minSalary)}
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filter by hasEquity */
    if (filters.hasEquity === "true") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE equity != 0.000
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    /**filter by !hasEquity */
    if (filters.hasEquity === "false") {
      const jobsRes = await db.query(
        `SELECT *
          FROM jobs
          WHERE equity = 0.000 
          ORDER BY title`
      );
      return jobsRes.rows;
    }

    const jobResponse = await db.query(`
      SELECT * 
      FROM jobs
      ORDER BY title`);
    return jobResponse.rows;
  }

  static async get(id) {
    const jobResponse = await db.query(
      `SELECT * 
        FROM jobs
        WHERE id = $1`,
      [id]
    );

    const job = jobResponse.rows[0];

    if (!job) throw new NotFoundError("Job not found");

    return job;
  }

  /***
   * Update the job details using id
   *
   * return {id, title, salary, ....}
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const querySql = `UPDATE jobs
        SET ${setCols}
        WHERE id = ${id}
        RETURNING id, title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError("Job not found");
    return job;
  }

  /**
   * Delete the job by id
   *
   */
  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError("Job not found");
  }
}

module.exports = Job;