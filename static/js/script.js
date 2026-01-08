// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordStrength = document.querySelector('.strength-bar');
const strengthText = document.querySelector('.strength-text');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const processAnimation = document.getElementById('processAnimation');
const resultContainer = document.getElementById('resultContainer');
const resultMessage = document.getElementById('resultMessage');
const downloadBtn = document.getElementById('downloadBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let currentFile = null;
let currentFilename = null;
let downloadFilename = null;
let downloadAction = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // File Upload Handling
    uploadArea.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Password visibility toggle
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    });

    // Password strength checker
    passwordInput.addEventListener('input', checkPasswordStrength);

    // Button event listeners
    encryptBtn.addEventListener('click', () => processFile('encrypt'));
    decryptBtn.addEventListener('click', () => processFile('decrypt'));
    downloadBtn.addEventListener('click', downloadFile);

    // Check for existing files to cleanup
    cleanupOldFiles();
});

// File selection handler
async function handleFileSelect(file) {
    // Validasi file type - SESUAIKAN DENGAN BACKEND
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isEncrypted = file.name.toLowerCase().endsWith('.aes256');
    
    if (!isPdf && !isEncrypted) {
        showError('Please select a PDF file or .aes256 encrypted file');
        return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
        showError('File size must be less than 16MB');
        return;
    }

    // Jika file PDF, verifikasi
    if (isPdf) {
        showLoading('Verifying PDF file...');
        try {
            const verification = await verifyPdf(file);
            
            if (!verification.valid) {
                hideLoading();
                showError('Invalid PDF file. Please upload a valid PDF document.');
                return;
            }
        } catch (error) {
            hideLoading();
            console.error('Verification error:', error);
            // Lanjutkan tanpa verifikasi jika endpoint error
        }
        hideLoading();
    }

    currentFile = file;
    currentFilename = file.name;

    // Update UI
    const fileIcon = isEncrypted ? 'fas fa-lock' : 'fas fa-file-pdf';
    const fileType = isEncrypted ? 'Encrypted File (.aes256)' : 'PDF Document';
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <i class="${fileIcon}"></i>
            <div>
                <h4>${file.name}</h4>
                <p>${formatFileSize(file.size)} • ${fileType}</p>
                ${isPdf ? '<span class="file-valid"><i class="fas fa-check-circle"></i> Valid PDF</span>' : ''}
            </div>
        </div>
        <button class="btn-clear" id="clearFile">
            <i class="fas fa-times"></i>
        </button>
    `;
    fileInfo.classList.add('show');

    // Add clear button listener
    document.getElementById('clearFile').addEventListener('click', (e) => {
        e.stopPropagation();
        clearFile();
    });

    // Auto-select appropriate action based on file extension
    if (isEncrypted) {
        decryptBtn.disabled = false;
        encryptBtn.disabled = true;
        decryptBtn.style.opacity = '1';
        encryptBtn.style.opacity = '0.5';
        decryptBtn.title = 'Ready to decrypt';
        encryptBtn.title = 'Upload a PDF file to encrypt';
    } else {
        encryptBtn.disabled = false;
        decryptBtn.disabled = true;
        encryptBtn.style.opacity = '1';
        decryptBtn.style.opacity = '0.5';
        encryptBtn.title = 'Ready to encrypt';
        decryptBtn.title = 'Upload an .aes256 file to decrypt';
    }
}

// Clear selected file
function clearFile() {
    currentFile = null;
    currentFilename = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    encryptBtn.disabled = true;
    decryptBtn.disabled = true;
    encryptBtn.style.opacity = '0.5';
    decryptBtn.style.opacity = '0.5';
    encryptBtn.title = 'Please upload a file first';
    decryptBtn.title = 'Please upload a file first';
}

// Password strength checker
function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    let text = 'Password Strength: ';

    // Length check (minimum 4 for backend, but we encourage 8+)
    if (password.length >= 4) strength++;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Update UI
    passwordStrength.className = 'strength-bar';
    
    if (password.length === 0) {
        text += 'None';
    } else if (strength <= 2) {
        passwordStrength.classList.add('weak');
        text += 'Weak';
    } else if (strength <= 3) {
        passwordStrength.classList.add('medium');
        text += 'Medium';
    } else if (strength <= 4) {
        passwordStrength.classList.add('strong');
        text += 'Strong';
    } else {
        passwordStrength.classList.add('very-strong');
        text += 'Very Strong';
    }

    strengthText.textContent = text;
}

// Process file (encrypt/decrypt)
async function processFile(action) {
    // Validation
    if (!currentFile) {
        showError('Please select a file first');
        return;
    }

    const password = passwordInput.value;
    if (!password) {
        showError('Please enter a password');
        return;
    }

    // Backend requires minimum 4 characters
    if (password.length < 4) {
        showError('Password must be at least 4 characters long');
        return;
    }

    // Show processing animation
    processAnimation.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Update processing message
    const processMsg = action === 'encrypt' 
        ? 'Encrypting with AES-256-CBC...' 
        : 'Decrypting and validating...';
    document.querySelector('.animation-container p').textContent = processMsg;
    
    // Disable buttons during processing
    encryptBtn.disabled = true;
    decryptBtn.disabled = true;
    encryptBtn.style.opacity = '0.5';
    decryptBtn.style.opacity = '0.5';

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('password', password);
        formData.append('action', action);

        // Send request to server with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.status}`);
        }

        if (!result.success) {
            throw new Error(result.error || 'Processing failed');
        }

        // Show success
        showResult(result.message, result.filename, result.action, result.file_size);

    } catch (error) {
        let errorMsg = error.message;
        
        if (error.name === 'AbortError') {
            errorMsg = 'Request timeout. The file might be too large or server is busy.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Network error. Please check your connection.';
        } else if (error.message.toLowerCase().includes('password') || 
                   error.message.toLowerCase().includes('invalid')) {
            errorMsg = 'Incorrect password or corrupted file. Please check your password and try again.';
        }
        
        showError(errorMsg);
    } finally {
        // Hide processing animation
        processAnimation.style.display = 'none';
        
        // Re-enable appropriate button
        const isEncrypted = currentFilename.toLowerCase().endsWith('.aes256');
        if (isEncrypted) {
            decryptBtn.disabled = false;
            decryptBtn.style.opacity = '1';
            decryptBtn.title = 'Ready to decrypt';
        } else {
            encryptBtn.disabled = false;
            encryptBtn.style.opacity = '1';
            encryptBtn.title = 'Ready to encrypt';
        }
    }
}

// Show result
function showResult(message, filename, action, fileSize) {
    resultMessage.textContent = message;
    downloadFilename = filename;
    downloadAction = action;
    
    // Update download button text
    const sizeText = fileSize ? ` (${formatFileSize(fileSize)})` : '';
    const btnText = action === 'encrypt' 
        ? `Download Encrypted File${sizeText}` 
        : `Download PDF${sizeText}`;
    
    downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${btnText}`;
    resultContainer.style.display = 'block';
    
    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Download file
function downloadFile() {
    if (!downloadFilename || !downloadAction) {
        showError('No file to download');
        return;
    }
    
    // Determine folder based on action
    const folder = downloadAction === 'encrypt' ? 'encrypted' : 'uploads';
    
    // Create download link
    const link = document.createElement('a');
    link.href = `/download/${folder}/${encodeURIComponent(downloadFilename)}`;
    link.download = downloadFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show error message
function showError(message) {
    // Remove any existing error notifications
    document.querySelectorAll('.error-notification').forEach(el => el.remove());
    
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <h4>Error</h4>
                <p>${message}</p>
            </div>
            <button class="error-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.classList.add('fade-out');
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 8000);
    
    // Add close button listener
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => errorDiv.remove(), 300);
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Clean up old files
async function cleanupOldFiles() {
    try {
        await fetch('/cleanup', { method: 'POST' });
    } catch (error) {
        console.log('Cleanup failed:', error);
    }
}

// Fungsi untuk memverifikasi PDF
async function verifyPdf(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/verify-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Verification failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Verification error:', error);
        // Return default valid if verification fails
        return { valid: true, error: 'Verification service unavailable' };
    }
}

// Fungsi loading
function showLoading(message) {
    // Remove any existing loading overlay
    hideLoading();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loadingOverlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Add CSS for styling
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS styles if not already present
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                max-width: 400px;
                background: linear-gradient(135deg, #ff4757, #ff3838);
                color: white;
                border-radius: 12px;
                z-index: 10000;
                box-shadow: 0 5px 25px rgba(255, 71, 87, 0.4);
                animation: slideIn 0.3s ease;
                overflow: hidden;
            }
            
            .error-content {
                padding: 15px;
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }
            
            .error-content i {
                font-size: 1.5rem;
                margin-top: 2px;
            }
            
            .error-content h4 {
                margin: 0 0 5px 0;
                font-size: 1.1rem;
            }
            
            .error-content p {
                margin: 0;
                font-size: 0.9rem;
                opacity: 0.9;
                line-height: 1.4;
            }
            
            .error-close {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1rem;
                padding: 5px;
                margin-left: auto;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            
            .error-close:hover {
                opacity: 1;
            }
            
            .error-notification.fade-out {
                animation: slideOut 0.3s ease forwards;
            }
            
            #loadingOverlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(10, 10, 15, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .loading-content {
                text-align: center;
                color: var(--primary);
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid var(--border);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            .file-valid {
                display: inline-block;
                background: rgba(0, 255, 157, 0.1);
                color: var(--success);
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                margin-top: 5px;
            }
            
            .file-valid i {
                margin-right: 5px;
            }
            
            .file-details {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .file-details i {
                font-size: 2rem;
                color: var(--primary);
            }
            
            .btn-clear {
                position: absolute;
                right: 15px;
                top: 15px;
                background: transparent;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 1.2rem;
                transition: color 0.3s;
            }
            
            .btn-clear:hover {
                color: var(--danger);
            }
            
            button[disabled] {
                cursor: not-allowed !important;
            }
            
            .process-animation p {
                font-family: 'Orbitron', sans-serif;
                color: var(--primary);
                letter-spacing: 1px;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create Verify PDF button
    const verifyPdfBtn = document.createElement('button');
    verifyPdfBtn.id = 'verifyPdfBtn';
    verifyPdfBtn.className = 'btn-outline';
    verifyPdfBtn.innerHTML = '<i class="fas fa-search"></i> Verify PDF';
    verifyPdfBtn.style.marginTop = '10px';
    verifyPdfBtn.style.display = 'none'; // Hidden by default
    
    // Add button after upload area
    uploadArea.parentNode.insertBefore(verifyPdfBtn, uploadArea.nextSibling);
    
    // Show verify button when PDF is selected
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.name.toLowerCase().endsWith('.pdf')) {
                verifyPdfBtn.style.display = 'inline-flex';
            } else {
                verifyPdfBtn.style.display = 'none';
            }
        }
    });
    
    // Verify button click handler
    verifyPdfBtn.addEventListener('click', async () => {
        if (!currentFile) {
            showError('Please select a file first');
            return;
        }
        
        if (!currentFile.name.toLowerCase().endsWith('.pdf')) {
            showError('Only PDF files can be verified');
            return;
        }
        
        showLoading('Verifying PDF...');
        try {
            const verification = await verifyPdf(currentFile);
            hideLoading();
            
            if (verification.valid) {
                showError('✓ PDF file is valid and ready for encryption');
            } else {
                showError('✗ Invalid PDF file. Please upload a different file.');
            }
        } catch (error) {
            hideLoading();
            showError('Verification service unavailable. Proceeding with upload...');
        }
    });
});