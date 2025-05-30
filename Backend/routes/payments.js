const express = require("express");
const router = express.Router();
const axios = require("axios");
const oauth = require("oauth");

require("dotenv").config(); // Load environment variables from .env file

// Load environment variables
const businessShortCode = process.env.SHORTCODE;
const passkey = process.env.PASSKEY;

// OAuth2 configuration
const oauth2 = new oauth.OAuth2(
  process.env.BLUEHIKE_KEY,
  process.env.BLUEHIKE_SECRET,
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
);

// Handle payment initiation
router.post("/initiate", (req, res) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, -3);

  // Creating the password
  const password = Buffer.from(
    `${businessShortCode}${passkey}${timestamp}`
  ).toString("base64");

  // Your logic to initiate payment using M-Pesa's API
  // Include the generated password in the payload
  // Send the request to M-Pesa's API endpoint

  // Example:
  // axios.post('M-Pesa API endpoint', {
  //   BusinessShortCode: businessShortCode,
  //   Password: password,
  //   Timestamp: timestamp,
  //   // Include other required parameters for payment initiation
  // })
  // .then(response => {
  //   console.log('Payment initiated:', response.data);
  //   res.status(200).send(response.data);
  // })
  // .catch(error => {
  //   console.error('Error initiating payment:', error);
  //   res.status(500).send('Error initiating payment');
  // });

  // Make a POST request to initiate payment using M-Pesa's API
  axios
    .post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: "Bearer " + process.env.ACCESS_TOKEN, // Include your access token here if required
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      console.log("Payment initiation response:", response.data);
      res.status(200).send(response.data);
    })
    .catch((error) => {
      console.error("Error initiating payment:", error);
      res.status(500).send("Error initiating payment");
    });
});

// Handle callback from M-Pesa
router.post("/callback", (req, res) => {
  // Your logic to handle M-Pesa callback
});

// Handle checking transaction status
router.get("/checkStatus/:transactionId", (req, res) => {
  // Your logic to check transaction status
});

module.exports = router;
