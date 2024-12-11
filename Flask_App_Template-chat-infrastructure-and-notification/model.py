from extensions import db  # Import db from extensions.py
from datetime import datetime

class User(db.Model):
    __tablename__ = 'user'  # Specifies the table name

    # Define the columns for the 'user' table
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Primary key
    email = db.Column(db.String(255), unique=True, nullable=False)  # Email field, unique and required
    password = db.Column(db.String(255), nullable=False)  # Password field, required (hashed)
    description = db.Column(db.Text, nullable=True)  # Description field, optional text
    admin = db.Column(db.Boolean, default=False, nullable=False)  # Admin field, boolean, default is False

    # String representation of the User object for debugging
    def __repr__(self):
        return f'<User {self.email}>'

class Listing(db.Model):
    __tablename__ = 'listing'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    campus = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, sold, deleted

    # Relationship with User model
    user = db.relationship('User', backref=db.backref('listings', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'price': self.price,
            'description': self.description,
            'category': self.category,
            'campus': self.campus,
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id,
            'image_url': self.image_url,
            'status': self.status,
            'user_email': self.user.email if self.user else None
        }
        
class Message(db.Model):
    __tablename__ = 'message'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id])
    listing = db.relationship('Listing', foreign_keys=[listing_id])

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'listing_id': self.listing_id,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'sender_email': self.sender.email
        }