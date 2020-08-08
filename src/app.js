const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

app.use(express.json())     // automatically pass incoming JSON to an object so we can access it in out request handlers
app.use(userRouter)
app.use(taskRouter)

module.exports = app