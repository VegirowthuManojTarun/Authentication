const express = require('express')
const path = require('path')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'userData.db')
const bcrypt = require('bcrypt')

app.use(express.json())
let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
initDbAndServer()

//api1
app.post('/register', async (request, response) => {
  const userInfo = request.body
  const {username, name, password, gender, location} = userInfo
  const userQuery = `
  SELECT * FROM user
  WHERE username = '${username}'
  ;`
  const dbUser = await db.get(userQuery)
  //console.log(dbUser)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const insertUserQuery = `
      INSERT INTO user
      VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
      )
      ;`
      await db.run(insertUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//api2
app.post('/login', async (request, response) => {
  const loginDetails = request.body
  const {username, password} = loginDetails
  const isInQuery = `
  SELECT * FROM user
  WHERE username = '${username}'
  ;`
  const dbInUser = await db.get(isInQuery)
  //console.log(dbUser)
  if (dbInUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordEqual = await bcrypt.compare(password, dbInUser.password)
    if (isPasswordEqual) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})


//api3
app.put('/change-password', async (request, response) => {
  const newPasswordDetails = request.body
  const {username, oldPassword, newPassword} = newPasswordDetails
  const userCheckQuery = `
  SELECT * FROM user
  WHERE username = '${username}'
  ;`
  const dbUser = await db.get(userCheckQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordEqual = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordEqual) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const passwordUpdateQuery = `
              UPDATE user
              SET password = "${hashedPassword}"
              WHERE username = "${username}"
            ;`
        await db.run(passwordUpdateQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

app.get('/users/', async (request, response) => {
  const getUsersQuery = `SELECT * FROM user;`
  const users = await db.all(getUsersQuery)
  response.send(users)
})

module.exports = app