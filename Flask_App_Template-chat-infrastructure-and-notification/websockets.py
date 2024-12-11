from flask_socketio import emit, join_room, leave_room
from flask import request
from flask_jwt_extended import decode_token
from model import User, Message
from extensions import db, socketio
from datetime import datetime

def register_websocket_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        print("Client attempting to connect...")
        token = request.args.get('token')

        if not token:
            print("No token provided, disconnecting client.")
            emit('connect_error', {'error': 'No token provided'})
            return

        try:
            decoded_token = decode_token(token)
            user = User.query.filter_by(email=decoded_token['sub']).first()
            if user:
                print(f"User {user.email} connected successfully")
                emit('connect_success', {'message': 'Connected successfully'})
            else:
                emit('connect_error', {'error': 'User not found'})
        except Exception as e:
            print(f"Error decoding token: {str(e)}")
            emit('connect_error', {'error': f'Invalid token: {str(e)}'})

    @socketio.on('join')
    def on_join(data):
        room = data.get('room')
        if room:
            join_room(room)
            print(f"Client joined room: {room}")

    @socketio.on('message')
    def handle_message(data):
        try:
            token = data.get('token')
            message_text = data.get('message')
            listing_id = data.get('listing_id')
            
            if not all([token, message_text, listing_id]):
                print("Missing required message data")
                return
            
            # Decode token and get user
            decoded = decode_token(token)
            user = User.query.filter_by(email=decoded['sub']).first()
            
            if user:
                # Save message to database
                new_message = Message(
                    sender_id=user.id,
                    listing_id=listing_id,
                    message=message_text
                )
                db.session.add(new_message)
                db.session.commit()
                
                # Emit message to the room
                room = f"listing_{listing_id}"
                emit('new_message', {
                    'message': message_text,
                    'sender_id': user.id,
                    'sender_email': user.email,
                    'timestamp': datetime.utcnow().isoformat(),
                    'listing_id': listing_id
                }, room=room)
                
            else:
                print("User not found for message")
                
        except Exception as e:
            print(f"Error handling message: {str(e)}")

    @socketio.on('disconnect')
    def handle_disconnect():
        print("Client disconnected")