// Purpose: (Optional) JavaScript file for any frontend logic, such as form submission or interaction with the backend API.
// Interacts with: all HTML files in the app/templates directory.
// Programming Language: JavaScript.

document.addEventListener('DOMContentLoaded', function() {
    const formSection = document.querySelector('.form-section');
    const toggleButton = document.getElementById('toggle-form');

    toggleButton.addEventListener('click', function() {
        if (formSection.style.display === 'none') {
            formSection.style.display = 'block';
            toggleButton.textContent = 'Hide Form';
        } else {
            formSection.style.display = 'none';
            toggleButton.textContent = 'Unhide Form';
        }
    });
});


