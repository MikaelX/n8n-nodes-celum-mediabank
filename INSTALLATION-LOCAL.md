# Installing as Community Package (Isolated from Monorepo)

This package is designed to work as a **standalone community package**, completely isolated from the n8n monorepo. It follows standard n8n community node installation patterns.

## Method 1: Development Mode (Recommended)

This is the standard way to develop and test community nodes - it's completely isolated:

```bash
# From the node package directory
cd /path/to/n8n-nodes-celum-mediabank
pnpm dev
```

This will:
- Build your node automatically
- Start a **separate n8n instance** (isolated from monorepo)
- Watch for changes and rebuild automatically
- Link node to `~/.n8n-node-cli/.n8n/custom` (standard community node location)
- Open n8n at `http://localhost:5678`

**Key Benefits:**
- ✅ Completely isolated from monorepo
- ✅ Uses standard community node installation pattern
- ✅ Hot reload for development
- ✅ No modifications to monorepo needed
- ✅ Works exactly like published community packages

## Method 2: Link to External n8n Instance

If you have n8n running separately (from monorepo or elsewhere):

```bash
# From the node package directory
cd /path/to/n8n-nodes-celum-mediabank

# Build the node
pnpm build

# Link to external n8n (watches for changes)
pnpm dev --external-n8n
```

This will:
- Build your node
- Link it to `~/.n8n-node-cli/.n8n/custom` (standard location)
- Watch for changes and rebuild
- **NOT** start n8n (assumes it's already running)

**Note:** Your running n8n instance will automatically detect the node in the custom nodes directory.

## Method 3: Install as Community Package

To install it like any other community package:

```bash
# Build the node
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Install from local path (in your n8n installation)
# This works for any n8n instance (monorepo, standalone, Docker, etc.)
npm install /path/to/n8n-nodes-celum-mediabank
# or
pnpm add /path/to/n8n-nodes-celum-mediabank

# Restart n8n
```

**Note:** This installs it as a dependency, but n8n will load it from `node_modules` automatically.

## Method 4: Copy to Custom Nodes Directory (Standard Method)

The standard way community nodes are installed:

```bash
# Build the node
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Copy to n8n custom nodes directory
# This is the standard location n8n looks for community nodes
mkdir -p ~/.n8n/custom
cp -r dist ~/.n8n/custom/n8n-nodes-celum-mediabank

# Restart n8n if it's running
```

**Note:** n8n automatically loads nodes from `~/.n8n/custom/` - this is the standard community node installation location.

## Important: Isolation from Monorepo

This package is **completely independent** from the n8n monorepo:

- ✅ No dependencies on monorepo structure
- ✅ Uses standard `n8n-workflow` peer dependency
- ✅ Follows community node package structure
- ✅ Can be published to npm independently
- ✅ Works with any n8n installation (monorepo, standalone, Docker, etc.)

## Recommended Development Workflow

For development with your monorepo n8n:

```bash
# Terminal 1: Start your monorepo n8n
cd ../n8n
pnpm dev

# Terminal 2: Develop the node (links to running n8n)
cd /path/to/n8n-nodes-celum-mediabank
pnpm dev --external-n8n
```
```

This gives you:
- ✅ Isolated node development
- ✅ Links to your running n8n instance
- ✅ Hot reload
- ✅ No monorepo modifications
- ✅ Standard community package workflow

