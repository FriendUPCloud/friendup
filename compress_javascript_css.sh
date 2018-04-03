#!/bin/bash

cd build/resources/webclient/js

for f in *.js
do
	echo "Minifying $f..."
	yui-compressor --nomunge $f -o $f.min
	#gzip $f
	#mv $f.gz $f
	rm $f
	mv $f.min $f
done


for d in amos apps external fui game gui io media native tree utils vr
do
	cd $d
	for f in *.js
	do
		echo "Minifying $d/$f..."
		yui-compressor --nomunge $f -o $f.min
		#gzip $f
		#mv $f.gz $f
		rm $f
		mv $f.min $f
	done
	cd ..
done

echo "All done!"

