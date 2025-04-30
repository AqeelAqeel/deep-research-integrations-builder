import { Client } from "@notionhq/client";
import { NotionAuth } from "./index";

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
    const blocks = await this.convertMarkdownToNotionBlocks(content);

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
      children: blocks,
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
      const blocks = await this.convertMarkdownToNotionBlocks(content);
      updateParams.children = blocks;
    }

    return await this.client.pages.update(updateParams);
  }

  async deletePage(pageId: string) {
    return await this.client.pages.update({
      page_id: pageId,
      archived: true,
    });
  }

  private async convertMarkdownToNotionBlocks(markdown: string) {
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
} 