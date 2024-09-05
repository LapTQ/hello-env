FROM ubuntu:20.04

ARG USER_ID
ARG USER_NAME
ARG GROUP_ID
ARG GROUP_NAME

RUN apt update

RUN echo $USER_ID
RUN apt install -y sudo
RUN addgroup --gid $GROUP_ID $GROUP_NAME
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID $USER_NAME
RUN echo "$USER_NAME ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
USER ${USER_NAME}
RUN whoami

WORKDIR /home/$USER_NAME

SHELL ["/bin/bash", "-c"]


