import { createNotionPageFromMarkdown } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Demo script to run the Notion integration
 * 
 * Usage:
 * 1. Set up your environment variables in .env
 * 2. Run: npx ts-node src/integrations/notion/run-demo.ts
 */

async function runDemo() {
  console.log('=== Notion Integration Demo ===');
  
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
    console.error('You can create a .env file in the project root with the following content:');
    console.error(`
# Notion Configuration
NOTION_ACCESS_TOKEN=your_notion_integration_token
NOTION_WORKSPACE_ID=your_workspace_id
NOTION_WORKSPACE_NAME=your_workspace_name
NOTION_WORKSPACE_ICON=your_workspace_icon
NOTION_BOT_ID=your_bot_id
NOTION_PARENT_PAGE_ID=your_parent_page_id
    `);
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

  console.log('✅ Environment variables loaded successfully');
  console.log(`Workspace: ${auth.workspace_name}`);
  console.log(`Parent Page ID: ${process.env.NOTION_PARENT_PAGE_ID}`);

  // Read test content from a file or use a sample
  let content: string;
  try {
    // Try to read from report.md if it exists
    content = await fs.readFile('report.md', 'utf-8');
    console.log('✅ Using content from report.md');
  } catch (err) {
    // Use sample content if report.md doesn't exist
    content = `# Notion Integration Demo

This is a demo page created by the Notion integration.

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
    console.log('ℹ️ Using sample content (report.md not found)');
  }

  // Create a page in Notion
  console.log('\nCreating page in Notion...');
  try {
    const result = await createNotionPageFromMarkdown(
      auth,
      process.env.NOTION_PARENT_PAGE_ID!,
      'Notion Integration Demo',
      content
    );

    console.log('✅ Page created successfully!');
    console.log('Page ID:', result.id);
    console.log('Page URL:', `https://notion.so/${process.env.NOTION_WORKSPACE_ID}/${result.id.replace(/-/g, '')}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating page:', error);
    throw error;
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo()
    .then(() => {
      console.log('\n=== Demo completed successfully ===');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n=== Demo failed ===');
      console.error(error);
      process.exit(1);
    });
}

export { runDemo }; 