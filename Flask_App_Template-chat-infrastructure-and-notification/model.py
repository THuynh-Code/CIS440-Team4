from extensions import db  # Import db from extensions.py

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

class Chatroom(db.Model):
    __tablename__ = 'chatroom'  # Specifies the table name

    # Define the columns for the 'chatroom' table
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Primary key
    name = db.Column(db.String(255), nullable=False)  # Name field, required
    description = db.Column(db.Text, nullable=True)  # Description field, optional text

    # String representation of the Chatroom object for debugging
    def __repr__(self):
        return f'<Chatroom {self.name}>'