FROM mcr.microsoft.com/devcontainers/typescript-node:1-18-bullseye

# Install pnpm v8
RUN su node -c "npm install -g pnpm@8"

# Fix issues with pnpm and Docker on macOS
RUN su node -c "pnpm config set store-dir ~/.local/share/pnpm/store"
