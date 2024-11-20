//DESCRIPTION: This script defines event listerns in the top section,
//              and then functions mapped to those listeners to handhe
//              the events.  You can hand this file to chatgpt and ask
//              it to add event listeners for elements on your html page
//              (give it an element id and the event you want to listen for).
//              When you do, you can also ask it to create a function to
//              handle the event that will be called by the listener.

function displayRegister() {
    var registerModal = new bootstrap.Modal(document.getElementById('createAccountModal'));
    registerModal.show();
}

// Wait until the DOM is fully loaded before attaching the event listener
document.addEventListener("DOMContentLoaded", function() {
    // Add the event listener to the form submit event
    document.getElementById("createAccountForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Grab the input values from the form fields
        const email = document.getElementById("createEmail").value;
        const password = document.getElementById("createPassword").value;
        const description = document.getElementById("createDescription").value;

        // Call the handleRegistration function with the grabbed values
        handleRegistration(email, password, description);
    });

    // Add the event listener to the login form submit event
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Grab the input values from the form fields
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Call the handleLoginClick function with the grabbed values
        handleLoginClick(email, password);
    });


});


//PLACE ALL OF YOUR FUNCTIONS BELOW
//  - functions called by the event listeners above
//  - any helper functions
// Function to handle login process

// TEMPLATE: handling login and storing the JWT token in localStorage
// Note: funcion retries 2 times if a server error is received
function handleLoginClick(username, password, attempt = 1) {
    // map this to your login route in routes.py - in this example it is /login
    fetch('/login', {
        method: 'POST',  // Send POST request to login endpoint
        headers: {
            'Content-Type': 'application/json',  // Send data as JSON
        },
        body: JSON.stringify({
            email: username,  // Username is assumed to be the email field
            password: password  // Include password in the request body
        }),
    })
    .then(response => {
        if (response.status === 500 && attempt <= 3) {
            // Retry the login on internal server error (up to 3 attempts)
            console.warn('Internal Server Error during login. Retrying attempt:', attempt);
            return new Promise((resolve) => setTimeout(resolve, 300))  // 300ms delay between retries
                .then(() => handleLoginClick(username, password, attempt + 1));  // Recursive retry call
        }
        return response.json();  // Parse response as JSON if not a 500 error
    })
    .then(data => {
        if (data.error) {
            // Handle login failure (e.g., display error message)
            alert('Login failed: ' + data.error);
        } else {

            // Storing the JWT token in localStorage
            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('admin', data.admin);

            // Redirect to another page after successful login
            window.location.href = '/inside';  // Replace '/dashboard' with your desired route
        }
    })
    .catch((error) => {
        // Log any errors that occur during the request
        console.error('Error:', error);
    });
}

// TEMPLATE: handling registration and displaying success message
// Sends a registration request to the server with email, password, and optional description (up to 3 retries on server error)
function handleRegistration(email, password, description = "", attempt = 1) {
    // Assumes you have a route in routes.py mapped to /create_account
    fetch('/create_account', {
        method: 'POST',  // Send POST request to create_account endpoint
        headers: {
            'Content-Type': 'application/json',  // Send data as JSON
        },
        body: JSON.stringify({
            email: email,  // Include email in the request body
            password: password,  // Include password in the request body
            description: description  // Optional description
        }),
    })
    .then(response => {
        if (response.status === 500 && attempt <= 3) {
            // Retry the registration on internal server error (up to 3 attempts)
            console.warn('Internal Server Error. Retrying attempt:', attempt);
            return new Promise((resolve) => setTimeout(resolve, 300))  // 300ms delay between retries
                .then(() => handleRegistration(email, password, description, attempt + 1));  // Recursive retry call
        }
        return response.json();  // Parse response as JSON if not a 500 error
    })
    .then(data => {
        if (data.error) {
            // Handle registration failure (e.g., display error message)
            alert('Error creating account: ' + data.error);
        } else {
            // Display success message upon successful account creation
            alert('Account created successfully!');

            // Clear the input fields in the registration modal
            document.getElementById('createEmail').value = '';
            document.getElementById('createPassword').value = '';
            document.getElementById('createDescription').value = '';

            // Hide the registration modal using Bootstrap's modal method
            const registerModalEl = document.getElementById('createAccountModal');
            const modalInstance = bootstrap.Modal.getInstance(registerModalEl); // Get the existing modal instance
            modalInstance.hide();

            // Populate the login form with the new credentials
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
        }
    })
    .catch((error) => {
        // Log any errors that occur during the request
        console.error('Error:', error);
    });
}

// EXAMPLE: Function to show a bootstrap modal
//          Note: this function would be called from an event listener
//                (e.g., a button click event) defined above when the 
//                DOM is loaded
//function showRegisterModal() {
//    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));  // Initialize the modal
//    registerModal.show();  // Show the modal
//}

