const express = require('express')
const app = express()
const server = require('http').Server(app)
const cors = require('cors')

// const Scrapper = require('./app/Scrapper')
// const userName = process.argv.indexOf('-s') > -1 ? process.argv[3] :  process.argv[2]
// const postsNumber = process.argv.indexOf('-s') > -1 ? process.argv[4] :  process.argv[3]

// const scrap = new Scrapper(userName)

app.use(cors())
app.use(require('./app/routes/routes'))

server.listen(3333)

// process.argv.indexOf('-s') > -1 ? 
//   scrap.static().catch(error => console.error(error)) : 
//   scrap.dynamic(postsNumber).catch(error => console.error(error))