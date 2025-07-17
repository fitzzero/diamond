# 🚀 Diamond Chess - Development Setup Guide

## Quick Start

```bash
# 1. Copy the environment template
yarn setup

# 2. Generate a secure NextAuth secret
yarn generate-secret

# 3. Edit .env with your actual values
# Add your DATABASE_URL from prisma.io
# Add your Discord OAuth credentials

# 4. Set up database and start development
yarn dev:setup
```

## Detailed Setup Instructions

### 1. Environment Variables

Copy the environment template:
```bash
cp environment.example .env
```

### 2. Database Setup (Prisma.io)

1. **Get your DATABASE_URL** from [Prisma Console](https://console.prisma.io/)
   - Should look like: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`

2. **Add to .env file:**
   ```bash
   DATABASE_URL="your_actual_database_url_here"
   ```

### 3. NextAuth Secret

Generate a secure secret:
```bash
yarn generate-secret
```

Copy the output to your `.env` file.

### 4. Discord OAuth Setup

1. **Create Discord Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Name it "Diamond Chess" (or whatever you prefer)

2. **Configure OAuth2:**
   - Go to OAuth2 > General
   - Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://your-domain.vercel.app/api/auth/callback/discord`

3. **Get credentials:**
   - Copy Client ID and Client Secret
   - Add to your `.env` file:
   ```bash
   DISCORD_CLIENT_ID="your_client_id"
   DISCORD_CLIENT_SECRET="your_client_secret"
   ```

### 5. Database Migration

```bash
# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push

# Or run both with:
yarn db:setup
```

### 6. Start Development

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your Diamond Chess app! ♟️

## Additional Commands

```bash
# View database in browser
yarn db:studio

# Reset database (careful!)
yarn db:reset

# Type checking
yarn type-check

# Linting
yarn lint
yarn lint:fix

# Production build
yarn build
yarn start
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Prisma Postgres connection string |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js encryption secret |
| `NEXTAUTH_URL` | ✅ | Your app's URL |
| `DISCORD_CLIENT_ID` | ✅ | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | ✅ | Discord OAuth client secret |
| `NODE_ENV` | ⚠️ | Environment (development/production) |
| `NEXT_PUBLIC_APP_NAME` | ❌ | App name for metadata |

## Troubleshooting

### Database Connection Issues
- Make sure your `DATABASE_URL` is correct
- Check that your Prisma.io database is active
- Try running `yarn db:generate` again

### Authentication Issues
- Verify Discord OAuth redirect URIs match exactly
- Make sure `NEXTAUTH_SECRET` is at least 32 characters
- Check that `NEXTAUTH_URL` matches your domain

### Build Issues
- Run `yarn type-check` to find TypeScript errors
- Run `yarn lint` to find linting issues
- Clear `.next` folder and rebuild

## Need Help?

- Check the Prisma Console for database issues
- Discord Developer Portal for OAuth problems
- Next.js documentation for framework questions

Happy coding! 🎯♟️ 