
# Define directories
CURRENTFOLDER=$(pwd)
cd ..
cd ..
FRIENDFOLDER=$(pwd)
cd "$CURRENTFOLDER"

# Installation path
DESTINATION="/home/$USER/.config/google-chrome/NativeMessagingHosts"
MANIFEST="$FRIENDFOLDER"/tools/friendlinux/manifest.json
APPLICATION="$FRIENDFOLDER"/build/services/friendNativeApplication
MANIFESTSAVE="$DESTINATION"/cloud.friendup.friendnativeapplication.json

# Build the application
./make.sh

# Checks the path
if [ ! -d "$DESTINATION" ]; then
	echo Creating directory: "$DESTINATION"
	mkdir "$DESTINATION"
fi
if [ ! -d "$DESTINATION" ]; then
	echo "Chrome not found. Aborting."
	exit 1
fi

cp "$MANIFEST" "$MANIFESTSAVE"
sed -i -- "s@PATH_TO_APPLICATION@$APPLICATION@g" "$MANIFESTSAVE"

