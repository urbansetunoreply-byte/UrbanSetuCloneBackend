# UrbanSetu

A full-stack real estate management application built with MERN stack (MongoDB, Express.js, React.js, Node.js) featuring both user and admin interfaces with admin approval system.

## Features

### User Features
- User registration and authentication
- Property browsing and search
- Property listings with detailed informations
- Wishlist functionality
- Appointment booking with real estate agents
- Profile management
- Password change functionality

### Admin Features
- **Admin Approval System**: New admin signups require approval from the default admin only
- **Default Admin**: Pre-configured admin account with exclusive approval privileges
- Property management (create, edit, delete)
- Appointment management with status updates
- User management
- Admin dashboard with analytics
- Admin request management page (default admin only)

## Default Admin Account

The system includes a default admin account with exclusive privileges:

- **Email**: rootadmin@gmail.com
- **Password**: ********
- **Status**: Pre-approved (no approval required)
- **Privileges**: Only this admin can approve new admin requests

### Setting up the Default Admin

After setting up your database, run the following command to create the default admin account:

```bash
npm run seed-admin
```

This will create the default admin account with pre-approved status and exclusive approval privileges.

## Admin Approval System

The application includes a secure admin approval system with exclusive default admin privileges:

### How it works:
1. **Default Admin**: The default admin (rootadmin@gmail.com) can sign in immediately and has exclusive approval privileges
2. **New Admin Registration**: When someone else signs up as an admin, their account is created with `adminApprovalStatus: "pending"`
3. **Approval Required**: Pending admins cannot sign in until approved by the default admin
4. **Exclusive Approval**: Only the default admin can view and approve/reject new admin requests
5. **Access Granted**: Only approved admins can access admin features (except approval functionality)

### Admin Request Flow:
1. User signs up as admin → Account created with pending status
2. User tries to sign in → Blocked with approval message
3. Default admin reviews request at `/admin/requests` (only visible to default admin)
4. Default admin approves/rejects the request
5. User can now sign in (if approved) or remains blocked (if rejected)

### Admin Privileges:
- **Default Admin (rootadmin@gmail.com)**:
  - Can approve/reject new admin requests
  - Has access to all admin functionality
  - Can manage properties, appointments, etc.
  - Exclusive access to admin approval system

- **Approved Admins**:
  - Can access all admin functionality except approval system
  - Cannot approve/reject new admin requests
  - Can manage properties, appointments, etc.

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads

### Frontend
- **React.js** with Vite
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Icons** for icons

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd mern-estate/api
npm install
```

Create a `.env` file in the `api` directory:
```env
MONGO=your_mongodb_connection_string
JWT_TOKEN=your_jwt_secret
PORT=3000
```

### Frontend Setup
```bash
cd mern-estate/client
npm install
```

### Running the Application
```bash
# Start backend (from api directory)
npm start

# Start frontend (from client directory)
npm run dev

# Seed default admin account (run once after setup)
npm run seed-admin
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Admin Management (Default Admin Only)
- `GET /api/admin/pending-requests` - Get pending admin requests
- `PUT /api/admin/approve/:userId` - Approve admin request
- `PUT /api/admin/reject/:userId` - Reject admin request

### Properties
- `GET /api/listing` - Get all properties
- `POST /api/listing` - Create new property
- `PUT /api/listing/:id` - Update property
- `DELETE /api/listing/:id` - Delete property

### Appointments
- `GET /api/bookings` - Get appointments
- `POST /api/bookings` - Create appointment
- `PUT /api/bookings/:id` - Update appointment status

## Project Structure

```
mern-estate/
├── api/                    # Backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── seedDefaultAdmin.js # Default admin seeding script
│   └── index.js          # Server entry point
├── client/               # Frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux store
│   │   └── main.jsx      # App entry point
│   └── package.json
└── uploads/              # File uploads
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Admin approval system with exclusive default admin privileges
- Default admin bypass for initial setup
- Protected routes for admin functionality
- Input validation and sanitization

## Contributing

Contributions are welcome and appreciated! 🚀  
If you'd like to improve UrbanSetu, follow these guidelines:

### How to Contribute
1. Fork the repository  
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   git commit -m "Add: meaningful description"
   git push origin feature/your-feature-name
3. Open a Pull Request (PR)

📩 For contribution discussions, contact:
auth.urbansetu@gmail.com
urbansetu.noreply@gmail.com

## License

Copyright © 2026 UrbanSetu. All rights reserved.
Made with ❤️ for real estate
