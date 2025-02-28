# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__INSTALL__YAZI" ]; then
    TO__INSTALL__YAZI="True"
fi

if [ -z "$MODE__INSTALL__YAZI" ]; then
    MODE__INSTALL__YAZI="install_from_source"
fi

if [ -z "$VER__YAZI" ]; then
    VER__YAZI="25.2.26"
fi

if [ -z "$ARCH__YAZI" ]; then
    ARCH__YAZI="x86_64-unknown-linux-musl"
fi

if [ -z "$PATHD__DOWNLOADS__YAZI" ]; then
    PATHD__DOWNLOADS__YAZI=$( realpath ~ )/temp
fi

if [ -z "$PATHD__INSTALL__YAZI" ]; then
    PATHD__INSTALL__YAZI=$( realpath ~ )/yazi
fi
# ================================================


source scripts/error-handlers.sh


# check if environment variable TO__INSTALL__YAZI is not True
if [ "$TO__INSTALL__YAZI" != "True" ]; then
    print_msg WARNING "Skipping yazi installation"
    return
fi


install_from_binary() {
    print_msg INFO "Installing yazi from binary"

    mkdir -p $PATHD__DOWNLOADS__YAZI
    cd $PATHD__DOWNLOADS__YAZI
    wget -O yazi.zip https://github.com/sxyazi/yazi/releases/download/v${VER__YAZI}/yazi-${ARCH__YAZI}.zip
    unzip -q -o yazi.zip -d $PATHD__INSTALL__YAZI
    
    echo "export PATH=$PATHD__INSTALL__YAZI/yazi-$ARCH__YAZI/:\$PATH" >> ~/.zshrc
}


# check installation mode
case $MODE__INSTALL__YAZI in
    install_from_binary)
        install_from_binary
        ;;
    *)
        print_msg ERROR "Invalid MODE__INSTALL__YAZI: $MODE__INSTALL__YAZI"
        exit 1
        ;;
esac


# Add function to ~/.zshrc if it doesn't already exist
if ! grep -q 'function y()' ~/.zshrc; then
    print_msg SUCCESS "Added function y() to ~/.zshrc"
    cat << 'EOF' >> ~/.zshrc

function y() {
    local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
    yazi "$@" --cwd-file="$tmp"
    if cwd="$(command cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
        builtin cd -- "$cwd"
    fi
    rm -f -- "$tmp"
}
EOF
else
    print_msg INFO "Function y() already exists in ~/.zshrc"
fi


# # Build from source
# https://yazi-rs.github.io/docs/installation/#build-from-source

# ```bash
# curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# git clone https://github.com/sxyazi/yazi.git
# ```

# Re-open terminal (choose either `~/.bashrc` or `~/.zshrc`):
# ```bash
# cd yazi && cargo build --release --locked
# echo "export PATH=\"$PATH:$(pwd)/target/release\"" >> ~/.zshrc
# echo "alias yy=yazi" >> ~/.zshrc
# ```