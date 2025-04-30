import { Client } from "@notionhq/client";

// Define the NotionAuth interface for type safety
export interface NotionAuth {
  oauth_access_token: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  bot_id: string;
}

// Define the component interface for Pipedream
interface PipedreamComponent {
  name: string;
  version: string;
  type: string;
  props: Record<string, any>;
  run: (context: any) => Promise<any>;
  [key: string]: any; // Allow additional properties
}

// Define the context interface for Pipedream
interface PipedreamContext {
  steps: Record<string, any>;
  $: any;
}

// Pipedream Connect SDK interface
export interface PipedreamConnect {
  connectAccount: (options: {
    app: string;
    oauthAppId?: string;
  }) => Promise<{
    access_token: string;
    workspace_id: string;
    workspace_name: string;
    workspace_icon?: string;
    bot_id?: string;
  }>;
}

// Function to initialize Pipedream Connect
export async function initializePipedreamConnect(): Promise<PipedreamConnect> {
  // In a browser environment, this would load the Pipedream Connect SDK
  // For CLI applications, we'll use a different approach
  if (typeof window !== 'undefined') {
    // @ts-ignore - Pipedream Connect SDK
    return window.pd;
  } else {
    // For CLI applications, we'll use a mock implementation
    // In a real implementation, you would use the Pipedream API directly
    return {
      connectAccount: async (options) => {
        // This is a mock implementation for CLI
        // In a real implementation, you would use the Pipedream API
        throw new Error('Pipedream Connect is not available in CLI mode. Please use the web UI for authentication.');
      }
    };
  }
}

// Function to connect to Notion via Pipedream
export async function connectToNotion(): Promise<NotionAuth> {
  const pd = await initializePipedreamConnect();
  
  try {
    const result = await pd.connectAccount({
      app: 'notion',
      // If you have a custom OAuth client, uncomment and add your OAuth app ID
      // oauthAppId: 'your_oauth_app_id',
    });
    
    return {
      oauth_access_token: result.access_token,
      workspace_id: result.workspace_id,
      workspace_name: result.workspace_name,
      workspace_icon: result.workspace_icon || '',
      bot_id: result.bot_id || '',
    };
  } catch (error) {
    console.error('Failed to connect to Notion via Pipedream:', error);
    throw error;
  }
}

// Function to save Notion auth to environment variables
export function saveNotionAuthToEnv(auth: NotionAuth): void {
  process.env.NOTION_ACCESS_TOKEN = auth.oauth_access_token;
  process.env.NOTION_WORKSPACE_ID = auth.workspace_id;
  process.env.NOTION_WORKSPACE_NAME = auth.workspace_name;
  process.env.NOTION_WORKSPACE_ICON = auth.workspace_icon;
  process.env.NOTION_BOT_ID = auth.bot_id;
}

// Notion authentication component
export const notionAuth: PipedreamComponent = {
  name: "notion_auth",
  version: "0.0.1",
  type: "oauth",
  props: {
    notion: {
      type: "app",
      app: "notion",
    },
  },
  async run({ steps, $ }: PipedreamContext) {
    const auth = this.notion.$auth as NotionAuth;
    return new Client({
      auth: auth.oauth_access_token,
    });
  },
};

// Create Notion page component
export const createNotionPage: PipedreamComponent = {
  name: "create_notion_page",
  version: "0.0.1",
  type: "action",
  props: {
    notion: {
      type: "app",
      app: "notion",
    },
    parentId: {
      type: "string",
      label: "Parent ID",
      description: "The ID of the parent page or database",
    },
    title: {
      type: "string",
      label: "Page Title",
      description: "The title of the new page",
    },
    content: {
      type: "string",
      label: "Page Content",
      description: "The content of the page in markdown format",
    },
  },
  async run({ steps, $ }: PipedreamContext) {
    const auth = this.notion.$auth as NotionAuth;
    const notion = new Client({
      auth: auth.oauth_access_token,
    });

    // Convert markdown content to Notion blocks
    const blocks = await convertMarkdownToNotionBlocks(this.content);

    return await notion.pages.create({
      parent: {
        page_id: this.parentId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: this.title,
              },
            },
          ],
        },
      },
      children: blocks,
    });
  },
};

// Helper function to convert markdown to Notion blocks
async function convertMarkdownToNotionBlocks(markdown: string) {
  // This is a placeholder - you'll need to implement proper markdown to Notion blocks conversion
  // You can use libraries like 'marked' for markdown parsing
  return [
    {
      paragraph: {
        rich_text: [
          {
            text: {
              content: markdown,
            },
          },
        ],
      },
    },
  ];
}

// Export a simple function to create a Notion page from markdown content
export async function createNotionPageFromMarkdown(
  auth: NotionAuth,
  parentId: string,
  title: string,
  content: string
) {
  const notion = new Client({
    auth: auth.oauth_access_token,
  });

  // Convert markdown content to Notion blocks
  const blocks = await convertMarkdownToNotionBlocks(content);

  return await notion.pages.create({
    parent: {
      page_id: parentId,
    },
    properties: {
      title: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    },
    children: blocks,
  });
} 