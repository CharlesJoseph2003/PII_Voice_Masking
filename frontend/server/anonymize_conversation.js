import OpenAI from "openai";
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add your OpenAI API key here as a string
const openai = new OpenAI({
});

async function anonymizeConversation(inputFile, outputFile) {
    try {
        // Create paths relative to the server directory
        const inputPath = join(__dirname, inputFile);
        const outputPath = join(__dirname, outputFile);

        // Read the conversation from the input file
        const rawData = await fs.readFile(inputPath, 'utf8');
        const conversationData = JSON.parse(rawData);

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
                    speaker: speaker,
                    text: textParts.join(': ')
                };
            })
        };

        // Write the anonymized conversation to the output file
        await fs.writeFile(outputPath, JSON.stringify(anonymizedConversation, null, 2));
        console.log('Anonymization completed successfully');
        return anonymizedConversation;
    } catch (error) {
        console.error('Error in anonymization:', error);
        throw error;
    }
}

// Run the anonymization
anonymizeConversation('data/extracted_conversations.json', 'data/anonymized_conversations.json');
