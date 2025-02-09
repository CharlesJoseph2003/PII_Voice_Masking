import Replicate from "replicate";
import { readFile } from "node:fs/promises";
import { REPLICATE_API_TOKEN } from './config.js';

async function diarizeAudio() {
    try {
        const replicate = new Replicate({
            auth: REPLICATE_API_TOKEN,
        });

        console.log("Reading audio file...");
        const file = await readFile("test_audio.wav");

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

        console.log("Diarization complete! Output:");
        console.log(JSON.stringify(output, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

// Run the diarization
diarizeAudio();