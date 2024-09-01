import express from 'express';
import bodyParser from 'body-parser';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';


dotenv.config();

const app = express();
app.use(bodyParser.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const client = new OpenAI();

const kalosPath = path.join(__dirname, 'assets', 'kalos.md'); 
const previousAudits = fs.readFileSync(kalosPath, 'utf8');

const prompt =
  `You are a professional security auditor for a zkVM named SP1, which is a RISC-V zero-knowledge virtual machine. 
    The code you receive might be in Rust, Solidity, C++, C or golang. 

    Please analyze the diff and provide a detailed report of any potential vulnerabilities or errors found in the code. 
    You can also include any lines of code that seem "suspicious" or the PR author should take a closer look at, even if 
    you do not find an explicit vulnerability or error.
    
    Please keep your response as short and concise as possible. 
    If you do not find any potential vulnerabilities or errors, then please just say that you did not find anything. 
    
    If you do find errors, please make a bullet point list in markdown as short as possible and to the point as possible.
    
    Here are some previous audit reports of the codebase that you might find useful:
    ${previousAudits}

    As a reminder, please output your response like this:

    Please analyze the diff and provide a detailed report of any potential vulnerabilities or errors found in the code. 
    You can also include any lines of code that seem "suspicious" or the PR author should take a closer look at, even if 
    you do not find an explicit vulnerability or error.
    
    Please keep your response as short and concise as possible. 
    If you do not find any potential vulnerabilities or errors, then please just say that you did not find anything. 
    
    If you do find errors, please make a bullet point list in markdown as short as possible and to the point as possible.    
    `;

console.log('Prompt length:', prompt.length);

app.get('/', (req, res) => {
  res.send('I am friendly LLM-powered security review bot for SP1!'); 
});

app.post('/', async (req, res) => {
  console.log('Received webhook');

  const event = req.body;

  if (event.action === 'opened' || event.action === 'edited') {
    console.log('Action is opened or edited');

    const pr = event.pull_request;
    const title = pr.title;

    if (title.includes('[test-bot]')) {
      const diffUrl = pr.diff_url;
      const diffResponse = await axios.get(diffUrl);
      const diff = diffResponse.data;
      console.log('First 80 characters of diff:', diff.substring(0, 80));

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content:
              'Review the following code diff for any possible security vulnerabilities:\n\n' +
              diff,
          },
        ],
      });

      const review = completion.choices[0].message;

      console.log('LLM Review:', review);

      await octokit.issues.createComment({
        owner: event.repository.owner.login,
        repo: event.repository.name,
        issue_number: pr.number,
        body: `**Security Bot Review:**\n\n${review.content}`, 
      });
    }
  }

  res.status(200).end();
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
