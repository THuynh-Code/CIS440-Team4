document.addEventListener('DOMContentLoaded', function() {

    // NOTE: IF YOUR APP USES WEBSOCKETS THEN UNCOMMENT THIS LINE
    //       TO ESTABLISH A CONNECTION TO THE WEBSOCKET SERVER

    // ChatSocket.connect();  // Establish the WebSocket connection

    // NOTE: SET CALLBACKS FOR SOCKET EVENTS HERE (MAPPED TO FUNCTIONS BELOW)

    // ChatSocket.setMessageCallback(sendChat);

    // Example usage: set up event listeners for adding and deleting users (if buttons exist)
    // Assuming you have addUserButton and deleteUserButton in your HTML
    /*
    document.getElementById('addUserButton').addEventListener('click', () => {
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const description = document.getElementById('userDescription').value;
        addUser(email, password, description);
    });
    */

    // Listen for the form submission
    document.getElementById('addUserForm').addEventListener('submit', function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();
    
        // Collect data from the form inputs
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        var description = document.getElementById('description').value;
        // Get the checkbox value and convert it to a boolean
        var isAdmin = document.getElementById('isAdmin').checked;
    
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Description:', description);
        console.log('Is Admin:', isAdmin); // Log the admin status
    
        // Call the addUser function with the form data, including the admin status
        addUser(email, password, description, isAdmin).then(() => {
            // Clear the input fields after user is added
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('description').value = '';
            document.getElementById('isAdmin').checked = false; // Reset the checkbox
    
            // Hide the modal using Bootstrap's modal instance
            const addUserModalEl = document.getElementById('addUserModal');
            const modalInstance = bootstrap.Modal.getInstance(addUserModalEl); // Get existing modal instance
            modalInstance.hide();
        }).catch((error) => {
            console.error('Error adding user:', error);
            alert('Error adding user. Please try again.');
        });
    
        loadUsersIntoTable();
    });

    // Add a listener for the Edit User form submission
document.getElementById('editUserForm').addEventListener('submit', async function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Collect data from the form inputs
    const email = document.getElementById('editEmail').value;
    const description = document.getElementById('editDescription').value;
    const isAdmin = document.getElementById('editIsAdmin').checked;  // Grab the value of the isAdmin checkbox

    try {
        // Call the DataModel's editSelectedUser function to update the user
        await DataModel.editSelectedUser(email, description, isAdmin);  // Pass isAdmin as the third parameter

        // If the update was successful, clear the modal inputs
        document.getElementById('editEmail').value = '';
        document.getElementById('editDescription').value = '';
        document.getElementById('editIsAdmin').checked = false; // Reset the checkbox

        // Hide the modal
        const editUserModalEl = document.getElementById('editUserModal');
        const modalInstance = bootstrap.Modal.getInstance(editUserModalEl);
        modalInstance.hide();

        // Alert that the user was successfully edited
        alert('User successfully edited!');

        // Refresh the user list in the table
        loadUsersIntoTable();
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Error editing user. Please try again.');
    }
});

    // Listener for adding a chatroom (To be placed inside the DOMContentLoaded event listener)
    document.getElementById('addChatroomForm').addEventListener('submit', async function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Collect data from the form inputs
        const name = document.getElementById('chatroomName').value;
        const description = document.getElementById('chatroomDescription').value;

        try {
            // Call the DataModel's addChatroom function to add the chatroom
            await DataModel.addChatroom(name, description);
            console.log('Chatroom created:', name);
            alert('Chatroom successfully added!');

            // Clear the input fields after chatroom is added
            document.getElementById('chatroomName').value = '';
            document.getElementById('chatroomDescription').value = '';

            // Hide the modal using Bootstrap's modal instance
            const addChatroomModalEl = document.getElementById('addChatroomModal');
            const modalInstance = bootstrap.Modal.getInstance(addChatroomModalEl);
            modalInstance.hide();

            // Refresh chatroom list in the table
            loadChatroomsIntoTable();
        } catch (error) {
            console.error('Error adding chatroom:', error);
            alert('Error adding chatroom. Please try again.');
        }
    });

    // Listener for editing a chatroom (To be placed inside the DOMContentLoaded event listener)
    document.getElementById('editChatroomForm').addEventListener('submit', async function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Collect data from the form inputs
        const name = document.getElementById('editChatroomName').value;
        const description = document.getElementById('editChatroomDescription').value;

        try {
            // Call the DataModel's editSelectedChatroom function to update the chatroom
            await DataModel.editSelectedChatroom(name, description);

            // Clear the modal inputs
            document.getElementById('editChatroomName').value = '';
            document.getElementById('editChatroomDescription').value = '';

            // Hide the modal
            const editChatroomModalEl = document.getElementById('editChatroomModal');
            const modalInstance = bootstrap.Modal.getInstance(editChatroomModalEl);
            modalInstance.hide();

            // Alert that the chatroom was successfully edited
            alert('Chatroom successfully edited!');

            // Refresh chatroom list in the table
            loadChatroomsIntoTable();
        } catch (error) {
            console.error('Error editing chatroom:', error);
            alert('Error editing chatroom. Please try again.');
        }
    });


    adminStatus = localStorage.getItem('admin');
    //alert('adminStatus: ' + adminStatus);
    DataModel.admin = adminStatus;
    if (adminStatus == 'true') {
        // Load users into the table after adding a new user
        loadUsersIntoTable();
    } else {
        // Disable the account management tab
        //alert('You are not an admin');
        document.getElementById('account-management-tab').classList.add('disabled');  // Add the 'disabled' class to the tab
        document.getElementById('account-management-tab').setAttribute('disabled', 'true');  // Set the disabled attribute
    }

    // Load chatrooms into the table
    loadChatroomsIntoTable();
    ChatSocket.setMessageCallback(handleMessage);
    ChatSocket.connect();
});

// NOTE: PLACE ALL OF YOUR FUNCTIONS BELOW

// Example function that sends a websocket message via the ChatSocket object
function sendChat(text) {
    // Checks to make sure string is not empty
    if (text.trim() === "") {
        console.error("Cannot send an empty message.");  // Log error if message is empty
        return;
    }

    ChatSocket.sendMessage(text);  // Send the message using ChatSocket
}

// Function to add a new user
async function addUser(email, password, description, isAdmin) {
    if (!email || !password || !description) {
        console.error("Email, password, and description are required.");
        return;
    }

    try {
        // Use DataModel's addUser function to add the user, including the isAdmin parameter
        const result = await DataModel.addUser(email, password, description, isAdmin);
        console.log('User created:', result);
        alert('User successfully added!');  // Show a success message

        await loadUsersIntoTable();  // Refresh user list in the table after addition

    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user. Please try again.');
    }
}

// Function to delete a user by ID
async function deleteUser(userId) {
    if (!userId) {
        console.error("User ID is required for deletion.");
        return;
    }

    // Ask for user confirmation before proceeding with deletion
    const isConfirmed = confirm(`Are you sure you want to delete this user? This action cannot be undone.`);

    // If the user confirms the deletion, proceed
    if (!isConfirmed) {
        return;  // Exit the function if the user doesn't confirm
    }

    try {
        // Call DataModel's deleteUser function to delete the user by their ID
        DataModel.setSelectedUser(userId);
        await DataModel.deleteUser();
        console.log(`User with ID ${userId} deleted.`);
        alert('User successfully deleted!');  // Show a success message
        await loadUsersIntoTable();  // Refresh user list in the table after deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}

// Function to load users into the table
async function loadUsersIntoTable() {
    try {
        const users = await DataModel.getAllUsers();  // Get all users from DataModel
        const tableBody = document.querySelector('#account-management tbody');  // Select the table body
        tableBody.innerHTML = '';  // Clear existing table rows

        users.forEach(user => {
            // Create a new row for each user
            const row = document.createElement('tr');

            // Email column
            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;
            row.appendChild(emailCell);

            // Admin status column (added next to the email)
            const adminCell = document.createElement('td');
            adminCell.textContent = user.admin ? 'Admin' : 'User';  // Display 'Admin' if user is an admin, otherwise 'User'
            row.appendChild(adminCell);

            // Description column
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = user.description;
            row.appendChild(descriptionCell);

            // Actions column
            const actionsCell = document.createElement('td');

            // Edit button
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm me-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => showEditModal(user.id));
            actionsCell.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.addEventListener('click', () => deleteUser(user.id));
            actionsCell.appendChild(deleteButton);

            row.appendChild(actionsCell);

            // Add the row to the table
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading users into table:', error);
        alert('Error loading users. Please try again.');
    }
}

// Function to load chatrooms into the table and dropdown
async function loadChatroomsIntoTable() {
    try {
        const chatrooms = await DataModel.getAllChatrooms();  // Get all chatrooms from DataModel
        
        // Populate the table
        const tableBody = document.querySelector('#main tbody');  // Select the table body
        tableBody.innerHTML = '';  // Clear existing content in table
        
        chatrooms.forEach(chatroom => {
            // Create a new row for each chatroom
            const row = document.createElement('tr');
            
            // Chatroom name column
           // Chatroom name column
            const nameCell = document.createElement('td');
            nameCell.textContent = chatroom.name;
            nameCell.id = "room-"+chatroom.id;  // Set the cell's ID to "room-<id>"
            row.appendChild(nameCell);
            
            // Description column
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = chatroom.description;
            row.appendChild(descriptionCell);
            
            // Actions column
            const actionsCell = document.createElement('td');
            
            // Edit button
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm me-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => showEditChatroomModal(chatroom.id));
            actionsCell.appendChild(editButton);
            
            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.addEventListener('click', () => deleteChatroom(chatroom.id));
            actionsCell.appendChild(deleteButton);
            
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        });
        
        // Populate the dropdown
        const dropdown = document.getElementById('quick_chat_room');
        dropdown.innerHTML = '<option selected>Select a room...</option>';  // Clear existing options, leaving default
        
        chatrooms.forEach(chatroom => {
            const option = document.createElement('option');
            option.value = chatroom.id;  // Set value as chatroom ID
            option.textContent = chatroom.name;  // Set display text as chatroom name
            dropdown.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading chatrooms into table:', error);
        alert('Error loading chatrooms. Please try again.');
    }
}

function openAddUserModal() {
    var addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    addUserModal.show();
  }

// Function to show the edit modal with user details
// Function to show the edit modal with user details
function showEditModal(userId) {
    // Set the selected user in DataModel
    DataModel.setSelectedUser(userId);  

    // Get the selected user object from DataModel
    const user = DataModel.getCurrentUser();  

    // Check if the user exists
    if (user) {
        // Populate the email and description inputs in the modal with the user's data
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editDescription').value = user.description;

        // Set the checkbox value based on the user's admin status
        document.getElementById('editIsAdmin').checked = user.admin;  // Update: Set checkbox for admin status

        // Show the edit modal
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
    } else {
        console.error('User not found');
    }
}

// Function to open the Add Chatroom Modal
function openAddChatroomModal() {
    var addChatroomModal = new bootstrap.Modal(document.getElementById('addChatroomModal'));
    addChatroomModal.show();
}

// Function to show the Edit Chatroom Modal with chatroom details
function showEditChatroomModal(chatroomId) {
    // Set the selected chatroom in DataModel
    DataModel.setSelectedChatroom(chatroomId);  

    // Get the selected chatroom object from DataModel
    const chatroom = DataModel.getCurrentChatroom();  

    // Check if the chatroom exists
    if (chatroom) {
        // Populate the name and description inputs in the modal with the chatroom's data
        document.getElementById('editChatroomName').value = chatroom.name;
        document.getElementById('editChatroomDescription').value = chatroom.description;

        // Show the edit chatroom modal
        const editChatroomModal = new bootstrap.Modal(document.getElementById('editChatroomModal'));
        editChatroomModal.show();
    } else {
        console.error('Chatroom not found');
    }
}

// Function to delete a chatroom by ID
async function deleteChatroom(chatroomId) {
    if (!chatroomId) {
        console.error("Chatroom ID is required for deletion.");
        return;
    }

    // Ask for user confirmation before proceeding with deletion
    const isConfirmed = confirm(`Are you sure you want to delete this chatroom? This action cannot be undone.`);

    // If the user confirms the deletion, proceed
    if (!isConfirmed) {
        return;  // Exit the function if the user doesn't confirm
    }

    try {
        // Call DataModel's deleteChatroom function to delete the chatroom by its ID
        DataModel.setSelectedChatroom(chatroomId);
        await DataModel.deleteSelectedChatroom();
        console.log(`Chatroom with ID ${chatroomId} deleted.`);
        alert('Chatroom successfully deleted!');  // Show a success message
        await loadChatroomsIntoTable();  // Refresh chatroom list in the table after deletion
    } catch (error) {
        console.error('Error deleting chatroom:', error);
        alert('Error deleting chatroom. Please try again.');
    }
}

// Function to send a quick chat message
function quickChatSend() {
    const message = document.getElementById('quick_chat_message').value.trim();
    const roomId = document.getElementById('quick_chat_room').value;

    // Check that both message and room are provided
    if (!message) {
        alert('Please enter a message before sending.');
        return;
    }
    if (roomId === "Select a room..." || !roomId) {
        alert('Please select a chat room before sending.');
        return;
    }

    // Send the message through ChatSocket
    ChatSocket.sendMessage(message, roomId);

    // Clear out the message input box
    document.getElementById('quick_chat_message').value = '';
}

function addGlowEffect(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.classList.contains('glow-effect')) {
            element.classList.remove('glow-effect');
            
            // Re-add the class after a brief delay to restart the animation
            setTimeout(() => {
                element.classList.add('glow-effect');
            }, 100); // 0.1 second delay
        } else {
            element.classList.add('glow-effect');
        }
    }
}

function handleMessage(message) {
    // Construct the element ID using the room_id from the message
    const elementId = `room-${message.room_id}`;
    
    // Check if the element exists in the DOM
    const element = document.getElementById(elementId);
    if (element) {
        // If it exists, apply the glow effect
        addGlowEffect(elementId);
    }
}

// Opens newListingModal when Create Listing Button is pressed
function openNewListingModal() {
    const modalElement = document.getElementById('newListingModal');
    const modal = new bootstrap.Modal(modalElement); // Use Bootstrap's Modal class
    modal.show(); // Display the modal
}

// opens modal for an expanded view when a listed object is clicked on
document.addEventListener("DOMContentLoaded", function () {
    // Select all listing cards
    const listingCards = document.querySelectorAll(".listing-card");

    listingCards.forEach((card) => {
        card.addEventListener("click", function () {
            // Get data from the clicked card
            const title = card.querySelector(".card-title").innerText;
            const price = card.querySelector(".price-text").innerText;
            const description = card.querySelector(".description-text").innerText;
            const location = card.querySelector(".location-badge").innerText;
            const imageSrc = card.querySelector(".listing-img").getAttribute("src");

            // Populate modal with data
            document.getElementById("expandedModalTitle").innerText = title;
            document.getElementById("expandedModalPrice").innerText = price;
            document.getElementById("expandedModalDescription").innerText = description;
            document.getElementById("expandedModalLocation").querySelector("span").innerText = location;
            document.getElementById("expandedModalImage").setAttribute("src", imageSrc);

            // Show the modal
            const expandedModal = new bootstrap.Modal(document.getElementById("expandedViewModal"));
            expandedModal.show();
        });
    });
});

// Opens purchaseModal within expandedViewModal
document.addEventListener("DOMContentLoaded", function () {
    // Add event listener to the purchase button in the expanded view modal
    const purchaseButton = document.querySelector("#expandedViewModal .btn-asu-gold");

    purchaseButton.addEventListener("click", function () {
        // Hide the expanded view modal
        const expandedModal = bootstrap.Modal.getInstance(document.getElementById("expandedViewModal"));
        expandedModal.hide();

        // Show the purchase modal
        const purchaseModal = new bootstrap.Modal(document.getElementById("purchaseModal"));
        purchaseModal.show();
    });
});

// When checking "In-Person Pickup," grays out shipping info and disabless input
function toggleShippingInfo() {
    const isPickup = document.getElementById("inPersonPickupCheckbox").checked;
    const shippingInputs = document.querySelectorAll(".shipping-input");
    const shippingCollapse = document.getElementById("collapseShipping");

    if (isPickup) {
        // Clear all inputs
        shippingInputs.forEach(input => {
            input.value = ""; // Clear value
            input.disabled = true; // Disable input
        });

        // Collapse the Shipping Information accordion
        shippingCollapse.classList.remove("show");

        // Disable the accordion button
        const shippingAccordionButton = document.querySelector("#headingShipping button");
        shippingAccordionButton.disabled = true;
    } else {
        // Enable inputs and reopen the accordion
        shippingInputs.forEach(input => {
            input.disabled = false;
        });

        // Reopen the Shipping Information accordion
        shippingCollapse.classList.add("show");

        // Enable the accordion button
        const shippingAccordionButton = document.querySelector("#headingShipping button");
        shippingAccordionButton.disabled = false;
    }
}




