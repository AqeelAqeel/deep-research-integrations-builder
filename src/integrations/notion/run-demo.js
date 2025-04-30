// JavaScript version of the Notion integration demo
const fs = require('fs').promises;
const path = require('path');

/**
 * Demo script to run the Notion integration
 * 
 * Usage:
 * 1. Set up your environment variables in .env
 * 2. Run: node src/integrations/notion/run-demo.js
 */

// Import the Notion client directly
const { Client } = require('@notionhq/client');

async function runDemo() {
  console.log('=== Notion Integration Demo ===');
  
  // For demo purposes, we'll use placeholder values
  // In a real implementation, these would come from environment variables
  const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN || 'your_notion_integration_token';
  const NOTION_WORKSPACE_ID = process.env.NOTION_WORKSPACE_ID || 'your_workspace_id';
  const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID || 'your_parent_page_id';
  
  // Check if we're using placeholder values
  const usingPlaceholders = 
    NOTION_ACCESS_TOKEN === 'your_notion_integration_token' || 
    NOTION_WORKSPACE_ID === 'your_workspace_id' || 
    NOTION_PARENT_PAGE_ID === 'your_parent_page_id';
  
  if (usingPlaceholders) {
    console.log('⚠️ Using placeholder values for demonstration purposes');
    console.log('To use real values, set the following environment variables:');
    console.log('- NOTION_ACCESS_TOKEN');
    console.log('- NOTION_WORKSPACE_ID');
    console.log('- NOTION_PARENT_PAGE_ID');
    console.log('\nOr create a .env file in the project root with these values.');
  }

  // Create Notion client
  const notion = new Client({
    auth: NOTION_ACCESS_TOKEN,
  });

  console.log('✅ Configuration loaded');
  console.log(`Workspace ID: ${NOTION_WORKSPACE_ID}`);
  console.log(`Parent Page ID: ${NOTION_PARENT_PAGE_ID}`);

  // Read test content from a file or use a sample
  let content;
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
const result = await notion.pages.create({
  parent: { page_id: parentId },
  properties: {
    title: {
      title: [{ text: { content: title } }]
    }
  },
  children: blocks
});
\`\`\`

Created at: ${new Date().toISOString()}
`;
    console.log('ℹ️ Using sample content (report.md not found)');
  }

  // Convert markdown to Notion blocks (simplified version)
  const blocks = [
    {
      paragraph: {
        rich_text: [
          {
            text: {
              content: content
            }
          }
        ]
      }
    }
  ];

  // Create a page in Notion
  console.log('\nCreating page in Notion...');
  
  if (usingPlaceholders) {
    console.log('⚠️ Skipping actual API call due to placeholder values');
    console.log('In a real implementation, this would create a page in Notion with:');
    console.log('- Title: Notion Integration Demo');
    console.log('- Content: The sample markdown content');
    console.log('- Parent Page ID: ' + NOTION_PARENT_PAGE_ID);
    
    // Return a mock result
    return {
      id: 'mock-page-id-12345',
      url: `https://notion.so/${NOTION_WORKSPACE_ID}/mock-page-id-12345`
    };
  }
  
  try {
    const result = await notion.pages.create({
      parent: {
        page_id: NOTION_PARENT_PAGE_ID
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: 'Notion Integration Demo'
              }
            }
          ]
        }
      },
      children: blocks
    });

    console.log('✅ Page created successfully!');
    console.log('Page ID:', result.id);
    console.log('Page URL:', `https://notion.so/${NOTION_WORKSPACE_ID}/${result.id.replace(/-/g, '')}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating page:', error);
    throw error;
  }
}

// Run the demo
runDemo()
  .then((result) => {
    console.log('\n=== Demo completed successfully ===');
    if (result) {
      console.log('Result:', result);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Demo failed ===');
    console.error(error);
    process.exit(1);
  }); 