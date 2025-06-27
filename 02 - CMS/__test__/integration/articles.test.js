const request = require("supertest");
const app = require("../../src/server");
const mongoose = require("mongoose");

describe("Articles Test", () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Create a test user before running tests
    await request(app).post("/api/v1/register").send({
      username: "testuser",
      email: "abc@gmail.com",
      password: "123",
    });
  });

  afterAll(async () => {
    // Clean up the database after tests
    const User = require("../../src/model/user");
    await User.deleteOne({ email: "abc@gmail.com" });
    await mongoose.connection.close();
  });

  test("Should not get articles", async () => {
    const response = await request(app).get("/api/v1/articles");
    expect(response.statusCode).toBe(401);
  });

  test("Should get all articles", async () => {
    const token = await request(app).post("/api/v1/login").send({
      email: "abc@gmail.com",
      password: "123",
    });
    expect(token.body.token).toBeDefined();

    const response = await request(app)
      .get("/api/v1/articles")
      .set("authorization", "Bearer " + token.body.token);
    expect(response.statusCode).toBe(200);
  });
});
