export const sendSMS = async (name, phone, company) => {
  try {
    const date = Date.now()

    const response = await fetch("http://10.150.14.26:5000/send-rating-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        company,
        date,
        used: false
      })
    });

    const data = await response.json();
    console.log(data);
    return data
  } catch (err) {
    throw new Error(err)
  }
};