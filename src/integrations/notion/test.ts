import * as fs from 'fs/promises';
import { createNotionPageFromMarkdown } from './index';

/**
 * Test script for Notion integration
 * 
 * Usage:
 * 1. Set up your environment variables in .env
 * 2. Run: npx ts-node src/integrations/notion/test.ts
 */

async function testNotionIntegration() {
  try {
    // Check if environment variables are set
    const requiredEnvVars = [
      'NOTION_ACCESS_TOKEN',
      'NOTION_WORKSPACE_ID',
      'NOTION_PARENT_PAGE_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:');
      missingVars.forEach(varName => console.error(`- ${varName}`));
      console.error('\nPlease set these variables in your .env file');
      process.exit(1);
    }

    // Create Notion auth object
    const auth = {
      oauth_access_token: process.env.NOTION_ACCESS_TOKEN!,
      workspace_id: process.env.NOTION_WORKSPACE_ID!,
      workspace_name: process.env.NOTION_WORKSPACE_NAME || 'My Workspace',
      workspace_icon: process.env.NOTION_WORKSPACE_ICON || '',
      bot_id: process.env.NOTION_BOT_ID || '',
    };

    // Read test content from a file or use a sample
    let content: string;
    try {
      // Try to read from report.md if it exists
      content = await fs.readFile('report.md', 'utf-8');
      console.log('Using content from report.md');
    } catch (err) {
      // Use sample content if report.md doesn't exist
      content = `# Test Notion Integration

This is a test page created by the Notion integration.

## Features

- Markdown to Notion conversion
- Pipedream Connect integration
- Simple API for creating pages

## Code Example

\`\`\`javascript
const result = await createNotionPageFromMarkdown(
  auth,
  parentId,
  title,
  content
);
\`\`\`

Created at: ${new Date().toISOString()}
`;
      console.log('Using sample content');
    }

    // Create a page in Notion
    console.log('Creating page in Notion...');
    const result = await createNotionPageFromMarkdown(
      auth,
      process.env.NOTION_PARENT_PAGE_ID!,
      'Test Integration Page',
      content
    );

    console.log('Page created successfully!');
    console.log('Page ID:', result.id);
    // Notion API doesn't return a URL directly, we need to construct it
    console.log('Page URL:', `https://notion.so/${process.env.NOTION_WORKSPACE_ID}/${result.id.replace(/-/g, '')}`);
    
    return result;
  } catch (error) {
    console.error('Error testing Notion integration:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotionIntegration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testNotionIntegration }; 