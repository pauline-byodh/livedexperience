# Getting your Lived Experience Calculator live on your own site

You have 3 files you'll need:

- `index-hosted.html` — the calculator page itself (the "frontend"). **Rename this to `index.html` before uploading** — Vercel needs it named exactly that to serve it as your homepage.
- `api/perspective.js` — the private helper that holds your API key and talks to Claude (the "backend")
- `package.json` — a small settings file Vercel needs to run the backend piece

You won't edit `package.json` at all. You'll edit the renamed `index.html` once, right at the end.

(Your other files — `index.html` the free version, and `index-live.html` the bring-your-own-key testing version — are just for your own reference. Don't upload those to this repo; only the renamed `index-hosted.html` goes up.)

---

## Step 1: Create a free GitHub account

Go to github.com and sign up (skip this if you already have an account).

## Step 2: Create a new repository

- Click the "+" in the top right → "New repository"
- Name it something like `lived-experience-calculator`
- Leave everything else as default, click "Create repository"

## Step 3: Upload your files

- On your new repo's page, click "Add file" → "Upload files"
- Drag in your renamed `index.html` (the one that was `index-hosted.html`), `package.json`, and the whole `api` folder (with `perspective.js` inside it)
- Scroll down, click "Commit changes"

Your repo should now show `index.html`, `package.json`, and an `api` folder with `perspective.js` inside it.

## Step 4: Create a free Vercel account

Go to vercel.com and sign up using "Continue with GitHub" — this links the two accounts automatically.

## Step 5: Import your repo into Vercel

- On your Vercel dashboard, click "Add New" → "Project"
- Find your `lived-experience-calculator` repo in the list and click "Import"
- Leave all the settings as default
- **Before clicking Deploy**, look for "Environment Variables" on this same screen

## Step 6: Add your API key as an Environment Variable

This is the one place your API key goes. It's a private setting, not a file — visitors can never see it.

- Name: `ANTHROPIC_API_KEY`
- Value: paste your actual Anthropic API key here
- Click "Add", then click "Deploy"

Vercel will build your project. In about a minute, you'll get a live web address that looks like:

`https://lived-experience-calculator-yourname.vercel.app`

**That's your backend's home.** Your actual function will live at that address plus `/api/perspective`.

## Step 7: Point your frontend at your backend

Now go back to GitHub, open `index.html`, click the pencil icon (Edit), and find this line near the top of the `<script>` section:

```js
var BACKEND_URL = 'https://YOUR-VERCEL-PROJECT.vercel.app/api/perspective';
```

Replace `YOUR-VERCEL-PROJECT.vercel.app` with your actual Vercel address from Step 6 (keep the `/api/perspective` part exactly as it is). Commit the change.

Vercel will notice the update and automatically redeploy — usually within a minute.

## Step 8: Test it

Open your live Vercel address in a browser (the one from Step 6) and try it out. Fill out the form and watch the perspective line — after a few seconds it should swap from the pre-written fallback to a freshly-found one.

If it doesn't swap, right-click → Inspect → Console, and look for a red error. Common ones:

- **"Failed to fetch"** — double check the `BACKEND_URL` in `index.html` is typed exactly right
- **A 401/403 error** — double check the API key you pasted into Vercel's Environment Variables in Step 6

## Step 9: Link to it from WordPress

In your WordPress editor, add a button or menu link, and set its URL to your Vercel address from Step 6 (the plain one, not the `/api/...` one). That's it — clicking it opens your calculator as its own page.

---

## One more thing: keeping your key safe going forward

If you ever need to change your API key, do it inside Vercel (Project → Settings → Environment Variables) — never inside `index.html`. The frontend file never contains your key, by design, and that should stay true even as you make future edits.
