#!/bin/bash

# TODO: This file may not be needed

# Ask for destination folder
read -p "Enter destination folder to install WebSSH2: " destination

# Check if the source folder exists
source="optional/ssh/webssh2"  # Replace with the actual source folder path
if [ ! -d "$source" ]; then
    echo "Source folder does not exist. Exiting..."
    exit 1
fi

# Check if the destination folder exists
if [ ! -d "$destination" ]; then
    # Try to create the destination folder
    mkdir -p "$destination"
    
    # Check if folder creation was successful
    if [ $? -ne 0 ]; then
        echo "Error: Cannot create destination folder. You might not have permissions to do that."
        exit 1
    fi
fi

# Rsync the source to the destination
rsync -av "$source" "$destination"

echo "Installation complete."
echo "Please check the webssh2.md readme file located in docs/optional/ for what to do next."

