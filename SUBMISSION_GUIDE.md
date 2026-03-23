# Submission Guide

Everything you need to get your PWA listed on pwa.mobi.

---

## Before You Submit

Make sure your PWA meets the minimum requirements:

- [ ] Served over **HTTPS** with a valid certificate
- [ ] Has a valid **Web App Manifest** (`manifest.json`)
- [ ] Has a registered **Service Worker**
- [ ] Works **offline** or shows a meaningful offline page
- [ ] Has a **512×512px icon**
- [ ] Achieves a **Lighthouse PWA score of 85+**
- [ ] Is a **real, working application** (not a placeholder or demo)

Not sure about your Lighthouse score? Run it free at
[web.dev/measure](https://web.dev/measure) or in Chrome DevTools → Lighthouse tab.

---

## Step-by-Step Submission

### 1. Fork the registry

Click **Fork** at the top right of this repository.
Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/registry.git
cd registry
```

### 2. Create your app YAML file

Copy the template:

```bash
cp apps/_template.yaml apps/your-app-name.yaml
```

**Naming convention:**
- Use lowercase, hyphens only, no spaces
- Use your app's primary domain name if possible
- Examples: `workflow-pro.yaml`, `coolnotes-app.yaml`, `myapp-io.yaml`

### 3. Fill in your YAML file

Open `apps/your-app-name.yaml` and fill in all required fields.
See the [template](apps/_template.yaml) and [field reference](#field-reference) below.

### 4. Validate locally (optional but recommended)

```bash
npm install
npm run validate apps/your-app-name.yaml
```

### 5. Commit and push

```bash
git add apps/your-app-name.yaml
git commit -m "feat: add YourAppName to registry"
git push origin main
```

### 6. Open a Pull Request

- Go to your fork on GitHub
- Click **Compare & pull request**
- Fill in the PR template checklist
- Submit

The audit bot will run within a few minutes and post results as a comment.

### 7. Fix any issues

If the audit finds issues, fix them on your live site, then push a new commit to your PR branch.
The audit will re-run automatically.

### 8. Get listed

Once your PR has a green audit and passes human review, it will be merged.
Your app will appear on pwa.mobi within minutes of the merge.

---

## Field Reference

### Required Fields

| Field | Description | Example |
|---|---|---|
| `name` | Your app's display name | `WorkFlow Pro` |
| `tagline` | One-line description, max 80 chars | `Project management without the bloat` |
| `category` | See category list below | `productivity` |
| `url` | The live URL of your PWA | `https://workflowpro.app` |
| `manifest_url` | Full URL to your manifest.json | `https://workflowpro.app/manifest.json` |
| `developer.name` | Your name or company name | `Jane Smith` |
| `developer.github` | Your GitHub username | `janesmith` |
| `listing.description` | Full description, 50–500 chars | `A fast, offline-capable...` |
| `listing.icon_url` | URL to your 512×512 icon | `https://...icon-512.png` |
| `payment_model` | One of: free / freemium / paid / open-source | `freemium` |
| `submitted_by` | Your GitHub username (must match PR author) | `janesmith` |

### Optional Fields

| Field | Description |
|---|---|
| `developer.website` | Your personal or company website |
| `developer.email` | Contact email (not public, for registry use only) |
| `listing.screenshots` | Array of screenshot URLs (up to 5) |
| `listing.tags` | Array of lowercase tags (up to 8) |
| `open_source_url` | GitHub/GitLab URL if your app is open source |
| `pricing_url` | URL to your pricing page |

### Categories

```
productivity    communication   finance         health
education       entertainment   utilities       developer-tools
social          news            travel          food
shopping        lifestyle       creativity      business
games           sports          weather         other
```

---

## Rules

1. **One submission per app.** Do not submit the same app multiple times.
2. **You must own or have rights to the domain.**
3. **No placeholder apps.** The app must be functional at the time of submission.
4. **Honest descriptions.** Do not misrepresent what your app does.
5. **No malware, phishing, or deceptive content.** Violations result in permanent ban.
6. **Payments must use legitimate processors.** Stripe, Paddle, Lemon Squeezy, etc.
7. **The `submitted_by` field must match your GitHub username.**

---

## Updating Your Listing

To update your app's metadata after it has been listed:

1. Fork the repo, edit your existing YAML file
2. Open a PR with the changes
3. The audit will re-run to confirm your live app still passes
4. Changes are merged by the maintainer

---

## Removing Your Listing

Open an issue with the `remove-my-listing` label and include your app's YAML filename.
We will remove it within 48 hours.

---

## Questions?

- Open a [GitHub Discussion](https://github.com/pwamobi/registry/discussions)
- Join the [pwa.mobi Discord](https://discord.gg/YOUR_INVITE)
