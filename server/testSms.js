   require("dotenv").config();
   const { sendSms } = require("./services/smsService");

   sendSms("7815908207", "Food Rescue test message").then((result) => {
     console.log("RESULT:", result);
   });