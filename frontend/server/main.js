import Replicate from "replicate";
import { readFile, writeFile } from "node:fs/promises";
import { REPLICATE_API_TOKEN } from './config.js';
import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from "openai";
import { OPENAI_API_KEY } from './config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const audioFile = join(__dirname, 'uploads', 'input.wav');
const jsonFile = join(__dirname, 'data', 'data.json');

async function diarizeAudio() {
    try {
        const replicate = new Replicate({
            auth: REPLICATE_API_TOKEN,
        });

        console.log("Reading audio file...");
        const file = await readFile(audioFile);

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

        console.log("Saving output to data.json...");
        await writeFile(jsonFile, JSON.stringify(output, null, 2));
        console.log("Diarization complete! Output saved to data.json");
        return output;
    } catch (error) {
        console.error("Error in diarization:", error.message);
        process.exit(1);
    }
}

async function extractAudioSegments() {
    try {
        // Load JSON data
        const jsonData = JSON.parse(await fs.readFile(jsonFile, 'utf8'));
        const segments = jsonData.segments;

        // Ensure output folder exists
        const outputFolder = join(__dirname, 'output_speakers');
        await fs.mkdir(join(__dirname, 'data'), { recursive: true });
        await fs.mkdir(outputFolder, { recursive: true });

        // Extract segments for each speaker
        for (const [index, segment] of segments.entries()) {
            const startTime = segment.start;
            const duration = segment.end - segment.start;
            const speaker = segment.speaker;
            const outputFile = join(outputFolder, `${speaker}_${index}.wav`);

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
        console.error('Error in extraction:', error.message);
        process.exit(1);
    }
}

// Initialize OpenAI with API key from config
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

async function extractSpeakerText(inputFile, outputFile) {
    try {
        // Read the conversation from the input file
        const rawData = await fs.readFile(inputFile, 'utf8');
        const inputJson = JSON.parse(rawData);

        // Extract speaker and text fields
        const outputJson = {
            conversations: inputJson.segments.map(segment => ({
                speaker: segment.speaker,
                text: segment.text
            }))
        };

        // Save to output file
        await fs.writeFile(outputFile, JSON.stringify(outputJson, null, 2));
        console.log(`Extracted conversation saved to ${outputFile}`);
        return outputJson;
    } catch (error) {
        console.error('Error in extraction:', error.message);
        process.exit(1);
    }
}

async function anonymizeConversation(conversationData, outputFile) {
    try {
        // Prepare the conversation for GPT
        const conversationText = conversationData.conversations
            .map(msg => `${msg.speaker}: ${msg.text}`)
            .join('\n');

        // Create the GPT prompt
        const prompt = `Please anonymize the following customer service conversation by:
1. Replacing all names with different fake names
2. Replacing addresses with different fake addresses
3. Replacing phone numbers with different fake numbers
4. Replacing account numbers with different fake numbers
5. Keeping the same format and conversation flow
6. Being consistent with the replacements throughout the conversation
7. Making sure the replacements are realistic and make sense in context

Original conversation:
${conversationText}

Provide only the anonymized conversation in the exact same format, nothing else.`;

        // Call GPT API
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant that anonymizes conversations by replacing personal information with realistic but fake data." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        // Parse the response and convert back to the original format
        const anonymizedText = completion.choices[0].message.content;
        const anonymizedLines = anonymizedText.split('\n').filter(line => line.trim());
        
        // Convert back to the original JSON structure
        const anonymizedConversation = {
            conversations: anonymizedLines.map(line => {
                const [speaker, ...textParts] = line.split(': ');
                return {
                    speaker: speaker.trim(),
                    text: textParts.join(': ').trim()
                };
            })
        };

        // Write the anonymized conversation to the output file
        await fs.writeFile(outputFile, JSON.stringify(anonymizedConversation, null, 2));
        console.log(`Anonymized conversation saved to ${outputFile}`);
    } catch (error) {
        console.error('Error in anonymization:', error.message);
        process.exit(1);
    }
}

async function processConversation() {
    try {
        // Step 1: Extract speaker text from raw data
        console.log('Step 1: Extracting conversation...');
        const extractedData = await extractSpeakerText(
            jsonFile,
            join(__dirname, 'data', 'extracted_conversations.json')
        );

        // Step 2: Anonymize the extracted conversation
        console.log('\nStep 2: Anonymizing conversation...');
        await anonymizeConversation(
            extractedData,
            join(__dirname, 'data', 'anonymized_conversations.json')
        );

        console.log('\nProcess completed successfully!');
    } catch (error) {
        console.error('Error in main process:', error.message);
        process.exit(1);
    }
}

async function cloneVoice() {
    try {
        console.log("Starting voice cloning...");
        
        // Read and parse both conversation files
        const anonymizedData = JSON.parse(await fs.readFile(join(__dirname, 'data', 'anonymized_conversations.json'), 'utf8'));
        const extractedData = JSON.parse(await fs.readFile(join(__dirname, 'data', 'extracted_conversations.json'), 'utf8'));

        // Create a map to store reference audio files for each speaker
        const speakerAudioFiles = {};
        
        // Find reference audio files for each speaker
        for (const speaker of ['SPEAKER_00', 'SPEAKER_01']) {
            const possibleFiles = [0, 1, 2];
            let foundFile = false;
            
            for (const index of possibleFiles) {
                const filePath = join(__dirname, 'output_speakers', `${speaker}_${index}.wav`);
                try {
                    const file = await readFile(filePath);
                    speakerAudioFiles[speaker] = file;
                    console.log(`Found reference audio file for ${speaker}: ${filePath}`);
                    foundFile = true;
                    break;
                } catch (err) {
                    console.log(`File ${filePath} not found, trying next...`);
                }
            }
            
            if (!foundFile) {
                throw new Error(`No valid audio file found for ${speaker}`);
            }
        }

        // Process each conversation segment in order
        const segments = [];
        for (const conv of anonymizedData.conversations) {
            console.log(`Processing segment for ${conv.speaker}...`);
            
            // Get reference text for this speaker
            const referenceText = extractedData.conversations
                .find(c => c.speaker === conv.speaker)?.text || "";

            const input = {
                gen_text: conv.text,
                ref_text: referenceText,
                ref_audio: speakerAudioFiles[conv.speaker]
            };

            console.log(`Processing voice clone for segment with Replicate...`);
            const replicate = new Replicate({
                auth: REPLICATE_API_TOKEN,
            });
            const output = await replicate.run(
                "x-lance/f5-tts:87faf6dd7a692dd82043f662e76369cab126a2cf1937e25a9d41e0b834fd230e", 
                { input }
            );

            // Save segment output
            const segmentFile = join(__dirname, `segment_${segments.length}.wav`);
            await writeFile(segmentFile, output);
            segments.push(segmentFile);
            console.log(`Segment complete! Output saved to ${segmentFile}`);
        }

        // Combine all segments in order
        console.log("Combining audio segments...");
        const command = ffmpeg();
        
        // Add all segments as inputs
        segments.forEach(segment => {
            command.input(segment);
        });

        // Create the filter complex string for concatenation
        const filterComplex = segments.map((_, index) => `[${index}:0]`).join('') + 
                            `concat=n=${segments.length}:v=0:a=1[out]`;

        // Run the ffmpeg command
        command
            .complexFilter(filterComplex)
            .map('[out]')
            .on('end', () => {
                console.log('Audio combination complete!');
                // Clean up temporary segment files
                segments.forEach(segment => {
                    fs.unlink(segment).catch(console.error);
                });
            })
            .on('error', (err) => console.error('Error combining audio:', err))
            .save(join(__dirname, 'output_speakers', 'final_output_diarize.wav'));

        console.log("Voice cloning and combination complete! Final output saved to output_speakers/final_output_diarize.wav");
    } catch (error) {
        console.error("Error in voice cloning:", error.message);
        process.exit(1);
    }
}

export async function main() {
    try {
        console.log("\n=== Starting Voice Processing Pipeline ===");
        console.log("Current time:", new Date().toISOString());
        
        // Step 1: Diarize the audio
        console.log("\nStep 1: Diarizing audio...");
        console.time('diarization');
        const diarizedData = await diarizeAudio();
        console.timeEnd('diarization');
        
        // Step 2: Extract audio segments
        console.log("\nStep 2: Extracting audio segments...");
        console.time('extraction');
        await extractAudioSegments();
        console.timeEnd('extraction');
        
        // Step 3: Process conversation
        console.log("\nStep 3: Processing conversation...");
        console.time('conversation');
        await processConversation();
        console.timeEnd('conversation');
        
        // Step 4: Clone voice
        console.log("\nStep 4: Cloning voice...");
        console.time('cloning');
        await cloneVoice();
        console.timeEnd('cloning');
        
        console.log("\n=== Pipeline completed successfully! ===");
        console.log("Current time:", new Date().toISOString());
        return true;
    } catch (error) {
        console.error("\n=== Pipeline Error ===");
        console.error("Error details:", error);
        console.error("Stack trace:", error.stack);
        throw error;
    }
}