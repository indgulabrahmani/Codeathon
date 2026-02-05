# Quick Setup Guide

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- express
- bcryptjs
- express-session
- cors
- body-parser

## Step 2: Start the Server

Run the server:

```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
📝 Login page: http://localhost:3000/login.html
🔐 API base: http://localhost:3000/api
```

## Step 3: Access the Application

1. Open your browser
2. Go to: `http://localhost:3000`
3. You'll see the login page

## Step 4: Create an Account

1. Click "Sign up" link
2. Fill in:
   - Full Name: Your name
   - Email: your@email.com
   - Password: (at least 6 characters)
   - Confirm Password: (same as password)
3. Click "Create Account"
4. You'll be automatically logged in and redirected to the main app

## Step 5: Use the Application

- Upload your resume (PDF or DOCX)
- Paste a job description
- Click "Analyze My Resume"
- Explore all 5 screens of analysis

## Troubleshooting

### Port 3000 already in use?

Change the port in `server.js`:
```javascript
const PORT = 3001; // or any other port
```

### Can't connect to server?

- Make sure Node.js is installed: `node --version`
- Make sure all dependencies are installed: `npm install`
- Check if port 3000 is available
- Try restarting the server

### Login not working?

- Make sure the server is running
- Check browser console for errors
- Verify you're accessing `http://localhost:3000` (not file://)
- Clear browser cookies and try again

## Development Mode

For auto-reload during development:

```bash
npm run dev
```

(Requires nodemon to be installed globally or as dev dependency)

