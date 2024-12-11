import datetime
import jwt  # Import PyJWT
from flask import Blueprint, current_app, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db
from model import User, Listing, Message  # Removed Chatroom from imports

# Helper function to decode the JWT token and validate the user
def validate_token(request):
    auth_header = request.headers.get('Authorization', None)
    if not auth_header:
        return None, jsonify({"error": "Token is missing!"}), 401

    try:
        token = auth_header.split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user = User.query.filter_by(email=decoded_token['sub']).first()
        if not user:
            return None, jsonify({"error": "User not found!"}), 404
        return user, None
    except jwt.ExpiredSignatureError:
        return None, jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError as e:
        return None, jsonify({"error": f"Token error: {str(e)}"}), 401

routes_blueprint = Blueprint('routes', __name__)

# Page Routes
@routes_blueprint.route('/')
def index():
    return render_template('index.html')

@routes_blueprint.route('/inside')
def inside():
    return render_template('example_app_page.html')  # Changed from example_app_page.html

# Authentication Routes
@routes_blueprint.route('/create_account', methods=['POST'])
def create_account():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    description = data.get('description')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User with that email already exists"}), 400

    hashed_password = generate_password_hash(password, method='sha256')
    new_user = User(email=email, password=hashed_password, description=description)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Account created successfully!"}), 201

@routes_blueprint.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 400

    token = create_access_token(identity=user.email, expires_delta=datetime.timedelta(hours=1))
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "admin": user.admin
    }), 200

# User Management Routes
@routes_blueprint.route('/users', methods=['GET'])
def get_all_users():
    current_user, error = validate_token(request)
    if error:
        return error

    if not current_user.admin:
        return jsonify({"error": "Unauthorized access"}), 403

    users = User.query.all()
    users_data = [{"id": user.id, "email": user.email, "description": user.description, "admin": user.admin} 
                 for user in users]
    return jsonify(users_data), 200

@routes_blueprint.route('/add_user', methods=['POST'])
def add_user():
    current_user, error = validate_token(request)
    if error:
        return error

    if not current_user.admin:
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    email = data.get('email')
    password = data.get('password')
    description = data.get('description')
    is_admin = data.get('isAdmin', False)

    if not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password, method='sha256')
    new_user = User(email=email, password=hashed_password, description=description, admin=is_admin)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"id": new_user.id, "email": new_user.email, "description": new_user.description, 
                   "admin": new_user.admin}), 201

@routes_blueprint.route('/edit_user/<int:user_id>', methods=['PUT'])
def edit_user(user_id):
    current_user, error = validate_token(request)
    if error:
        return error

    if not current_user.admin:
        return jsonify({"error": "Unauthorized access"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    user.email = data.get('email', user.email)
    user.description = data.get('description', user.description)
    user.admin = data.get('admin', user.admin)
    db.session.commit()

    return jsonify({"message": "User updated successfully"}), 200

@routes_blueprint.route('/delete_user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    current_user, error = validate_token(request)
    if error:
        return error

    if not current_user.admin:
        return jsonify({"error": "Unauthorized access"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200

# Marketplace Routes
@routes_blueprint.route('/api/listings', methods=['GET'])
def get_listings():
    current_user, error = validate_token(request)
    if error:
        return error

    # Optional query parameters for filtering
    category = request.args.get('category')
    campus = request.args.get('campus')
    search = request.args.get('search')

    query = Listing.query

    if category and category != 'All Categories':
        query = query.filter(Listing.category == category)
    if campus and campus != 'All Campuses':
        query = query.filter(Listing.campus == campus)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Listing.title.ilike(search_term),
                Listing.description.ilike(search_term)
            )
        )

    listings = query.order_by(Listing.created_at.desc()).all()
    return jsonify([listing.to_dict() for listing in listings]), 200

@routes_blueprint.route('/api/listings/create', methods=['POST'])
def create_listing():
    current_user, error = validate_token(request)
    if error:
        return error

    try:
        data = request.json
        required_fields = ['title', 'price', 'description', 'category', 'campus']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        new_listing = Listing(
            title=data['title'],
            price=float(data['price']),
            description=data['description'],
            category=data['category'],
            campus=data['campus'],
            user_id=current_user.id,
            image_url=data.get('image_url')
        )

        db.session.add(new_listing)
        db.session.commit()
        return jsonify(new_listing.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@routes_blueprint.route('/api/listings/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id):
    current_user, error = validate_token(request)
    if error:
        return error

    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    # Check if the current user owns the listing or is an admin
    if listing.user_id != current_user.id and not current_user.admin:
        return jsonify({"error": "Unauthorized to delete this listing"}), 403

    try:
        db.session.delete(listing)
        db.session.commit()
        return jsonify({"message": "Listing deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@routes_blueprint.route('/api/listings/<int:listing_id>', methods=['PUT'])
def update_listing(listing_id):
    current_user, error = validate_token(request)
    if error:
        return error

    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    # Check if the current user owns the listing or is an admin
    if listing.user_id != current_user.id and not current_user.admin:
        return jsonify({"error": "Unauthorized to update this listing"}), 403

    try:
        data = request.json
        if 'title' in data:
            listing.title = data['title']
        if 'price' in data:
            listing.price = float(data['price'])
        if 'description' in data:
            listing.description = data['description']
        if 'category' in data:
            listing.category = data['category']
        if 'campus' in data:
            listing.campus = data['campus']
        if 'image_url' in data:
            listing.image_url = data['image_url']
        if 'status' in data:
            listing.status = data['status']

        db.session.commit()
        return jsonify(listing.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@routes_blueprint.route('/api/listings/user/<int:user_id>', methods=['GET'])
def get_user_listings_by_id(user_id):  # Changed function name
    current_user, error = validate_token(request)
    if error:
        return error

    listings = Listing.query.filter_by(user_id=user_id).order_by(Listing.created_at.desc()).all()
    return jsonify([listing.to_dict() for listing in listings]), 200

# Second route for getting current user's listings
@routes_blueprint.route('/api/listings/user/me', methods=['GET'])
def get_my_listings():  # Changed function name
    current_user, error = validate_token(request)
    if error:
        return error

    try:
        # Get all listings for the current user
        listings = Listing.query.filter_by(user_id=current_user.id).all()
        return jsonify([listing.to_dict() for listing in listings]), 200
    except Exception as e:
        print('Error getting user listings:', e)
        return jsonify({"error": "Failed to fetch listings"}), 500
    
@routes_blueprint.route('/api/messages/<int:listing_id>', methods=['GET'])
def get_messages(listing_id):
    current_user, error = validate_token(request)
    if error:
        return error

    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    # Only allow the seller and potential buyers to see messages
    if listing.user_id != current_user.id and not Message.query.filter_by(
        listing_id=listing_id, sender_id=current_user.id).first():
        return jsonify({"error": "Unauthorized"}), 403

    messages = Message.query.filter_by(listing_id=listing_id).order_by(Message.timestamp).all()
    return jsonify([msg.to_dict() for msg in messages]), 200

@routes_blueprint.route('/api/messages/<int:listing_id>', methods=['POST'])
def create_message(listing_id):
    current_user, error = validate_token(request)
    if error:
        return error

    data = request.json
    message_text = data.get('message')
    
    if not message_text:
        return jsonify({"error": "Message cannot be empty"}), 400

    new_message = Message(
        sender_id=current_user.id,
        listing_id=listing_id,
        message=message_text
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    return jsonify(new_message.to_dict()), 201