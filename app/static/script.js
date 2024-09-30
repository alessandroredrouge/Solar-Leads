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


document.addEventListener('DOMContentLoaded', function() {
    const dateSelect = document.getElementById('date-select');
    const syncStatus = document.getElementById('sync-status');

    function syncData() {
        syncStatus.textContent = 'Syncing...';
        fetch('/sync_data', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            syncStatus.textContent = 'Last sync: ' + new Date().toLocaleTimeString();
            updatePerformanceData(dateSelect.value);
        })
        .catch(error => {
            syncStatus.textContent = 'Sync failed. Retry in 5 minutes.';
            console.error('Error syncing data:', error);
        });
    }

    function updatePerformanceData(selectedDate) {
        fetch('/get_performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({date: selectedDate}),
        })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.performance-item:nth-child(1) h2').textContent = data.doors_knocked;
            document.querySelector('.performance-item:nth-child(2) h2').textContent = data.appointments_set;
            document.querySelector('.performance-item:nth-child(3) h2').textContent = `${data.rank_doors_knocked}${getRankSuffix(data.rank_doors_knocked)}`;
            document.querySelector('.performance-item:nth-child(4) h2').textContent = `${data.rank_appointments_set}${getRankSuffix(data.rank_appointments_set)}`;
            document.querySelector('.performance-item:nth-child(5) h2').textContent = data.doors_away;
            document.querySelector('.performance-item:nth-child(6) h2').textContent = data.conv_rate;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function getRankSuffix(rank) {
        if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
        if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
        if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
        return 'th';
    }
    
    dateSelect.addEventListener('change', function() {
        updatePerformanceData(this.value);
    });

    // Sync data every 5 minutes (adjust as needed)
    setInterval(syncData, 5 * 60 * 1000);

    // Initial sync when page loads
    syncData();
});