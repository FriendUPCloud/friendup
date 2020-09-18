# Jlinux packaging

These scripts are for updateing Friendup installations on Jlinux servers from
a working installation on a master server

### Creating the update package

build_package.sh takes one argument, the package version. So if Friendup is installed
in /usr/app/friendup/<version>, this is what should be passed to the build script:

> sh build_package.sh <version>

The output will be /tmp/friendup-<version>.tar.gz, ready for distribution

### Applying package manually

On the server to be updated: 
	unpack friendup-<version>.tar.gz
	change to /usr/app/friendup/<version>
	make install
	change symlink /usr/app/friendup/current to point to new version, i guess
	probably other things
