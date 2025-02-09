import Replicate from "replicate";
// const replicate = new Replicate();
import { REPLICATE_API_TOKEN } from './config.js';

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});
import { readFile } from "node:fs/promises";
const file = await readFile("./output_speakers/SPEAKER_00_1.wav");

const input = {
    gen_text: "Hello my name is Jack. I am a voice assistant.",
    ref_text: "Hi, my name is Charles Joseph. Where do you live?",
    ref_audio: file
};

const output = await replicate.run("x-lance/f5-tts:87faf6dd7a692dd82043f662e76369cab126a2cf1937e25a9d41e0b834fd230e", { input });

import { writeFile } from "node:fs/promises";
await writeFile("output.wav", output);
//=> output.wav written to disk