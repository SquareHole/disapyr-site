# Node.js Setup Instructions

## Install Node.js

To run the Next.js application, you need to install Node.js on your system.

### Option 1: Official Node.js Installer (Recommended)
1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the setup wizard
4. Restart your terminal after installation

### Option 2: Using Homebrew (macOS)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Option 3: Using Node Version Manager (nvm)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.bashrc

# Install and use the latest LTS Node.js
nvm install --lts
nvm use --lts
```

## Verify Installation
After installing Node.js, verify it's working:
```bash
node --version
npm --version
```

## Run the Next.js Application
Once Node.js is installed:

1. Navigate to the site directory:
   ```bash
   cd site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: http://localhost:3000

## Preview Without Node.js
If you want to see the design immediately without installing Node.js, open the `preview.html` file in your browser:
```bash
open preview.html
```

## Troubleshooting
- If you get permission errors, you may need to use `sudo` with npm commands
- If the port 3000 is busy, Next.js will automatically use the next available port
- Make sure your terminal is in the correct directory (`site/`) when running npm commands
