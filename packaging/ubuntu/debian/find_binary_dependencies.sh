#!/bin/sh
if [ "$#" -ne 1 ]; then
	echo "This script will find ELF files in provided path, extract their load-time dependencies and find their deb packages."
	echo "Use it to update the control file. It can take some minutes to execute."
	echo "Apply common sense to the output list. NOT ALL PACKAGES SHOULD BE DEPENDENCIES OF FriendUP deb!\n"
	echo "Usage: ./find_binary_dependencies.sh ../path/to/build/directory"
	exit 1
fi

#Enjoy the finely inlaid comments...

find $1 -exec file {} \; |  `#find files that are executable` \
	grep ELF |          `#check if they are ELF files` \
	cut -f1 -d":" |     `#cut just the binary name, without ELF metadata` \
	xargs -L1 ldd |     `#run ldd on that binary` \
	awk '{print $1}' |  `#cut just the .so name (without path and address)` \
	sort | uniq |       `#remove duplicates` \
	xargs -L1 dpkg -S | `#find which packages the .so files belong to` \
	cut -f1 -d":" |     `#cut just the package name` \
	sort | uniq         `#remove duplicates`
