DIR_PRJ=/path/to/prj/dir
VENV_PARENT=/path/to/venv/parent

mkdir -p $VENV_PARENT

VENV_NAME=.venv
VENV_PATH=$VENV_PARENT/$VENV_NAME
[[ ! -d $VENV_PATH ]] && python3 -m venv $VENV_PATH
# try  --without-pip if create venv error: apt install python3.x-venv

if [ $( realpath "$VENV_PARENT" ) != $( realpath "$DIR_PRJ" ) ]; then
    ln -sf $VENV_PATH $DIR_PRJ/
fi

source $DIR_PRJ/$VENV_NAME/bin/activate
which python3

pip install -r requirements.txt --default-timeout=10000
