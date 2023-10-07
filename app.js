const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "userData.db");
let db = null;

const initializationDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializationDBandServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptPassword = await bcrypt.hash(password, 10);
  const selectUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbresponse = await db.get(selectUser);

  if (dbresponse === undefined) {
    const insertIntoUser = `INSERT INTO user (username, name, password, gender, location)
                                VALUES ('${username}','${name}','${encryptPassword}','${gender}','${location}')`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const runTable = await db.run(insertIntoUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbresponse = await db.get(selectUser);

  if (dbresponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbresponse.password);
    if (comparePassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  console.log(oldPassword);
  const selectUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbresponse = await db.get(selectUser);
  console.log(dbresponse);
  if (dbresponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(
      oldPassword,
      dbresponse.password
    );
    if (comparePassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `UPDATE user SET password = '${encryptPassword}'`;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
