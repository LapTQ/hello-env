## Release
https://github.com/sxyazi/yazi/releases

## Build from source
https://yazi-rs.github.io/docs/installation/#build-from-source

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
git clone https://github.com/sxyazi/yazi.git
```

Re-open terminal, then:
```bash
cd yazi && cargo build --release --locked
./target/release/yazi
```

Add the following line to `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$PATH:/path/to/yazi/target/release"
alias yy=yazi
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
