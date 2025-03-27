const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOtpMail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP for Login Chat App",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};

module.exports = { sendOtpMail };
