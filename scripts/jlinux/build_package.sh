#!/bin/sh
version=$1
echo "version $version"
cd /usr/app/friendup/$version
echo "pwd: " pwd

cp scripts/jlinux/configure.ac configure.ac
cp scripts/jlinux/Makefile.am Makefile.am

autoreconf --verbose

exit 0

./configure --prefix=/usr/app/friendup/$version \
	--sysconfdir=/etc/app/friendup \
	--localstatedir=/var/app/friendup

cp -r /etc/app/friendup etc
cp -r /var/app/friendup var

package="friendup-$version.tar.gz"
tar czf /tmp/$package /usr/app/friendup/$version

echo "package is ready at /tmp/$package"
