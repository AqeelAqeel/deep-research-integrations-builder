import * as fs from 'fs/promises';
import * as readline from 'readline';

import { getModel } from './ai/providers';
import {
  deepResearch,
  writeFinalAnswer,
  writeFinalReport,
} from './deep-research';
import { generateFeedback } from './feedback';
import { NotionService } from './integrations/notion/notion';
import { NotionAuth, saveNotionAuthToEnv } from './integrations/notion';
import { getNotionAuthViaCLI } from './integrations/pipedream/cli';

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

// run the agent
async function run() {
  console.log('Using model: ', getModel().modelId);

  // Get initial query
  const initialQuery = await askQuestion('What would you like to research? ');

  // Get breath and depth parameters
  const breadth =
    parseInt(
      await askQuestion(
        'Enter research breadth (recommended 2-10, default 4): ',
      ),
      10,
    ) || 4;
  const depth =
    parseInt(
      await askQuestion('Enter research depth (recommended 1-5, default 2): '),
      10,
    ) || 2;
  const isReport =
    (await askQuestion(
      'Do you want to generate a long report or a specific answer? (report/answer, default report): ',
    )) !== 'answer';

  let combinedQuery = initialQuery;
  if (isReport) {
    log(`Creating research plan...`);

    // Generate follow-up questions
    const followUpQuestions = await generateFeedback({
      query: initialQuery,
    });

    log(
      '\nTo better understand your research needs, please answer these follow-up questions:',
    );

    // Collect answers to follow-up questions
    const answers: string[] = [];
    for (const question of followUpQuestions) {
      const answer = await askQuestion(`\n${question}\nYour answer: `);
      answers.push(answer);
    }

    // Combine all information for deep research
    combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;
  }

  log('\nStarting research...\n');

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth,
    depth,
  });

  log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
  log(`\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`);
  log('Writing final report...');

  if (isReport) {
    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    await fs.writeFile('report.md', report, 'utf-8');
    console.log(`\n\nFinal Report:\n\n${report}`);
    console.log('\nReport has been saved to report.md');

    // Ask if the user wants to export to Notion
    const exportToNotion = await askQuestion('\nDo you want to export this report to Notion? (y/n): ');
    
    if (exportToNotion.toLowerCase() === 'y') {
      try {
        // Check if Notion integration is already configured
        if (process.env.NOTION_ACCESS_TOKEN && process.env.NOTION_PARENT_PAGE_ID) {
          console.log('\nUsing existing Notion credentials...');
          
          const notionAuth: NotionAuth = {
            oauth_access_token: process.env.NOTION_ACCESS_TOKEN,
            workspace_id: process.env.NOTION_WORKSPACE_ID || '',
            workspace_name: process.env.NOTION_WORKSPACE_NAME || '',
            workspace_icon: process.env.NOTION_WORKSPACE_ICON || '',
            bot_id: process.env.NOTION_BOT_ID || '',
          };

          const notionService = new NotionService(notionAuth);

          await notionService.createPage({
            parentId: process.env.NOTION_PARENT_PAGE_ID,
            title: "Research Report: " + initialQuery,
            content: report
          });
          console.log('\nReport has been saved to Notion');
        } else {
          console.log('\nNotion integration not configured. Setting up Pipedream Connect...');
          
          // Use Pipedream Connect to authenticate with Notion via OAuth
          const notionAuth = await getNotionAuthViaCLI();
          
          // Save the auth to environment variables for future use
          saveNotionAuthToEnv(notionAuth);
          
          const notionService = new NotionService(notionAuth);

          await notionService.createPage({
            parentId: process.env.NOTION_PARENT_PAGE_ID!,
            title: "Research Report: " + initialQuery,
            content: report
          });
          console.log('\nReport has been saved to Notion');
        }
      } catch (error) {
        console.error('\nFailed to save report to Notion:', error);
      }
    } else {
      console.log('\nSkipping Notion export.');
    }
  } else {
    const answer = await writeFinalAnswer({
      prompt: combinedQuery,
      learnings,
    });

    await fs.writeFile('answer.md', answer, 'utf-8');
    console.log(`\n\nFinal Answer:\n\n${answer}`);
    console.log('\nAnswer has been saved to answer.md');
  }

  rl.close();
}

run().catch(console.error);
