import Replicate from "replicate";
import { REPLICATE_API_TOKEN } from './config.js';
import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";

// Read and parse both conversation files
const anonymizedData = JSON.parse(await readFile("./anonymized_conversations.json", 'utf8'));
const extractedData = JSON.parse(await readFile("./extracted_conversations.json", 'utf8'));

// Extract all SPEAKER_00 text from anonymized conversations
const speaker00Text = anonymizedData.conversations
    .filter(conv => conv.speaker === "SPEAKER_00")
    .map(conv => conv.text)
    .join(" ");

// Get the first SPEAKER_00 text from extracted conversations
const referenceText = extractedData.conversations
    .find(conv => conv.speaker === "SPEAKER_00")?.text || "";

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

const file = await readFile("./output_speakers/SPEAKER_00_1.wav");

const input = {
    gen_text: speaker00Text,
    ref_text: referenceText,
    ref_audio: file
};

const output = await replicate.run(
    "x-lance/f5-tts:87faf6dd7a692dd82043f662e76369cab126a2cf1937e25a9d41e0b834fd230e", 
    { input }
);

await writeFile("output.wav", output);