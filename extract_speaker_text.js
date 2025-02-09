const fs = require('fs');

try {
    // Load input JSON file
    const inputJson = require('./data.json');

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

    // Save to extracted_conversations.json
    fs.writeFileSync('extracted_conversations.json', JSON.stringify(outputJson, null, 2));
    console.log('Extracted JSON saved to extracted_conversations.json');
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
