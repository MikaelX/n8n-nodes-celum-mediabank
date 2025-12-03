# n8n-nodes-celum-mediabank

A comprehensive n8n community node for integrating with the Celum Mediabank API. This node provides full CRUD operations for digital asset management, including asset search, collection management, file uploads, and asset type definitions.

## Features

- **10 Operations** covering all major Celum Mediabank API endpoints
- **Custom Credential Type** for secure API key authentication
- **TypeScript** implementation with full type safety
- **Modular Architecture** for easy maintenance and extension
- **Community Package** - works with any n8n installation

## Installation

### Install from npm (Recommended)

```bash
npm install n8n-nodes-celum-mediabank
# or
pnpm add n8n-nodes-celum-mediabank
```

After installation, restart your n8n instance. The node will be automatically available.

### Install from Local Path

```bash
# Build the node first
cd /path/to/n8n-nodes-celum-mediabank
pnpm build

# Install from local path
npm install /path/to/n8n-nodes-celum-mediabank
# or
pnpm add /path/to/n8n-nodes-celum-mediabank

# Restart n8n
```

### Development Mode

For local development and testing:

```bash
# Clone the repository
git clone https://github.com/MikaelX/n8n-nodes-celum-mediabank.git
cd n8n-nodes-celum-mediabank

# Install dependencies
pnpm install

# Start development server (includes n8n)
pnpm dev
```

This will:
- Build the node automatically
- Start n8n on `http://localhost:5678`
- Watch for changes and rebuild automatically
- Hot reload without restarting n8n

## Quick Start

1. **Install the package** (see Installation above)
2. **Create Credentials:**
   - Go to **Credentials** in n8n
   - Click **Add Credential**
   - Search for **"Celum Mediabank API"**
   - Enter your API Key and Base URL (e.g., `https://your-instance.celum.cloud/content-api/v1`)
   - Save the credential
3. **Use the Node:**
   - Create a new workflow in n8n
   - Add the **Celum Mediabank** node
   - Select your credential
   - Choose an operation and configure it

## Operations

The node supports 9 operations covering all major Celum Mediabank functionality:

### Asset Operations

#### 1. Search Assets
Search for assets using full-text search or field-based filters.

**Features:**
- Full-text search by UUID, name, or metadata
- 50+ filter types (ASSET_FULLTEXT, field-based filters, etc.)
- Pagination support (page and size)
- Multiple sort fields (creation date, modification date, name, ID, filename, file size, etc.)
- Ascending/descending sort order

**Use Cases:**
- Find assets by UUID
- Search assets by metadata fields
- List assets with pagination
- Sort assets by various criteria

#### 2. Get Asset
Retrieve detailed information about a specific asset by ID.

**Features:**
- Get asset by ID
- Customizable inclusions (information fields, permissions, file properties, external references, download formats)
- Locale support for localized values
- Filter specific information fields and download formats
- Permission evaluation

**Use Cases:**
- Get complete asset details
- Retrieve asset metadata
- Check asset permissions
- Get available download formats

#### 3. Create Asset
Create a new asset in the mediabank.

**Features:**
- Create asset with name and metadata
- Specify parent collection
- Assign asset type
- Set initial information field values
- Optional upload handle for immediate file association

**Use Cases:**
- Create placeholder assets
- Create assets with initial metadata
- Prepare assets for file upload

#### 4. Update Asset
Update asset metadata, name, or lock status.

**Features:**
- Update asset name
- Modify lock status (set, clear, or leave unchanged)
- Update information field values (TEXT, LOCALIZED_TEXT, COLLECTION_REFERENCE, TAG_REFERENCE, etc.)
- Support for field operations (SET, CLEAR, MODIFY)

**Use Cases:**
- Update asset metadata
- Change asset name
- Lock/unlock assets
- Modify information fields

#### 5. Delete Asset
Delete an asset from the mediabank.

**Features:**
- Delete asset by ID
- Returns success confirmation

**Use Cases:**
- Remove assets from mediabank
- Clean up unused assets

#### 6. Create Asset Version
Add a new version to an existing asset.

**Features:**
- Add new version with filename
- Associate uploaded file via upload handle
- Part of the file upload workflow

**Use Cases:**
- Upload new file versions
- Replace asset files
- Add additional versions to assets

### Upload Operations

#### 7. Request Upload Location
Request an upload URL and handle for file uploads.

**Features:**
- Get upload URL for file upload
- Receive upload handle for version creation
- Specify filename and file size

**Use Cases:**
- Prepare for file upload
- Get upload credentials
- Part of the upload workflow

**Returns:**
- `url`: The upload URL where the file should be uploaded
- `handle`: The upload handle needed for version creation

#### 8. Upload Binary
Upload a binary file to a provided upload URL and optionally create a new asset version.

**Features:**
- Upload binary files directly from input items
- Uploads to a provided upload URL (from Request Upload Location)
- Optional checkbox to create a new asset version after upload
- Requires upload URL and handle from Request Upload Location operation

**Use Cases:**
- Upload files from previous nodes (e.g., HTTP Request, File System)
- Upload and create version in a single operation
- Complete the upload workflow after requesting upload location

**Upload Workflow:**
1. **Request Upload Location** - Get upload URL and handle
2. **Upload Binary** - Upload file to the URL and optionally create version
   - Select binary property from input item
   - Provide upload URL and handle from step 1
   - Optionally enable "Create Version After Upload" checkbox
   - If enabled, provide Asset ID and filename for version creation

### Collection Operations

#### 9. Search Collections
Search for collections by name or parent collection.

**Features:**
- Search by collection name
- Filter by parent collection ID
- Recursive search (include sub-collections)
- Pagination support
- Locale support

**Use Cases:**
- Find collections by name
- List collections in a parent
- Navigate collection hierarchy
- Search recursively through sub-collections

### Asset Type Operations

#### 10. Get Asset Type
Retrieve asset type definition with information fields.

**Features:**
- Get asset type by ID
- Retrieve information field definitions
- Locale support for localized field names

**Use Cases:**
- Understand asset type structure
- Get field definitions for metadata mapping
- Discover available information fields

## Credentials

The node uses a custom credential type **"Celum Mediabank API"** with the following fields:

- **API Key** (required): Your Celum Mediabank API key for authentication
- **Base URL** (required): Your Celum Mediabank instance URL (e.g., `https://your-instance.celum.cloud/content-api/v1`)

The credential uses HTTP header authentication with the `X-API-KEY` header.

## Project Structure

```
n8n-nodes-celum-mediabank/
├── src/
│   ├── credentials/
│   │   └── CelumMediabank.credentials.ts    # Credential definition
│   └── nodes/
│       └── CelumMediabank/
│           ├── CelumMediabank.node.ts       # Main node implementation
│           ├── CelumMediabank.node.json    # Node metadata
│           ├── GenericFunctions.ts          # Shared API functions
│           ├── celummediabank.svg          # Node icon
│           └── actions/                     # Operation implementations
│               ├── index.ts                 # Operation registry
│               ├── searchAssets.operation.ts
│               ├── getAsset.operation.ts
│               ├── createAsset.operation.ts
│               ├── updateAsset.operation.ts
│               ├── deleteAsset.operation.ts
│               ├── createAssetVersion.operation.ts
│               ├── requestUploadLocation.operation.ts
│               ├── searchCollections.operation.ts
│               ├── getAssetType.operation.ts
│               └── filterTypes.ts           # Filter type definitions
├── dist/                                    # Compiled output
├── scripts/
│   └── fix-node-exports.js                 # Build script
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Prerequisites

- Node.js (v22 or higher)
- pnpm (recommended) or npm/yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/MikaelX/n8n-nodes-celum-mediabank.git
cd n8n-nodes-celum-mediabank

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Start development server (includes n8n)
pnpm dev

# Build for production
pnpm build

# Build in watch mode
pnpm build:watch

# Run linter
pnpm lint
pnpm lint:fix

# Type check
pnpm typecheck

# Create release
pnpm release
```

### Development Mode with External n8n

If you have n8n running separately:

```bash
# Build and link to your running n8n instance
pnpm build
pnpm dev --external-n8n
```

This links the node to `~/.n8n/custom/` and watches for changes.

## Examples

### Example 1: Search for Asset by UUID

```json
{
  "operation": "searchAssets",
  "searchText": "your-uuid-here",
  "filterType": "ASSET_FULLTEXT",
  "page": 1,
  "size": 20,
  "sortField": "creation.date",
  "sortOrder": "DESC"
}
```

### Example 2: Create Asset with Metadata

```json
{
  "operation": "createAsset",
  "name": "My Asset",
  "parentId": 12345,
  "typeId": 2200,
  "informationFieldValues": "[{\"id\": 643, \"value\": \"example\", \"type\": \"TEXT\"}]"
}
```

### Example 3: Upload File Workflow

**Step 1: Request Upload Location**
```json
{
  "operation": "requestUploadLocation",
  "filename": "image.jpg",
  "filesize": 1024000
}
```

**Step 2: Upload Binary**
```json
{
  "operation": "uploadBinary",
  "uploadUrl": "{{ $json.url }}",
  "uploadHandle": "{{ $json.handle }}",
  "binaryPropertyName": "data",
  "createVersion": true,
  "assetId": 12345,
  "filename": "image.jpg"
}
```

**Complete Workflow:**
1. Request upload location to get URL and handle
2. Upload binary file to the returned URL
3. Optionally create version using the handle

## API Documentation

For detailed API documentation, refer to the [Celum Mediabank API documentation](https://docs.celum.com).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/MikaelX/n8n-nodes-celum-mediabank/issues)
- Check the [n8n Community Forum](https://community.n8n.io/)
