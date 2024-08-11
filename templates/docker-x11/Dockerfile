FROM ubuntu:20.04

RUN apt-get update -y
RUN apt-get upgrade -y
RUN ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime && echo $CONTAINER_TIMEZONE > /etc/timezone
RUN apt update

RUN apt install x11-apps -y

SHELL ["/bin/bash", "-c"]
