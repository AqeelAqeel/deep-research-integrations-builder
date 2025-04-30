import React, { useState, useEffect } from 'react';
import { createNotionPageFromMarkdown, connectToNotion, NotionAuth } from './index';

interface NotionUIProps {
  reportContent?: string;
  reportTitle?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const NotionConnectUI: React.FC<NotionUIProps> = ({
  reportContent,
  reportTitle = 'Research Report',
  onSuccess,
  onError,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentPageId, setParentPageId] = useState('');
  const [pageTitle, setPageTitle] = useState(reportTitle);

  // Check if user is already connected to Notion
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if we have a valid token in localStorage or session
        const token = localStorage.getItem('notion_access_token');
        if (token) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error checking Notion connection:', err);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use Pipedream Connect to authenticate with Notion
      const auth = await connectToNotion();
      
      // Store the token for future use
      localStorage.setItem('notion_access_token', auth.oauth_access_token);
      localStorage.setItem('notion_workspace_id', auth.workspace_id);
      localStorage.setItem('notion_workspace_name', auth.workspace_name);
      
      setIsConnected(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!reportContent) {
      setError('No report content available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('notion_access_token');
      if (!token) {
        throw new Error('Not connected to Notion');
      }

      const auth: NotionAuth = {
        oauth_access_token: token,
        workspace_id: localStorage.getItem('notion_workspace_id') || '',
        workspace_name: localStorage.getItem('notion_workspace_name') || '',
        workspace_icon: '',
        bot_id: '',
      };

      await createNotionPageFromMarkdown(
        auth,
        parentPageId,
        pageTitle,
        reportContent
      );

      if (onSuccess) onSuccess();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Notion Integration</h2>
      
      {!isConnected ? (
        <div>
          <p className="mb-4">Connect your Notion account to save research reports directly to your workspace.</p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect to Notion'}
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-green-600">✓ Connected to Notion</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Parent Page ID</label>
            <input
              type="text"
              value={parentPageId}
              onChange={(e) => setParentPageId(e.target.value)}
              placeholder="Enter the ID of the page where reports should be created"
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find this in the URL of your Notion page: notion.so/workspace/{'{page-id}'}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Page Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleCreatePage}
            disabled={isLoading || !parentPageId || !reportContent}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Creating Page...' : 'Create Notion Page'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 