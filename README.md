# Lexi-Fill

A web application that allows users to upload `.docx` legal documents, detect dynamic placeholders, and fill them via a React UI.

## Features

- **Document Upload**: Upload `.docx` files through a modern web interface
- **Placeholder Detection**: Automatically detects placeholders like `[Investor Name]`, `{{Date}}`, `((Amount))`, etc.
- **Interactive Filling**: Fill placeholders through Lexi-AI, a clean, responsive chatbot powered by a llm
- **Real-time Preview**: See the document content as you work

## Live Demo

<img width="1920" height="951" alt="image" src="https://github.com/user-attachments/assets/c9e17121-9fd0-42b4-ae10-d5cd1a09a271" />

1. **Open your browser** and go to `https://lexi-fill.vercel.app`

2. **Upload a document:**
   - Click "Choose File" and select a `.docx` file
   - Click "Upload & Parse" to process the document

3. **Fill placeholders:**
   - The app will automatically detect placeholders in your document
   - Enter values for each placeholder in the input fields or nullify a field if not needed
   - See the document content preview below

4. **Supported placeholder formats:**
   - `[Placeholder Name]`
   - `{{placeholder_name}}`
   - `((placeholder))`
   - `__placeholder__`
   - `Label:Placeholder`

## Tech Stack

### Frontend
- **React** (Vite)
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Multer** - File upload handling

### Document Processing
- **Python** - Document parsing
- **python-docx** - DOCX file manipulation

## Project Structure

```
lexi-fill/
├── backend/
│   ├── server.js              # Express server
│   ├── package.json           # Backend dependencies
│   ├── parser/
│   │   ├── parse_doc.py       # Python document parser
│   │   └── requirements.txt   # Python dependencies
│   └── uploads/               # Uploaded files (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # React component for App
│   │   └── ChatModal.jsx      # React component for chatbot
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
└── README.md
```

## API Endpoints

- `POST /upload` - Upload and parse DOCX file
- `GET /sanity` - Health check endpoint

## License

This project is licensed under the MIT License.
