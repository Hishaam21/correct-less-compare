# Supabase Auth App

This project is a web application that implements a full authentication system using Supabase. It includes features for user signup, login, session handling, and route protection for premium features.

## Features

- **User Signup**: Users can create an account using their email and password.
- **User Login**: Users can log in to their accounts with email and password.
- **Session Handling**: The application maintains user sessions to keep users logged in.
- **Logout Functionality**: Users can log out of their accounts easily.
- **Protected Routes**: Certain pages are protected and only accessible to logged-in users.
- **Error Handling**: The application provides feedback for invalid login attempts and enforces strong password requirements.
- **Mobile-Friendly Design**: The application is designed to be simple and responsive for mobile devices.

## Project Structure

```
supabase-auth-app
├── public
│   ├── index.html          # Main HTML document
│   └── styles.css         # CSS styles for the application
├── src
│   ├── components
│   │   ├── Login.js       # Component for user login
│   │   ├── Signup.js      # Component for user signup
│   │   ├── LogoutButton.js # Component for logout button
│   │   └── ProtectedRoute.js # Component for protecting routes
│   ├── pages
│   │   ├── Home.js        # Home page component
│   │   └── Premium.js     # Premium features page component
│   ├── utils
│   │   └── supabaseClient.js # Supabase client configuration
│   ├── App.js             # Main application component
│   └── index.js           # Entry point for the React application
├── package.json            # npm configuration file
└── README.md               # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd supabase-auth-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your Supabase project and configure the `supabaseClient.js` file with your Supabase URL and public API key.

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

- Navigate to the signup page to create a new account.
- Use the login page to access your account.
- Once logged in, you can access the premium features page.
- Use the logout button to log out of your account.

## License

This project is licensed under the MIT License.