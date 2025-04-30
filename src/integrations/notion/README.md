# Notion Integration with Pipedream Connect

This integration allows you to connect to Notion using Pipedream Connect and create pages from markdown content.

## Setup

### 1. Install Dependencies

```bash
npm install @notionhq/client @pipedream/platform marked
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```
# Notion Configuration
NOTION_ACCESS_TOKEN=your_notion_integration_token
NOTION_WORKSPACE_ID=your_workspace_id
NOTION_WORKSPACE_NAME=your_workspace_name
NOTION_WORKSPACE_ICON=your_workspace_icon
NOTION_BOT_ID=your_bot_id
NOTION_PARENT_PAGE_ID=your_parent_page_id

# Pipedream Configuration (if using Pipedream Connect)
PIPEDREAM_CLIENT_ID=your_pipedream_client_id
PIPEDREAM_CLIENT_SECRET=your_pipedream_client_secret
```

### 3. Get Notion Credentials

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Research Reports")
4. Select the workspace where you want to create pages
5. Click "Submit"
6. Copy the "Internal Integration Token" - this is your `NOTION_ACCESS_TOKEN`
7. Go to your Notion workspace
8. Create a page where you want the reports to be created
9. Click "Share" and add your integration
10. Copy the page ID from the URL (it's the part after the workspace name and before any question marks)

### 4. Get Pipedream Credentials (if using Pipedream Connect)

1. Go to [https://api.pipedream.com/oauth/apps](https://api.pipedream.com/oauth/apps)
2. Create a new app
3. Get the Client ID and Client Secret

## Usage

### Basic Usage

```typescript
import { createNotionPageFromMarkdown } from './integrations/notion';

// Create a Notion auth object
const auth = {
  oauth_access_token: process.env.NOTION_ACCESS_TOKEN!,
  workspace_id: process.env.NOTION_WORKSPACE_ID!,
  workspace_name: process.env.NOTION_WORKSPACE_NAME || 'My Workspace',
  workspace_icon: process.env.NOTION_WORKSPACE_ICON || '',
  bot_id: process.env.NOTION_BOT_ID || '',
};

// Create a page in Notion
const result = await createNotionPageFromMarkdown(
  auth,
  process.env.NOTION_PARENT_PAGE_ID!,
  'My Research Report',
  '# My Research Report\n\nThis is the content of my report.'
);

console.log('Page created with ID:', result.id);
```

### Using with Pipedream Connect

If you want to use Pipedream Connect for authentication, you can use the UI component:

```tsx
import { NotionConnectUI } from './integrations/notion/ui';

function App() {
  return (
    <div>
      <h1>My Research App</h1>
      <NotionConnectUI 
        reportContent="# My Research Report\n\nThis is the content of my report."
        reportTitle="My Research Report"
        onSuccess={() => console.log('Page created successfully!')}
        onError={(error) => console.error('Error creating page:', error)}
      />
    </div>
  );
}
```

### Testing the Integration

Run the test script to verify your setup:

```bash
npx ts-node src/integrations/notion/test.ts
```

This will create a test page in your Notion workspace using the credentials from your `.env` file.

## Integration with Research Reports

The integration is designed to work with the research report generator. When a report is generated, it can be automatically saved to Notion.

To enable this feature, make sure your environment variables are set correctly, and the integration will be used automatically when generating reports.

## Troubleshooting

- **Authentication Errors**: Make sure your Notion token is valid and has the necessary permissions.
- **Page Creation Errors**: Verify that the parent page ID is correct and that your integration has access to the page.
- **Pipedream Connect Errors**: Check that your Pipedream credentials are correct and that you've set up the OAuth flow properly. 