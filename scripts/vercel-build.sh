#!/usr/bin/env bash
set -e

# Build the app with Vite
bun run build

# Bundle the SSR server with all node_modules into one self-contained file
bun build dist/server/server.js --target=node --format=esm \
  --outfile=.vercel/output/functions/ssr.func/server.js

# Set up Vercel Build Output API structure
mkdir -p .vercel/output/static

# Serve client static assets
cp -r dist/client/. .vercel/output/static/

# Node.js handler that adapts the Fetch API server to Vercel's req/res interface
cat > .vercel/output/functions/ssr.func/index.js << 'HANDLER'
import server from './server.js'

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const url = new URL(req.url, `${proto}://${host}`)

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }

  let body = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    body = Buffer.concat(chunks)
  }

  const request = new Request(url, { method: req.method, headers, body })
  const response = await server.fetch(request, {}, {})

  res.statusCode = response.status
  for (const [k, v] of response.headers.entries()) res.setHeader(k, v)
  res.end(Buffer.from(await response.arrayBuffer()))
}
HANDLER

# Vercel Node.js function config
cat > .vercel/output/functions/ssr.func/.vc-config.json << 'CONFIG'
{
  "runtime": "nodejs20.x",
  "handler": "index.js",
  "launcherType": "Nodejs"
}
CONFIG

# Route all non-static requests to the SSR function
cat > .vercel/output/config.json << 'ROUTES'
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/ssr" }
  ]
}
ROUTES
