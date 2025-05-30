const express = require("express");
const router = express.Router();
const app = express();
const moment = require("moment");
const fs = require("fs");
const axios = require("axios");
require('dotenv').config();

// Sample API route
router.get("/home", (req, res) => {
  res.json({ message: "This is a sample API route." });
  console.log("This is a sample API route.");
});

router.get("/api/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.json({ message: "😀 Your access token is " + accessToken });
    })
    .catch(console.log);
});

async function generateAccessToken() {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing consumer key or secret in environment variables");
  }

  const auth = "Basic " + Buffer.from(consumerKey + ":" + consumerSecret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
    
    if (!response.data || !response.data.access_token) {
      throw new Error("Invalid response from token generation");
    }
    
    return response.data.access_token;
  } catch (error) {
    console.error("Token generation error:", error.response?.data || error.message);
    throw new Error("Failed to generate access token: " + (error.response?.data?.error_description || error.message));
  }
}

router.post("/stkpush", (req, res) => {
  let phoneNumber = req.body.phone;
  const accountNumber = req.body.accountNumber;
  const amount = req.body.amount;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;

  if (!shortcode || !passkey) {
    return res.status(500).json({
      msg: "Missing shortcode or passkey in environment variables",
      success: false
    });
  }

  if (!phoneNumber || !amount) {
    return res.status(400).json({
      msg: "Phone number and amount are required",
      success: false
    });
  }

  // Format phone number to international format
  phoneNumber = phoneNumber.toString().trim();
  phoneNumber = phoneNumber.replace(/\D/g, '');
  
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '254' + phoneNumber.substring(1);
  }
  
  if (!phoneNumber.startsWith('254')) {
    phoneNumber = '254' + phoneNumber;
  }

  if (!/^254[7-9][0-9]{8}$/.test(phoneNumber)) {
    return res.status(400).json({
      msg: "Invalid phone number format. Please use a valid Kenyan phone number",
      success: false
    });
  }

  generateAccessToken()
    .then((accessToken) => {
      const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = Buffer.from(
        shortcode + passkey + timestamp
      ).toString("base64");

      return axios.post(
        url,
        {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: "https://249e-105-60-226-239.ngrok-free.app/api/callback",
          AccountReference: accountNumber,
          TransactionDesc: "Mpesa Daraja API stk push test",
        },
        {
          headers: {
            Authorization: auth,
          },
        }
      );
    })
    .then((response) => {
      console.log("STK Push Response:", response.data);
      res.status(200).json({
        msg: "Request is successful done ✔✔. Please enter mpesa pin to complete the transaction",
        success: true
      });
    })
    .catch((error) => {
      console.error("STK Push Error:", error.response?.data || error.message);
      res.status(500).json({
        msg: error.response?.data?.errorMessage || error.message || "Request failed",
        success: false
      });
    });
});

router.post("/callback", (req, res) => {
  console.log("STK PUSH CALLBACK");
  const merchantRequestID = req.body.Body.stkCallback.MerchantRequestID;
  const checkoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
  const resultCode = req.body.Body.stkCallback.ResultCode;
  const resultDesc = req.body.Body.stkCallback.ResultDesc;
  const callbackMetadata = req.body.Body.stkCallback.CallbackMetadata;
  const amount = callbackMetadata.Item[0].Value;
  const mpesaReceiptNumber = callbackMetadata.Item[1].Value;
  const transactionDate = callbackMetadata.Item[3].Value;
  const phoneNumber = callbackMetadata.Item[4].Value;

  console.log("MerchantRequestID:", merchantRequestID);
  console.log("CheckoutRequestID:", checkoutRequestID);
  console.log("ResultCode:", resultCode);
  console.log("ResultDesc:", resultDesc);

  console.log("Amount:", amount);
  console.log("MpesaReceiptNumber:", mpesaReceiptNumber);
  console.log("TransactionDate:", transactionDate);
  console.log("PhoneNumber:", phoneNumber);

  var json = JSON.stringify(req.body);
  fs.writeFile("stkcallback.json", json, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("STK PUSH CALLBACK STORED SUCCESSFULLY");
  });
});

//Route to initailize payment
// router.post("/initiatePayment", async (req, res) => {
//   const { amount, phoneNumber } = req.body;

//   if (!amount || isNaN(amount) || isNaN(amount)) {
//     return res.status(400).json({ error: "Invalid Amount" });
//   }

//   if (!validatePhoneNumber(phoneNumber)) {
//     return res.status(400).json({ error: "Invalid phone number format" });
//   }
//   try {
//     const accessToken = await generateAccessToken();

//     res.status(200).json({ message: "Payment initiated successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// REGISTER URL FOR C2B
app.get("/registerurl", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: "174379",
            ResponseType: "Complete",
            ConfirmationURL: "http://example.com/confirmation",
            ValidationURL: "http://example.com/validation",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          resp.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          resp.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

app.get("/confirmation", (req, res) => {
  console.log("All transaction will be sent to this URL");
  console.log(req.body);
});

app.get("/validation", (req, resp) => {
  console.log("Validating payment");
  console.log(req.body);
});

// B2C ROUTE OR AUTO WITHDRAWAL
app.get("/b2curlrequest", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const securityCredential =
        "N3Lx/hisedzPLxhDMDx80IcioaSO7eaFuMC52Uts4ixvQ/Fhg5LFVWJ3FhamKur/bmbFDHiUJ2KwqVeOlSClDK4nCbRIfrqJ+jQZsWqrXcMd0o3B2ehRIBxExNL9rqouKUKuYyKtTEEKggWPgg81oPhxQ8qTSDMROLoDhiVCKR6y77lnHZ0NU83KRU4xNPy0hRcGsITxzRWPz3Ag+qu/j7SVQ0s3FM5KqHdN2UnqJjX7c0rHhGZGsNuqqQFnoHrshp34ac/u/bWmrApUwL3sdP7rOrb0nWasP7wRSCP6mAmWAJ43qWeeocqrz68TlPDIlkPYAT5d9QlHJbHHKsa1NA==";
      const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            InitiatorName: "testapi",
            SecurityCredential: securityCredential,
            CommandID: "PromotionPayment",
            Amount: "1",
            PartyA: "600996",
            PartyB: "254768168060",
            Remarks: "Withdrawal",
            QueueTimeOutURL: "https://mydomain.com/b2c/queue",
            ResultURL: "https://mydomain.com/b2c/result",
            Occasion: "Withdrawal",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

module.exports = router;
