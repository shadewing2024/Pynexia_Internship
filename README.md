## Login System Backend

A secure login and registration system built with Node.js, Express.js, MongoDB, and a responsive HTML, CSS, and JavaScript frontend.

## Features:

1. User registration and login
2. Email format validation
3. Duplicate email prevention
4. Password hashing with bcrypt
5. Email verification using a time-limited verification link
6. JWT-based authentication
7. Protected user profile endpoint
8. Logout functionality
9. Responsive login and registration interface
10. Input validation and error handling

## Technologies Used:

1. Node.js
2. Express.js
3. MongoDB
4. Mongoose
5. bcrypt
6. JSON Web Token (JWT)
7. Nodemailer
8. HTML, CSS, JavaScript
9. dotenv
10. validator

## Requirements:

1. Node.js and npm
2. MongoDB running locally or a MongoDB connection URI
3. A Gmail account configured with an App Password for email verification

## Installation and Setup:

1. Clone or download this repository.
2. Open the project directory in a terminal.
3. Install dependencies: 
    npm install
4. Create a .env file in the project root and configure these variables:
    PORT=3000
    MONGODB_URI=your_mongodb_connection_uri
    JWT_SECRET=your_secure_secret
    EMAIL_USER=your_email_address
    EMAIL_PASS=your_email_app_password
    APP_URL=http://localhost:3000
    Replace the example values with your own configuration. Never commit your .env file or share your secrets publicly.
5. Start the server:
    npm start
6. Open the application in your browser:
    http://localhost:3000

## API Endpoints:

1.  Method: POST
    Endpoint: /api/auth/register
    Description: Register a new user and send a verification email

2.  Method: GET
    Endpoint: /api/auth/verify-email?token=...
    Description: Verify a user's email

3.  Method: POST
    Endpoint: /api/auth/login
    Description: Authenticate a verified user and return a JWT

4.  Method: GET
    Endpoint: /api/auth/profile
    Description: Retrieve the authenticated user's profile

## Authentication:

The profile endpoint requires a valid JWT in the Authorization header:
    Authorization: Bearer YOUR_JWT_TOKEN

## Security:

1. Passwords are hashed before being stored.
2. Email verification links use time-limited tokens.
3. Verification tokens are stored as hashes.
4. JWTs expire after one hour.
5. Protected routes require valid authentication
6. Environment variables are used for secrets and configuration.

## Testing:

1. The following checks have been performed manually:

    Successful server startup and MongoDB connection
    Login using an existing verified account
    Profile data displayed after login
    Logout functionality
    Rejection of an incorrect password
    Rejection of an invalid email address
    Prevention of duplicate email registration

2. Email verification for a newly registered account should also be tested with an   email address that is not already registered.

## Project Structure:

Login System Backend/
├── middleware/
├── models/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── routes/
├── .env (example)
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js

Note: .env and node_modules/ should not be committed to Git.

## Author:

Muhammad Taha

## Project:

Pynexia Internship — Backend Web Development