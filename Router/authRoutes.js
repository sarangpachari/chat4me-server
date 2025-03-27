const express = require('express')
const router = express.Router()
const controller = require('../Controller/UserConroller')

router.post('/generate-Otp',controller.generateOtp)

router.post('/verify-Otp',controller.verifyOtpLogin)

router.post('/create-username',controller.getUsername)


module.exports = router
