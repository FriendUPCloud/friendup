#!/bin/bash

# Ask for destination folder
read -p "Enter destination folder (available to Apache2) to install SSHy: " destination

# Check if the source folder exists
source="optional/ssh/SSHy-master"  # Replace with the actual source folder path
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
echo "Please check the SSHy.md readme file located in docs/optional/ for what to do next."

