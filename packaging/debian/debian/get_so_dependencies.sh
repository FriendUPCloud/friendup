#!/bin/sh
if [ "$#" -ne 1 ]; then
	echo "This script will print deb dependencies based on libraries linked in a binary."
	echo "Use it to update the control file.\n"
	echo "Usage: ./get_so_dependencies.sh path/to/FriendCore"
	exit 1
fi

ldd $1 | awk '{print $1}' | xargs -L1 dpkg -S | cut -f1 -d":" | sort | uniq
