const express = require('express')
const router = express.Router()
const controller = require('../Controller/groupController')
const jwtMiddleware = require('../Middleware/jwtMiddleware')

router.post('/create-group',jwtMiddleware,controller.createGroup)
router.get('/get-all-groups/:id',jwtMiddleware,controller.getUserGroups)

module.exports = router
