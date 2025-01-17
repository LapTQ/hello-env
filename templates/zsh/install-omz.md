# Install Oh My ZSH

## Requirements

1. `zsh` (install [here](./install-zsh.md))

## Install

Access `zsh` then install oh-my-zsh
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## Add option to change theme

```bash
echo "alias ztheme='(){ export ZSH_THEME="$@" && source $ZSH/oh-my-zsh.sh }'" >> ~/.zshrc
```

Usage:
```bash
ztheme robbyrussell
```

Automatically:
```bash
echo "ztheme af-magic" >> ~/.zshrc
```

## To automatically access your Zsh shell whenever you SSH into the server

Add the following lines at the end of the file `~/.bashrc`:
```
source /path/to/conda/bin/activate your-conda-env && exec zsh
```
Replace the `/path/to/conda/bin/activate` with path to the installed conda (e.g., `~/miniconda3/bin/activate`).

## References

1. https://anaconda.org/conda-forge/zsh
2. https://ohmyz.sh
