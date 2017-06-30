#!/bin/bash

LIB_DIR = libwebsockets 

ALL:
	for dir in $(LIB_DIR); do \
		make -C $$dir; \
	done

install:
ifeq ($(CYGWIN_BUILD),1)
	for dir in $(LIB_DIR); do \
		make -C $$dir install; \
	done
	
	cp libwebsockets/bin/cygwebsockets-8.dll ../build/
else
	cp libwebsockets/lib/libwebsockets.so* ../build/
	for dir in $(LIB_DIR); do \
		sudo make -C $$dir install; \
	done
	
	if [ -d "/usr/lib/x86_64-linux-gnu/" ]; then \
		sudo cp /usr/local/lib/libwebsockets.so.* /usr/lib/x86_64-linux-gnu/; \
	else \
		sudo cp /usr/local/lib/libwebsockets.so.* /lib/i386-linux-gnu/; \
	fi
endif

setup:
	cd libwebsockets/ ;cmake . ;cd ../
	#for dir in $(LIB_DIR); do \
	#	make -C $$dir setup; \
	#done

clean:
	for dir in $(LIB_DIR); do \
		make -C $$dir clean; \
	done

compile:
	for dir in $(LIB_DIR); do \
		make -C $$dir DEBUG=1; \
	done

release:
	for dir in $(LIB_DIR); do \
                make -C $$dir release; \
        done


