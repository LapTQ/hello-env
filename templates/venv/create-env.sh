venv_parent=~/prj-name
venv_name=.env-name
venv_path=$venv_parent/$venv_name
[[ ! -d $venv_path ]] && python3 -m venv $venv_path
source $venv_path/bin/activate
which python3

pip_cache_dir=/path/to/.cache/pip
tmp_dir=/path/to/tmp
[[ ! -d $tmp_dir ]] && mkdir -p $tmp_dir
export TMPDIR=$tmp_dir
[[ ! -d $pip_cache_dir ]] && mkdir -p $pip_cache_dir
pip install --cache-dir=$pip_cache_dir -r --ignore-installed requirements.txt --default-timeout=10000
