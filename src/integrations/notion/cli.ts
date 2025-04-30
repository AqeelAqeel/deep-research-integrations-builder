import * as readline from 'readline';
import * as http from 'http';
import { NotionAuth } from './index';

// Create a simple HTTP server to handle the OAuth callback
function createOAuthServer(port: number): Promise<{ server: http.Server; code: Promise<string> }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      const code = url.searchParams.get('code');
      
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body>
              <h1>Authentication Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
        
        // Resolve the code promise
        codePromiseResolve(code);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>No authorization code received. Please try again.</p>
            </body>
          </html>
        `);
      }
    });
    
    server.listen(port, () => {
      console.log(`OAuth callback server listening on port ${port}`);
    });
    
    let codePromiseResolve: (value: string) => void;
    const codePromise = new Promise<string>((resolve) => {
      codePromiseResolve = resolve;
    });
    
    resolve({ server, code: codePromise });
  });
}

// Function to get Notion auth via CLI
export async function getNotionAuthViaCLI(): Promise<NotionAuth> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  // Helper function to get user input
  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(query, answer => {
        resolve(answer);
      });
    });
  };
  
  try {
    console.log('\n=== Notion Authentication ===');
    console.log('To authenticate with Notion, we need to set up the connection.');
    
    // Get Notion credentials from user
    console.log('\nPlease provide your Notion integration credentials:');
    const notionToken = await askQuestion('Enter your Notion Integration Token (from https://www.notion.so/my-integrations): ');
    
    if (!notionToken) {
      throw new Error('Notion Integration Token is required');
    }

    // Create a mock auth object with the provided token
    const auth: NotionAuth = {
      oauth_access_token: notionToken,
      workspace_id: 'direct_integration',
      workspace_name: 'Direct Integration',
      workspace_icon: '',
      bot_id: '',
    };
    
    // Get the parent page ID
    const parentPageId = await askQuestion('Enter the Notion parent page ID where reports should be created: ');
    process.env.NOTION_PARENT_PAGE_ID = parentPageId;
    
    console.log('\nNotion authentication successful!');
    rl.close();
    
    return auth;
  } catch (error) {
    rl.close();
    throw error;
  }
} 