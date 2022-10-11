const request = require("supertest");
const initServer = require('../../index')
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = initServer();

describe('product', () => {

    beforeAll(async () => {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri())
    })

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoose.connection.close();
    })

    describe('testing routes', () => {
        describe("post route '/doc'", () => {

            test("should respond with status code 200", async () => {
                const response = await request(app).post("/doc").send(
                    { name: "john doe", html: "<a></a>" }
                )
                expect(response.statusCode).toBe(200)
            })

            test("should respond with status code 400 when name is not defined", async () => {
                const response = await request(app).post("/doc").send(
                    { html: "<a></a>" }
                )
                expect(response.statusCode).toBe(400)
            })

            test("should specify json in the content type heaser", async () => {
                const response = await request(app).post("/doc").send(
                    { name: "john doe", html: "<div>text inside div.</div" }
                )
                expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            })
        })

        describe("get route '/doc'", () => {

            test("should respond with status code 200", async () => {
                const response = await request(app).get("/doc")
                expect(response.statusCode).toBe(200)
            })
        })
    });

})
