// Purpose: (Optional) JavaScript file for any frontend logic, such as form submission or interaction with the backend API.
// Interacts with: all HTML files in the app/templates directory.
// Programming Language: JavaScript.

// Functioning of the Hide / Unhide Form button in the Submission Form of data_collection.html
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

// Delete individual row and all data functionalities from the MongoDB database through the table in data_collection.html
document.addEventListener('DOMContentLoaded', function() {
    // Delete individual row
    document.querySelectorAll('.delete-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const prospectId = this.getAttribute('data-id');

            // Confirm with the user before deleting
            if (confirm('Are you sure you want to delete this record?')) {
                // Send a DELETE request to the server
                fetch(`/delete/${prospectId}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (response.ok) {
                        // Reload the page after deletion
                        window.location.reload();
                    } else {
                        console.error('Failed to delete prospect.');
                    }
                })
                .catch(error => {
                    console.error('Error during deletion:', error);
                });
            }
        });
    });

    // Delete all data
    document.querySelectorAll('.delete-all-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // Confirm with the user before deleting all data
            if (confirm('Are you REALLY sure you want to delete all records? This action cannot be undone!')) {
                // Send a DELETE request to the server
                fetch(`/delete-ALL`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (response.ok) {
                        // Reload the page after deletion
                        window.location.reload();
                    } else {
                        console.error('Failed to delete all data.');
                    }
                })
                .catch(error => {
                    console.error('Error during deletion:', error);
                });
            }
        });
    });
});


// Add current time and date to the submission form in data_collection.html, and show/hide contact-only / appointment details fields
document.addEventListener('DOMContentLoaded', function() {
    
    // Adding the current time and date to the Submission Form of data_collection.html, still allowing to modify it if necessary
    const timestampInput = document.getElementById('timestamp');
    const now = new Date();
    // Adjust for local timezone offset to get the correct local time
    const timezoneOffset = now.getTimezoneOffset() * 60000; // in milliseconds
    const localISOTime = (new Date(now - timezoneOffset)).toISOString().slice(0, -1);
    // Format the date and time for the datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedDateTime = localISOTime.slice(0, 16);
    // Set the value of the input field
    timestampInput.value = formattedDateTime;


    // Functionality to show/hide contact-only fields
    const prospectResponse = document.getElementById('prospect_response');
    const contactFields = document.getElementById('contact-fields');

    function toggleContactFields() {
        if (prospectResponse.value && prospectResponse.value !== 'No answer') {
            contactFields.style.display = 'block';
        } else {
            contactFields.style.display = 'none';
            // Clear values
            document.getElementById('electricity_bill_estimate').value = '';
            document.getElementById('number_of_decision_makers').value = '';
            document.getElementById('approximate_age').value = '';
            document.getElementById('number_inhabitants').value = '';
        }
    }
    // Initial check in case the default value is not 'No answer'
    toggleContactFields();
    // Add event listener to the prospect response field
    prospectResponse.addEventListener('change', function() {
        toggleContactFields();
    });

    // Functionality to show/hide appointment details
    const appointmentDetails = document.getElementById('appointment-details');
    const namesurname = document.getElementById('name_surname');
    const contactEmail = document.getElementById('contact_email');
    const contactPhone = document.getElementById('contact_phone');
    const appointmentTime = document.getElementById('appointment_time');
    function toggleAppointmentDetails() {
        if (prospectResponse.value === 'Appointment set') {
            appointmentDetails.style.display = 'block';
            // Make fields required
            namesurname.required = true;
            contactEmail.required = true;
            contactPhone.required = true;
            appointmentTime.required = true;
        } else {
            appointmentDetails.style.display = 'none';
            // Remove required attribute
            namesurname.required = false;
            contactEmail.required = false;
            contactPhone.required = false;
            appointmentTime.required = false;
            // Clear the values
            namesurname.value = '';
            contactEmail.value = '';
            contactPhone.value = '';
            appointmentTime.value = '';
        }
    }
    // Initial check in case the default value is 'Appointment set'
    toggleAppointmentDetails();
    // Add event listener to the prospect response field
    prospectResponse.addEventListener('change', toggleAppointmentDetails);
});
