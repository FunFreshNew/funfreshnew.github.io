window.transitionToPage = function(href) {
    document.querySelector('center').style.opacity = 0
    setTimeout(function() { 
        window.location.href = href
    }, 2000)
}

document.addEventListener('DOMContentLoaded', function(event) {
    document.querySelector('center').style.opacity = 1
})

function toggleDateInput() {
    var checkbox = document.getElementById('publish-checkbox');
    var dateTextArea = document.getElementById('publish-date');

    // Show or hide the date input based on checkbox status
    if (checkbox.checked) {
        dateTextArea.style.display = 'inline-block';  // Show date input when checked
    } else {
        dateTextArea.style.display = 'none';          // Hide the date input when unchecked
    }
}





/* AUTO COPY */
function copyText(event) {
    event.preventDefault(); // Prevent accidental navigation

    // Define the text that should be copied
    const textToCopy = "funfreshnew";

    // Create a temporary text area to copy the text
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);

    // Show tooltip-style confirmation
    let tooltip = document.createElement("span");
    tooltip.innerText = "Copied!";
    tooltip.classList.add("tooltip");

    const button = event.target;
    button.appendChild(tooltip);

    // Fade out and remove tooltip after 1 second
    setTimeout(() => {
        tooltip.style.opacity = "0";
        setTimeout(() => {
            button.removeChild(tooltip);
        }, 500);
    }, 1000);
}


/* pixbutton-bubble */

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.pixbutton').forEach(button => {
        button.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevents click from closing instantly

            let bubble = this.nextElementSibling;
            let softwareName = this.getAttribute('data-software');
            let softwareUrl = this.getAttribute('data-url');
            let link = bubble.querySelector('a');

            link.textContent = softwareName;
            link.href = softwareUrl;

            // Show bubble & reset fade timer
            bubble.classList.remove('hidden', 'fade-out');
            resetFadeTimer(bubble);
        });
    });

    // Hide bubbles when clicking outside
    document.addEventListener('click', function (event) {
        document.querySelectorAll('.bubble').forEach(bubble => {
            if (!bubble.contains(event.target)) {
                bubble.classList.add('fade-out');
                setTimeout(() => bubble.classList.add('hidden'), 500); // Hide after fade-out animation
            }
        });
    });

    // Function to reset fade timer
    function resetFadeTimer(bubble) {
        clearTimeout(bubble.dataset.timer); // Clear any existing timer
        bubble.dataset.timer = setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.classList.add('hidden'), 500); // Hide after fade animation
        }, 3000);
    }

    // Reset fade timer when hovering over the bubble
    document.querySelectorAll('.bubble').forEach(bubble => {
        bubble.addEventListener('mouseenter', () => resetFadeTimer(bubble));
    });
});


/* Pixbutton STUCK! */


/* 3D ! */



/* Soundcloud Remote Controller */

/* Minecraft Splash Text */

function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

const splashTexts = [
    "Woo! JavaScript!",
    "Now in HD!",
    "So smooth!",
    "Infinite creativity!",
    "100% organic pixels!",
    "More pixels, more fun!",
    "Crafting your experience!",
    "Procedurally generated fun!",
    "Blocky but beautiful!",
    "Limited edition!"
];

// Pick a random splash text
document.getElementById("splashText").textContent = splashTexts[Math.floor(Math.random() * splashTexts.length)];

// Go Home!
function goBackOrHome() {
    const referrer = document.referrer;
    const sameDomain = referrer && new URL(referrer).origin === window.location.origin;

    if (sameDomain) {
        history.back();
    } else {
        window.location.href = '/index.html'; // Adjust the path if needed
    }
}