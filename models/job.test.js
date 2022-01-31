"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const filters = {
  title: "guest",
  minSalary: 30000,
  hasEquity: "false",
};

/******************************** create */

describe("create a job", function () {
  const newJob = {
    title: "owner support",
    salary: 35000,
    equity: 0,
    company_handle: "c1",
  };

  test("the job is created", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "owner support",
      salary: 35000,
      equity: "0",
      company_handle: "c1",
    });
    const result = await db.query(
      `SELECT *
            FROM jobs
            WHERE title = 'owner support'`
    );
    expect(result.rows).toEqual([
      {
        id: result.rows[0].id,
        title: "owner support",
        salary: 35000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("create duplicate job will raise error", async function () {
    try {
      await Job.create({
        title: "guest service",
        salary: 32000,
        equity: 0,
        company_handle: "c1",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/*******************find all jobs */

describe("find all jobs", function () {
  test("find all jobs in db with no filter", async function () {
    const allJobs = await Job.findAll({});
    expect(allJobs).toEqual([
      {
        id: allJobs[0].id,
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by title, minSalary, and hasEquity", async function () {
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by title, minSalary, and !hasEquity", async function () {
    let jobs = await Job.findAll({
      title: "guest",
      minSalary: 30000,
      hasEquity: "true",
    });
    expect(jobs).toEqual([]);
  });

  test("works: filter by title and minSalary", async function () {
    let jobs = await Job.findAll({
      title: "guest",
      minSalary: 30000,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by title and hasEquity", async function () {
    let jobs = await Job.findAll({
      title: "guest",
      hasEquity: "true",
    });
    expect(jobs).toEqual([]);
  });

  test("works: filter by title and !hasEquity", async function () {
    let jobs = await Job.findAll({
      title: "guest",
      hasEquity: "false",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by minSalary and hasEquity", async function () {
    let jobs = await Job.findAll({
      minSalary: 30000,
      hasEquity: "true",
    });
    expect(jobs).toEqual([]);
  });

  test("works: filter by minSalary and !hasEquity", async function () {
    let jobs = await Job.findAll({
      minSalary: 30000,
      hasEquity: "false",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by title", async function () {
    let jobs = await Job.findAll({ title: "guest" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by minSalary", async function () {
    let jobs = await Job.findAll({ minSalary: 30000 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: filter by hasEquity", async function () {
    let jobs = await Job.findAll({ hasEquity: "true" });
    expect(jobs).toEqual([]);
  });

  test("works: filter by !hasEquity", async function () {
    let jobs = await Job.findAll({ hasEquity: "false" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "guest service",
        salary: 32000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("not work: filter by inappropriate filter name", async function () {
    try {
      await Job.findAll({ hello: "world" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/******************* get a job*/

describe("get a job by title, salary, comp_handle, equity", function () {
  test("works: show the job that matches", async function () {
    const jobResponse = await db.query(`
            SELECT id 
            FROM jobs
            WHERE title = 'guest service'`);
    const jobId = jobResponse.rows[0].id;

    const job = await Job.get(jobId);
    expect(job).toEqual({
      id: job.id,
      title: "guest service",
      salary: 32000,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("fail: search with no such job", async function () {
    try {
      await Job.get(1800);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/*******************update a job */

describe("update the job details", function () {
  const updateData = {
    title: "cx analyst",
    salary: 50000,
    equity: 0,
  };

  test("can update with the data", async function () {
    const jobResponse = await db.query(`
            SELECT id 
            FROM jobs
            WHERE title = 'guest service'`);
    const jobId = jobResponse.rows[0].id;
    const job = await Job.update(jobId, updateData);
    expect(job).toEqual({
      id: jobId,
      title: "cx analyst",
      salary: 50000,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("update non-existent job", async function () {
    try {
      const job = await Job.update(123456, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("cannot update with no data", async function () {
    try {
      await Job.update(12345, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/***************Delete a job */

describe("delet a job", function () {
  test("delete successfully", async function () {
    const jobResponse = await db.query(`
            SELECT id 
            FROM jobs
            WHERE title = 'guest service'`);
    const jobId = jobResponse.rows[0].id;
    await Job.remove(jobId);
    const res = await db.query(`SELECT * FROM jobs WHERE id=${jobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("cannot delete, job does not exist", async function () {
    try {
      await Job.remove(123456);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});