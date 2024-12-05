const DataModel = {
    users: [],
    listings: [],
    admin: false,
    currentUser: null,
    currentListing: null,
    baseUrl: `${window.location.protocol}//${window.location.host}/`,

    // Helper function for making authenticated API requests with retries
    async fetchWithAuth(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json',
        };
        options.headers = headers;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                if (attempt === 3) throw error;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    },

    // User Management Methods
    async getAllUsers() {
        const url = this.baseUrl + 'users';
        try {
            const users = await this.fetchWithAuth(url, { method: 'GET' });
            this.users = users;
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    setSelectedUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.currentUser = user;
        } else {
            console.error('User not found');
        }
    },

    getCurrentUser() {
        return this.currentUser;
    },

    async addUser(email, password, description, isAdmin) {
        if (!email || !password || !description) {
            console.error('Email, password, and description are required.');
            return;
        }
    
        const url = this.baseUrl + 'add_user';
        const body = JSON.stringify({ email, password, description, isAdmin });
    
        try {
            const newUser = await this.fetchWithAuth(url, { method: 'POST', body });
            this.users.push(newUser);
            console.log('User added successfully:', newUser);
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    },

    async deleteUser() {
        if (!this.currentUser) {
            console.error('No user selected');
            return;
        }

        const url = this.baseUrl + `delete_user/${this.currentUser.id}`;
        try {
            await this.fetchWithAuth(url, { method: 'DELETE' });
            this.users = this.users.filter(u => u.id !== this.currentUser.id);
            console.log('User deleted successfully:', this.currentUser);
            this.currentUser = null;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    async editSelectedUser(email, description, isAdmin) {
        if (!this.currentUser) {
            console.error('No user selected');
            return;
        }

        const url = this.baseUrl + `edit_user/${this.currentUser.id}`;
        const body = JSON.stringify({ email, description, admin: isAdmin });

        try {
            const updatedUser = await this.fetchWithAuth(url, { method: 'PUT', body });
            this.currentUser.email = updatedUser.email;
            this.currentUser.description = updatedUser.description;
            this.currentUser.admin = updatedUser.admin;

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

    // Listing Management Methods
    async getAllListings() {
        const url = this.baseUrl + 'api/listings';
        try {
            const listings = await this.fetchWithAuth(url, { method: 'GET' });
            this.listings = listings;
            return listings;
        } catch (error) {
            console.error('Error fetching listings:', error);
            throw error;
        }
    },

    setSelectedListing(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (listing) {
            this.currentListing = listing;
        } else {
            console.error('Listing not found');
        }
    },

    getCurrentListing() {
        return this.currentListing;
    },

    async addListing(title, price, category, campus, description, imageUrl) {
        const url = this.baseUrl + 'api/listings/create';
        try {
            const newListing = await this.fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    price,
                    category,
                    campus,
                    description,
                    image_url: imageUrl
                })
            });
            this.listings.push(newListing);
            return newListing;
        } catch (error) {
            console.error('Error creating listing:', error);
            throw error;
        }
    },

    async deleteListing(listingId) {
        const url = this.baseUrl + `api/listings/${listingId}`;
        try {
            await this.fetchWithAuth(url, { method: 'DELETE' });
            this.listings = this.listings.filter(l => l.id !== listingId);
            if (this.currentListing?.id === listingId) {
                this.currentListing = null;
            }
        } catch (error) {
            console.error('Error deleting listing:', error);
            throw error;
        }
    },

    async updateListing(listingId, updates) {
        const url = this.baseUrl + `api/listings/${listingId}`;
        try {
            const updatedListing = await this.fetchWithAuth(url, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            const index = this.listings.findIndex(l => l.id === listingId);
            if (index !== -1) {
                this.listings[index] = updatedListing;
            }
            return updatedListing;
        } catch (error) {
            console.error('Error updating listing:', error);
            throw error;
        }
    },

    // Initialization
    async initialize() {
        try {
            await this.getAllListings();
            console.log('Data model initialized with listings:', this.listings);
        } catch (error) {
            console.error('Error initializing data model:', error);
        }
    }
};