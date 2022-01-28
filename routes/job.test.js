"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token
  } = require("./_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);


  /********************POST /jobs */

  describe("POST /jobs", function () {
    const newJob = {
      title: "partner service coordinator",
      salary: 46000,
      equity: 1,
      company_handle: "c1"
    };
  
    test("job is created sucessfully with appropriate data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "partner service coordinator",
            salary: 46000,
            equity: "1",
            company_handle: "c1"
        }
      });
    });
  
    test("bad request with missing data, failed to create", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "partner service coordinator",
            salary: 46000,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data, failed to create", async function () {
      const resp = await request(app)
          .post("/companies")
          .send({
            title: 5800,
            salary: "1400",
            equity: "1",
            company_handle: 500
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("fail: user is not admin, cannot create a company", async function(){
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  /***********************GET /jobs */



  /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;
      const resp = await request(app).get(`/jobs/${jobId}`);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "guest services",
            salary: 48000,
            equity: "0",
            company_handle: "c1"
        },
      });
    });

    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/12345`);
      expect(resp.statusCode).toEqual(404);
    });
  });


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for users", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;  
      const resp = await request(app)
          .patch(`/jobs/${jobId}`)
          .send({
            title: "software engineer",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "software engineer",
            salary: 48000,
            equity: "0",
            company_handle: "c1"
        },
      });
    });
  
    test("unauth for anon", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;   
      const resp = await request(app)
          .patch(`/jobs/${jobId}`)
          .send({
            title: "software engineer",
          });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/12345`)
          .send({
            title: "software engineer",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on handle change attempt", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;   
      const resp = await request(app)
          .patch(`/jobs/${jobId}`)
          .send({
            id: 45,
            company_handle: "evolve "
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id; 
      const resp = await request(app)
          .patch(`/jobs/${jobId}`)
          .send({
            title: 4528451,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("fail: user is not admin, cannot update the company", async function(){
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id; 
      const resp = await request(app)
          .patch(`/jobs/${jobId}`)
          .send({
            salary: 65000,
          })
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });
  
  /************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;  
      const resp = await request(app)
          .delete(`/jobs/${jobId}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({ deleted: `Job id ${jobId}` });
    });
  
    test("unauth for anon", async function () {
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id;    
      const resp = await request(app)
          .delete(`/jobs/${jobId}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such company", async function () {
      const resp = await request(app)
          .delete(`/jobs/123456`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("fail: user is not admin, cannot delete the company", async function(){
      const mockJob = await db.query(`
        SELECT *
        FROM jobs 
        WHERE title = 'guest services'`);
      const jobId = mockJob.rows[0].id; 
      const resp = await request(app)
          .delete(`/jobs/${jobId}`)
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });