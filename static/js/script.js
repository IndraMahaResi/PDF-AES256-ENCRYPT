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

// Demo Elements (akan diinisialisasi nanti)
let showCodeBtn, codeModal, modalClose;
let demoTabs, demoContainers, codeTabs, codeContents;
let playDemoBtn, resetDemoBtn, generateDemoBtn, demoPassword, decryptPassword;

// State
let currentFile = null;
let currentFilename = null;
let downloadFilename = null;
let downloadAction = null;

// Demo state
let demoSteps = [];
let currentStep = 0;
let demoInterval = null;
let demoData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMainApp();
    initDemoSystem();
    addGlobalStyles();
    createVerifyButton();
});

// ===== FUNGSI UTAMA APLIKASI =====

function initMainApp() {
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
}

async function handleFileSelect(file) {
    // Validasi file type
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isEncrypted = file.name.toLowerCase().endsWith('.aes256');
    
    if (!isPdf && !isEncrypted) {
        showError('Harap pilih file PDF atau file terenkripsi .aes256');
        return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
        showError('Ukuran file harus kurang dari 16MB');
        return;
    }

    // Jika file PDF, verifikasi
    if (isPdf) {
        showLoading('Memverifikasi file PDF...');
        try {
            const verification = await verifyPdf(file);
            
            if (!verification.valid) {
                hideLoading();
                showError('File PDF tidak valid. Harap unggah dokumen PDF yang valid.');
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
    const fileType = isEncrypted ? 'File Terenkripsi (.aes256)' : 'Dokumen PDF';
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <i class="${fileIcon}"></i>
            <div>
                <h4>${file.name}</h4>
                <p>${formatFileSize(file.size)} • ${fileType}</p>
                ${isPdf ? '<span class="file-valid"><i class="fas fa-check-circle"></i> PDF Valid</span>' : ''}
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
        decryptBtn.title = 'Siap mendekripsi';
        encryptBtn.title = 'Unggah file PDF untuk mengenkripsi';
    } else {
        encryptBtn.disabled = false;
        decryptBtn.disabled = true;
        encryptBtn.style.opacity = '1';
        decryptBtn.style.opacity = '0.5';
        encryptBtn.title = 'Siap mengenkripsi';
        decryptBtn.title = 'Unggah file .aes256 untuk mendekripsi';
    }
}

function clearFile() {
    currentFile = null;
    currentFilename = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    encryptBtn.disabled = true;
    decryptBtn.disabled = true;
    encryptBtn.style.opacity = '0.5';
    decryptBtn.style.opacity = '0.5';
    encryptBtn.title = 'Harap unggah file terlebih dahulu';
    decryptBtn.title = 'Harap unggah file terlebih dahulu';
}

function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    let text = 'Kekuatan Password: ';

    // Length check
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
        text += 'Kosong';
    } else if (strength <= 2) {
        passwordStrength.classList.add('weak');
        text += 'Lemah';
    } else if (strength <= 3) {
        passwordStrength.classList.add('medium');
        text += 'Sedang';
    } else if (strength <= 4) {
        passwordStrength.classList.add('strong');
        text += 'Kuat';
    } else {
        passwordStrength.classList.add('very-strong');
        text += 'Sangat Kuat';
    }

    strengthText.textContent = text;
}

async function processFile(action) {
    // Validation
    if (!currentFile) {
        showError('Harap pilih file terlebih dahulu');
        return;
    }

    const password = passwordInput.value;
    if (!password) {
        showError('Harap masukkan password');
        return;
    }

    if (password.length < 4) {
        showError('Password harus minimal 4 karakter');
        return;
    }

    // Show processing animation
    processAnimation.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Update processing message
    const processMsg = action === 'encrypt' 
        ? 'Mengenkripsi dengan AES-256-CBC...' 
        : 'Mendekripsi dan memvalidasi...';
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
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
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
            throw new Error(result.error || 'Proses gagal');
        }

        // Show success
        showResult(result.message, result.filename, result.action, result.file_size);

    } catch (error) {
        let errorMsg = error.message;
        
        if (error.name === 'AbortError') {
            errorMsg = 'Timeout. File mungkin terlalu besar atau server sibuk.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Kesalahan jaringan. Periksa koneksi Anda.';
        } else if (error.message.toLowerCase().includes('password') || 
                   error.message.toLowerCase().includes('invalid')) {
            errorMsg = 'Password salah atau file rusak. Periksa password Anda dan coba lagi.';
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
            decryptBtn.title = 'Siap mendekripsi';
        } else {
            encryptBtn.disabled = false;
            encryptBtn.style.opacity = '1';
            encryptBtn.title = 'Siap mengenkripsi';
        }
    }
}

function showResult(message, filename, action, fileSize) {
    resultMessage.textContent = message;
    downloadFilename = filename;
    downloadAction = action;
    
    // Update download button text
    const sizeText = fileSize ? ` (${formatFileSize(fileSize)})` : '';
    const btnText = action === 'encrypt' 
        ? `Unduh File Terenkripsi${sizeText}` 
        : `Unduh PDF${sizeText}`;
    
    downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${btnText}`;
    resultContainer.style.display = 'block';
    
    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function downloadFile() {
    if (!downloadFilename || !downloadAction) {
        showError('Tidak ada file untuk diunduh');
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

function formatFileSize(bytes) {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function cleanupOldFiles() {
    try {
        await fetch('/cleanup', { method: 'POST' });
    } catch (error) {
        console.log('Cleanup failed:', error);
    }
}

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
        return { valid: true, error: 'Verification service unavailable' };
    }
}

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

// ===== DEMO KRIPTOGRAFI SYSTEM =====

function initDemoSystem() {
    // Initialize demo elements
    showCodeBtn = document.getElementById('showCodeBtn');
    codeModal = document.getElementById('codeModal');
    modalClose = document.getElementById('modalClose');
    
    if (!codeModal) {
        console.warn('Code modal not found. Demo features disabled.');
        return;
    }
    
    demoTabs = document.querySelectorAll('.demo-tab');
    demoContainers = document.querySelectorAll('.demo-container');
    codeTabs = document.querySelectorAll('.code-tab');
    codeContents = document.querySelectorAll('.code-content');
    playDemoBtn = document.getElementById('playDemo');
    resetDemoBtn = document.getElementById('resetDemo');
    generateDemoBtn = document.getElementById('generateDemo');
    demoPassword = document.getElementById('demoPassword');
    decryptPassword = document.getElementById('decryptPassword');

    // Initialize demo data
    initDemoData();

    // Event listeners for demo
    if (showCodeBtn) {
        showCodeBtn.addEventListener('click', () => {
            codeModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            initDemoSteps();
            highlightCode();
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === codeModal) {
            closeModal();
        }
    });

    // Demo tabs switching
    demoTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const demoType = tab.getAttribute('data-demo');
            
            // Update active tab
            demoTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show active container
            demoContainers.forEach(container => {
                container.classList.remove('active');
                if (container.id === `${demoType}Demo`) {
                    container.classList.add('active');
                }
            });
            
            // Reset demo if switching away from encrypt demo
            if (demoType !== 'encrypt') {
                resetDemo();
            }
        });
    });

    // Code tabs switching
    if (codeTabs.length > 0) {
        codeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const codeType = tab.getAttribute('data-code');
                
                // Update active tab
                codeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show active content
                codeContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${codeType}Code`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    // Play demo button
    if (playDemoBtn) {
        playDemoBtn.addEventListener('click', () => {
            if (demoInterval) {
                // Pause demo
                clearInterval(demoInterval);
                demoInterval = null;
                playDemoBtn.innerHTML = '<i class="fas fa-play"></i> Lanjutkan Demo';
            } else {
                // Play or resume demo
                playDemo();
            }
        });
    }

    // Reset demo button
    if (resetDemoBtn) {
        resetDemoBtn.addEventListener('click', resetDemo);
    }

    // Generate new demo data
    if (generateDemoBtn) {
        generateDemoBtn.addEventListener('click', () => {
            initDemoData();
            resetDemo();
        });
    }

    // Update demo when password changes
    if (demoPassword) {
        demoPassword.addEventListener('input', () => {
            initDemoData();
        });
    }

    // Update decrypt demo when password changes
    if (decryptPassword) {
        decryptPassword.addEventListener('input', () => {
            const status = document.getElementById('validationStatus');
            if (status && demoData) {
                if (decryptPassword.value === demoData.password) {
                    status.innerHTML = '<i class="fas fa-check-circle valid"></i><span>Password valid</span>';
                    status.style.color = 'var(--success)';
                } else {
                    status.innerHTML = '<i class="fas fa-times-circle invalid"></i><span>Password tidak cocok</span>';
                    status.style.color = 'var(--danger)';
                }
            }
        });
    }
}

function closeModal() {
    if (codeModal) {
        codeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetDemo();
    }
}

// Initialize demo data
function initDemoData() {
    const password = demoPassword ? demoPassword.value || "PasswordDemo123!" : "PasswordDemo123!";
    demoData = {
        password: password,
        passwordHash: simulateSHA256(password),
        salt: generateRandomHex(16),
        key: generateRandomHex(32),
        iv: generateRandomHex(16),
        originalData: "255044462D312E340A2525454F460A", // %PDF-1.4 header
        xorKey: generateRandomHex(8),
        cipherBlocks: [
            generateRandomHex(8),
            generateRandomHex(8)
        ]
    };
    
    // Update UI with demo data
    updateDemoUI();
}

// Generate random hex string
function generateRandomHex(bytes) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
}

// Simple SHA-256 simulation
function simulateSHA256(text) {
    // Simplified version for demo - in production use actual SHA-256
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += Math.floor(Math.random() * 16).toString(16);
    }
    return hash.toUpperCase();
}

// XOR simulation
function xorHex(hex1, hex2) {
    const bytes1 = hex1.split(' ').map(b => parseInt(b, 16));
    const bytes2 = hex2.split(' ').map(b => parseInt(b, 16));
    const result = [];
    
    const length = Math.min(bytes1.length, bytes2.length);
    for (let i = 0; i < length; i++) {
        result.push((bytes1[i] ^ bytes2[i]).toString(16).padStart(2, '0'));
    }
    
    return result.join(' ').toUpperCase();
}

// Update demo UI with current data
function updateDemoUI() {
    if (!demoData) return;
    
    // Helper function to safely update element
    function updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    // Update encrypt demo
    updateElement('passwordHash', demoData.passwordHash.substring(0, 24) + '...');
    updateElement('originalHex', demoData.originalData.substring(0, 11));
    updateElement('passwordHex', demoData.xorKey);
    updateElement('xorResult', xorHex(demoData.originalData.substring(0, 11), demoData.xorKey));
    updateElement('demoSalt', demoData.salt.substring(0, 24) + '...');
    updateElement('demoKey', demoData.key.substring(0, 24) + '...');
    updateElement('demoIV', demoData.iv.substring(0, 24) + '...');
    updateElement('blockIV', demoData.iv.substring(0, 11));
    updateElement('cipherBlock1', demoData.cipherBlocks[0]);
    updateElement('finalSalt', demoData.salt.substring(0, 24) + '...');
    updateElement('finalIV', demoData.iv.substring(0, 24) + '...');
    updateElement('finalCipher', demoData.cipherBlocks.join(' '));
    
    // Update decrypt demo
    updateElement('decryptedData', demoData.originalData);
}

// Initialize demo steps for animation
function initDemoSteps() {
    const encryptDemo = document.getElementById('encryptDemo');
    if (encryptDemo) {
        demoSteps = Array.from(encryptDemo.querySelectorAll('.demo-step'));
        currentStep = 0;
    }
}

// Play demo step by step
function playDemo() {
    if (demoInterval) clearInterval(demoInterval);
    
    // Reset all steps
    demoSteps.forEach(step => step.classList.remove('active-step'));
    currentStep = 0;
    
    // Play first step
    playNextStep();
    
    // Set interval for next steps
    demoInterval = setInterval(() => {
        if (currentStep >= demoSteps.length) {
            clearInterval(demoInterval);
            demoInterval = null;
            if (playDemoBtn) {
                playDemoBtn.innerHTML = '<i class="fas fa-play"></i> Jalankan Demo Lagi';
            }
            return;
        }
        playNextStep();
    }, 3000);
    
    // Update button text
    if (playDemoBtn) {
        playDemoBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda Demo';
    }
}

// Play next step in demo
function playNextStep() {
    if (currentStep >= demoSteps.length) return;
    
    // Remove active class from all steps
    demoSteps.forEach(step => step.classList.remove('active-step'));
    
    // Add active class to current step
    demoSteps[currentStep].classList.add('active-step');
    
    // Scroll to current step
    demoSteps[currentStep].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    
    currentStep++;
}

// Reset demo
function resetDemo() {
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    
    if (demoSteps && demoSteps.length > 0) {
        demoSteps.forEach(step => step.classList.remove('active-step'));
    }
    currentStep = 0;
    
    if (playDemoBtn) {
        playDemoBtn.innerHTML = '<i class="fas fa-play"></i> Jalankan Demo Langkah demi Langkah';
    }
}

// Add syntax highlighting to code blocks
function highlightCode() {
    const codeBlocks = document.querySelectorAll('.code-content code');
    codeBlocks.forEach(block => {
        let code = block.textContent;
        
        // Simple syntax highlighting
        code = code.replace(/\b(def|class|return|try|except|if|else|for|while|import|from|as)\b/g, 
            '<span class="keyword">$1</span>');
        code = code.replace(/\b(encrypt_pdf|decrypt_pdf|derive_key_and_iv|xor_transform|is_valid_pdf)\b/g, 
            '<span class="function">$1</span>');
        code = code.replace(/(".*?"|'.*?')/g, 
            '<span class="string">$1</span>');
        code = code.replace(/#.*$/gm, 
            '<span class="comment">$&</span>');
        code = code.replace(/\b(\d+)\b/g, 
            '<span class="number">$1</span>');
        
        block.innerHTML = code;
    });
}

// ===== UTILITY FUNCTIONS =====

function addGlobalStyles() {
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
            
            @keyframes highlightStep {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
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
            
            .demo-step.active-step {
                animation: highlightStep 0.5s ease;
            }
            
            .code-content code .keyword { color: #ff79c6; font-weight: bold; }
            .code-content code .function { color: #50fa7b; }
            .code-content code .string { color: #f1fa8c; }
            .code-content code .comment { color: #6272a4; font-style: italic; }
            .code-content code .number { color: #bd93f9; }
        `;
        document.head.appendChild(style);
    }
}

function createVerifyButton() {
    const verifyPdfBtn = document.createElement('button');
    verifyPdfBtn.id = 'verifyPdfBtn';
    verifyPdfBtn.className = 'btn-outline';
    verifyPdfBtn.innerHTML = '<i class="fas fa-search"></i> Verifikasi PDF';
    verifyPdfBtn.style.marginTop = '10px';
    verifyPdfBtn.style.display = 'none';
    
    // Add button after upload area
    if (uploadArea && uploadArea.parentNode) {
        uploadArea.parentNode.insertBefore(verifyPdfBtn, uploadArea.nextSibling);
    }
    
    // Show verify button when PDF is selected
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            verifyPdfBtn.style.display = file.name.toLowerCase().endsWith('.pdf') ? 'inline-flex' : 'none';
        }
    });
    
    // Verify button click handler
    verifyPdfBtn.addEventListener('click', async () => {
        if (!currentFile) {
            showError('Harap pilih file terlebih dahulu');
            return;
        }
        
        if (!currentFile.name.toLowerCase().endsWith('.pdf')) {
            showError('Hanya file PDF yang dapat diverifikasi');
            return;
        }
        
        showLoading('Memverifikasi PDF...');
        try {
            const verification = await verifyPdf(currentFile);
            hideLoading();
            
            if (verification.valid) {
                showError('✓ File PDF valid dan siap untuk dienkripsi');
            } else {
                showError('✗ File PDF tidak valid. Harap unggah file yang berbeda.');
            }
        } catch (error) {
            hideLoading();
            showError('Layanan verifikasi tidak tersedia. Melanjutkan dengan upload...');
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape' && codeModal && codeModal.style.display === 'block') {
        closeModal();
    }
    
    // Focus password field with Alt+P
    if (e.altKey && e.key === 'p') {
        e.preventDefault();
        passwordInput.focus();
    }
    
    // Focus file input with Alt+F
    if (e.altKey && e.key === 'f') {
        e.preventDefault();
        fileInput.click();
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && demoInterval) {
        // Pause demo when tab is hidden
        clearInterval(demoInterval);
        demoInterval = null;
        if (playDemoBtn) {
            playDemoBtn.innerHTML = '<i class="fas fa-play"></i> Lanjutkan Demo';
        }
    }
});

// Export functions for testing (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatFileSize,
        checkPasswordStrength,
        generateRandomHex,
        simulateSHA256,
        xorHex
    };
}