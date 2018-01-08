#!/bin/bash

echo "Installing packages."

sudo apt-get install chromium-browser

echo "Installing xsession script."

sudo cp scripts/friendbook.sh /opt/

echo "You now have to copy the xsession file manually to your distribution's session list path."

