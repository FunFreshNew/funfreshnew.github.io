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
    const numberInput = document.getElementById('number-input');
    const socialMediaInput = document.getElementById('social-media-input');

    if (nameInput.value.trim() === '') {
      alert('Name is required!');
      nameInput.focus();
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




function getIndonesianTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

function updateAnalogClock() {
  const time = getIndonesianTime();
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour + minute adjustment
  const minuteDeg = minutes * 6 + seconds * 0.1; // 6 degrees per minute + second adjustment
  const secondDeg = seconds * 6; // 6 degrees per second

  document.getElementById('hour-hand').style.transform = `rotate(${hourDeg}deg)`;
  document.getElementById('minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
  document.getElementById('second-hand').style.transform = `rotate(${secondDeg}deg)`;
}

setInterval(updateAnalogClock, 1000);
updateAnalogClock();
