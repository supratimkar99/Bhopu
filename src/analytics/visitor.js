export function getVisitorId() {
  let visitorId = localStorage.getItem("visitor_id");

  if (!visitorId) {
    try {
      visitorId = crypto.randomUUID();
    } catch (error) {
      if (error.message.includes("crypto.randomUUID is not a function")) {
        console.warn("You're likely on the local network link or on an awefully old browser. If not, this is trouble.");
      } else {
        console.error("Error generating visitor ID:", error);
      }
      throw error;
    }
    localStorage.setItem("visitor_id", visitorId);
  }

  return visitorId;
}
