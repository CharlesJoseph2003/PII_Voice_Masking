import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'audio/wav') {
      setSelectedFile(file);
      setAudioURL(URL.createObjectURL(file));
    } else {
      alert('Please select a valid .wav file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    // Here you can implement the upload logic to your backend
    console.log('File ready for upload:', selectedFile);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Voice Cloak</h1>
        <p>Upload your .wav file for processing</p>
      </header>
      
      <main className="App-main">
        <div className="upload-container">
          <input
            type="file"
            accept=".wav"
            onChange={handleFileChange}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            Choose WAV File
          </label>
          
          <button 
            onClick={handleUpload}
            className="upload-button"
            disabled={!selectedFile}
          >
            Upload File
          </button>
        </div>

        {audioURL && (
          <div className="audio-preview">
            <h3>Audio Preview</h3>
            <audio controls src={audioURL}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
