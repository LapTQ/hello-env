#!/bin/bash

rm -f /tmp/.X1-lock
rm -f /tmp/.X11-unix/X1
echo "starting VNC server ..."
vncserver :1 -geometry 1920x1080 -depth 24 && tail -F /root/.vnc/*.log
