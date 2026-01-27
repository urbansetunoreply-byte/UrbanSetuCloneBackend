# 🏠 UrbanSetu

A full-stack real estate management application built with MERN stack (MongoDB, Express.js, React.js, Node.js) featuring both user and admin interfaces with admin approval system.

## 🚀 Features

###  👤 User Features
- User registration and authentication
- Property browsing and search
- Property listings with detailed informations
- Wishlist functionality
- Appointment booking with real estate agents
- Profile management
- Password change functionality

### 🛠️ Admin Features
- **Admin Approval System**: New admin signups require approval from the default admin only
- **Default Admin**: Pre-configured admin account with exclusive approval privileges
- Property management (create, edit, delete)
- Appointment management with status updates
- User management
- Admin dashboard with analytics
- Admin request management page (default admin only)

##  🔒 Default Admin Account

The system includes a default admin account with exclusive privileges:

- **Email**: rootadmin@gmail.com
- **Password**: ********
- **Status**: Pre-approved (no approval required)
- **Privileges**: Only this admin can approve new admin requests

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

## 🧪 Try UrbanSetu (Demo)

You can experience the platform using demo credentials:

**Demo User Login**
- 👤 Email: `mockuser@nullsto.edu.pl`  
- 🔒 Password: `Mockuser@12`

Or you can sign up and start your own property journey 🚀

---

## ⚠️ Important: Third-Party Cookies Notice

UrbanSetu uses **separate domains for frontend and backend** (e.g., Vercel + Render).  
Because of this, authentication relies on cross-site cookies.

👉 Please ensure **third-party cookies are enabled** in your browser.  
Otherwise, login sessions may expire immediately.

This is a browser security behavior — not a bug in the app.

---

## 🧰 Technology Stack

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

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd urbansetu/api
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
cd urbansetu/web
npm install
```

### Run Application
```bash
# Start backend (from api directory)
npm start

# Start frontend (from web directory)
npm run dev

📁 ## Project Structure

```
mern-estate/
├── api/                    # Backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── seedDefaultAdmin.js # Default admin seeding script
│   └── index.js          # Server entry point
├── web/                  # Frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux store
│   │   └── main.jsx      # App entry point
│   └── package.json
└── uploads/              # File uploads
```
```
🔐 ## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Admin approval system with exclusive default admin privileges
- Default admin bypass for initial setup
- Protected routes for admin functionality
- Input validation and sanitization

🤝## Contributing

Contributions are welcome and appreciated! 🚀  
If you'd like to improve UrbanSetu, follow these guidelines:

### How to Contribute
1. Fork the repository  
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
3. Commit changes:
  ```bash
   git commit -m "Add: meaningful description"
```
4. Push and open a Pull Request
  ```bash
   git push origin feature/your-feature-name
```
5.Open a Pull Request (PR)

📩 For contribution discussions, contact:
auth.urbansetu@gmail.com
urbansetu.noreply@gmail.com

📄## License

Copyright © 2026 UrbanSetu. All rights reserved.
Made with ❤️ for real estate
