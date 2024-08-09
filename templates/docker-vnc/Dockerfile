FROM ubuntu:20.04

RUN apt-get update -y
RUN apt-get upgrade -y
RUN ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime && echo $CONTAINER_TIMEZONE > /etc/timezone
RUN apt update

# VNC
RUN DEBIAN_FRONTEND=noninteractive apt install lxde tightvncserver xvfb dbus-x11 x11-utils xfonts-base xfonts-75dpi xfonts-100dpi -y
RUN apt purge firefox -y

ARG VNCPASS

RUN mkdir -p /root/.vnc
COPY xstartup /root/.vnc/
RUN chmod a+x /root/.vnc/xstartup
RUN touch /root/.vnc/passwd
RUN /bin/bash -c "echo -e '${VNCPASS}\n${VNCPASS}\nn' | vncpasswd" > /root/.vnc/passwd
RUN chmod 400 /root/.vnc/passwd
RUN chmod go-rwx /root/.vnc
RUN touch /root/.Xauthority
COPY start-vncserver.sh /root/
RUN chmod a+x /root/start-vncserver.sh

SHELL ["/bin/bash", "-c"]
