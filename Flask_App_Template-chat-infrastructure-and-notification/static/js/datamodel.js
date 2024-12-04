const DataModel = {
    users: [],  // Placeholder for data fetched from the API
    chatrooms: [],
    admin: false,
    currentUser: null,  // Placeholder for the currently selected user
    currentChatroom: null,  // Placeholder for the currently selected chatroom
    baseUrl: `${window.location.protocol}//${window.location.host}/`,  // Base URL dynamically generated for API requests

    // Helper function for making authenticated API requests with retries
    async fetchWithAuth(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,  // Add JWT token for authentication
            'Content-Type': 'application/json',  // Ensure the request sends and receives JSON
        };
        options.headers = headers;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(url, options);  // Send the request using fetch
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return await response.json();  // Parse and return the response JSON if successful
            } catch (error) {
                if (attempt === 3) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 200));  // Optional delay before retrying
            }
        }
    },

    // Function to get all users and store them in the 'users' variable
    async getAllUsers() {
        const url = this.baseUrl + 'users';  // Construct the full API URL
        try {
            const users = await this.fetchWithAuth(url, { method: 'GET' });
            this.users = users;  // Store the fetched users
            return users;  // Return the users
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Function to get all chatrooms and store them in the 'chatrooms' variable
    async getAllChatrooms() {
        const url = this.baseUrl + 'chatrooms';  // Construct the full API URL
        try {
            const chatrooms = await this.fetchWithAuth(url, { method: 'GET' });
            this.chatrooms = chatrooms;  // Store the fetched chatrooms
            return chatrooms;  // Return the chatrooms
        } catch (error) {
            console.error('Error fetching chatrooms:', error);
            throw error;
        }
    },

    // Function to set the current user by their ID
    setSelectedUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.currentUser = user;  // Set the selected user
        } else {
            console.error('User not found');
        }
    },

    // Function to get the currently selected user
    getCurrentUser() {
        return this.currentUser;
    },

    // Function to add a new user
    async addUser(email, password, description, isAdmin) {
        if (!email || !password || !description) {
            console.error('Email, password, description, and isAdmin are required.');
            return;
        }
    
        const url = this.baseUrl + 'add_user';  // API URL for adding a new user
        const body = JSON.stringify({ email, password, description, isAdmin }); // Include isAdmin in the request body
    
        try {
            const newUser = await this.fetchWithAuth(url, { method: 'POST', body });
            this.users.push(newUser);  // Add the new user to the users array
            console.log('User added successfully:', newUser);
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    },

    // Function to delete the selected user
    async deleteUser() {
        if (!this.currentUser) {
            console.error('No user selected');
            return;
        }

        const url = this.baseUrl + `delete_user/${this.currentUser.id}`;  // API URL for deleting the selected user

        try {
            await this.fetchWithAuth(url, { method: 'DELETE' });
            this.users = this.users.filter(u => u.id !== this.currentUser.id);  // Remove the user from the users array
            console.log('User deleted successfully:', this.currentUser);
            this.currentUser = null;  // Clear the currentUser after deletion
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Function to edit the selected user (update email, description, and admin status)
    async editSelectedUser(email, description, isAdmin) {
        if (!this.currentUser) {
            console.error('No user selected');
            return;
        }

        const url = this.baseUrl + `edit_user/${this.currentUser.id}`;  // API URL for editing user
        const body = JSON.stringify({ email, description, admin: isAdmin }); // Include isAdmin in the body

        try {
            const updatedUser = await this.fetchWithAuth(url, { method: 'PUT', body });
            // Update the currentUser and users array with new values
            this.currentUser.email = updatedUser.email;
            this.currentUser.description = updatedUser.description;
            this.currentUser.admin = updatedUser.admin;  // Update the admin status

            // Update the user in the users array
            const index = this.users.findIndex(u => u.id === this.currentUser.id);
            if (index !== -1) {
                this.users[index] = this.currentUser;
            }
            return updatedUser;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Function to add a new chatroom
    async addChatroom(name, description) {
        if (!name || !description) {
            console.error('Name and description are required for adding a chatroom.');
            return;
        }

        const url = this.baseUrl + 'add_chatroom';  // API URL for adding a new chatroom
        const body = JSON.stringify({ name, description });

        try {
            const newChatroom = await this.fetchWithAuth(url, { method: 'POST', body });
            this.chatrooms.push(newChatroom);  // Add the new chatroom to the chatrooms array
            console.log('Chatroom added successfully:', newChatroom);
            return newChatroom;
        } catch (error) {
            console.error('Error adding chatroom:', error);
            throw error;
        }
    },

    // Function to delete the selected chatroom
    async deleteSelectedChatroom() {
        if (!this.currentChatroom) {
            console.error('No chatroom selected');
            return;
        }

        const chatroomId = this.currentChatroom.id;
        const url = this.baseUrl + `delete_chatroom/${chatroomId}`;  // API URL for deleting the chatroom

        try {
            await this.fetchWithAuth(url, { method: 'DELETE' });
            // Remove the chatroom from the chatrooms array
            this.chatrooms = this.chatrooms.filter(c => c.id !== chatroomId);
            console.log('Chatroom deleted successfully:', chatroomId);
            // Clear the current chatroom after deletion
            this.currentChatroom = null;
        } catch (error) {
            console.error('Error deleting chatroom:', error);
            throw error;
        }
    },


    // Function to edit the selected chatroom (update name and description)
    async editSelectedChatroom(name, description) {
        if (!this.currentChatroom) {
            console.error('No chatroom selected');
            return;
        }

        const chatroomId = this.currentChatroom.id;
        const url = this.baseUrl + `edit_chatroom/${chatroomId}`;  // API URL for editing chatroom
        const body = JSON.stringify({ name, description });

        try {
            const updatedChatroom = await this.fetchWithAuth(url, { method: 'PUT', body });
            // Update the currentChatroom and chatrooms array with new values
            this.currentChatroom.name = updatedChatroom.name;
            this.currentChatroom.description = updatedChatroom.description;

            // Update the chatroom in the chatrooms array
            const index = this.chatrooms.findIndex(c => c.id === chatroomId);
            if (index !== -1) {
                this.chatrooms[index] = this.currentChatroom;
            }
            console.log('Chatroom updated successfully:', updatedChatroom);
            return updatedChatroom;
        } catch (error) {
            console.error('Error updating chatroom:', error);
            throw error;
        }
    },


    // Function to set the current chatroom by its ID
    setSelectedChatroom(chatroomId) {
        const chatroom = this.chatrooms.find(c => c.id === chatroomId);
        if (chatroom) {
            this.currentChatroom = chatroom;  // Set the selected chatroom
        } else {
            console.error('Chatroom not found');
        }
    },

    // Function to get the currently selected chatroom
    getCurrentChatroom() {
        return this.currentChatroom;
    },


    // Function to initialize the data model by loading all users and chatrooms
    async initialize() {
        try {
            await this.getAllUsers();  // Call the function to get all users and store them in the model
            await this.getAllChatrooms();  // Call the function to get all chatrooms and store them in the model
            console.log('Data model initialized with users and chatrooms:', this.users, this.chatrooms);
        } catch (error) {
            console.error('Error initializing data model:', error);
        }
    }
};
