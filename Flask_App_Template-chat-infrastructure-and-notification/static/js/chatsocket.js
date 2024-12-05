const ChatSocket = {
    socket: null,
    jwtToken: localStorage.getItem('jwtToken'),
    messageCallback: null,
    notificationCallback: null,
    currentRoom: null,

    connect: function () {
        if (!this.jwtToken) {
            console.error("No JWT token found. Cannot connect to WebSocket.");
            return;
        }

        this.socket = io.connect(`${window.location.protocol}//${window.location.host}`, {
            transports: ['websocket', 'polling'],    
            query: `token=${this.jwtToken}`
        });

        this.socket.on('connect', () => {
            console.log('SocketIO connection established.');
        });

        // Handle different types of messages
        this.socket.on('chat_message', (data) => {
            console.log("Received chat message:", data);
            if (this.messageCallback) {
                this.messageCallback(data);
            }
        });

        this.socket.on('listing_update', (data) => {
            console.log("Listing update received:", data);
            if (this.notificationCallback) {
                this.notificationCallback({
                    type: 'listing_update',
                    data: data
                });
            }
        });

        this.socket.on('new_listing', (data) => {
            console.log("New listing notification:", data);
            if (this.notificationCallback) {
                this.notificationCallback({
                    type: 'new_listing',
                    data: data
                });
            }
        });

        this.socket.on('purchase_notification', (data) => {
            console.log("Purchase notification:", data);
            if (this.notificationCallback) {
                this.notificationCallback({
                    type: 'purchase',
                    data: data
                });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log("SocketIO disconnected:", reason);
            // Try to reconnect after a delay
            setTimeout(() => this.connect(), 5000);
        });

        this.socket.on('connect_error', (error) => {
            console.error("SocketIO error:", error);
        });
    },

    joinRoom: function(roomId) {
        if (this.socket && this.socket.connected) {
            this.currentRoom = roomId;
            this.socket.emit('join_room', roomId);
            console.log('Joined room:', roomId);
        }
    },

    leaveRoom: function() {
        if (this.socket && this.socket.connected && this.currentRoom) {
            this.socket.emit('leave_room', this.currentRoom);
            this.currentRoom = null;
            console.log('Left room:', this.currentRoom);
        }
    },

    sendMessage: function (message, recipientId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('send_message', {
                message: message,
                recipient_id: recipientId,
                token: this.jwtToken
            }, (response) => {
                if (response && response.error) {
                    console.error('Server error on message:', response.error);
                } else {
                    console.log('Message sent successfully');
                }
            });
        } else {
            console.error("SocketIO connection is not open. Cannot send message.");
        }
    },

    setMessageCallback: function (callback) {
        this.messageCallback = callback;
    },

    setNotificationCallback: function (callback) {
        this.notificationCallback = callback;
    }
};