# PII_Voice_Masking

A tool to extract and anonymize conversations by removing personally identifiable information (PII).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `.env` file

## Usage

Run the script to process a conversation:
```bash
node process_conversation.js
```

This will:
1. Read the conversation from `data.json`
2. Extract speaker text to `extracted_conversations.json`
3. Create an anonymized version in `anonymized_conversations.json`

## Files
- `process_conversation.js` - Main script that handles extraction and anonymization
- `data.json` - Input file containing the raw conversation
- `extracted_conversations.json` - Intermediate file with extracted speaker text
- `anonymized_conversations.json` - Final output with anonymized conversation
- `.env` - Environment variables (not tracked in git)
- `.env.example` - Template for environment variables