#!/bin/bash
set -e

echo "🔧 HVMS Backend Build Script"
echo "=============================="

# Install Python 3 and pip
echo "📦 Installing Python 3..."
apt-get update -qq
apt-get install -y python3 python3-pip

# Verify Python installation
echo "✅ Python version:"
python3 --version

# Install Python dependencies
if [ -f requirements.txt ]; then
  echo "📦 Installing Python dependencies..."
  pip3 install -r requirements.txt
  echo "✅ Python dependencies installed"
else
  echo "⚠️  No requirements.txt found"
fi

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

echo "✅ Build complete!"
echo "=============================="
