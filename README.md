# Lexi-Fill

A web application that allows users to upload `.docx` legal documents, detect dynamic placeholders, and fill them via a React UI.

## Features

- **Document Upload**: Upload `.docx` files through a modern web interface
- **Placeholder Detection**: Automatically detects placeholders like `[Investor Name]`, `{{Date}}`, `((Amount))`, etc.
- **Interactive Filling**: Fill placeholders through Lexi-AI, a clean, responsive chatbot powered by a llm
- **Real-time Preview**: See the document content as you work

## Live Demo

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


## 🔧 Development

### Backend Development

- **File uploads** are stored in `backend/uploads/`
- **Python script** processes documents and returns JSON
- **CORS** is enabled for frontend communication

### Frontend Development

- **Vite** provides fast hot module replacement
- **Tailwind CSS** for styling
- **Proxy configuration** for API calls during development

### API Endpoints

- `POST /upload` - Upload and parse DOCX file
- `GET /sanity` - Health check endpoint

## 🐛 Troubleshooting

### Common Issues

1. **Python not found:**
   - Ensure Python 3 is installed and accessible via `python3`
   - Install python-docx: `pip install python-docx`

2. **CORS errors:**
   - Backend CORS is configured for `http://localhost:5173`
   - Check that both servers are running

3. **File upload fails:**
   - Ensure the file is a valid `.docx` format
   - Check file size (10MB limit)
   - Verify `backend/uploads/` directory exists

### Debug Mode

- **Backend**: Use `npm run dev` for auto-restart on changes
- **Frontend**: Vite provides hot reload by default

## 📝 Next Steps (Day 2)

- [ ] Document generation with filled placeholders
- [ ] Download functionality for completed documents
- [ ] Document preview with placeholder highlighting
- [ ] Save/load document templates
- [ ] User authentication and document history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
