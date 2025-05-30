import "./mpesa.scss";
import React, { useState } from "react";
import axios from "axios";

const Mpesa = () => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleClick = () => {
    setShowModal(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    setShowModal(false);
    setAmount("");
    setPhoneNumber("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const initiateSTKPush = async () => {
    if (!amount || !phoneNumber) {
      setErrorMessage("Please provide both phone number and amount");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(?:254|\+254|0)?([7-9]{1}[0-9]{8})$/;
    const cleanPhone = phoneNumber.replace(/^0+/, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage("Please enter a valid phone number (e.g., 0712345678)");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const response = await axios.post(
        "http://localhost:5000/api/stkpush",
        {
          phone: cleanPhone,
          amount: amount,
          accountNumber: "123456"
        }
      );

      const responseData = response.data;

      setPhoneNumber("");
      setAmount("");
      setShowModal(false);
      setLoading(false);

      if (responseData.success) {
        setSuccessMessage(responseData.msg || "Payment initiated successfully");
      } else {
        setErrorMessage(responseData.msg || "Payment failed. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.response?.data?.msg || "Payment failed. Please try again");
    }
  };

  return (
    <div className="payment-container">
      <video
        className="video-background"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4" type="video/mp4" />
      </video>
      <button className="checkout" onClick={handleClick}>
        Make Payment
      </button>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleClose}>
              &times;
            </span>
            <h2>Mpesa Payment</h2>
            <div className="input-group">
              <label>Amount (KES)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number (e.g., 0712345678)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <button 
              onClick={initiateSTKPush} 
              disabled={loading || !amount || !phoneNumber}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mpesa;
