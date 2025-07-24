# GolfBuddy

GolfBuddy is a full-stack web application that helps golfers coordinate tee times, find playing partners, and manage their golf availability and profile.

## Features

- **User Registration & Login:** Secure authentication for all users.
- **Set Availability:** Select dates and time sections when you are available to play.
- **Find Matches:** Search for matching dates and sections with other players by email and zip code.
- **User Profile:** Manage your personal golf information and preferences.
- **Saved Availability:** View and edit your saved availability.
- **Responsive Design:** Optimized for desktop and mobile devices.

## Project Structure

```
README.md
backend/
  package.json
  server.js
  models/
  routes/
data/
  ...MongoDB database files...
frontend/
  package.json
  src/
    App.js
    ...
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (running locally on default port)

### Backend Setup

1. Install dependencies:
    ```bash
    cd backend
    npm install
    ```

2. Start the backend server:
    ```bash
    npm start
    ```
   The backend will run on [http://localhost:5000](http://localhost:5000).

### Frontend Setup

1. Install dependencies:
    ```bash
    cd frontend
    npm install
    ```

2. Start the frontend development server:
    ```bash
    npm start
    ```
   The frontend will run on [http://localhost:3000](http://localhost:3000).

## Usage

- Register a new account or log in.
- Set your availability by selecting dates and time sections.
- Search for matches with other golfers using their email and zip code.
- View your saved availability and update your profile.

## Technologies Used

- **Frontend:** React, Material UI
- **Backend:** Node.js, Express, MongoDB, Mongoose

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.

---

⛳ Happy Golfing with