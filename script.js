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

async function downloadFormAsZip() {
    try {
        const form = document.getElementById('dataForm');
        const notice = document.getElementById('notice');
        const zip = new JSZip();

        // Validate required fields
        const nameInput = document.getElementById('text-input');
        const emailInput = document.getElementById('email-input');
        const numberInput = document.getElementById('number-input');
        const socialMediaInput = document.getElementById('social-media-input');

        if (nameInput.value.trim() === '') {
            alert('Name is required!');
            nameInput.focus();
            return;
        }

        if (emailInput.value.trim() === '') {
            alert('Email is required!');
            emailInput.focus();
            return;
        }

        if (socialMediaInput.value.trim() === '') {
            alert('Social Media Handle is required!');
            socialMediaInput.focus();
            return;
        }

        if (numberInput.value.trim() === '') {
            alert('Number is required!');
            numberInput.focus();
            return;
        }

        // Collect form data in the specified order
        const formData = {
            name: nameInput.value || 'N/A',
            email: document.getElementById('email-input').value || 'N/A',
            socialMedia: socialMediaInput.value || 'N/A',
            selectedCharacters: [],
            totalSkin: numberInput.value || 'N/A',
            commissionType: document.getElementById('dropdown-input').value || 'N/A',
            notes: document.getElementById('textarea-input').value || 'N/A',
            publishDate: 'N/A'
        };

        // Handle the selected characters (Steve, Alex)
        const steveCheckbox = document.getElementById('checkbox-steve');
        const alexCheckbox = document.getElementById('checkbox-alex');

        if (steveCheckbox.checked) formData.selectedCharacters.push('Steve');
        if (alexCheckbox.checked) formData.selectedCharacters.push('Alex');
        if (formData.selectedCharacters.length === 0) {
            formData.selectedCharacters = 'None selected';
        }

        // Handle the publish date if the checkbox is checked
        if (document.getElementById('publish-checkbox').checked) {
            const publishDateInput = document.getElementById('publish-date');
            const publishDate = publishDateInput.value;

            if (publishDate) {
                // Split the date by '/' and handle formatting to D/M/YYYY
                const dateParts = publishDate.split('/');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0], 10);   // Remove leading zeros for day
                    const month = parseInt(dateParts[1], 10); // Remove leading zeros for month
                    const year = dateParts[2];                 // Keep the year as is
                    formData.publishDate = `${day}/${month}/${year}`;
                } else {
                    formData.publishDate = 'N/A';
                }
            }
        }

        // Add form data as text in the correct order and with more readable formatting
        let formText = '';
        formText += `Name: ${formData.name} \n\n`;
        formText += `Email: ${formData.email} \n\n`;
        formText += `Social Media Handle: ${formData.socialMedia} \n\n`;
        formText += `--------------------------\n\n`;
        formText += `Selected Character: ${Array.isArray(formData.selectedCharacters) ? formData.selectedCharacters.join(', ') : formData.selectedCharacters} \n\n`;
        formText += `Total Skin: ${formData.totalSkin} \n\n`;
        formText += `Commission Type: ${formData.commissionType} \n\n`;
        formText += `--------------------------\n\n`;
        formText += `Notes: ${formData.notes} \n\n`;
        formText += `Publish Date: ${formData.publishDate} \n\n`;

        zip.file('form_data.txt', formText);

        // Add uploaded files to 'images' folder
        const files = document.getElementById('file-upload').files;
        if (files.length > 0) {
            const imageFolder = zip.folder('images');
            for (const file of files) {
                const fileData = await file.arrayBuffer();
                imageFolder.file(file.name, fileData);
            }
        }

        // Generate ZIP and trigger download
        const zipFileName = formData.name !== 'N/A' ? `${formData.name.replace(/\s+/g, '_')}_commission.zip` : 'form_data.zip';
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Check if ZIP was successfully created
        if (zipBlob.size > 0) {
            saveAs(zipBlob, zipFileName);
        } else {
            console.error('Error: ZIP file is empty');
            alert('Failed to create ZIP file. Please check the form and uploaded files.');
        }

        // Show notice (keeps it visible)
        notice.style.visibility = 'visible';
        notice.style.opacity = '1';

    } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Failed to create ZIP file. Please check the console for more details.');
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