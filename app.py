import os
import base64
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import hashlib
import secrets
import hashlib
import binascii

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ENCRYPTED_FOLDER'] = 'encrypted'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Pastikan folder exist
for folder in [app.config['UPLOAD_FOLDER'], app.config['ENCRYPTED_FOLDER']]:
    os.makedirs(folder, exist_ok=True)

def derive_key_and_iv(password, salt):
    """Derive key and IV from password using PBKDF2"""
    key_iv = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, dklen=48)
    key = key_iv[:32]  # 32 bytes for AES-256
    iv = key_iv[32:48] # 16 bytes for IV
    return key, iv

def xor_transform(data, key):
    """XOR transformation with expanded key"""
    key_bytes = key * (len(data) // len(key) + 1)
    transformed = bytearray()
    for i, byte in enumerate(data):
        transformed.append(byte ^ key_bytes[i % len(key_bytes)])
    return bytes(transformed)

def encrypt_pdf(file_data, password):
    """Encrypt PDF using AES-256-CBC with XOR layer"""
    try:
        # Generate random salt
        salt = get_random_bytes(16)
        
        # Derive key and IV from password
        key, iv = derive_key_and_iv(password, salt)
        
        # First XOR transformation with password hash
        password_hash = hashlib.sha256(password.encode()).digest()
        xor_data = xor_transform(file_data, password_hash)
        
        # Create cipher
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        # Pad and encrypt data
        padded_data = pad(xor_data, AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        
        # Create header untuk identifikasi file (16 bytes)
        header = b'PDFAES256' + get_random_bytes(7)  # Total 16 bytes
        
        # Gabungkan header + salt + encrypted data
        final_data = header + salt + encrypted_data
        
        return final_data
    except Exception as e:
        raise ValueError(f"Encryption error: {str(e)}")

def decrypt_pdf(encrypted_data, password):
    """Decrypt PDF that was encrypted with encrypt_pdf"""
    try:
        # Check minimum size
        if len(encrypted_data) < 48:
            raise ValueError("File too small or corrupted")
        
        # Periksa header (first 9 bytes should be PDFAES256)
        if not encrypted_data[:9] == b'PDFAES256':
            raise ValueError("Invalid encrypted file format. File was not encrypted by this system.")
        
        # Extract components
        header = encrypted_data[:16]  # 16 bytes header
        salt = encrypted_data[16:32]   # 16 bytes salt
        encrypted_payload = encrypted_data[32:]  # Rest is encrypted data
        
        if len(encrypted_payload) < 16:  # Minimum AES block size
            raise ValueError("File corrupted or too small")
        
        # Derive key and IV from password
        key, iv = derive_key_and_iv(password, salt)
        
        # Create cipher and decrypt
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_padded = cipher.decrypt(encrypted_payload)
        
        # Unpad
        xor_data = unpad(decrypted_padded, AES.block_size)
        
        # Reverse XOR transformation
        password_hash = hashlib.sha256(password.encode()).digest()
        original_data = xor_transform(xor_data, password_hash)
        
        # Verify that result is a PDF
        if len(original_data) < 5:
            raise ValueError("Decrypted data is too small")
        
        # Check for PDF signature (allow for some variations)
        if not original_data[:4] == b'%PDF' and not original_data[:5] == b'%PDF-':
            # Try to check if it contains PDF markers
            if b'%PDF' not in original_data[:1000]:
                raise ValueError("Invalid password or corrupted file. Decrypted data doesn't appear to be a PDF.")
        
        return original_data
    except ValueError as e:
        raise e
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")

def is_valid_pdf(file_data):
    """Check if data is a valid PDF"""
    # Check multiple PDF signatures
    signatures = [
        b'%PDF-',  # Standard PDF
        b'%PDF ',  # Alternative PDF signature
        b'%PDF1',  # PDF version
    ]
    
    for sig in signatures:
        if file_data.startswith(sig):
            return True
    
    # Also check if PDF appears in first 1000 bytes
    if b'%PDF' in file_data[:1000]:
        return True
    
    return False

def is_valid_encrypted_file(file_data):
    """Check if data is a valid encrypted file"""
    return len(file_data) >= 16 and file_data[:9] == b'PDFAES256'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    password = request.form.get('password', '')
    action = request.form.get('action', 'encrypt')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    try:
        # Read file data
        file_data = file.read()
        
        if action == 'encrypt':
            # Validasi file PDF
            if not is_valid_pdf(file_data):
                return jsonify({'error': 'Invalid PDF file. Please upload a valid PDF document.'}), 400
            
            # Encrypt the PDF
            encrypted_data = encrypt_pdf(file_data, password)
            
            # Save to encrypted folder dengan extension .aes256
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            original_name = secure_filename(file.filename)
            
            # Clean original name
            if original_name.lower().endswith('.pdf'):
                base_name = original_name[:-4]
            else:
                base_name = original_name
            
            filename = f'{base_name}_{timestamp}.aes256'
            filepath = os.path.join(app.config['ENCRYPTED_FOLDER'], filename)
            
            with open(filepath, 'wb') as f:
                f.write(encrypted_data)
            
            return jsonify({
                'success': True,
                'filename': filename,
                'original_name': f'{base_name}.pdf',
                'message': 'File encrypted successfully!',
                'action': 'encrypt',
                'file_size': len(encrypted_data)
            })
        
        elif action == 'decrypt':
            # Cek apakah file terenkripsi valid
            if not is_valid_encrypted_file(file_data):
                return jsonify({'error': 'Invalid encrypted file format. Please upload a file encrypted by this system (.aes256 extension).'}), 400
            
            # Decrypt the PDF
            decrypted_data = decrypt_pdf(file_data, password)
            
            # Save to uploads folder dengan nama asli
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Try to get original name from filename
            original_name = secure_filename(file.filename)
            if original_name.lower().endswith('.aes256'):
                # Remove timestamp and extension
                base_name = original_name[:-21]  # Remove _YYYYMMDD_HHMMSS.aes256
                if not base_name.endswith('.pdf'):
                    base_name = base_name + '.pdf'
                output_name = base_name
            else:
                output_name = f'decrypted_{timestamp}.pdf'
            
            # Ensure it ends with .pdf
            if not output_name.lower().endswith('.pdf'):
                output_name = output_name + '.pdf'
            
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_name)
            
            with open(filepath, 'wb') as f:
                f.write(decrypted_data)
            
            # Verify the decrypted file is a valid PDF
            if not is_valid_pdf(decrypted_data):
                os.remove(filepath)
                return jsonify({'error': 'Decryption failed. The password might be incorrect or file is corrupted.'}), 400
            
            return jsonify({
                'success': True,
                'filename': output_name,
                'message': 'File decrypted successfully!',
                'action': 'decrypt',
                'file_size': len(decrypted_data)
            })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@app.route('/download/<folder>/<filename>')
def download_file(folder, filename):
    if folder not in ['uploads', 'encrypted']:
        return jsonify({'error': 'Invalid folder'}), 404
    
    folder_path = app.config['UPLOAD_FOLDER'] if folder == 'uploads' else app.config['ENCRYPTED_FOLDER']
    filepath = os.path.join(folder_path, secure_filename(filename))
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Determine mimetype and download name
    if filename.endswith('.aes256'):
        mimetype = 'application/octet-stream'
        as_attachment = True
        download_name = filename
    else:
        mimetype = 'application/pdf'
        as_attachment = True
        download_name = filename if filename.lower().endswith('.pdf') else filename + '.pdf'
    
    return send_file(
        filepath,
        mimetype=mimetype,
        as_attachment=as_attachment,
        download_name=download_name
    )

@app.route('/cleanup', methods=['POST'])
def cleanup():
    """Clean up old temporary files"""
    try:
        current_time = datetime.now()
        deleted_count = 0
        
        for folder_name in ['UPLOAD_FOLDER', 'ENCRYPTED_FOLDER']:
            folder = app.config[folder_name]
            if not os.path.exists(folder):
                continue
                
            for filename in os.listdir(folder):
                filepath = os.path.join(folder, filename)
                
                if not os.path.isfile(filepath):
                    continue
                
                try:
                    file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
                    
                    # Delete files older than 1 hour
                    if (current_time - file_time).total_seconds() > 3600:
                        os.remove(filepath)
                        deleted_count += 1
                except:
                    continue
        
        return jsonify({'success': True, 'message': f'Cleanup completed. Deleted {deleted_count} files.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-pdf', methods=['POST'])
def verify_pdf():
    """Verify if uploaded file is a valid PDF"""
    if 'file' not in request.files:
        return jsonify({'valid': False, 'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'valid': False, 'error': 'No file selected'})
    
    try:
        # Read first 1024 bytes to check PDF signature
        file_data = file.read(1024)
        file.seek(0)  # Reset file pointer
        
        is_pdf = is_valid_pdf(file_data)
        return jsonify({
            'valid': is_pdf,
            'is_pdf': is_pdf,
            'filename': file.filename,
            'size': len(file_data) if hasattr(file, 'tell') else 0
        })
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)})

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'PDF AES-256 Encryption',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Clean up old files on startup
    with app.app_context():
        cleanup()
    
    print("=" * 60)
    print("PDF AES-256 Encryption System")
    print("Server running on http://0.0.0.0:5000")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)