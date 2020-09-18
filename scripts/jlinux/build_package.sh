#!/bin/sh
version=$1
echo "version $version"
cd /usr/app/friendup/$version
echo "pwd: $(pwd)"

cp scripts/jlinux/configure.ac configure.ac
cp scripts/jlinux/Makefile.am Makefile.am

autoreconf --verbose

./configure --prefix=/usr/app/friendup/$version \
	--sysconfdir=/etc/app/friendup \
	--localstatedir=/var/app/friendup \
	FERSION=$version

cp -r /etc/app/friendup etc
cp -r /var/app/friendup var

package="friendup-$version.tar.gz"
tar czf /tmp/$package /usr/app/friendup/$version

rm -r /usr/app/friendup/$version/etc
rm -r /usr/app/friendup/$version/var

echo "package is ready at /tmp/$package"
