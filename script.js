// API Configuration
// Detect API base URL - use current origin if served from server, otherwise default to localhost:3000
function getApiBaseUrl() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000/api';
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3000/api`;
    }
    return `${window.location.origin}/api`;
}

const API_BASE_URL = getApiBaseUrl();

// Authentication Check
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        
        // Update user name in navbar
        if (data.user) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = data.user.name || data.user.email;
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // On error, still allow access (for development)
    }
}

// Check authentication on page load
checkAuth();

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect on error
            window.location.href = 'login.html';
        }
    });
}

// Navigation and Screen Management
const screens = document.querySelectorAll('.screen');
const navLinks = document.querySelectorAll('.nav-link');

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetScreen = document.getElementById(`screen-${screenId}`);
    const targetLink = document.querySelector(`[data-screen="${screenId}"]`);
    
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const screenId = link.getAttribute('data-screen');
        showScreen(screenId);
    });
});

// Screen 1: File Upload
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileRemove = document.getElementById('fileRemove');
const analyzeBtn = document.getElementById('analyzeBtn');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

let currentFile = null;

async function handleFile(file) {
    if (file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc')) {
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit. Please upload a smaller file.');
            return;
        }
        
        currentFile = file;
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        
        // Upload file to server
        await uploadFile(file);
    } else {
        alert('Please upload a PDF or DOCX file');
    }
}

async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('resume', file);
        
        const response = await fetch(`${API_BASE_URL}/upload/resume`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('File uploaded successfully:', data);
            // Show success indicator
            const successMsg = document.createElement('span');
            successMsg.textContent = ' ✓ Uploaded';
            successMsg.style.color = 'var(--success-green)';
            successMsg.style.marginLeft = '8px';
            if (!fileName.querySelector('span')) {
                fileName.appendChild(successMsg);
            }
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file: ' + error.message);
        currentFile = null;
        fileInfo.style.display = 'none';
        fileInput.value = '';
    }
}

fileRemove.addEventListener('click', () => {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    currentFile = null;
    fileName.innerHTML = fileName.textContent.split(' ✓')[0]; // Remove success indicator
});

analyzeBtn.addEventListener('click', async () => {
    const jobDesc = document.getElementById('jobDescription').value;
    if (!currentFile && !fileName.textContent) {
        alert('Please upload a resume file');
        return;
    }
    if (!jobDesc.trim()) {
        alert('Please paste the job description');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<span>Analyzing...</span>';
    
    try {
        // Call analysis API
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ jobDescription: jobDesc }),
        });
        
        const analysisData = await response.json();
        
        if (response.ok) {
            // Use real analysis data
            animateDashboardWithData(analysisData);
            showScreen('dashboard');
        } else {
            throw new Error(analysisData.message || 'Analysis failed');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Failed to analyze resume: ' + error.message);
        // Fallback to simulated data
        animateDashboard();
        showScreen('dashboard');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = originalText;
    }
});

// Screen 2: Dashboard Animation
function animateDashboard() {
    // Default/fallback data
    const defaultData = {
        score: 72,
        keywordMatch: 68,
        skillDepth: 75,
        formatCompatibility: 90,
        experienceRelevance: 65,
        riskLevel: 'medium',
        riskLabel: 'Medium Rejection Risk',
        riskExplanation: 'Your resume is decent but could be stronger.'
    };
    animateDashboardWithData(defaultData);
}

function animateDashboardWithData(data) {
    const score = data.score || 72;
    const gaugeProgress = document.getElementById('gaugeProgress');
    const gaugeNumber = document.getElementById('gaugeNumber');
    const circumference = 2 * Math.PI * 80; // radius = 80
    const offset = circumference - (score / 100) * circumference;
    
    gaugeProgress.style.strokeDashoffset = offset;
    
    // Animate number
    let current = 0;
    const increment = score / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(timer);
        }
        gaugeNumber.textContent = Math.round(current);
    }, 20);
    
    // Update risk indicator with real data
    updateRiskIndicator(score, data.riskLevel, data.riskLabel, data.riskExplanation);
    
    // Animate metric bars with real data
    setTimeout(() => {
        animateMetric('keywordMatch', data.keywordMatch || 68, 'keywordBar');
        animateMetric('skillDepth', data.skillDepth || 75, 'skillBar');
        animateMetric('formatCompat', data.formatCompatibility || 90, 'formatBar');
        animateMetric('expRelevance', data.experienceRelevance || 65, 'expBar');
    }, 500);
    
    // Store analysis data for other screens
    window.currentAnalysis = data;
}

function animateMetric(elementId, value, barId) {
    const element = document.getElementById(elementId);
    const bar = document.getElementById(barId);
    
    let current = 0;
    const increment = value / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(timer);
        }
        
        if (elementId === 'skillDepth') {
            element.textContent = `${Math.round(current)}/100`;
        } else {
            element.textContent = `${Math.round(current)}%`;
        }
        bar.style.width = `${current}%`;
    }, 20);
}

function updateRiskIndicator(score, riskLevel, riskLabel, riskExplanation) {
    const riskIcon = document.getElementById('riskIcon');
    const riskLabelEl = document.getElementById('riskLabel');
    const riskExplanationEl = document.getElementById('riskExplanation');
    
    // Use provided data or calculate from score
    const level = riskLevel || (score < 60 ? 'high' : score < 80 ? 'medium' : 'low');
    const label = riskLabel || (score < 60 ? 'High Rejection Risk' : score < 80 ? 'Medium Rejection Risk' : 'Low Rejection Risk');
    const explanation = riskExplanation || (
        score < 60 
            ? 'Your resume needs significant improvements to pass ATS filters. Focus on adding missing keywords and quantifying achievements.'
            : score < 80
            ? 'Your resume is decent but could be stronger. Add more quantifiable results and ensure all required skills are demonstrated.'
            : 'Great job! Your resume is well-optimized for ATS. Minor tweaks could push it to excellent.'
    );
    
    if (level === 'high') {
        riskIcon.className = 'risk-icon high';
        riskIcon.textContent = '⚠️';
        riskLabelEl.textContent = label;
        riskLabelEl.style.color = 'var(--danger-red)';
        riskExplanationEl.textContent = explanation;
    } else if (level === 'medium') {
        riskIcon.className = 'risk-icon medium';
        riskIcon.textContent = '⚡';
        riskLabelEl.textContent = label;
        riskLabelEl.style.color = 'var(--warning-yellow)';
        riskExplanationEl.textContent = explanation;
    } else {
        riskIcon.className = 'risk-icon low';
        riskIcon.textContent = '✓';
        riskLabelEl.textContent = label;
        riskLabelEl.style.color = 'var(--success-green)';
        riskExplanationEl.textContent = explanation;
    }
}

// Screen 3: Heatmap Tooltips
const resumeSections = document.querySelectorAll('[data-tooltip]');
resumeSections.forEach(section => {
    section.addEventListener('mouseenter', function() {
        // Tooltip is handled by CSS
    });
});

// Minimap toggle
const toggleMinimap = document.getElementById('toggleMinimap');
const minimap = document.getElementById('minimap');

toggleMinimap.addEventListener('click', () => {
    if (minimap.style.display === 'none') {
        minimap.style.display = 'block';
        toggleMinimap.textContent = 'Hide Minimap';
    } else {
        minimap.style.display = 'none';
        toggleMinimap.textContent = 'Show Minimap';
    }
});

// Screen 5: Improvement Simulator
const summaryEditor = document.getElementById('summaryEditor');
const experienceEditor = document.getElementById('experienceEditor');
const skillsEditor = document.getElementById('skillsEditor');
const liveScore = document.getElementById('liveScore');
const scoreChange = document.getElementById('scoreChange');
const beforeAfterToggle = document.getElementById('beforeAfterToggle');
const beforeAfterView = document.getElementById('beforeAfterView');

let baseScore = 72;
let currentScore = baseScore;

function updateLiveScore() {
    // Simple scoring logic based on content length and keywords
    let newScore = baseScore;
    
    const summary = summaryEditor.value;
    const experience = experienceEditor.value;
    const skills = skillsEditor.value;
    
    // Check for keywords
    const keywords = ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'CI/CD', 'quantified', 'improved', 'led', 'developed'];
    
    const allText = (summary + ' ' + experience + ' ' + skills).toLowerCase();
    const foundKeywords = keywords.filter(kw => allText.includes(kw.toLowerCase())).length;
    newScore += foundKeywords * 2;
    
    // Check for quantifiable results (numbers)
    const hasNumbers = /\d+/.test(allText);
    if (hasNumbers) newScore += 5;
    
    // Length bonuses
    if (summary.length > 100) newScore += 2;
    if (experience.length > 200) newScore += 3;
    if (skills.split(',').length > 6) newScore += 2;
    
    // Cap at 100
    newScore = Math.min(100, Math.max(0, newScore));
    
    const change = newScore - currentScore;
    currentScore = newScore;
    
    liveScore.textContent = Math.round(currentScore);
    
    // Update score change indicator
    const changeIndicator = scoreChange.querySelector('.change-indicator');
    if (change > 0) {
        changeIndicator.textContent = `+${change}`;
        changeIndicator.className = 'change-indicator positive';
    } else if (change < 0) {
        changeIndicator.textContent = `${change}`;
        changeIndicator.className = 'change-indicator negative';
    } else {
        changeIndicator.textContent = '+0';
        changeIndicator.className = 'change-indicator positive';
    }
    
    // Update breakdown (simplified)
    document.getElementById('liveKeyword').textContent = `${Math.min(100, Math.round(currentScore * 0.9))}%`;
    document.getElementById('liveSkill').textContent = `${Math.min(100, Math.round(currentScore * 1.05))}/100`;
    document.getElementById('liveFormat').textContent = '90%';
    document.getElementById('liveExp').textContent = `${Math.min(100, Math.round(currentScore * 0.9))}%`;
}

summaryEditor.addEventListener('input', updateLiveScore);
experienceEditor.addEventListener('input', updateLiveScore);
skillsEditor.addEventListener('input', updateLiveScore);

// Before/After toggle
beforeAfterToggle.addEventListener('click', () => {
    if (beforeAfterView.style.display === 'none') {
        beforeAfterView.style.display = 'grid';
        beforeAfterToggle.textContent = 'Hide Comparison';
        
        // Populate before/after content
        document.getElementById('beforeContent').innerHTML = `
            <p><strong>Summary:</strong> Experienced software engineer with expertise in web development and cloud technologies.</p>
            <p><strong>Experience:</strong> Led development of web applications using React and Node.js. Improved performance by 30%.</p>
            <p><strong>Skills:</strong> JavaScript, React, Node.js, Python, AWS, Docker</p>
        `;
        
        document.getElementById('afterContent').innerHTML = `
            <p><strong>Summary:</strong> ${summaryEditor.value}</p>
            <p><strong>Experience:</strong> ${experienceEditor.value}</p>
            <p><strong>Skills:</strong> ${skillsEditor.value}</p>
        `;
    } else {
        beforeAfterView.style.display = 'none';
        beforeAfterToggle.textContent = 'Before/After';
    }
});

// Apply suggestion buttons
const applyButtons = document.querySelectorAll('.btn-apply');
applyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const suggestion = btn.getAttribute('data-suggestion');
        
        switch(suggestion) {
            case 'typescript':
                const currentSkills = skillsEditor.value;
                if (!currentSkills.includes('TypeScript')) {
                    skillsEditor.value = currentSkills + ', TypeScript';
                    updateLiveScore();
                }
                break;
            case 'aws':
                const currentExp = experienceEditor.value;
                if (!currentExp.includes('AWS')) {
                    experienceEditor.value = currentExp + ' Deployed 5+ microservices on AWS, reducing infrastructure costs by 25%.';
                    updateLiveScore();
                }
                break;
            case 'summary':
                summaryEditor.value = 'Senior Software Engineer with 5+ years of experience building scalable web applications. Led development of React/Node.js applications serving 100K+ users, improving performance by 30% and reducing costs by 25%.';
                updateLiveScore();
                break;
            case 'cicd':
                const exp = experienceEditor.value;
                experienceEditor.value = exp + ' Implemented CI/CD pipelines using Jenkins and Docker, reducing deployment time by 40% and improving release frequency.';
                updateLiveScore();
                break;
        }
        
        // Show feedback
        btn.textContent = '✓ Applied';
        btn.style.background = 'var(--success-green)';
        setTimeout(() => {
            btn.textContent = 'Apply this suggestion';
            btn.style.background = '';
        }, 2000);
    });
});

// Initialize
updateLiveScore();

