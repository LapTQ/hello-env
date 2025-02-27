# get the path of the current script
PATHD__SCRIPT=$( dirname $( realpath $0 ) )/..

source scripts/error-handlers.sh


# ================= install ncurses =================
export TO__INSTALL__NCURSES=False
export MODE__INSTALL__NCURSES=install_from_source
export VER__NCURSES=6.4
export PATHD__DOWNLOADS__NCURSES=$( realpath ~ )/lib-downloaded
export PATHD__INSTALL__NCURSES=$( realpath ~ )/ncurses

cd $PATHD__SCRIPT
source zsh/install-ncurses.sh
# ==================================================


# ================= install zsh =================
export TO__INSTALL__ZSH=False
export MODE__INSTALL__ZSH=install_from_source
export VER__ZSH=5.9
export PATHD__DOWNLOADS__ZSH=$( realpath ~ )/lib-downloaded
export PATHD__INSTALL__ZSH=$( realpath ~ )/zsh
export TO__USE__ZSH_AS_DEFAULT_SHELL=True

# set ncurses environment variables before installing zsh
export PATH=$PATHD__INSTALL__NCURSES/bin/:$PATH
export LD_LIBRARY_PATH=$PATHD__INSTALL__NCURSES/lib:$LD_LIBRARY_PATH
export CPPFLAGS=-I$PATHD__INSTALL__NCURSES/include
export LDFLAGS=-L$PATHD__INSTALL__NCURSES/lib

cd $PATHD__SCRIPT
source zsh/install-zsh.sh
# ==============================================

# ================= install omz =================
export TO__INSTALL__OMZ=False

# set zsh environment variables before installing oh-my-zsh
export PATH=$PATHD__INSTALL__ZSH/bin:$PATH

cd $PATHD__SCRIPT
source zsh/install-omz.sh
# ==================================================


print_msg INFO "Done"