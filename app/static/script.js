// Purpose: (Optional) JavaScript file for any frontend logic, such as form submission or interaction with the backend API.
// Interacts with: all HTML files in the app/templates directory.
// Programming Language: JavaScript.

// Functioning of the buttons in the login page
document.addEventListener('DOMContentLoaded', function() {
    const companyLoginBtn = document.getElementById('companyLogin');
    const tryDemoBtn = document.getElementById('tryDemo');

    if (companyLoginBtn) {
        companyLoginBtn.addEventListener('click', function() {
            alert('Work in progress, function currently unavailable');
        });
    }

    if (tryDemoBtn) {
        tryDemoBtn.addEventListener('click', function() {
            window.location.href = '/role_selection';
        });
    }
});


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
        } else if (prospectResponse.value === 'Request to Return later') {
            appointmentDetails.style.display = 'block';
            // Make fields optional
            namesurname.required = false;
            contactEmail.required = false;
            contactPhone.required = false;
            appointmentTime.required = false;
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

    // FIXME: make this sync work properly
    function syncData() {
        syncStatus.textContent = 'Syncing...';
        fetch('/sync_data', {
            method: 'POST',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.message === "No new data to sync") {
                syncStatus.textContent = 'No new data to sync. Last check: ' + new Date().toLocaleTimeString();
            } else {
                syncStatus.textContent = 'Last successful sync: ' + new Date().toLocaleTimeString();
                updatePerformanceData(dateSelect.value);
                updateOverallPerformanceData();
            }
        })
        .catch(error => {
            syncStatus.textContent = 'Sync failed. Will retry in 5 minutes. Error: ' + error.message;
            console.error('Error syncing data:', error);
        });
    }

    function updateOverallPerformanceData() {
        fetch('/get_overall_performance', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-doors-knocked').textContent = data.total_doors_knocked;
            document.getElementById('total-appointments-set').textContent = data.total_appointments_set;
            document.getElementById('average-conv-rate').textContent = data.average_conv_rate;
            document.getElementById('days-since-started').textContent = data.days_since_started;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function updatePerformanceData(selectedDate) {
        fetch('/get_one_day_performance', {
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

    updateOverallPerformanceData();

    // Sync data every 5 minutes (adjust as needed)
    setInterval(syncData, 5 * 60 * 1000);

    // Initial sync when page loads
    syncData();
});

// Pitch recap functionality
document.addEventListener('DOMContentLoaded', function() {
    const pitchBox = document.getElementById('pitch-box');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');

    if (pitchBox && editBtn && saveBtn) {
        // Set initial pitch text
        pitchBox.value = "Hello, how are you today?\n\
I'm here to see if you qualify for the government grant to go solar.\n\
Have you heard about this grant?\n\
\n\
Let me explain: We install solar panels with no upfront cost and no installation fee. The system will reduce your power bill to zero, and instead of paying for electricity, you'll pay towards the system until it's paid off. If you can afford your current power bill, you can definitely afford this system.\n\
\n\
To qualify, you need to pay $xxx or more on energy bills each quarter and be the homeowner.\n\
\n\
We're offering a free consultation with a specialist who will visit your home for a 30-minute chat. They'll assess your roof space and answer any questions you have. If you're not interested after the consultation, you can simply ask them to leave.\n\
\n\
Would this be something you're interested in?";

        editBtn.addEventListener('click', () => {
            pitchBox.readOnly = false;
            pitchBox.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        });

        saveBtn.addEventListener('click', () => {
            pitchBox.readOnly = true;
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            // Here you would typically save the new pitch text to a database
            console.log('New pitch saved:', pitchBox.value);
        });
    }
});


// Call this function when the analytics page loads
document.addEventListener('DOMContentLoaded', function() {
    function updateTeamOverviewData() {
        fetch('/get_team_overview', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('team-members').textContent = data.team_members;
            document.getElementById('total-doors').textContent = data.total_doors;
            document.getElementById('total-appointments').textContent = data.total_appointments;
            document.getElementById('avg-doors-per-day').textContent = data.avg_doors_per_day_employee;
            document.getElementById('avg-appointments-per-day').textContent = data.avg_appointments_per_day_employee;
            document.getElementById('avg-conversion-rate').textContent = data.avg_conversion_rate;
            document.getElementById('days-of-collection').textContent = data.days_of_collection;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    if (document.querySelector('.team-overview')) {
        updateTeamOverviewData();
    }
});

// Team' Performance chart in Analytics page
let teamPerformanceChart;
let teamPerformanceData;

function fetchTeamPerformanceData() {
    return fetch('/get_team_performance')
        .then(response => response.json())
        .then(data => {
            teamPerformanceData = data;
            return data;
        });
}

function createTeamPerformanceChart(data, metric = 'appointments', view = 'total') {
    const ctx = document.getElementById('teamPerformanceChart').getContext('2d');
    const labels = data.map(d => d.member);
    const values = data.map(d => d[metric][view]);

    if (teamPerformanceChart) {
        teamPerformanceChart.destroy();
    }

    teamPerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `${metric.charAt(0).toUpperCase() + metric.slice(1)} (${view})`,
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: metric === 'conversion' ? 'Percentage' : 'Count'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const metricSelect = document.getElementById('metric-select');
    const toggleViewBtn = document.getElementById('toggle-view');
    let currentView = 'total';

    if (metricSelect && toggleViewBtn) {
        fetchTeamPerformanceData().then(data => {
            createTeamPerformanceChart(data);

            metricSelect.addEventListener('change', function() {
                createTeamPerformanceChart(teamPerformanceData, this.value, currentView);
            });

            toggleViewBtn.addEventListener('click', function() {
                currentView = currentView === 'total' ? 'daily' : 'total';
                createTeamPerformanceChart(teamPerformanceData, metricSelect.value, currentView);
            });
        });
    }
});

// Prospects' Response chart in Analytics page
let prospectResponsesChart;
let prospectResponsesData;

function fetchProspectResponsesData() {
    return fetch('/get_prospect_responses')
        .then(response => response.json())
        .then(data => {
            prospectResponsesData = data;
            return data;
        });
}

function createProspectResponsesChart(data) {
    const ctx = document.getElementById('prospectResponsesChart').getContext('2d');

    if (prospectResponsesChart) {
        prospectResponsesChart.destroy();
    }

    prospectResponsesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                    'rgba(50, 100, 192, 0.8)'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Reasons of No chart in Analytics page
let reasonsOfNoChart;
let reasonsOfNoData;

function fetchReasonsOfNoData() {
    return fetch('/get_reasons_of_no')
        .then(response => response.json())
        .then(data => {
            reasonsOfNoData = data;
            return data;
        });
}

function createReasonsOfNoChart(data) {
    const ctx = document.getElementById('reasonsOfNoChart').getContext('2d');

    if (reasonsOfNoChart) {
        reasonsOfNoChart.destroy();
    }

    reasonsOfNoChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                    'rgba(50, 100, 192, 0.8)'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Load the pie charts in Analytics page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('prospectResponsesChart')) {
        fetchProspectResponsesData().then(data => {
            createProspectResponsesChart(data);
        }).catch(error => console.error('Error fetching prospect responses data:', error));
    }
    if (document.getElementById('reasonsOfNoChart')) {
        fetchReasonsOfNoData().then(data => {
            createReasonsOfNoChart(data);
        }).catch(error => console.error('Error fetching reasons of no data:', error));
    }
});