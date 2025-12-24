# Supabase Setup Guide

This application uses Supabase for shared data storage across all users. Follow these steps to set up your Supabase database.

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account (or log in if you already have one)
3. Create a new project
   - Choose an organization
   - Enter a project name (e.g., "VT4S Master Schedule")
   - Enter a database password (save this securely!)
   - Choose a region closest to your users
   - Click "Create new project"

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, go to the **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase-schema.sql` from this project
4. Copy and paste the entire SQL content into the SQL Editor
5. Click "Run" to execute the SQL
6. You should see "Success. No rows returned" - this means the tables were created successfully

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. In your project root directory, create a file named `.env.local` (if it doesn't exist)
2. Add the following lines:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace:
- `your_project_url_here` with your Project URL from Step 3
- `your_anon_key_here` with your anon public key from Step 3

**Example:**
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

## Step 5: Configure Netlify Environment Variables

Since you're hosting on Netlify, you also need to set these environment variables in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:
   - **Key:** `VITE_SUPABASE_URL` **Value:** Your Supabase project URL
   - **Key:** `VITE_SUPABASE_ANON_KEY` **Value:** Your Supabase anon key
5. Click "Save"

**Important:** After adding environment variables in Netlify, you'll need to redeploy your site for the changes to take effect.

## Step 6: Test the Connection

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Check the browser console (F12) for any errors
4. If you see warnings about Supabase environment variables, double-check your `.env.local` file

## Troubleshooting

### "Supabase environment variables are not set"
- Make sure your `.env.local` file is in the project root
- Make sure the variable names start with `VITE_`
- Restart your development server after creating/updating `.env.local`

### "Error loading data from Supabase"
- Check that you've run the SQL schema in Supabase
- Verify your API keys are correct
- Check the Supabase dashboard for any error logs

### Data not syncing between users
- Make sure all users are accessing the same Supabase project
- Check that environment variables are set correctly in Netlify
- Verify Row Level Security (RLS) policies allow the operations you need

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- Row Level Security (RLS) is enabled but currently allows all operations
- For production, consider tightening RLS policies based on user roles
- Never commit your `.env.local` file to git (it should already be in `.gitignore`)

## Next Steps

Once set up, your application will:
- Store all schedule data in Supabase
- Share data across all users in real-time
- Persist data even if users clear their browser cache
- Allow multiple users to see the same schedule simultaneously

If you need to migrate existing localStorage data to Supabase, you can export it from the browser's localStorage and import it into Supabase using the Supabase dashboard or API.

