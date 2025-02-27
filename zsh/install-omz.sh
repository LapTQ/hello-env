# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__INSTALL__OMZ" ]; then
    TO__INSTALL__OMZ="True"
fi
# ================================================

source scripts/error-handlers.sh

if [ "$TO__INSTALL__OMZ" != "True" ]; then
    print_msg WARNING "Skipping oh-my-zsh installation"
    return
fi

print_msg INFO "Installing oh-my-zsh"

# install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Add option to change theme
echo "alias ztheme='(){ export ZSH_THEME="$@" && source $ZSH/oh-my-zsh.sh }'" >> ~/.zshrc
