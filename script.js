function copyDiscordName() {
    const discordName = "YourDiscordName#1234"; // Replace with your Discord name
    navigator.clipboard.writeText(discordName).then(() => {
      // Show notification
      const notification = document.getElementById("notification");
      notification.classList.add("visible");

      // Hide notification after 2 seconds
      setTimeout(() => {
        notification.classList.remove("visible");
      }, 2000);
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  }