Pynexia Login System Backend

Technologies Used:

Node.js
Express.js
MongoDB
Mongoose
bcrypt
JWT
dotenv
validator

Features:

Users can create a new account.
Email validation is included.
Duplicate email registration is not allowed.
Passwords are stored in hashed form.
Users can log in with their email and password.
JWT tokens are generated after successful login.
Protected profile API is available.
Invalid and missing tokens are rejected.

How to Run the Project:

Install Node.js and MongoDB.
Install the required packages using npm.cmd install.
Add the MongoDB connection URL and JWT secret in the .env file.
Start the server using npm.cmd start.

API Endpoints:

    Method                  Endpoint                    Description

1.  POST                    /api/auth/register          Create a new account
2.  POST                    /api/auth/login             Log in to an account
3.  GET                     /api/auth/profile           Get user profile with a valid token

Testing:

I tested the registration and login APIs using Postman. I also tested duplicate email registration, invalid email, and protected profile access with valid and invalid tokens.

Security:

Passwords are hashed using bcrypt. JWT is used to protect the profile API. The .env file contains private information and should not be shared publicly.