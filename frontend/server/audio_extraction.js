import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const audioFile = 'input.wav';  // Change this to your actual WAV file
const jsonFile = 'data.json';  // Your JSON file with timestamps

async function extractAudioSegments() {
    try {
        // Load JSON data
        const jsonData = JSON.parse(await fs.readFile(jsonFile, 'utf8'));
        const segments = jsonData.segments;

        // Ensure output folder exists
        const outputFolder = 'output_speakers';
        try {
            await fs.access(outputFolder);
        } catch {
            await fs.mkdir(outputFolder);
        }

        // Extract segments for each speaker
        for (const [index, segment] of segments.entries()) {
            const startTime = segment.start;
            const duration = segment.end - segment.start;
            const speaker = segment.speaker;
            const outputFile = `${outputFolder}/${speaker}_${index}.wav`;

            console.log(`Extracting ${speaker} from ${startTime}s to ${segment.end}s...`);

            await new Promise((resolve, reject) => {
                ffmpeg(audioFile)
                    .setStartTime(startTime)
                    .setDuration(duration)
                    .output(outputFile)
                    .on('end', () => {
                        console.log(`Saved: ${outputFile}`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`Error extracting segment: ${err.message}`);
                        reject(err);
                    })
                    .run();
            });
        }
        
        console.log('All segments extracted successfully!');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the extraction
extractAudioSegments();
