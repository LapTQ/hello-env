export USER_ID=$(id -u)
export USER_NAME=$(id -un)
export GROUP_ID=$(id -g)
export GROUP_NAME=$(id -gn)
# docker build . -t base-laptq-img -f Dockerfile-base
# docker-compose build
docker-compose up -d
