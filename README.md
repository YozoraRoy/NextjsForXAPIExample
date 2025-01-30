# Project Overview

## Technologies Used
- **Authentication System**: `/app/api/twitter/auth2/`
- **Tweet Functionality**: `/app/api/twitter/`
- **Frontend Interface**: `/app/`

## System Flow

### Authentication Process
- User clicks the login button
- System generates PKCE challenge code and state value
- Redirects to the Twitter authorization page
- User authorizes and returns to Next.js
- System validates and exchanges for an access token
- Stores the token in HTTP-only cookies

### Tweet Posting Process
- User fills in the tweet content
- System uses the stored access token to send a request
- Sends the tweet via Twitter API v2

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.