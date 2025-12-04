#!/bin/bash
# Start ngrok tunnel for n8n local development
# This exposes localhost:5678 to the internet for testing

echo "Starting ngrok tunnel for n8n (localhost:5678)..."
echo ""
echo "This will expose your local n8n instance to the internet."
echo "Use the public URL for testing binary uploads without localhost issues."
echo ""
echo "Press Ctrl+C to stop the tunnel."
echo ""

# Start ngrok tunnel on port 5678
ngrok http 5678

