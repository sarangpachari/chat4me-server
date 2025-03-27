const express = require('express')
const router = express.Router()
const controller = require('../Controller/UserConroller')
const chatController = require('../Controller/chatController')
const jwtMiddleware = require('../Middleware/jwtMiddleware')
const upload = require('../Middleware/multerMiddleware')

router.get('/user-Info/:id',controller.getUserInfo)

router.get('/all-Users',controller.getAllUsers)

router.get('/search-User',controller.getSearchUser)

router.get('/get-Chat-Users/:id',jwtMiddleware,chatController.getChatUsers)

router.put('/update-Username',controller.updateUsername)

router.delete('/remove-message/:id',jwtMiddleware, chatController.deleteSingleChat)

router.delete('/clear-all-chats',jwtMiddleware ,chatController.clearAllChats)

router.put("/update-Profile/:id",upload.single("file"), controller.updateProfile);

module.exports = router
