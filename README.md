# headlinebot

This is a tool that can be used to scrape news website content and provide alternate means for reading it (currently Slack and RSS).

To work around common techniques used to block automated scraping of website content, it drives a real instance of Google Chrome (using puppeteer).

That said, scraping is inherently fragile. Expect this thing to break. Regularly.

## Requirements

- Node.js (see `.nvmrc` for exact version)
- Yarn

## Getting started

You'll need to set a number of environment variables for this tool to work. Once you've done that, you can execute it like so:

```shell
yarn && yarn start
```

## Environment variables

| Variable           | Example                                                          | Description                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ALLOWED_HOSTS`    | `"example.org,account.example.org"`                              | During scraping, requests made to any hosts _not_ in this list (for example, to load third-party Javascript) will be blocked. **It may take some trial and error to get this list right.** |
| `CHROME_PATH`      | `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` | Path to the Google Chrome executable.                                                                                                                                                      |
| `HEADLINES_URL`    | `"https://example.org/local-news"`                               | URL to scrape news headlines from.                                                                                                                                                         |
| `WEBSITE_PASSWORD` | `"trustno1"`                                                     | Password used to log into the news website when a paywall is hit.                                                                                                                          |
| `WEBSITE_USERNAME` | `"my-email@example.org"`                                         | Username used to log into the news website when a paywall is hit.                                                                                                                          |

### Summarization

Articles can be automatically summarized using ChatGPT.

| Variable         | Example             | Description                                                         |
| ---------------- | ------------------- | ------------------------------------------------------------------- |
| `OPENAI_API_KEY` | `"sk-sldkjflsdkjf"` | Key used to access the OpenAI API (used for article summarization). |

### Slack integration

When configured, new articles can be periodically posted to a Slack channel.

| Variable        | Example       | Description                                                                    |
| --------------- | ------------- | ------------------------------------------------------------------------------ |
| `SLACK_CHANNEL` | `"#the-news"` | When integrated with Slack, the channel that new articles should be posted in. |
| `SLACK_TOKEN`   | `"xoxb-foo"`  | Bot token used to access the Slack API to post.                                |

### RSS feed generation

Each run can generate an RSS feed .xml file and upload it to S3 (or a compatible service).

| Variable                   | Example                           | Description                                             |
| -------------------------- | --------------------------------- | ------------------------------------------------------- |
| `S3_BUCKET`                | `"my-bucket"`                     | S3 bucket to upload RSS XML to.                         |
| `S3_REGION`                | `"us-east-1"`                     | S3 region to use.                                       |
| `S3_ENDPOINT`              | `"https://example.org/my-bucket"` | Alternate endpoint (allows using an S3-compatible API). |
| `AWS_ACCESS_KEY_ID`        |                                   | (AWS credential used for RSS upload.)                   |
| `AWS_SECRET_ACCESS_KEY_ID` |                                   | (AWS credential used for RSS upload.)                   |
