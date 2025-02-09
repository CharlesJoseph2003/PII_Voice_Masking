import Replicate from "replicate";
import { REPLICATE_API_TOKEN } from './config.js';
import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";

// Read and parse the anonymized conversations
const anonymizedData = JSON.parse(await readFile("./anonymized_conversations.json", 'utf8'));

// Extract all SPEAKER_01 text
const speaker01Text = anonymizedData.conversations
    .filter(conv => conv.speaker === "SPEAKER_00")
    .map(conv => conv.text)
    .join(" ");

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

const file = await readFile("./output_speakers/SPEAKER_00_1.wav");

const input = {
    gen_text: speaker01Text,
    ref_text: "Hi, my name is Charles Joseph. Where do you live?",
    ref_audio: file
};

const output = await replicate.run(
    "x-lance/f5-tts:87faf6dd7a692dd82043f662e76369cab126a2cf1937e25a9d41e0b834fd230e", 
    { input }
);

await writeFile("output.wav", output);