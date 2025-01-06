async function generateZip() {
    const zip = new JSZip();
    const form = document.getElementById('dataForm');
  
    // Get text inputs
    const name = form.querySelector('#text-input').value || 'N/A';
    const email = form.querySelector('#email-input').value || 'N/A';
    const number = form.querySelector('#number-input').value || 'N/A';
  
    // Add text inputs to the ZIP as a .txt file
    const textContent = `Name: ${name}\nEmail: ${email}\nNumber: ${number}`;
    zip.file('form_data.txt', textContent);
  
    // Process uploaded files
    const files = form.querySelector('#file-upload').files;
  
    if (files.length > 0) {
      for (const file of files) {
        const fileData = await file.arrayBuffer(); // Convert file to ArrayBuffer
        zip.file(`images/${file.name}`, fileData);
      }
    } else {
      alert("Please upload at least one image.");
      return;
    }
  
    // Generate the ZIP file
    zip.generateAsync({ type: 'blob' })
      .then((zipFile) => {
        // Download the ZIP file
        saveAs(zipFile, 'submission.zip');
        document.getElementById('instructions').style.display = 'block'; // Show instructions
      })
      .catch((error) => {
        console.error("Error creating ZIP file:", error);
        alert("Failed to create ZIP file. Please try again.");
      });
  }