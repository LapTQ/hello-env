## Release
https://github.com/sxyazi/yazi/releases

## Download binary file

```bash
wget -c https://github.com/sxyazi/yazi/releases/download/v25.2.11/yazi-aarch64-unknown-linux-musl.zip
```

## Build from source
https://yazi-rs.github.io/docs/installation/#build-from-source

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
git clone https://github.com/sxyazi/yazi.git
```

Re-open terminal (choose either `~/.bashrc` or `~/.zshrc`):
```bash
cd yazi && cargo build --release --locked
echo "export PATH=\"$PATH:$(pwd)/target/release\"" >> ~/.zshrc
echo "alias yy=yazi" >> ~/.zshrc
```

To cd to the working dir when exiting Yazi:
```bash
function y() {
        local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
        yazi "$@" --cwd-file="$tmp"
        if cwd="$(command cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
                builtin cd -- "$cwd"
        fi
        rm -f -- "$tmp"
}
```
Given this, press `y` to start, press `q` to quit.
