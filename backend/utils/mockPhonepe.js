// backend/utils/mockPhonepe.js

// Creates a fake order (looks like real PhonePe/Razorpay)
export const createMockOrder = (amount) => {
  return {
    id: "MOCK_ORDER_" + Date.now(),
    amount,
    currency: "INR",
    status: "CREATED",
  };
};

// Creates fake payment details
export const createMockPayment = (orderId) => {
  return {
    paymentId: "MOCK_PAY_" + Math.floor(Math.random() * 9999999),
    orderId,
    signature: "MOCK_SIGNATURE_" + Math.floor(Math.random() * 9999999),
    status: "SUCCESS",
  };
};

// Optional: verify payment (always passes)
export function verifyMockPayment(orderId) {
  return {
    success: true, 
    message: "Mock payment verified",
    orderId,
    paymentId: "MOCK_PAY_" + Date.now(),
  };
}