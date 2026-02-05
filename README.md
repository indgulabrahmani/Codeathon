# ATS Resume Coach - Modern Educational Web App

A modern, educational ATS (Applicant Tracking System) resume coaching web application designed to help job seekers optimize their resumes before applying.

## Features

### Screen 1: Upload & Input
- Clean hero section with compelling tagline
- Drag-and-drop resume upload (PDF/DOCX support)
- Job description textarea
- Trust indicators and modern gradient design

### Screen 2: Dashboard Overview
- **Match Score Gauge**: Visual 0-100 score with color coding
  - Red: <60 (High risk)
  - Yellow: 60-79 (Medium risk)
  - Green: 80+ (Low risk)
- **Rejection Risk Indicator**: Low/Medium/High with explanations
- **4 Key Metrics**:
  - Keyword Match %
  - Skill Depth Score
  - Format Compatibility
  - Experience Relevance

### Screen 3: Resume Heatmap View
- Side-by-side layout: Original vs Annotated resume
- Color-coded highlighting:
  - 🟢 Green: Strong sections matching JD
  - 🟡 Yellow: Weak/vague sections
  - 🔴 Red: Missing critical elements
  - ⚪ Gray: Irrelevant content
- Hover tooltips explaining each section
- Minimap navigation for long resumes

### Screen 4: Skill Depth Analyzer
- Detailed skill analysis cards
- Status indicators: Not Found / Mentioned / Demonstrated
- Depth bars showing skill strength
- Specific improvement suggestions for each skill

### Screen 5: Improvement Simulator (Unique Feature)
- Split-screen editor with live score updates
- Real-time score calculation as you type
- Before/After comparison toggle
- Suggested improvements with impact preview (+score badges)
- One-click "Apply this suggestion" buttons

## Design Style

- **Modern SaaS Aesthetic**: Inspired by Linear and Notion
- **Color Palette**:
  - Primary: Blue (#6366F1) to Purple (#8B5CF6) gradient
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Danger: Red (#EF4444)
- **Typography**: Inter font family
- **Layout**: Card-based with generous white space
- **Interactions**: Smooth transitions and micro-animations
- **Responsive**: Mobile-friendly design

## Authentication

The app now includes a complete authentication system:
- **Login Page**: Modern, responsive login interface
- **Registration**: User registration with validation
- **Session Management**: Secure session-based authentication
- **Protected Routes**: Main app requires authentication
- **Logout**: Secure logout functionality

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`
   - You'll be redirected to the login page
   - Create a new account or use existing credentials
   - After login, you'll access the main application

### First Time Setup

1. Start the server (see above)
2. Navigate to `http://localhost:3000`
3. Click "Sign up" on the login page
4. Create your account with:
   - Full Name
   - Email address
   - Password (minimum 6 characters)
5. After registration, you'll be automatically logged in
6. Start using the ATS Resume Coach!

## File Structure

```
.
├── index.html          # Main HTML structure with all screens
├── login.html          # Login and registration page
├── styles.css          # Complete styling and responsive design
├── login.css           # Login page specific styles
├── script.js           # Interactive functionality and animations
├── login.js            # Login/registration functionality
├── server.js           # Express backend server
├── package.json        # Node.js dependencies
├── users.json          # User data storage (created automatically)
└── README.md           # This file
```

## Backend API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status
- `GET /api/user/profile` - Get user profile (protected)
- `GET /api/health` - Server health check

## Technologies Used

### Frontend
- HTML5
- CSS3 (with CSS Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

### Backend
- Node.js
- Express.js (web framework)
- bcryptjs (password hashing)
- express-session (session management)
- CORS (cross-origin resource sharing)

## Browser Support

Works best in modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Notes

⚠️ **Important for Production:**
- Change the session secret in `server.js` to a strong, random value
- Use HTTPS in production (set `secure: true` in session cookie)
- Consider using a proper database (PostgreSQL, MongoDB) instead of JSON file
- Implement rate limiting for login/register endpoints
- Add email verification for new registrations
- Use environment variables for sensitive configuration

## Development Notes

This application includes:
- **Frontend**: Complete UI with all 5 screens and interactive features
- **Backend**: Express server with authentication
- **Storage**: JSON file-based user storage (for development)

For production, you would integrate with:
- Database (PostgreSQL, MongoDB, etc.)
- Backend API for actual resume parsing
- ATS algorithm analysis
- Natural language processing for keyword matching
- Machine learning for skill depth analysis
- File upload service (AWS S3, Cloudinary, etc.)

## Customization

All colors, spacing, and design tokens are defined as CSS variables in `styles.css` for easy customization.

