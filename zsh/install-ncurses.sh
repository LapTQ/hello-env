# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__INSTALL__NCURSES" ]; then
    TO__INSTALL__NCURSES="True"
fi

if [ -z "$MODE__INSTALL__NCURSES" ]; then
    MODE__INSTALL__NCURSES="install_from_source"
fi

if [ -z "$VER__NCURSES" ]; then
    VER__NCURSES="6.4"
fi

if [ -z "$PATHD__DOWNLOADS__NCURSES" ]; then
    PATHD__DOWNLOADS__NCURSES=$( realpath ~ )/temp
fi

if [ -z "$PATHD__INSTALL__NCURSES" ]; then
    PATHD__INSTALL__NCURSES=$( realpath ~ )/ncurses
fi
# ================================================


source scripts/error-handlers.sh


# check if environment variable TO__INSTALL__NCURSES is not True
if [ "$TO__INSTALL__NCURSES" != "True" ]; then
    print_msg WARNING "Skipping ncurses installation"
    return
fi

install_from_source() {
    print_msg INFO "Installing ncurses from source"

    # download installation files
    mkdir -p $PATHD__DOWNLOADS__NCURSES
    cd $PATHD__DOWNLOADS__NCURSES
    wget -O ncurses.tar.gz https://github.com/mirror/ncurses/archive/refs/tags/v${VER__NCURSES}.tar.gz
    tar -xvf ncurses.tar.gz

    # install ncurses
    mkdir -p $PATHD__INSTALL__NCURSES
    cd ncurses-${VER__NCURSES}
    ./configure --prefix=$PATHD__INSTALL__NCURSES --with-shared
    make
    make install

    echo "export PATH=$PATHD__INSTALL__NCURSES/bin:\$PATH" >> ~/.bashrc
    echo "export LD_LIBRARY_PATH=$PATHD__INSTALL__NCURSES/lib:\$LD_LIBRARY_PATH" >> ~/.bashrc
}

# check installation mode
case $MODE__INSTALL__NCURSES in
    install_from_source)
        install_from_source
        ;;
    *)
        print_msg ERROR "Invalid MODE__INSTALL__NCURSES: $MODE__INSTALL__NCURSES"
        exit 1
        ;;
esac

