#!/bin/bash

cd /home/hogne/friendup/build
nohup ./FriendCore >> /dev/null &

read CX CY <<<$(xdpyinfo | awk -F'[ x]+' '/dimensions:/{print $3, $4}')

chromium-browser --open-ash --ash-force-desktop --kiosk --no-default-browser-check --window-position=0,0 --window-size=$CX,$CY --enable-strict-site-isolation --disable-web-security --use-data-dir --app="http://localhost:6502/webclient/friendbook.html"
