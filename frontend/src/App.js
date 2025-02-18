import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [outputAudioURL, setOutputAudioURL] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'audio/wav') {
      setSelectedFile(file);
      setAudioURL(URL.createObjectURL(file));
      setOutputAudioURL(null);
      setError(null);
    } else {
      alert('Please select a valid .wav file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);

      const response = await fetch('http://localhost:3001/process-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process audio');
      }

      setOutputAudioURL(`http://localhost:3001${data.outputUrl}`);
    } catch (err) {
      setError(err.message);
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessing(false);
    }
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
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Run PII Masking'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}

          <div className="audio-container">
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
