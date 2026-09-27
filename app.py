"""
S.V. Government Polytechnic - QR Generator Backend
Flask server for handling image uploads and QR generation
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('.', 'index.html')


@app.route('/qr.html')
def qr_page():
    """Serve the QR generator page"""
    return send_from_directory('.', 'qr.html')


@app.route('/scan.html')
def scan_page():
    """Serve the scan page"""
    return send_from_directory('.', 'scan.html')


@app.route('/admin.html')
def admin_page():
    """Serve the admin page"""
    return send_from_directory('.', 'admin.html')


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/upload', methods=['POST'])
def upload_image():
    """
    Handle image upload and return URL for QR generation
    """
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']

    # Check if filename is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file
    if file and allowed_file(file.filename):
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)

        # Get file size
        file_size = os.path.getsize(filepath)

        # Return response with URL
        file_url = f"/uploads/{unique_filename}"
        
        return jsonify({
            'success': True,
            'filename': unique_filename,
            'url': file_url,
            'full_url': f"http://localhost:5000{file_url}",
            'size': file_size,
            'message': 'File uploaded successfully'
        }), 200
    else:
        return jsonify({'error': 'Invalid file type. Allowed: JPG, PNG, WEBP'}), 400


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'S.V. Government Polytechnic QR Generator',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🎓 S.V. Government Polytechnic - QR Generator Server")
    print("=" * 60)
    print(" Server running at: http://localhost:5000")
    print("📱 QR Page: http://localhost:5000/qr.html")
    print("📁 Uploads folder: ./uploads")
    print("=" * 60)
    print("\n⚠️  Install dependencies first:")
    print("   pip install flask flask-cors")
    print("\n✅ Press Ctrl+C to stop the server\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)