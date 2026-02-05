const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "indgulabrahmani@gmail.com",
      pass: "zfjs uqdo wplv vaei"
    }
  });
  
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow all origins for development (restrict in production)
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Session configuration
app.use(session({
    secret: 'ats-resume-coach-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Data storage file
const DATA_FILE = path.join(__dirname, 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RESUMES_DIR = path.join(__dirname, 'resumes');

// Create uploads directories if they don't exist
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(RESUMES_DIR)) {
    fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, RESUMES_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
        }
    }
});

// Initialize users file if it doesn't exist
function initUsersFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}

// Read users from file
function getUsers() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write users to file
function saveUsers(users) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// Initialize on startup
initUsersFile();

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        const users = getUsers();
        const user = users.find(u => u.id === req.session.userId);
        if (user) {
            return res.json({
                authenticated: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        }
    }
    res.json({ authenticated: false });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const users = getUsers();

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = uuidv4();

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            verified: false,
            verificationToken: verificationToken,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        // Send verification email
        try {
            const verifyLink = `http://localhost:${PORT}/api/auth/verify-email?token=${verificationToken}`;
            
            await transporter.sendMail({
                from: '"ATS Resume Coach" <indgulabrahmani@gmail.com>',
                to: email,
                subject: "Verify your Email - ATS Resume Coach",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563EB;">Email Verification</h2>
                        <p>Hello ${name},</p>
                        <p>Thank you for registering with ATS Resume Coach. Please verify your email address by clicking the link below:</p>
                        <p style="margin: 30px 0;">
                            <a href="${verifyLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="color: #666; word-break: break-all;">${verifyLink}</p>
                        <p style="margin-top: 30px; color: #666; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Continue with registration even if email fails
        }

        // Create session (user can use app but should verify email)
        req.session.userId = newUser.id;
        req.session.userEmail = newUser.email;

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                verified: false
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Email verification endpoint
app.get('/api/auth/verify-email', (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2 style="color: #DC2626;">Invalid Verification Link</h2>
                        <p>No verification token provided.</p>
                    </body>
                </html>
            `);
        }

        const users = getUsers();
        const user = users.find(u => u.verificationToken === token);

        if (!user) {
            return res.send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2 style="color: #DC2626;">Invalid or Expired Verification Link</h2>
                        <p>The verification link is invalid or has expired.</p>
                    </body>
                </html>
            `);
        }

        if (user.verified) {
            return res.send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2 style="color: #059669;">Email Already Verified</h2>
                        <p>Your email has already been verified. You can now log in.</p>
                        <p><a href="/login.html" style="color: #2563EB;">Go to Login</a></p>
                    </body>
                </html>
            `);
        }

        // Mark user as verified
        user.verified = true;
        user.verificationToken = null;
        saveUsers(users);

        res.send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #059669;">Email Verified Successfully!</h2>
                    <p>Your email has been verified. You can now log in to your account.</p>
                    <p><a href="/login.html" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Go to Login</a></p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Verification error:', error);
        res.send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #DC2626;">Verification Error</h2>
                    <p>An error occurred during verification. Please try again.</p>
                </body>
            </html>
        `);
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if email is verified (optional - can be made mandatory)
        if (user.verified === false) {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
            });
        }

        // Create session
        req.session.userId = user.id;
        req.session.userEmail = user.email;

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                verified: user.verified || true
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Protected route example
app.get('/api/user/profile', requireAuth, (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.id === req.session.userId);
    
    if (user) {
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error('Failed to parse PDF: ' + error.message);
    }
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        throw new Error('Failed to parse DOCX: ' + error.message);
    }
}

// Helper function to extract text from DOC (legacy Word format)
async function extractTextFromDOC(filePath) {
    // For .doc files, we'll try to read as text (basic approach)
    // In production, you might want to use a library like antiword or LibreOffice
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        // Fallback: try to read as text
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (err) {
            throw new Error('Failed to parse DOC file. Please convert to DOCX or PDF.');
        }
    }
}

// Analysis function
function analyzeResume(resumeText, jobDescription) {
    const resumeLower = resumeText.toLowerCase();
    const jobDescLower = jobDescription.toLowerCase();
    
    // Extract keywords from job description
    const jobWords = jobDescLower.match(/\b\w{4,}\b/g) || [];
    const uniqueJobWords = [...new Set(jobWords)];
    
    // Find matching keywords
    const matchedKeywords = uniqueJobWords.filter(word => 
        resumeLower.includes(word) && word.length > 3
    );
    
    // Calculate keyword match percentage
    const keywordMatch = uniqueJobWords.length > 0 
        ? Math.round((matchedKeywords.length / uniqueJobWords.length) * 100)
        : 0;
    
    // Extract skills (common tech skills)
    const commonSkills = [
        'javascript', 'react', 'node.js', 'python', 'java', 'typescript',
        'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql',
        'git', 'ci/cd', 'agile', 'scrum', 'rest', 'api', 'graphql',
        'html', 'css', 'angular', 'vue', 'express', 'django', 'flask'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
        resumeLower.includes(skill.toLowerCase())
    );
    
    const jobSkills = commonSkills.filter(skill =>
        jobDescLower.includes(skill.toLowerCase())
    );
    
    const skillMatch = jobSkills.length > 0
        ? Math.round((foundSkills.filter(s => jobSkills.includes(s)).length / jobSkills.length) * 100)
        : 0;
    
    // Check for quantifiable results (numbers)
    const hasNumbers = /\d+/.test(resumeText);
    const numberCount = (resumeText.match(/\d+/g) || []).length;
    
    // Check for action verbs
    const actionVerbs = ['led', 'developed', 'created', 'improved', 'increased', 
                         'reduced', 'managed', 'designed', 'implemented', 'optimized'];
    const foundVerbs = actionVerbs.filter(verb => resumeLower.includes(verb));
    
    // Calculate overall score
    let score = 0;
    score += keywordMatch * 0.4; // 40% weight
    score += skillMatch * 0.3; // 30% weight
    score += (hasNumbers ? 15 : 0); // 15% for having numbers
    score += (foundVerbs.length > 3 ? 15 : foundVerbs.length * 5); // 15% for action verbs
    
    score = Math.min(100, Math.round(score));
    
    // Determine risk level
    let riskLevel = 'high';
    let riskLabel = 'High Rejection Risk';
    let riskExplanation = 'Your resume needs significant improvements to pass ATS filters.';
    
    if (score >= 80) {
        riskLevel = 'low';
        riskLabel = 'Low Rejection Risk';
        riskExplanation = 'Great job! Your resume is well-optimized for ATS.';
    } else if (score >= 60) {
        riskLevel = 'medium';
        riskLabel = 'Medium Rejection Risk';
        riskExplanation = 'Your resume is decent but could be stronger.';
    }
    
    // Format compatibility (basic check)
    const formatScore = resumeText.length > 500 ? 90 : 60;
    
    // Experience relevance
    const expRelevance = Math.round((keywordMatch + skillMatch) / 2);
    
    return {
        score,
        keywordMatch,
        skillMatch,
        skillDepth: Math.round((foundSkills.length / commonSkills.length) * 100),
        formatCompatibility: formatScore,
        experienceRelevance: expRelevance,
        riskLevel,
        riskLabel,
        riskExplanation,
        matchedKeywords: matchedKeywords.slice(0, 20),
        foundSkills,
        jobSkills,
        hasNumbers,
        numberCount,
        foundVerbs
    };
}

// File upload endpoint
app.post('/api/upload/resume', requireAuth, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let resumeText = '';
        
        // Extract text based on file type
        if (fileExt === '.pdf') {
            resumeText = await extractTextFromPDF(filePath);
        } else if (fileExt === '.docx') {
            resumeText = await extractTextFromDOCX(filePath);
        } else if (fileExt === '.doc') {
            resumeText = await extractTextFromDOC(filePath);
        } else {
            // Clean up file
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'Unsupported file type' });
        }
        
        // Store resume data (in production, use database)
        const resumeData = {
            userId: req.session.userId,
            fileName: req.file.originalname,
            filePath: filePath,
            text: resumeText,
            uploadedAt: new Date().toISOString()
        };
        
        // Save resume data to file (in production, use database)
        const resumesFile = path.join(__dirname, 'resumes.json');
        let resumes = [];
        if (fs.existsSync(resumesFile)) {
            resumes = JSON.parse(fs.readFileSync(resumesFile, 'utf8'));
        }
        resumes.push(resumeData);
        fs.writeFileSync(resumesFile, JSON.stringify(resumes, null, 2));
        
        res.json({
            message: 'File uploaded successfully',
            fileName: req.file.originalname,
            textLength: resumeText.length,
            preview: resumeText.substring(0, 200) + '...'
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing file: ' + error.message });
    }
});

// Analyze resume endpoint
app.post('/api/analyze', requireAuth, async (req, res) => {
    try {
        const { jobDescription } = req.body;
        
        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ message: 'Job description is required' });
        }
        
        // Get the most recent resume for this user
        const resumesFile = path.join(__dirname, 'resumes.json');
        if (!fs.existsSync(resumesFile)) {
            return res.status(400).json({ message: 'No resume uploaded. Please upload a resume first.' });
        }
        
        const resumes = JSON.parse(fs.readFileSync(resumesFile, 'utf8'));
        const userResume = resumes
            .filter(r => r.userId === req.session.userId)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
        
        if (!userResume) {
            return res.status(400).json({ message: 'No resume found. Please upload a resume first.' });
        }
        
        // Analyze resume
        const analysis = analyzeResume(userResume.text, jobDescription);
        
        // Add resume text for frontend
        analysis.resumeText = userResume.text;
        analysis.fileName = userResume.fileName;
        
        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ message: 'Error analyzing resume: ' + error.message });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve index.html (protected)
app.get('/index.html', (req, res) => {
    // Check auth but don't block - let frontend handle redirect
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Cleanup old files (optional - runs on startup)
function cleanupOldFiles() {
    try {
        const files = fs.readdirSync(RESUMES_DIR);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        files.forEach(file => {
            const filePath = path.join(RESUMES_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        });
    } catch (error) {
        // Ignore cleanup errors
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Initialize on startup (already called above, removing duplicate)
cleanupOldFiles();

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 ATS Resume Coach Server Started');
    console.log('='.repeat(50));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📝 Login Page: http://localhost:${PORT}/login.html`);
    console.log(`🔐 API Base: http://localhost:${PORT}/api`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📄 Upload Directory: ${RESUMES_DIR}`);
    console.log('='.repeat(50));
    console.log('✅ Server is ready to accept connections\n');
});

