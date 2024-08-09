venv_parent=~/prj-name
venv_name=.env-name
venv_path=$venv_parent/$venv_name
[[ ! -d $venv_path ]] && python -m venv $venv_path
source $venv_path/bin/activate
which python3

pip install --ignore-installed -r requirements.txt
