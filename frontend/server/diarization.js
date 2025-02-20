import Replicate from "replicate";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { REPLICATE_API_TOKEN } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function diarizeAudio() {
    try {
        const replicate = new Replicate({
            auth: REPLICATE_API_TOKEN,
        });

        const inputPath = join(__dirname, 'uploads', 'input.wav');
        console.log("Reading audio file...");
        const file = await readFile(inputPath);

        console.log("Processing audio with Whisper diarization...");
        const input = {
            file: file,
            prompt: "LLama, AI, Meta.",
            file_url: "",
            language: "en",
            num_speakers: 2
        };

        const output = await replicate.run(
            "thomasmol/whisper-diarization:cbd15da9f839c5f932742f86ce7def3a03c22e2b4171d42823e83e314547003f",
            { input }
        );

        const outputPath = join(__dirname, 'data', 'data.json');
        console.log("Saving output to data.json...");
        await writeFile(outputPath, JSON.stringify(output, null, 2));
        console.log("Diarization complete! Output saved to data.json");
    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
}

// Run the diarization
diarizeAudio();