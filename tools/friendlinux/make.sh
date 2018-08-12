#!/bin/bash

#
# Compilation of friend native application
#
# Define directories
CURRENTFOLDER=$(pwd)
cd ..
cd ..
FRIENDFOLDER=$(pwd)
cd "$CURRENTFOLDER"
DESTINATION="$FRIENDFOLDER"/build/services/friendNativeApplication

# Compile!
echo Compiling "$DESTINATION"
gcc -o "$DESTINATION" main.c friendstring.c cJSON.c cJSON_Utils.c 
echo Done.





