// pages/utils/openMockPhonepe.js
handler: async (response) => {
  try {
    await verifyPayment({
      orderId: response.orderId,  // important!
      requestId,
      amount,
    });

    alert("🎉 Donation successful!");
    fetchCampaigns();
    fetchMyDonations();
  } catch (err) {
    console.error("verify error", err);
    alert("Payment verification failed.");
  }
}

export function openMockPhonepe(options) {
  const overlay = document.createElement("div");
  overlay.style = `
    position: fixed; top: 0; left: 0; bottom: 0; right: 0;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(2px);
    z-index: 999999; display: flex; align-items: flex-start;
    justify-content: center; transition: opacity 0.25s ease;
  `;

  const sheet = document.createElement("div");
  sheet.style = `
    width: 100%; max-width: 420px; background: #fff;
    border-radius: 16px 16px 0 0; padding: 25px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    font-family: 'Inter', sans-serif; transform: translateY(-100%);
    transition: transform 0.35s ease; position: relative; margin-top: 20px;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style = `
    position: absolute; top:12px; right:15px;
    border:none; background:transparent; font-size:22px;
    cursor:pointer; color:#666;
  `;
  closeBtn.onclick = closeSheet;
  sheet.appendChild(closeBtn);

  const header = document.createElement("div");
  header.style = "text-align:center; margin-top:5px;";
  header.innerHTML = `
    <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg"
     style="height:45px; margin-bottom:10px;" />

    <h2 style="font-weight:600; color:#333; margin-bottom:6px;">${options.name}</h2>
    <p style="font-size:14px; color:#777;">${options.description}</p>
  `;
  sheet.appendChild(header);

  const orderInfo = document.createElement("div");
  orderInfo.style = `
    margin-top:20px; border:1px solid #eee; padding:15px;
    border-radius:10px; background:#fafafa;
  `;
  orderInfo.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span style="color:#666;">Amount</span>
      <strong>₹${options.amount}</strong>
    </div>

    <div style="display:flex; justify-content:space-between; font-size:12px; color:#777;">
      <span>Order ID</span>
      <span>${options.order_id}</span>
    </div>
  `;
  sheet.appendChild(orderInfo);

  const tabs = document.createElement("div");
  tabs.style = "display:flex; justify-content:space-around; margin-top:20px; border-bottom:1px solid #ddd;";

  const upiTab = document.createElement("button");
  upiTab.innerText = "UPI ID";
  upiTab.style = `
    flex:1; padding:10px; background:transparent; cursor:pointer;
    font-weight:600; color:#5b2be0; border:none; border-bottom:2px solid #5b2be0;
  `;

  const qrTab = document.createElement("button");
  qrTab.innerText = "Scan QR";
  qrTab.style = `
    flex:1; padding:10px; background:transparent; cursor:pointer;
    font-weight:600; color:#777; border:none;
  `;

  tabs.appendChild(upiTab);
  tabs.appendChild(qrTab);
  sheet.appendChild(tabs);

  const tabContent = document.createElement("div");
  tabContent.style = "margin-top:15px;";
  sheet.appendChild(tabContent);

  const upiContent = document.createElement("div");
  upiContent.style = "display:block;";
  upiContent.innerHTML = `
    <input placeholder="Enter UPI ID (e.g. name@upi)"
      style="width:100%; padding:10px; border-radius:8px;
      border:1px solid #ddd; margin-bottom:15px;">

    <input placeholder="Full Name"
      value="${options.userName}" readonly
      style="width:100%; padding:10px; border-radius:8px;
      border:1px solid #ddd; background:#f0f0f0; margin-bottom:10px;">

    <input placeholder="Email Address"
      value="${options.userEmail}" readonly
      style="width:100%; padding:10px; border-radius:8px;
      border:1px solid #ddd; background:#f0f0f0;">
  `;
  tabContent.appendChild(upiContent);

  const qrContent = document.createElement("div");
  qrContent.style = `
    display:none;
    text-align:center;
    width:100%;
    flex-direction:column;
    align-items:center;
    justify-content:center;
  `;
  qrContent.innerHTML = `
    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Commons_QR_code.png"
      style="height:200px; margin-bottom:10px;">
    <p style="font-size:14px;color:#777;">Scan this QR code using your UPI app</p>
  `;
  tabContent.appendChild(qrContent);

  upiTab.onclick = () => {
    upiContent.style.display = "block";
    qrContent.style.display = "none";
    upiTab.style.color = "#5b2be0";
    upiTab.style.borderBottom = "2px solid #5b2be0";
    qrTab.style.color = "#777";
    qrTab.style.borderBottom = "none";
  };

  qrTab.onclick = () => {
    upiContent.style.display = "none";
    qrContent.style.display = "flex"; // show only in Scan QR
    qrTab.style.color = "#5b2be0";
    qrTab.style.borderBottom = "2px solid #5b2be0";
    upiTab.style.color = "#777";
    upiTab.style.borderBottom = "none";
  };

  const payBtn = document.createElement("button");
  payBtn.innerText = `Pay ₹${options.amount}`;
  payBtn.style = `
    margin-top:25px; width:100%; padding:14px; background:#5b2be0;
    border:none; border-radius:10px; color:white; font-size:17px; cursor:pointer;
  `;
  sheet.appendChild(payBtn);

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  setTimeout(() => (sheet.style.transform = "translateY(0)"), 10);

  function closeSheet() {
    sheet.style.transform = "translateY(-100%)";
    overlay.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(overlay);
      options.onClose?.();
    }, 280);
  }

  payBtn.onclick = () => {
    const inputs = upiContent.querySelectorAll("input");

    let paymentResponse;

  if (upiContent.style.display !== "none") {
    const upi = inputs[0].value.trim();

    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{3,}$/;
    if (!upiRegex.test(upi)) {
      alert("Please enter a valid UPI ID (e.g. name@bank)");
      return;
    }

    paymentResponse = {
      orderId: options.order_id,  // ✅ FIXED
      paymentId: "MOCK_PAY_" + Date.now(),
      signature: "MOCK_SIG_" + Date.now(),
      upi,
      name: options.userName,
      email: options.userEmail,
    };
  } else {
    paymentResponse = {
      orderId: options.order_id,  // ✅ FIXED
      paymentId: "MOCK_PAY_" + Date.now(),
      signature: "MOCK_SIG_" + Date.now(),
      name: "Anonymous",
      email: "",
      upi: "",
    };
  } 

    sheet.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <div style="font-size:48px; color:#5b2be0;">&#10003;</div>
        <h2 style="margin-top:10px; font-weight:600; color:#333;">Donation Successful!</h2>
        <p style="margin-top:5px; color:#666; font-size:14px;">
          Thank you for supporting this cause.
        </p>
      </div>
    `;

    setTimeout(() => closeSheet(), 1800);
    options.handler?.(paymentResponse);
  };
}