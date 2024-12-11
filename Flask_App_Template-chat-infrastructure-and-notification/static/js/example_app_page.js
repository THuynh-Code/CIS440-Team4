// Global variables
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataModel
    DataModel.initialize();

    // Connect WebSocket if user is authenticated
    if (localStorage.getItem('jwtToken')) {
        ChatSocket.connect();
        ChatSocket.setMessageCallback(handleMessage);
    }

    // Check admin status and setup UI accordingly
    const adminStatus = localStorage.getItem('admin') === 'true';
    DataModel.admin = adminStatus;
    
    if (adminStatus) {
        loadUsersIntoTable();
    } else {
        const adminTab = document.getElementById('account-management-tab');
        if (adminTab) {
            adminTab.classList.add('disabled');
            adminTab.setAttribute('disabled', 'true');
        }
    }

    // Set up WebSocket callbacks
    ChatSocket.setMessageCallback(function(data) {
        addMessageToUI(data);
    });

    ChatSocket.setNotificationCallback(handleNotification);

    // Setup Filters
    setupFilters();

    // Setup Form Handlers
    setupFormHandlers();

    // Load initial listings
    loadListings();
});

// Filter Setup and Handling
function setupFilters() {
    // Quick filter buttons
    const quickFilterButtons = document.querySelectorAll('.quick-filters button');
    quickFilterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            quickFilterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set the category select to match the quick filter
            const categorySelect = document.querySelector('.col-md-3:last-child select');
            if (categorySelect) {
                categorySelect.value = this.textContent.trim();
            }
            
            loadListings();
        });
    });

    // Search input handler with debounce
    const searchInput = document.querySelector('.search-section input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadListings();
        }, 300));
    }

    // Select handlers
    const filterSelects = document.querySelectorAll('.col-md-3 select');
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            loadListings();
        });
    });
}

function handleLogout() {
    // Clear the JWT token and admin status from localStorage
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('admin');
    
    // Disconnect WebSocket if connected
    if (ChatSocket.socket) {
        ChatSocket.socket.disconnect();
    }
    
    // Redirect to login page
    window.location.href = '/';
}

// Form Handlers Setup
function setupFormHandlers() {
    // New Listing Form
    const newListingForm = document.getElementById('newListingForm');
    if (newListingForm) {
        newListingForm.addEventListener('submit', handleNewListing);
    }

    // Add User Form
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    // Edit User Form
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }

    // Purchase Modal Checkbox
    const inPersonPickupCheckbox = document.getElementById('inPersonPickupCheckbox');
    if (inPersonPickupCheckbox) {
        inPersonPickupCheckbox.addEventListener('change', toggleShippingInfo);
    }
}

// Modal opener function
function openNewListingModal() {
    const modalElement = document.getElementById('newListingModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// Listing Management Functions
async function loadListings() {
    try {
        console.log('Loading listings...');
        
        // Get current filter values
        const searchTerm = document.querySelector('.search-section input')?.value || '';
        const campus = document.querySelector('.col-md-3 select')?.value || 'All Campuses';
        const category = document.querySelector('.col-md-3:last-child select')?.value || 'All Categories';

        console.log('Filter values:', { searchTerm, campus, category });

        // Build query parameters
        const queryParams = new URLSearchParams({
            search: searchTerm,
            campus: campus,
            category: category
        });

        // Make API request with filters
        const response = await fetch(`/api/listings?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        });

        console.log('Listings response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch listings');
        }
        
        const listings = await response.json();
        console.log('Received listings:', listings);
        displayListings(listings);
        
    } catch (error) {
        console.error('Error loading listings:', error);
    }
}

function displayListings(listings) {
    const container = document.querySelector('.row.g-4');
    if (!container) {
        console.error('Listings container not found');
        return;
    }

    container.innerHTML = '';
    
    listings.forEach(listing => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3';
        
        col.innerHTML = `
            <div class="card listing-card h-100" style="cursor: pointer;" role="button">
                <img src="${listing.image_url || defaultImage}" 
                     class="card-img-top listing-img" 
                     alt="${listing.title}"
                     onerror="this.src='${defaultImage}'">
                <div class="card-body">
                    <h5 class="card-title text-truncate">${listing.title}</h5>
                    <p class="price-text">$${listing.price.toFixed(2)}</p>
                    <p class="description-text">${listing.description}</p>
                    <div class="location-badge">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${listing.campus}</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <small class="text-muted">Posted ${formatTimeAgo(new Date(listing.created_at))}</small>
                </div>
            </div>
        `;

        // Add click event listener to the card
        const card = col.querySelector('.listing-card');
        console.log('Setting up click handler for card:', listing.title); // Debug log
        
        card.addEventListener('click', function(e) {
            console.log('Card clicked:', listing); // Debug log
            showExpandedView(listing);
        });
        
        container.appendChild(col);
    });
}

async function handleNewListing(event) {
    event.preventDefault();
    console.log('Form submitted');
    const formData = new FormData(event.target);
    
    const listingData = {
        title: formData.get('title'),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        campus: formData.get('campus'),
        description: formData.get('description'),
        image_url: formData.get('image_url')
    };
    
    console.log('Sending listing data:', listingData);
    
    try {
        const response = await fetch('/api/listings/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(listingData)
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
            throw new Error('Failed to create listing');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('newListingModal'));
        modal.hide();
        event.target.reset();
        
        await loadListings();
        alert('Listing created successfully!');
        
    } catch (error) {
        console.error('Error creating listing:', error);
        alert('Failed to create listing: ' + error.message);
    }
}

async function deleteListing(listingId) {
    if (!confirm('Are you sure you want to delete this listing?')) {
        return;
    }

    console.log('Deleting listing with ID:', listingId);

    try {
        const response = await fetch(`/api/listings/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error('Failed to delete listing');
        }

        // Remove the listing card from the DOM
        const listingCard = document.querySelector(`button[onclick="deleteListing(${listingId})"]`).closest('.col-12');
        if (listingCard) {
            listingCard.remove();
        }

        alert('Listing deleted successfully!');

    } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing: ' + error.message);
    }
}

async function editListing(listingId) {
    // First get the current listing data
    const listing = DataModel.listings.find(l => l.id === listingId);
    if (!listing) {
        console.error('Listing not found:', listingId);
        return;
    }

    // Get modal elements
    const modalElement = document.getElementById('editListingModal');
    if (!modalElement) {
        console.error('Edit modal not found');
        return;
    }

    // Get form elements
    const titleInput = modalElement.querySelector('input[name="title"]');
    const priceInput = modalElement.querySelector('input[name="price"]');
    const descriptionInput = modalElement.querySelector('textarea[name="description"]');
    const categorySelect = modalElement.querySelector('select[name="category"]');
    const campusSelect = modalElement.querySelector('select[name="campus"]');
    const imageUrlInput = modalElement.querySelector('input[name="image_url"]');

    // Populate form with current listing data
    if (titleInput) titleInput.value = listing.title;
    if (priceInput) priceInput.value = listing.price;
    if (descriptionInput) descriptionInput.value = listing.description;
    if (categorySelect) categorySelect.value = listing.category;
    if (campusSelect) campusSelect.value = listing.campus;
    if (imageUrlInput) imageUrlInput.value = listing.image_url || '';

    // Set up form submission handler
    const form = modalElement.querySelector('form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            try {
                const updates = {
                    title: titleInput.value,
                    price: parseFloat(priceInput.value),
                    description: descriptionInput.value,
                    category: categorySelect.value,
                    campus: campusSelect.value,
                    image_url: imageUrlInput.value
                };

                // Update the listing using DataModel
                await DataModel.updateListing(listingId, updates);

                // Close the modal
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal.hide();

                // Refresh the listings display
                await loadListings();

                // Show success message
                alert('Listing updated successfully!');

            } catch (error) {
                console.error('Error updating listing:', error);
                alert('Failed to update listing: ' + error.message);
            }
        };
    }

    // Show the modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}


function showExpandedView(listing) {
    console.log('Opening expanded view for listing:', listing);
    
    const modalElement = document.getElementById('expandedViewModal');
    const modalTitle = document.getElementById('expandedModalTitle');
    const modalBody = modalElement.querySelector('.modal-body');
    
    if (!modalElement || !modalTitle || !modalBody) {
        console.error('Modal elements not found:', {
            modal: modalElement,
            title: modalTitle,
            body: modalBody
        });
        return;
    }

    try {
        modalTitle.textContent = listing.title;
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${listing.image_url || defaultImage}" 
                         class="img-fluid rounded" 
                         alt="${listing.title}">
                </div>
                <div class="col-md-6">
                    <h3 class="price-text mb-3">$${listing.price.toFixed(2)}</h3>
                    <p class="mb-3">${listing.description}</p>
                    <div class="location-badge mb-3">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${listing.campus}</span>
                    </div>
                    <div class="seller-info mt-3">
                        <h5>Seller Information</h5>
                        <p>${listing.user_email || 'Anonymous'}</p>
                    </div>
                </div>
            </div>
            <div class="messaging-section mt-4" style="display: none;">
                <hr>
                <h5>Message Seller</h5>
                <div class="messages-container mb-3" style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; padding: 10px;">
                </div>
                <div class="input-group">
                    <input type="text" class="form-control" id="messageInput" placeholder="Type your message...">
                    <button class="btn btn-primary" type="button" onclick="sendMessage()">Send</button>
                </div>
            </div>
        `;

        // Set up message button handler
        const messageButton = modalElement.querySelector('.btn-outline-primary');
        if (messageButton) {
            messageButton.onclick = function() {
                const expandedModal = bootstrap.Modal.getInstance(modalElement);
                expandedModal.hide();
                openMessagingModal(listing);
            };
        }

        // Set up purchase button handler
        const purchaseButton = modalElement.querySelector('.btn-asu-gold');
        if (purchaseButton) {
            purchaseButton.onclick = function() {
                console.log('Purchase button clicked');
                const expandedModal = bootstrap.Modal.getInstance(modalElement);
                expandedModal.hide();
                const purchaseModal = new bootstrap.Modal(document.getElementById('purchaseModal'));
                purchaseModal.show();
            };
        }

        console.log('Showing modal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        DataModel.setSelectedListing(listing.id);

    } catch (error) {
        console.error('Error showing expanded view:', error);
    }
}

function openMessagingModal(listing) {
    console.log('Opening messaging modal for listing:', listing);
    DataModel.setSelectedListing(listing);
    
    // Clear previous messages
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    // Show modal
    const messagingModal = new bootstrap.Modal(document.getElementById('messagingModal'));
    messagingModal.show();
    
    // Join the chat room
    ChatSocket.joinRoom(`listing_${listing.id}`);
    
    // Load existing messages
    loadMessages(listing.id);
}

async function loadMessages(listingId) {
    try {
        const response = await fetch(`/api/messages/${listingId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load messages');
        
        const messages = await response.json();
        const container = document.getElementById('messagesContainer');
        container.innerHTML = ''; // Clear container
        messages.forEach(msg => addMessageToUI(msg));
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ... other existing code ...

    // Setup message form handler
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            const listing = DataModel.getCurrentListing();
            
            if (message && listing) {
                console.log('Sending message:', message);
                // Send via WebSocket
                ChatSocket.socket.emit('message', {
                    message: message,
                    listing_id: listing.id,
                    token: localStorage.getItem('jwtToken')
                });
                
                // Add message to UI immediately
                addMessageToUI({
                    message: message,
                    sender_id: parseInt(localStorage.getItem('userId')),
                    sender_email: localStorage.getItem('userEmail'),
                    timestamp: new Date().toISOString()
                });
                
                // Clear input
                input.value = '';
            }
        });
    }
});

function addMessageToUI(messageData) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    console.log('Adding message to UI:', messageData);
    
    const messageElement = document.createElement('div');
    const isSentByMe = messageData.sender_id === parseInt(localStorage.getItem('userId'));
    
    messageElement.className = `message ${isSentByMe ? 'sent' : 'received'} mb-2`;
    messageElement.innerHTML = `
        <div class="message-content p-2 rounded ${isSentByMe ? 'bg-asu-maroon text-white' : 'bg-light'}">
            <small class="d-block ${isSentByMe ? 'text-white-50' : 'text-muted'}">${messageData.sender_email}</small>
            <div class="message-text">${messageData.message}</div>
            <small class="${isSentByMe ? 'text-white-50' : 'text-muted'}">
                ${formatTimeAgo(new Date(messageData.timestamp))}
            </small>
        </div>
    `;
    
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const listing = DataModel.getCurrentListing();
    
    if (message && listing) {
        ChatSocket.sendMessage(message, listing.user_id);
        messageInput.value = '';
        
        addMessageToUI({
            message: message,
            sender_id: 'me',
            timestamp: new Date()
        });
    }
}

function addMessageToUI(messageData) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${messageData.sender_id === 'me' ? 'sent' : 'received'} mb-2`;
    
    messageElement.innerHTML = `
        <div class="message-content p-2 rounded">
            <div class="message-text">${messageData.message}</div>
            <small class="text-muted">${formatTimeAgo(new Date(messageData.timestamp))}</small>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleNotification(notification) {
    switch(notification.type) {
        case 'new_listing':
            loadListings(); // Reload listings when a new one is created
            break;
        case 'listing_update':
            loadListings(); // Reload listings when one is updated
            break;
        case 'purchase':
            loadListings(); // Reload listings when one is purchased
            break;
    }
}

function toggleShippingInfo() {
    const isPickup = document.getElementById('inPersonPickupCheckbox').checked;
    const shippingInputs = document.querySelectorAll('.shipping-input');
    const shippingCollapse = document.getElementById('collapseShipping');
    const shippingAccordionButton = document.querySelector('#headingShipping button');

    shippingInputs.forEach(input => {
        input.disabled = isPickup;
        if (isPickup) input.value = '';
    });

    if (isPickup) {
        shippingCollapse.classList.remove('show');
        shippingAccordionButton.disabled = true;
    } else {
        shippingCollapse.classList.add('show');
        shippingAccordionButton.disabled = false;
    }
}

// Utility Functions
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// WebSocket Message Handler
function handleMessage(data) {
    if (data.room_id) {
        const roomElement = document.getElementById(`room-${data.room_id}`);
        if (roomElement) {
            addGlowEffect(roomElement);
        }
    }
}

function addGlowEffect(element) {
    if (element.classList.contains('glow-effect')) {
        element.classList.remove('glow-effect');
        setTimeout(() => element.classList.add('glow-effect'), 10);
    } else {
        element.classList.add('glow-effect');
    }
}

// Update the showYourListings function to include status display
async function showYourListings() {
    // Hide filter elements
    const searchSection = document.querySelector('.search-section');
    const quickFilters = document.querySelector('.quick-filters');
    if (searchSection) searchSection.style.display = 'none';
    if (quickFilters) quickFilters.style.display = 'none';

    // Get the main container
    const container = document.querySelector('.container .row.g-4');
    if (!container) return;

    try {
        // Get user's listings
        const response = await fetch('/api/listings/user/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch your listings');
        const listings = await response.json();

        // Clear and add title
        container.innerHTML = `
            <div class="col-12 mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <h2>Your Listings</h2>
                    <button class="btn btn-asu-gold" onclick="openNewListingModal()">
                        <i class="fas fa-plus me-1"></i> Create New Listing
                    </button>
                </div>
            </div>
        `;

        // Display listings
        listings.forEach(listing => {
            const statusColor = listing.status === 'purchased' ? 'text-success' : 'text-dark';
            const statusText = listing.status === 'purchased' ? 'Purchased' : 'Active';
            
            const col = document.createElement('div');
            col.className = 'col-12 mb-4';
            col.innerHTML = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center bg-asu-maroon text-white">
                        <h5 class="mb-0">${listing.title}</h5>
                        <span class="badge ${statusColor} bg-white">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${listing.image_url || defaultImage}" 
                                     class="img-fluid rounded" 
                                     alt="${listing.title}"
                                     onerror="this.src='${defaultImage}'">
                                <div class="mt-3">
                                    <p class="mb-2"><strong>Price:</strong> $${listing.price.toFixed(2)}</p>
                                    <p class="mb-2"><strong>Category:</strong> ${listing.category}</p>
                                    <p class="mb-2"><strong>Location:</strong> ${listing.campus}</p>
                                    <p class="mb-0"><strong>Listed:</strong> ${formatTimeAgo(new Date(listing.created_at))}</p>
                                </div>
                            </div>

                            <div class="col-md-8">
                                <h6>Description</h6>
                                <p>${listing.description}</p>
                                <div class="messages-section">
                                    <h6 class="mt-4">Messages</h6>
                                    <div class="messages-container border rounded p-3" style="height: 200px; overflow-y: auto;" id="messages-${listing.id}">
                                        <!-- Messages will be loaded here -->
                                    </div>
                                    <div class="input-group mt-2">
                                        <input type="text" class="form-control" id="reply-${listing.id}" placeholder="Type your reply...">
                                        <button class="btn btn-asu-maroon" onclick="sendSellerReply(${listing.id})">Reply</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                                                    
                    <div class="card-footer bg-light">
                        ${listing.status !== 'purchased' ? `
                            <button class="btn btn-danger" onclick="deleteListing(${listing.id})">
                                <i class="fas fa-trash me-1"></i> Delete Listing
                            </button>
                            <button class="btn btn-primary" onclick="editListing(${listing.id})">
                                <i class="fas fa-edit me-1"></i> Edit Listing
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            container.appendChild(col);
            // Load messages for this listing
            loadListingMessages(listing.id);
        });

    } catch (error) {
        console.error('Error loading your listings:', error);
        alert('Failed to load your listings. Please try again.');
    }
}



async function loadListingMessages(listingId) {
    const messagesContainer = document.getElementById(`messages-${listingId}`);
    if (!messagesContainer) return;

    try {
        const response = await fetch(`/api/messages/${listingId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load messages');
        const messages = await response.json();

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="text-center text-muted">No messages yet</div>';
            return;
        }

        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const isSent = msg.sender_id === parseInt(localStorage.getItem('userId'));
            const messageEl = document.createElement('div');
            messageEl.className = `message ${isSent ? 'sent' : 'received'} mb-2`;
            messageEl.innerHTML = `
                <div class="message-content p-2 rounded ${isSent ? 'bg-asu-maroon text-white' : 'bg-light'}">
                    <small class="${isSent ? 'text-white-50' : 'text-muted'}">${msg.sender_email}</small>
                    <div class="message-text">${msg.message}</div>
                    <small class="${isSent ? 'text-white-50' : 'text-muted'}">${formatTimeAgo(new Date(msg.timestamp))}</small>
                </div>
            `;
            messagesContainer.appendChild(messageEl);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div class="text-center text-danger">Failed to load messages</div>';
    }
}

function sendSellerReply(listingId) {
    const input = document.getElementById(`reply-${listingId}`);
    const message = input.value.trim();
    
    if (message) {
        // Send via WebSocket
        ChatSocket.socket.emit('message', {
            message: message,
            listing_id: listingId,
            token: localStorage.getItem('jwtToken')
        });
        
        // Clear input
        input.value = '';
    }
}

function showBrowse() {
    // Show filter elements
    const searchSection = document.querySelector('.search-section');
    const quickFilters = document.querySelector('.quick-filters');
    if (searchSection) searchSection.style.display = 'block';
    if (quickFilters) quickFilters.style.display = 'flex';

    // Reset filters and load listings
    const quickFilterButtons = document.querySelectorAll('.quick-filters button');
    quickFilterButtons.forEach(btn => btn.classList.remove('active'));
    
    const allItemsButton = document.querySelector('.quick-filters button:first-child');
    if (allItemsButton) {
        allItemsButton.classList.add('active');
    }

    const campusSelect = document.querySelector('.col-md-3 select');
    const categorySelect = document.querySelector('.col-md-3:last-child select');
    if (campusSelect) campusSelect.value = '';
    if (categorySelect) categorySelect.value = '';

    const searchInput = document.querySelector('.search-section input');
    if (searchInput) searchInput.value = '';

    loadListings();
}

// Format credit card number while typing
document.getElementById('cardNumber').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = '';
    
    for(let i = 0; i < value.length && i < 16; i++) {
        if(i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    e.target.value = formattedValue;
});

// Format phone number while typing
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = '';
    
    if(value.length > 0) {
        formattedValue = value.substring(0, 3);
        if(value.length > 3) {
            formattedValue += '-' + value.substring(3, 6);
        }
        if(value.length > 6) {
            formattedValue += '-' + value.substring(6, 10);
        }
    }
    
    e.target.value = formattedValue;
});

// Format expiration date while typing
document.getElementById('expirationDate').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = '';
    
    if(value.length > 0) {
        formattedValue = value.substring(0, 2);
        if(value.length > 2) {
            formattedValue += '/' + value.substring(2, 4);
        }
    }
    
    e.target.value = formattedValue;
});

// Format Zip Code to only allow 5 digits
document.getElementById('zipCode').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    e.target.value = value.substring(0, 5); // Only keep first 5 digits
});

// Email validation function
function validateEmails() {
    const email = document.getElementById('email');
    const confirmEmail = document.getElementById('confirmEmail');
    const emailValue = email.value.trim();
    const confirmValue = confirmEmail.value.trim();

    if (emailValue && confirmValue) {
        if (emailValue !== confirmValue) {
            confirmEmail.setCustomValidity('Email addresses must match');
            return false;
        } else {
            confirmEmail.setCustomValidity('');
            return true;
        }
    }
    return true;
}

// Add email validation listeners
document.getElementById('email').addEventListener('input', validateEmails);
document.getElementById('confirmEmail').addEventListener('input', validateEmails);

async function submitPurchase() {
    const shippingForm = document.getElementById('shippingForm');
    const paymentForm = document.getElementById('paymentForm');
    const isPickup = document.getElementById('inPersonPickupCheckbox').checked;
    
    // Validate emails match
    if (!validateEmails()) {
        alert('Email addresses must match');
        return;
    }
    
    // Validate shipping form if not pickup
    if(!isPickup && !shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
    }
    
    // Always validate payment form
    if(!paymentForm.checkValidity()) {
        paymentForm.reportValidity();
        return;
    }
    
    try {
        const currentListing = DataModel.getCurrentListing();
        if (!currentListing) {
            throw new Error('No listing selected');
        }

        // Collect form data
        const formData = {
            isPickup: isPickup,
            listingId: currentListing.id,
            shipping: isPickup ? null : {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                address1: document.getElementById('address1').value,
                address2: document.getElementById('address2').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            },
            payment: {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expirationDate: document.getElementById('expirationDate').value,
                securityCode: document.getElementById('securityCode').value
            }
        };

        // Update listing status to purchased
        await DataModel.updateListing(currentListing.id, {
            ...currentListing,
            status: 'purchased'
        });
        
        // TODO: Add API call to process payment
        console.log('Purchase data:', formData);
        
        // Close modal and show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('purchaseModal'));
        modal.hide();
        
        // Refresh the listings display
        await loadListings();
        
        alert('Purchase completed successfully!');
        
    } catch(error) {
        console.error('Purchase failed:', error);
        alert('Failed to complete purchase. Please try again.');
    }
}
