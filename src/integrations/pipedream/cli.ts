import * as readline from 'readline';
import * as http from 'http';
import { NotionAuth } from '../notion';

// Pipedream configuration
const PIPEDREAM_CONFIG = {
  clientId: process.env.PIPEDREAM_CLIENT_ID || 'wIlf_amIsMX8e39OeWVhjyH-p-cmoO_cPJb6RchkHzA',
  redirectUrl: 'https://api.pipedream.com/connect/oauth/oa_M4ilDK/callback',
  apiKey: process.env.PIPEDREAM_API_KEY,
  workspaceId: process.env.PIPEDREAM_WORKSPACE_ID,
  projectId: process.env.PIPEDREAM_PROJECT_ID
};

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

// Function to exchange code for access token
async function exchangeCodeForToken(code: string): Promise<NotionAuth> {
  const tokenEndpoint = 'https://api.pipedream.com/connect/oauth/token';
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PIPEDREAM_CONFIG.apiKey}`
    },
    body: JSON.stringify({
      client_id: PIPEDREAM_CONFIG.clientId,
      code: code,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();
  
  return {
    oauth_access_token: data.access_token,
    workspace_id: data.workspace_id || '',
    workspace_name: data.workspace_name || 'Notion Workspace',
    workspace_icon: data.workspace_icon || '',
    bot_id: data.bot_id || ''
  };
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
    console.log('\n=== Notion Authentication via Pipedream Connect ===');
    console.log('To authenticate with Notion, we need to open a browser window.');
    
    const proceed = await askQuestion('Do you want to proceed with Notion authentication? (y/n): ');
    
    if (proceed.toLowerCase() !== 'y') {
      throw new Error('Authentication cancelled by user');
    }
    
    // Create a local server to handle the OAuth callback
    const port = 3456;
    const { server, code } = await createOAuthServer(port);
    
    // Construct the authorization URL with the correct client ID and redirect URL
    const authUrl = `https://api.pipedream.com/connect/oauth/authorize?` +
      `client_id=${encodeURIComponent(PIPEDREAM_CONFIG.clientId)}` +
      `&redirect_uri=${encodeURIComponent(PIPEDREAM_CONFIG.redirectUrl)}` +
      `&response_type=code` +
      `&scope=notion`;
    
    console.log('\nPlease open this URL in your browser to authenticate with Notion:');
    console.log(authUrl);
    console.log('\nWaiting for authentication...');
    
    // Wait for the authorization code
    const authCode = await code;
    
    // Close the server
    server.close();
    
    console.log('\nExchanging authorization code for access token...');
    
    // Exchange the code for an access token
    const auth = await exchangeCodeForToken(authCode);
    
    // Get the parent page ID
    const parentPageId = await askQuestion('\nEnter the Notion parent page ID where reports should be created: ');
    process.env.NOTION_PARENT_PAGE_ID = parentPageId;
    
    console.log('\nNotion authentication successful!');
    rl.close();
    
    return auth;
  } catch (error) {
    rl.close();
    throw error;
  }
} 