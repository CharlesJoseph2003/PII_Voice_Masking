import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function extractSpeakerText() {
    try {
        // Load input JSON file
        const dataPath = join(__dirname, 'data', 'data.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        const inputJson = JSON.parse(rawData);

        if (!inputJson || !inputJson.segments) {
            throw new Error('Input JSON is missing or does not have the expected "segments" array');
        }

        // Extract speaker and text fields
        const outputJson = {
            conversations: inputJson.segments.map(segment => ({
                speaker: segment.speaker,
                text: segment.text
            }))
        };

        // Save to extracted_conversations.json in the data directory
        const outputPath = join(__dirname, 'data', 'extracted_conversations.json');
        await fs.writeFile(outputPath, JSON.stringify(outputJson, null, 2));
        console.log('Extracted JSON saved to extracted_conversations.json');
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// Run the extraction
extractSpeakerText();
