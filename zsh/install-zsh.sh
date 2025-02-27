# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__INSTALL__ZSH" ]; then
    TO__INSTALL__ZSH="True"
fi

if [ -z "$MODE__INSTALL__ZSH" ]; then
    MODE__INSTALL__ZSH="install_from_source"
fi

if [ -z "$VER__ZSH" ]; then
    VER__ZSH="5.9"
fi

if [ -z "$PATHD__DOWNLOADS__ZSH" ]; then
    PATHD__DOWNLOADS__ZSH=$( realpath ~ )/temp
fi

if [ -z "$PATHD__INSTALL__ZSH" ]; then
    PATHD__INSTALL__ZSH=$( realpath ~ )/zsh
fi

if [ -z "$TO__USE__ZSH_AS_DEFAULT_SHELL" ]; then
    TO__USE__ZSH_AS_DEFAULT_SHELL="True"
fi
# ================================================


source scripts/error-handlers.sh


# check if environment variable TO__INSTALL__ZSH is not True
if [ "$TO__INSTALL__ZSH" != "True" ]; then
    print_msg WARNING "Skipping zsh installation"
    return
fi

install_via_apt() {
    print_msg INFO "Installing zsh via apt"
    sudo apt-get install -y zsh
}

install_via_conda() {
    print_msg INFO "Installing zsh via conda"
    conda install -y conda-forge::zsh
}

install_from_source() {
    print_msg INFO "Installing zsh from source"

    # download installation files
    mkdir -p $PATHD__DOWNLOADS__ZSH
    cd $PATHD__DOWNLOADS__ZSH
    wget -O zsh.tar.gz https://zenlayer.dl.sourceforge.net/project/zsh/zsh/${VER__ZSH}/zsh-${VER__ZSH}.tar.xz
    tar -xvf zsh.tar.gz
    cd zsh-${VER__ZSH}

    # install zsh
    mkdir -p $PATHD__INSTALL__ZSH
    ./configure --prefix=$PATHD__INSTALL__ZSH
    make
    make install
    
    echo "export PATH=$PATHD__INSTALL__ZSH/bin:\$PATH" >> ~/.bashrc

    if [ "$TO__USE__ZSH_AS_DEFAULT_SHELL" == "True" ]; then
        echo "exec zsh" >> ~/.bashrc
    fi
}

# check installation mode
case $MODE__INSTALL__ZSH in
    install_via_apt)
        install_via_apt
        ;;
    install_via_conda)
        install_via_conda
        ;;
    install_from_source)
        install_from_source
        ;;
    *)
        print_msg ERROR "Invalid MODE__INSTALL__ZSH: $MODE__INSTALL__ZSH"
        exit 1
        ;;
esac


# References
# 1. https://unix.stackexchange.com/questions/673669/installing-zsh-from-source-file-without-root-user-access
# 2. http://emboss.open-bio.org/html/adm/ch01s11.html
# 3. https://unix.stackexchange.com/questions/123597/building-zsh-without-admin-priv-no-terminal-handling-library-found