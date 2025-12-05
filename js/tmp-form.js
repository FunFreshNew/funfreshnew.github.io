// Auto-save and restore input values using localStorage
document.addEventListener("DOMContentLoaded", () => {
    // Get all inputs and textareas
    const fields = document.querySelectorAll("input[type='text'], textarea");

    fields.forEach(field => {
        const key = `autosave_${field.id || field.name}`; // unique key per field

        // Restore saved value
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            field.value = saved;
        }

        // Save on every input
        field.addEventListener("input", () => {
            localStorage.setItem(key, field.value);
        });
    });
});