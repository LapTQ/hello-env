# Install Oh My ZSH with zsh-autosuggestions

## Install

Note: assuming we're installing in a conda environment as we do not have permission to install packages in the host enviroment.

Install zsh:
```bash
conda install conda-forge::zsh
```

Install oh-my-zsh
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

Install zsh-autosuggestions
```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```
Add the plugin to the list of plugins for Oh My Zsh to load (inside `~/.zshrc`)
```
plugins=( 
    # other plugins...
    zsh-autosuggestions
)
```

## To automatically access your Zsh shell whenever you SSH into the server

Add the following lines at the end of the file `~/.bashrc`:
```
source /path/to/conda/bin/activate your-conda-env
exec zsh
```
Replace the `/path/to/conda/bin/activate` with path to the installed conda to (e.g., `~/miniconda3/bin/activate`).
