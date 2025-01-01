

// Custom controls for video1
const video1 = document.getElementById("video1");
const mute1 = document.getElementById("mute1");
const fullscreen1 = document.getElementById("fullscreen1");

// Custom controls for video2
const video2 = document.getElementById("video2");
const mute2 = document.getElementById("mute2");
const fullscreen2 = document.getElementById("fullscreen2");

// Mute/Unmute functionality
function toggleMute(video, button) {
  if (video.muted) {
    video.muted = false;
    button.textContent = "🔊";
  } else {
    video.muted = true;
    button.textContent = "🔇";
  }
}

// Fullscreen functionality
function toggleFullscreen(video) {
  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen();
  } else if (video.msRequestFullscreen) {
    video.msRequestFullscreen();
  }
}

// Attach events for video1
mute1.addEventListener("click", () => toggleMute(video1, mute1));
fullscreen1.addEventListener("click", () => toggleFullscreen(video1));

// Attach events for video2
mute2.addEventListener("click", () => toggleMute(video2, mute2));
fullscreen2.addEventListener("click", () => toggleFullscreen(video2));





function copyDiscordName() {
    const discordName = "funfreshnew"; //  Discord name
    navigator.clipboard.writeText(discordName).then(() => {
      // Show notification
      const notification = document.getElementById("notification");
      notification.classList.add("visible");

      // Hide notification after 2 seconds
      setTimeout(() => {
        notification.classList.remove("visible");
      }, 2000);
    }).catch(err => {
      console.error("what the: ", err);
    });
  }


