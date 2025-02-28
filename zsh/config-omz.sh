# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__CONFIG__OMZ" ]; then
    TO__CONFIG__OMZ="True"
fi

if [ -z "$THEME__OMZ" ]; then
    THEME__OMZ="af-magic"
fi

if [ -z "$LIST__PLUGINS" ]; then
    LIST__PLUGINS=(
        "zsh-autosuggestions"
        "zsh-syntax-highlighting"
        "fast-syntax-highlighting"
        "zsh-history-substring-search"
        "zsh-autocomplete"
        "tmux"
        "virtualenv"
        "conda-env"
    )
fi
# ================================================

source scripts/error-handlers.sh

if [ "$TO__CONFIG__OMZ" != "True" ]; then
    print_msg WARNING "Skipping oh-my-zsh configuration"
    return
fi

print_msg INFO "Configurating oh-my-zsh"


# ================== config theme ==================
if ! grep -q "^ZSH_THEME=\"$THEME__OMZ\"" ~/.zshrc; then
    sed -i 's/ZSH_THEME="\(.*\)"/ZSH_THEME="'$THEME__OMZ'"/g' ~/.zshrc
    print_msg SUCCESS "Changed theme to $THEME__OMZ"
else
    print_msg INFO "Theme $THEME__OMZ already set"
fi


# ================== config plugins ==================
declare -A map_plugin_to_cmd=(
    ["zsh-autosuggestions"]="git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
    ["zsh-syntax-highlighting"]="git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
    ["fast-syntax-highlighting"]="git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/fast-syntax-highlighting"
    ["zsh-history-substring-search"]="git clone https://github.com/zsh-users/zsh-history-substring-search.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-history-substring-search"
    ["zsh-autocomplete"]="git clone --depth 1 -- https://github.com/marlonrichert/zsh-autocomplete.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autocomplete"
    ["tmux"]=""
    ["virtualenv"]=""
    ["conda-env"]=""
)


add_plugin() {
    local plugin=$1
    local cmd=$2

    if [ -n "$cmd" ]; then
        repo_dir=$(echo $cmd | awk '{print $NF}')
        if [ ! -d "$repo_dir" ]; then
            eval $cmd
        fi
    fi
    
    if ! grep -q "^plugins=\\(.*$plugin.*\\)" ~/.zshrc; then
        sed -i 's/plugins=(\(.*\))/plugins=(\1 '$plugin')/g' ~/.zshrc
        print_msg SUCCESS "Added plugin $plugin"
    else
        print_msg INFO "Plugin $plugin already added"
    fi
    
}

IFS=$'\n'
for plugin in ${LIST__PLUGINS[@]}; do
    cmd=${map_plugin_to_cmd[$plugin]}
    add_plugin $plugin "$cmd"
done
# ==================================================
