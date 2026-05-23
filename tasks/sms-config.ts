/**
 * cSMS (mycsms.com) SMS Integration Configuration
 * Use this for sending SMS notifications to users (OTP, booking updates, etc.)
 *
 * Endpoint: POST https://app.mycsms.com/api/v3/sms/send
 */

export interface SmsPayload {
  phone: string[];
  sender_id: string;
  message: string;
  message_type: "text";
}

export async function sendSms(payload: SmsPayload, apiKey: string): Promise<Record<string, unknown>> {
  const response = await fetch("https://app.mycsms.com/api/v3/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const data: Record<string, unknown> = await response.json();
  console.log(data);
  return data;
}

// Example usage:
// const apiKey = "YOUR_API_KEY";
// const payload: SmsPayload = {
//   phone: ["233241234567", "233501234567"],
//   sender_id: "StayJazzy",
//   message: "Hello from Stay Jazzy Multimedia",
//   message_type: "text"
// };
// sendSms(payload, apiKey).catch(console.error);
