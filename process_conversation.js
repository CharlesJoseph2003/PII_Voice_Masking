import OpenAI from "openai";
import { promises as fs } from 'fs';
import { OPENAI_API_KEY } from './config.js';


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
            'data.json',
            'extracted_conversations.json'
        );

        // Step 2: Anonymize the extracted conversation
        console.log('\nStep 2: Anonymizing conversation...');
        await anonymizeConversation(
            extractedData,
            'anonymized_conversations.json'
        );

        console.log('\nProcess completed successfully!');
    } catch (error) {
        console.error('Error in main process:', error.message);
        process.exit(1);
    }
}

// Run the entire process
processConversation();
