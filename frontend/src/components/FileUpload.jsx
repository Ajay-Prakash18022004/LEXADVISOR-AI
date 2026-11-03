import React, { useRef } from 'react';

export default function FileUpload({ onFileSelect, selectedFile }) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="upload">
      <label
        className="drop"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        htmlFor="react-file-upload"
      >
        <span className="drop-icon">📄</span>
        <strong>Drop contract or stamp paper scan here</strong>
        <span className="note">or click to browse files (PDF, DOCX, PNG, JPG)</span>
        <input
          id="react-file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
        />
      </label>
      {selectedFile && (
        <div className="note" style={{ marginTop: '8px', fontWeight: 600 }}>
          Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </div>
      )}
    </div>
  );
}
