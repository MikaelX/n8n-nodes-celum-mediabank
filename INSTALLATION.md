# Installation Guide for n8n-nodes-celum-mediabank

This guide covers different ways to install the Celum Mediabank node in your n8n instance.

## Prerequisites

- Node.js (v22 or higher recommended)
- pnpm (recommended) or npm/yarn
- n8n instance (local or remote)

## Installation Methods

### Method 1: Install from npm (Recommended for Production)

The easiest way to install the node in production:

```bash
# In your n8n installation directory
npm install n8n-nodes-celum-mediabank
# or
pnpm add n8n-nodes-celum-mediabank

# Restart n8n
```

After installation, restart your n8n instance and the node will be available.

### Method 2: Development Mode (Best for Development)

This is the recommended approach when developing or testing the node locally.

```bash
# Clone or navigate to the project directory
git clone https://github.com/MikaelX/n8n-nodes-celum-mediabank.git
cd n8n-nodes-celum-mediabank

# Install dependencies
pnpm install

# Start development server (includes n8n)
pnpm dev
```

**What this does:**
- Builds the node automatically
- Starts n8n on `http://localhost:5678`
- Watches for file changes and rebuilds automatically
- Links the node to n8n's custom nodes directory

**Advantages:**
- Hot reload - changes appear immediately
- No need to restart n8n
- Isolated environment for testing
- Perfect for development

### Method 3: Install from Local Path

If you want to install from a local copy:

```bash
# Build the node first
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Install from local path (in your n8n installation directory)
npm install /path/to/n8n-nodes-celum-mediabank
# or
pnpm add /path/to/n8n-nodes-celum-mediabank

# Restart n8n
```

### Method 4: Copy to Custom Nodes Directory

The standard way community nodes are installed:

```bash
# Build the node
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Copy to n8n custom nodes directory
# Default location: ~/.n8n/custom
mkdir -p ~/.n8n/custom
cp -r dist ~/.n8n/custom/n8n-nodes-celum-mediabank

# Restart n8n
```

**Note:** n8n automatically loads community nodes from `~/.n8n/custom/` - this is the standard installation location.

### Method 5: Use External n8n (Development)

If you have n8n running separately and want to develop against it:

```bash
cd /path/to/n8n-nodes-celum-mediabank
pnpm build
pnpm dev --external-n8n
```

This will:
- Build your node
- Link it to n8n's custom nodes directory (`~/.n8n/custom/`)
- Watch for changes and rebuild
- **NOT** start n8n (assumes it's already running)

## Verifying Installation

After installation, verify the node is available:

1. Open n8n in your browser
2. Create a new workflow
3. Click **Add Node**
4. Search for **"Celum Mediabank"**
5. You should see the node in the results

## Setting Up Credentials

1. In n8n, go to **Credentials** (gear icon)
2. Click **Add Credential**
3. Search for **"Celum Mediabank API"**
4. Fill in:
   - **API Key**: Your Celum Mediabank API key
   - **Base URL**: Your Celum Mediabank instance URL (e.g., `https://your-instance.celum.cloud/content-api/v1`)
5. Click **Save**
6. The credential is now available for use in workflows

## Docker Installation

If running n8n via Docker:

```bash
# Build the node
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Copy to Docker volume or mount point
docker cp dist/. n8n-container:/home/node/.n8n/custom/n8n-nodes-celum-mediabank/

# Or use a volume mount in docker-compose.yml:
volumes:
  - ./n8n-nodes-celum-mediabank/dist:/home/node/.n8n/custom/n8n-nodes-celum-mediabank

# Restart container
docker restart n8n-container
```

## Troubleshooting

### Node Not Appearing

1. **Check build output:**
   ```bash
   cd /path/to/n8n-nodes-celum-mediabank
   pnpm build
   ls -la dist/nodes/CelumMediabank/
   ```

2. **Check n8n custom nodes directory:**
   ```bash
   ls -la ~/.n8n/custom/
   ```

3. **Check n8n logs** for errors:
   ```bash
   # If running via npm/pnpm, check console output
   # If running via Docker:
   docker logs n8n-container-name
   ```

4. **Clear n8n cache:**
   ```bash
   rm -rf ~/.n8n/custom
   # Then reinstall
   ```

### Credential Not Appearing

1. Ensure the credential file was built:
   ```bash
   ls -la dist/credentials/CelumMediabank.credentials.js
   ```

2. Check `package.json` includes credentials:
   ```json
   "n8n": {
     "credentials": [
       "dist/credentials/CelumMediabank.credentials.js"
     ]
   }
   ```

3. Restart n8n after installing

### Build Errors

1. **TypeScript errors:**
   ```bash
   pnpm typecheck
   ```

2. **Linting errors:**
   ```bash
   pnpm lint
   pnpm lint:fix
   ```

3. **Missing dependencies:**
   ```bash
   pnpm install
   ```

## Production Deployment

For production:

1. Install from npm: `npm install n8n-nodes-celum-mediabank`
2. Restart n8n
3. Create credentials in production environment
4. Test workflows
5. Monitor for any issues

## Development Workflow

For active development:

1. **Terminal 1:** Run `pnpm dev` (starts n8n with hot reload)
2. **Terminal 2:** Make code changes
3. Changes automatically rebuild and appear in n8n
4. Test in n8n UI at `http://localhost:5678`
