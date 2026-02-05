# Troubleshooting Connection Errors

## Common Issues and Solutions

### Issue: "Connection error" when trying to login

#### Solution 1: Make sure the server is running

1. Open a terminal/command prompt in the project directory
2. Run: `npm start`
3. You should see:
   ```
   🚀 Server running on http://localhost:3000
   ```
4. Keep this terminal window open while using the app
5. Try logging in again

#### Solution 2: Check if you're accessing via the server

**❌ Wrong way:**
- Opening `login.html` directly from file explorer
- Using `file:///` protocol

**✅ Correct way:**
- Open browser
- Go to: `http://localhost:3000`
- Or: `http://localhost:3000/login.html`

#### Solution 3: Check if port 3000 is available

If you see an error like "Port 3000 is already in use":

1. Find what's using port 3000:
   - Windows: `netstat -ano | findstr :3000`
   - Mac/Linux: `lsof -i :3000`

2. Either:
   - Stop the other application
   - Or change the port in `server.js`:
     ```javascript
     const PORT = 3001; // Change to another port
     ```
   - Then update `login.js` and `script.js`:
     ```javascript
     const API_BASE_URL = 'http://localhost:3001/api';
     ```

#### Solution 4: Check Node.js installation

Make sure Node.js is installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

#### Solution 5: Reinstall dependencies

If issues persist:
```bash
# Delete node_modules folder
rm -rf node_modules  # Mac/Linux
rmdir /s node_modules  # Windows

# Reinstall
npm install

# Start server
npm start
```

#### Solution 6: Check firewall/antivirus

Sometimes firewalls or antivirus software block localhost connections:
- Temporarily disable to test
- Add exception for Node.js
- Allow localhost:3000 in firewall settings

### Issue: CORS errors in browser console

If you see CORS errors, the server CORS configuration should allow all origins in development. If issues persist:

1. Make sure you're accessing via `http://localhost:3000` (not file://)
2. Check browser console for specific error messages
3. Try a different browser

### Issue: "Cannot read property" errors

This usually means the server isn't responding. Follow Solution 1 above.

### Still having issues?

1. Check the server terminal for error messages
2. Check browser console (F12) for detailed error messages
3. Make sure all files are in the same directory
4. Verify `package.json` has all dependencies listed
5. Try restarting your computer (sometimes helps with port issues)

## Quick Test

To verify the server is working:

1. Start server: `npm start`
2. Open browser: `http://localhost:3000/api/health`
3. You should see: `{"status":"ok","message":"Server is running"}`

If this works, the server is running correctly!

