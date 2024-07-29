export USER_ID=$(id -u)
export USER_NAME=$(id -un)
export GROUP_ID=$(id -g)
export GROUP_NAME=$(id -gn)
# docker-compose build
docker-compose up -d
