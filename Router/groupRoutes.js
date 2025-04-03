const express = require('express')
const router = express.Router()
const controller = require('../Controller/groupController')
const jwtMiddleware = require('../Middleware/jwtMiddleware')
const upload = require('../Middleware/multerMiddleware')

router.post('/create-group',jwtMiddleware,controller.createGroup)
router.get('/get-all-groups/:id',jwtMiddleware,controller.getUserGroups)
router.get('/group-info/:id',jwtMiddleware,controller.groupInfo)
router.put('/group-add-user/:id',jwtMiddleware,controller.updateMembers)
router.delete('/group-remove-user/:id',jwtMiddleware,controller.removeUser)
router.delete('/group-remove/:id',jwtMiddleware,controller.removeGroup)
router.delete('/group-clear-chat/:id',jwtMiddleware,controller.clearGroupChat)
router.put('/group-Icon-update/:id',jwtMiddleware,upload.single("file"),controller.updateGroupIcon)

module.exports = router
