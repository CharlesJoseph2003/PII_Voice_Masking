import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [outputAudioURL, setOutputAudioURL] = useState(null);

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
    // Assuming the output audio URL is received from the backend
    const outputAudioPath = '/final_output.wav';
    setOutputAudioURL(outputAudioPath);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Voice Cloak</h1>
        <p>Voice Anonymization Demo</p>
      </header>
      
      <main className="App-main">
        {/* Demo Section */}
        <section className="demo-section">
          <h2>Demo Example</h2>
          <div className="audio-container">
            <div className="audio-section">
              <h3>Before</h3>
              <audio controls src="/input.wav">
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="audio-section">
              <h3>After PII Masking</h3>
              <audio controls src="/final_output.wav">
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="upload-section">
          <h2>Try it yourself</h2>
          <div className="upload-container">
            <div className="button-group">
              <input
                type="file"
                accept=".wav"
                onChange={handleFileChange}
                className="file-input"
                id="file-input"
              />
              <label htmlFor="file-input" className="button-common file-label">
                Choose WAV File
              </label>
              
              <button 
                onClick={handleUpload}
                className="button-common upload-button"
                disabled={!selectedFile}
              >
                Run PII Masking
              </button>
            </div>
          </div>

          {audioURL && (
            <div className="audio-preview">
              <h3>Audio Preview</h3>
              <audio controls src={audioURL}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {outputAudioURL && (
            <div className="audio-preview">
              <h3>Anonymized Audio</h3>
              <audio controls src={outputAudioURL}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
