#!/bin/bash

set -e

echo "🔧 Installing dependencies..."
pnpm install

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🏗️ Building Next.js application..."
pnpm run build

echo "✅ Build completed successfully!"

