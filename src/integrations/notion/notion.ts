import { Client } from "@notionhq/client";
import { NotionAuth } from "./index";

type NotionBlock = {
  type: string;
  [key: string]: any;
} & {
  object: "block";
};

export class NotionService {
  private client: Client;

  constructor(auth: NotionAuth) {
    this.client = new Client({
      auth: auth.oauth_access_token,
    });
  }

  async createPage(params: {
    parentId: string;
    title: string;
    content: string;
  }) {
    const { parentId, title, content } = params;

    // Convert markdown content to Notion blocks
    const blocks = this.convertMarkdownToNotionBlocks(content);

    return await this.client.pages.create({
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
      children: blocks as any, // Type assertion needed due to Notion API types
    });
  }

  async getPage(pageId: string) {
    return await this.client.pages.retrieve({
      page_id: pageId,
    });
  }

  async updatePage(params: {
    pageId: string;
    title?: string;
    content?: string;
  }) {
    const { pageId, title, content } = params;

    const updateParams: any = {
      page_id: pageId,
    };

    if (title) {
      updateParams.properties = {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      };
    }

    if (content) {
      const blocks = this.convertMarkdownToNotionBlocks(content);
      updateParams.children = blocks as any; // Type assertion needed due to Notion API types
    }

    return await this.client.pages.update(updateParams);
  }

  async deletePage(pageId: string) {
    return await this.client.pages.update({
      page_id: pageId,
      archived: true,
    });
  }

  private convertMarkdownToNotionBlocks(markdown: string): NotionBlock[] {
    const lines = markdown.split('\n');
    const blocks: NotionBlock[] = [];
    let currentListItems: string[] = [];
    let isInCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = 'plain text';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';

      // Handle code blocks
      if (line.startsWith('```')) {
        if (!isInCodeBlock) {
          // Start of code block
          isInCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim() || 'plain text';
          codeBlockContent = '';
        } else {
          // End of code block
          isInCodeBlock = false;
          blocks.push({
            object: "block",
            type: 'code',
            code: {
              rich_text: [{
                text: {
                  content: codeBlockContent.trim()
                }
              }],
              language: codeBlockLanguage
            }
          });
        }
        continue;
      }

      if (isInCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle headings
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        blocks.push({
          object: "block",
          type: `heading_${level}`,
          [`heading_${level}`]: {
            rich_text: [{
              text: {
                content: text
              }
            }],
            is_toggleable: false,
            color: 'default'
          }
        });
        continue;
      }

      // Handle lists
      if (line.match(/^[-*]\s/)) {
        currentListItems.push(line.replace(/^[-*]\s/, ''));
        continue;
      } else if (currentListItems.length > 0) {
        // Process accumulated list items
        currentListItems.forEach(item => {
          blocks.push({
            object: "block",
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: {
                  content: item
                }
              }]
            }
          });
        });
        currentListItems = [];
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        blocks.push({
          object: "block",
          type: 'quote',
          quote: {
            rich_text: [{
              text: {
                content: line.replace(/^>\s*/, '')
              }
            }]
          }
        });
        continue;
      }

      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}$/)) {
        blocks.push({ 
          object: "block",
          type: 'divider',
          divider: {} 
        });
        continue;
      }

      // Handle regular paragraphs
      if (line.trim()) {
        blocks.push({
          object: "block",
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              text: {
                content: line
              }
            }]
          }
        });
      }
    }

    // Handle any remaining list items
    if (currentListItems.length > 0) {
      currentListItems.forEach(item => {
        blocks.push({
          object: "block",
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: {
                content: item
              }
            }]
          }
        });
      });
    }

    return blocks;
  }
} 