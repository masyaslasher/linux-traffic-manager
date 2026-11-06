# Contributing to Linux Traffic Manager

Thank you for your interest in improving Linux Traffic Manager (LTM)!

## Development Philosophy

- **Reliability first:** Real system data only. No fake metrics, no speculative process attribution.
- **Performance first:** Low idle CPU usage, bounded memory history, async I/O with Tokio.
- **Privacy first:** Zero telemetry, strictly local SQLite storage.
- **Modularity:** Keep `ltm-core` clean and independent from the GUI presentation layer.

## Setting Up Your Environment (Fedora Linux)

### Prerequisites

1. **Rust & Cargo** (1.80+):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Node.js & pnpm**:
   ```bash
   node --version # v20+ recommended
   npm install -g pnpm
   ```
3. **Fedora Desktop Build Dependencies**:
   ```bash
   sudo dnf install -y webkit2gtk4.1-devel gtk3-devel libsoup3-devel javascriptcoregtk4.1-devel openssl-devel librsvg2-devel
   ```

### Building & Running

1. **Run Rust unit tests (without GUI dependencies):**
   ```bash
   cargo test --workspace
   ```
2. **Run Frontend in Development Mode:**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
3. **Run Full Tauri Desktop Application:**
   ```bash
   pnpm tauri dev
   ```

## Coding Guidelines

- Format Rust code with `cargo fmt --all`.
- Ensure no clippy warnings: `cargo clippy --workspace --all-targets -- -D warnings`.
- Format frontend code and ensure TypeScript type safety: `pnpm lint` and `pnpm tsc --noEmit`.
- Write unit tests for new parsers, network calculations, and database logic.
- Follow conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
