# Install Zsh

## Install from pre-built

Install zsh via conda:
```bash
conda install conda-forge::zsh -y
```
or via apt:
```bash
sudo apt install zsh -y
```

## Install from source

Download:
```bash
cd ~
wget https://zenlayer.dl.sourceforge.net/project/zsh/zsh/5.9/zsh-5.9.tar.xz
tar -xvf zsh-5.9.tar.xz
```

Install:
```bash
PATH__DIR__INSTALL__ZSH=$( realpath ~ )/zsh
mkdir -p $PATH__DIR__INSTALL__ZSH
cd ~/zsh-5.9
./configure --prefix=$PATH__DIR__INSTALL__ZSH
make
make install
echo "export PATH=$PATH__DIR__INSTALL__ZSH/bin:$PATH" >> ~/.bashrc
```


Verify installation:
```bash
zsh --version
```

## Issues

### `ncurses`

```
configure: error: in `/mnt/ssd1t/Users/laptq/zsh-5.9':
configure: error: "No terminal handling library was found on your system.
This is probably a library called 'curses' or 'ncurses'.  You may
need to install a package called 'curses-devel' or 'ncurses-devel' on your
system."
```

Download:
```bash
cd ~
wget -O ncurses.v6.4.tar.gz https://github.com/mirror/ncurses/archive/refs/tags/v6.4.tar.gz
tar -xvf ncurses.v6.4.tar.gz
```

Install:
```bash
PATH__DIR__INSTALL__NCURSES=$( realpath ~ )/ncurses
mkdir -p $PATH__DIR__INSTALL__NCURSES
cd ~/ncurses-6.4/
./configure --prefix=$PATH__DIR__INSTALL__NCURSES --with-shared
make
make install
export PATH=$PATH__DIR__INSTALL__NCURSES/bin/:$PATH
export LD_LIBRARY_PATH=$PATH__DIR__INSTALL__NCURSES/lib:$LD_LIBRARY_PATH
export CPPFLAGS=-I$PATH__DIR__INSTALL__NCURSES/include
export LDFLAGS=-L$PATH__DIR__INSTALL__NCURSES/lib
```

## References

1. https://unix.stackexchange.com/questions/673669/installing-zsh-from-source-file-without-root-user-access
2. http://emboss.open-bio.org/html/adm/ch01s11.html
