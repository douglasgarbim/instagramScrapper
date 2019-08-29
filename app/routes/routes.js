const MainController = require('../Controllers/MainController')
const express = require('express')

const routes = new express.Router()

routes.get('/dynamic/:user/:posts', MainController.dynamic)
routes.get('/static/:user', MainController.static)

module.exports = routes