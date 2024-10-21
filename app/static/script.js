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
        button.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Ahhh, so you tried to delete everything? Well, I'm one step forward than you: the 'Delete All' feature is currently disabled in the demo exactly for this reason. Muahahah, got ya!");
            // TODO: reactivate this functionality when eventually providing the software to the client
            // Confirm with the user before deleting all data
            // if (confirm('Are you REALLY sure you want to delete all records? This action cannot be undone!')) {
            //     // Send a DELETE request to the server
            //     fetch(`/delete-ALL`, {
            //         method: 'DELETE',
            //     })
            //     .then(response => {
            //         if (response.ok) {
            //             // Reload the page after deletion
            //             window.location.reload();
            //         } else {
            //             console.error('Failed to delete all data.');
            //         }
            //     })
            //     .catch(error => {
            //         console.error('Error during deletion:', error);
            //     });
            // }
        });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    
    // Adding the current time and date to the Submission Form
    const timestampInput = document.getElementById('timestamp');
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000; // in milliseconds
    const localISOTime = (new Date(now - timezoneOffset)).toISOString().slice(0, -1);
    const formattedDateTime = localISOTime.slice(0, 16);
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

    // Functionality to show/hide appointment details
    const appointmentDetails = document.getElementById('appointment-details');
    const contactDetailsGroup = document.getElementById('contact-details-group');
    const timeFieldsGroup = document.getElementById('time-fields-group');
    const appointmentTimeGroup = document.getElementById('appointment-time-group');
    const followUpTimeGroup = document.getElementById('follow-up-time-group');
    const nameSurname = document.getElementById('name_surname');
    const contactEmail = document.getElementById('contact_email');
    const contactPhone = document.getElementById('contact_phone');
    const appointmentTime = document.getElementById('appointment_time');
    const followUpTime = document.getElementById('follow_up_time');

    function toggleAppointmentDetails() {
        const isAppointment = prospectResponse.value === 'Appointment set';
        const isReturnLater = prospectResponse.value === 'Request to Return later';

        if (isAppointment || isReturnLater) {
            appointmentDetails.style.display = 'block';
            contactDetailsGroup.style.display = 'block';
            timeFieldsGroup.style.display = 'block';
            
            // Set required for contact details only if it's an appointment
            nameSurname.required = isAppointment;
            contactEmail.required = isAppointment;
            contactPhone.required = isAppointment;

            // Show and make required the appropriate time field
            if (isAppointment) {
                appointmentTimeGroup.style.display = 'block';
                followUpTimeGroup.style.display = 'none';
                appointmentTime.required = true;
                followUpTime.required = false;
                followUpTime.value = '';
            } else {
                appointmentTimeGroup.style.display = 'none';
                followUpTimeGroup.style.display = 'block';
                appointmentTime.required = false;
                followUpTime.required = true;
                appointmentTime.value = '';
            }
        } else {
            appointmentDetails.style.display = 'none';
            // Remove required attribute and clear values
            [nameSurname, contactEmail, contactPhone, appointmentTime, followUpTime].forEach(field => {
                field.required = false;
                field.value = '';
            });
        }
    }

    // Initial checks
    toggleContactFields();
    toggleAppointmentDetails();

    // Add event listeners to the prospect response field
    prospectResponse.addEventListener('change', toggleContactFields);
    prospectResponse.addEventListener('change', toggleAppointmentDetails);
});


document.addEventListener('DOMContentLoaded', function() {
    const dateSelect = document.getElementById('date-select');
    dateSelect.value = '2024-10-06';
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

    updatePerformanceData(dateSelect.value);
    dateSelect.addEventListener('change', function() {
        updatePerformanceData(this.value);
    });

    updateOverallPerformanceData();

    // Sync data every 5 minutes (adjust as needed)
    setInterval(syncData, 5 * 60 * 1000);

    // Initial sync when page loads
    syncData();
});

// FIXME: change it in a way that it sets the last available date in the date selector in field_support.html
// Functionality to set the last available date in the date selector in field_support.html
// document.addEventListener('DOMContentLoaded', function() {
//     const dateSelect = document.getElementById('date-select');
    
//     // Fetch the last available date
//     fetch('/get_last_available_date')
//         .then(response => response.json())
//         .then(data => {
//             dateSelect.value = data.last_date;
//             updatePerformanceData(data.last_date);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             dateSelect.value = new Date().toISOString().split('T')[0];
//         });
//     // Event listener for date change
//     updatePerformanceData(this.value);
//     dateSelect.addEventListener('change', function() {
//         updatePerformanceData(this.value);
//     });

// });

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

// Scripts for the Prospect Qualification page
// Function to populate the Prospect Personas table
function populateProspectPersonas() {
    fetch('/get_prospect_personas')
        .then(response => response.json())
        .then(data => {
            document.getElementById('best-solar-panels').textContent = data.best.solar_panels_on_roof;
            document.getElementById('worst-solar-panels').textContent = data.worst.solar_panels_on_roof;
            document.getElementById('best-roof-condition').textContent = data.best.roof_type_condition;
            document.getElementById('worst-roof-condition').textContent = data.worst.roof_type_condition;
            document.getElementById('best-shading-issues').textContent = data.best.shading_issues;
            document.getElementById('worst-shading-issues').textContent = data.worst.shading_issues;
            document.getElementById('best-appliances').textContent = data.best.appliances;
            document.getElementById('worst-appliances').textContent = data.worst.appliances;
            document.getElementById('best-electricity-bill').textContent = data.best.electricity_bill_estimate;
            document.getElementById('worst-electricity-bill').textContent = data.worst.electricity_bill_estimate;
            document.getElementById('best-decision-makers').textContent = data.best.number_of_decision_makers;
            document.getElementById('worst-decision-makers').textContent = data.worst.number_of_decision_makers;
            document.getElementById('best-age').textContent = data.best.approximate_age;
            document.getElementById('worst-age').textContent = data.worst.approximate_age;
            document.getElementById('best-inhabitants').textContent = data.best.number_inhabitants;
            document.getElementById('worst-inhabitants').textContent = data.worst.number_inhabitants;
        })
        .catch(error => console.error('Error:', error));
}

let prospectsDataDistributionChart;

function createProspectsDataDistributionChart(data) {
    const ctx = document.getElementById('prospectsDataDistributionChart').getContext('2d');
    const isNumerical = data.type === 'numerical';

    if (prospectsDataDistributionChart) {
        prospectsDataDistributionChart.destroy();
    }

    // Define the order of responses and their corresponding colors
    const responseOrder = [
        'Undefined',
        'No answer',
        'Not interested (Renter)',
        'Not interested (Homeowner)',
        'Request to Return later',
        'Positive conversation (Initial)',
        'Positive conversation (Detailed)',
        'Appointment set'
    ];

    const colorMap = {
        'Undefined': 'rgba(255, 255, 255, 0.6)',
        'No answer': 'rgba(128, 128, 128, 0.6)',
        'Not interested (Renter)': 'rgba(255, 165, 0, 0.6)',
        'Not interested (Homeowner)': 'rgba(255, 0, 0, 0.6)',
        'Request to Return later': 'rgba(255, 215, 0, 0.6)',
        'Positive conversation (Initial)': 'rgba(0, 0, 255, 0.6)',
        'Positive conversation (Detailed)': 'rgba(173, 216, 230, 0.6)',
        'Appointment set': 'rgba(0, 128, 0, 0.6)'
    };

    let chartData;
    if (isNumerical) {
        chartData = {
            labels: data.responses,
            datasets: [{
                label: 'Average',
                data: data.values,
                backgroundColor: data.responses.map(response => colorMap[response] || 'rgba(75, 192, 192, 0.6)'),
                borderColor: data.responses.map(response => colorMap[response]?.replace('0.6', '1') || 'rgba(75, 192, 192, 1)'),
                borderWidth: 1
            }]
        };
    } else {
        // Sort the data according to the responseOrder
        const sortedIndices = responseOrder.map(response => data.responses.indexOf(response)).filter(index => index !== -1);
        const sortedResponses = sortedIndices.map(index => data.responses[index]);
        const sortedValues = sortedIndices.map(index => data.values[index]);

        chartData = {
            labels: data.options,
            datasets: sortedResponses.map((response, index) => ({
                label: response,
                data: sortedValues[index],
                backgroundColor: colorMap[response] || `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`,
                borderColor: colorMap[response]?.replace('0.6', '1') || `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
                borderWidth: 1
            }))
        };
    }

    prospectsDataDistributionChart = new Chart(ctx, {
        type: isNumerical ? 'bar' : 'bar',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: !isNumerical,
                    title: {
                        display: true,
                        text: isNumerical ? 'Prospect Response' : 'Options'
                    }
                },
                y: {
                    stacked: !isNumerical,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: isNumerical ? 'Average Value' : 'Count'
                    }
                }
            },
            plugins: {
                legend: {
                    display: !isNumerical,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `Distribution of ${data.field}`
                }
            }
        }
    });
}

function fetchProspectsDataDistribution(field) {
    fetch(`/get_prospects_data_distribution/${field}`)
        .then(response => response.json())
        .then(data => {
            createProspectsDataDistributionChart(data);
        })
        .catch(error => console.error('Error:', error));
}

// Load components of the Prospect Qualification page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('best-solar-panels')) {
        populateProspectPersonas();
    }
    const fieldSelect = document.getElementById('field-select');

    if (fieldSelect) {
        fetchProspectsDataDistribution(fieldSelect.value);

        fieldSelect.addEventListener('change', function() {
            fetchProspectsDataDistribution(this.value);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const lists = document.querySelectorAll('.initiative-list');
    const addButton = document.getElementById('add-initiative');
    const modal = document.getElementById('initiative-modal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('initiative-form');

    function getInitiatives() {
        fetch('/get_initiatives')
            .then(response => response.json())
            .then(data => {
                initiatives = {
                    successful: data.filter(i => i.status === 'successful'),
                    current: data.filter(i => i.status === 'current'),
                    unsuccessful: data.filter(i => i.status === 'unsuccessful')
                };
                renderInitiatives();
            })
            .catch(error => console.error('Error fetching initiatives:', error));
    }

    function renderInitiatives() {
    Object.keys(initiatives).forEach(status => {
        const list = document.getElementById(`${status}-list`);
        list.innerHTML = '';
        initiatives[status].forEach((initiative, index) => {
            const item = createInitiativeElement(initiative, index, status);
            list.appendChild(item);
        });
    });
}

    function createInitiativeElement(initiative, index, currentBucket) {
        const item = document.createElement('div');
        item.classList.add('initiative-item');
        item.draggable = true;
        
        // Determine the other two buckets
        const buckets = ['successful', 'current', 'unsuccessful'];
        const otherBuckets = buckets.filter(bucket => bucket !== currentBucket);

        item.innerHTML = `
            <span class="problem-tag">${initiative.problem}</span>
            <h4>${initiative.title}</h4>
            <p><i>Description:</i> ${initiative.description}</p>
            <p><i>Timeline:</i> ${initiative.timeline}</p>
            <p><i>Estimated Cost:</i> $${initiative.cost}</p>
            <p><i>People Involved:</i> ${initiative.people}</p>
            <div class="initiative-buttons">
                <button class="edit-initiative" data-id="${initiative._id}">Edit</button>
                <button class="delete-initiative" data-id="${initiative._id}">Delete</button>
            </div>
            <div class="move-buttons">
                <button class="move-initiative" data-target="${otherBuckets[0]}">Move to ${otherBuckets[0]}</button>
                <button class="move-initiative" data-target="${otherBuckets[1]}">Move to ${otherBuckets[1]}</button>
            </div>
        `;
        item.dataset.index = index;
        item.dataset.id = initiative._id;
        
        // Add event listener for delete button
        const deleteButton = item.querySelector('.delete-initiative');
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent dragging when clicking delete
            deleteInitiative(initiative._id);
        });
        
        // Add event listener for edit button
        const editButton = item.querySelector('.edit-initiative');
        editButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent dragging when clicking edit
            openEditModal(initiative);
        });

        // Add event listeners for move buttons
        const moveButtons = item.querySelectorAll('.move-initiative');
        moveButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent dragging when clicking move
                const targetBucket = this.getAttribute('data-target');
                moveInitiative(initiative, currentBucket, targetBucket);
            });
        });
        
        return item;
    }

    function openEditModal(initiative) {
        const modal = document.getElementById('initiative-modal');
        const form = document.getElementById('initiative-form');
        
        // Populate form fields with initiative data
        document.getElementById('initiative-id').value = initiative._id;
        document.getElementById('initiative-title').value = initiative.title;
        document.getElementById('initiative-problem').value = initiative.problem;
        document.getElementById('initiative-description').value = initiative.description;
        document.getElementById('initiative-timeline').value = initiative.timeline;
        document.getElementById('initiative-cost').value = initiative.cost;
        document.getElementById('initiative-people').value = initiative.people;
        
        modal.style.display = 'block';
    }

    function moveInitiative(initiative, fromBucket, toBucket) {
        // Remove initiative from current bucket
        initiatives[fromBucket] = initiatives[fromBucket].filter(init => init._id !== initiative._id);
        
        // Add initiative to new bucket
        initiatives[toBucket].push(initiative);
        
        // Update initiative status in the database
        updateInitiativeStatus(initiative._id, toBucket);
        
        // Re-render initiatives
        renderInitiatives();
    }
    function deleteInitiative(initiativeId) {
        if (confirm('Are you sure you want to delete this initiative?')) {
            fetch(`/delete_initiative/${initiativeId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                getInitiatives();
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function updateInitiativeStatus(initiativeId, newStatus) {
        fetch(`/update_initiative/${initiativeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    }

    function updateInitiative(initiativeId, initiative) {
        fetch(`/update_initiative/${initiativeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(initiative),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Initiative updated:', data);
            modal.style.display = 'none';
            form.reset();
            getInitiatives();
        })
        .catch(error => {
            console.error('Error updating initiative:', error);
        });
    }    

    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggingItem);
            } else {
                list.insertBefore(draggingItem, afterElement);
            }
        });

        list.addEventListener('dragend', () => {
            const items = Array.from(list.querySelectorAll('.initiative-item'));
            const bucketId = list.id.split('-')[0];
            initiatives[bucketId] = items.map(item => initiatives[item.dataset.bucketId][item.dataset.index]);
            saveInitiative();
            renderInitiatives();
        });
    });

    // FIXME: you can currently drag initiatives between buckets, but you can't drop them in the bucket
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.initiative-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addButton.addEventListener('click', () => {
        form.reset();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const initiativeId = document.getElementById('initiative-id').value;
        const initiative = {
            problem: document.getElementById('initiative-problem').value,
            title: document.getElementById('initiative-title').value,
            description: document.getElementById('initiative-description').value,
            timeline: document.getElementById('initiative-timeline').value,
            cost: parseFloat(document.getElementById('initiative-cost').value),
            people: parseInt(document.getElementById('initiative-people').value),
            status: initiativeId ? undefined : 'current' // Only set status for new initiatives
        };
        
        if (initiativeId) {
            // If initiativeId exists, it's an edit operation
            updateInitiative(initiativeId, initiative);
        } else {
            // Otherwise, it's a new initiative
            saveInitiative(initiative);
        }
    });

    // FIXME: for some unknown reason, the if the description of the initiative is too long, the new initiative saved overwrites the previous ones in the bucket. So one has to first save the initiative with a small description, and then update it with the full description to avoid this problem. It makes no sense at all, but it is what it is
    function saveInitiative(initiative) {
        console.log('Sending initiative:', initiative);
        fetch('/save_initiative', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(initiative),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Initiative saved:', data);
            renderInitiatives();
            modal.style.display = 'none';
            form.reset();
            getInitiatives();
        })
        .catch(error => {
            console.error('Error saving initiative:', error);
        });
    }
    getInitiatives();
});

// Scripts for the Analytics page
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

// Team' Performance chart
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

// Prospects' Response chart 
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

    // Define the order and colors to match the histogram chart
    const responseOrder = [
        'Undefined',
        'No answer',
        'Not interested (Renter)',
        'Not interested (Homeowner)',
        'Request to Return later',
        'Positive conversation (Initial)',
        'Positive conversation (Detailed)',
        'Appointment set'
    ];

    const colorMap = {
        'Undefined': 'rgba(255, 255, 255, 0.6)',
        'No answer': 'rgba(128, 128, 128, 0.6)',
        'Not interested (Renter)': 'rgba(255, 165, 0, 0.6)',
        'Not interested (Homeowner)': 'rgba(255, 0, 0, 0.6)',
        'Request to Return later': 'rgba(255, 215, 0, 0.6)',
        'Positive conversation (Initial)': 'rgba(0, 0, 255, 0.6)',
        'Positive conversation (Detailed)': 'rgba(173, 216, 230, 0.6)',
        'Appointment set': 'rgba(0, 128, 0, 0.6)'
    };

    // Sort and filter the data according to the defined order
    const sortedData = responseOrder
        .filter(response => data.hasOwnProperty(response))
        .map(response => ({
            response: response,
            count: data[response]
        }));

    prospectResponsesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedData.map(item => item.response),
            datasets: [{
                data: sortedData.map(item => item.count),
                backgroundColor: sortedData.map(item => colorMap[item.response]),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Reasons of No chart 
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

// Load the pie charts
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





