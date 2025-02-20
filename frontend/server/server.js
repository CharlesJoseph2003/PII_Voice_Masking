import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { main } from './main.js';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Create necessary directories if they don't exist
const uploadDir = join(__dirname, 'uploads');
const outputDir = join(__dirname, 'output_speakers');
const dataDir = join(__dirname, 'data');

try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
} catch (err) {
    console.error('Error creating directories:', err);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        console.log('Receiving file:', file.originalname);
        cb(null, 'input.wav');
    }
});

const upload = multer({ storage: storage });

// Enable CORS
app.use(cors());

// Serve static files
app.use('/output_speakers', express.static(outputDir));

// File upload endpoint
app.post('/process-audio', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    try {
        console.log('File received:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');
        console.log('Starting audio processing pipeline...');

        const inputPath = join(uploadDir, 'input.wav');
        
        // Verify the file exists before processing
        try {
            await fs.access(inputPath);
            console.log('Input file verified, starting main processing...');
        } catch (err) {
            throw new Error('Input file not found after upload');
        }

        await main();
        
        const outputPath = join(__dirname, 'output_speakers', 'final_output_diarize.wav');
        
        // Verify the output file exists
        try {
            await fs.access(outputPath);
            console.log('Output file verified at:', outputPath);
        } catch (err) {
            console.error('Failed to find output file at:', outputPath);
            throw new Error('Output file not found after processing');
        }

        const outputUrl = '/output_speakers/final_output_diarize.wav';
        console.log('Processing completed successfully');
        res.json({ success: true, outputUrl });
    } catch (error) {
        console.error('Error in processing pipeline:', error);
        console.error('Error details:', error.stack);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
    console.log('='.repeat(50));
    console.log(`Voice Cloak Server is running on port ${port}`);
    console.log('Waiting for file uploads from frontend...');
    console.log('='.repeat(50));
});
