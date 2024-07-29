FROM base-laptq-img

SHELL ["/bin/bash", "-c"]

# VNC
ARG VNCPASS
RUN echo "i"
RUN mkdir -p /root/.vnc
COPY scripts/xstartup /root/.vnc/
RUN chmod a+x /root/.vnc/xstartup
RUN touch /root/.vnc/passwd
RUN /bin/bash -c "echo -e '${VNCPASS}\n${VNCPASS}\nn' | vncpasswd" > /root/.vnc/passwd
RUN chmod 400 /root/.vnc/passwd
RUN chmod go-rwx /root/.vnc
RUN touch /root/.Xauthority
COPY scripts/start-vncserver.sh /root/
RUN chmod a+x /root/start-vncserver.sh

WORKDIR /source

RUN echo "ee"
ARG USER_ID
ARG USER_NAME
ARG GROUP_ID
ARG GROUP_NAME
RUN echo $USER_ID
RUN apt install -y sudo
RUN addgroup --gid $GROUP_ID $GROUP_NAME
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID $USER_NAME
RUN echo "$USER_NAME ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
USER ${USER_NAME}
RUN whoami

# install python packages
# COPY requirements.txt requirements.txt
# RUN pip install -r requirements.txt --default-timeout=10000
# RUN pip install --ignore-installed pyyaml-include==1.3.2
