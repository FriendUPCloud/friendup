#!/bin/bash

LIB_DIR = libwebsockets 

ALL: compile
	@echo "make ALL"
	#for dir in $(LIB_DIR); do \
	#	make -C $$dir; \
	#done

install:
ifeq ($(CYGWIN_BUILD),1)
	for dir in $(LIB_DIR); do \
		make -C $$dir install FRIEND_PATH=$(FRIEND_PATH); \
	done
	
else
	#sudo cp libwebsockets/build/lib/libwebsockets.so* /usr/lib/
	#cd libwebsockets/build/ ;make install ;cd ../../
endif

setup:
	mkdir -p libwebsockets/build
	mkdir -p libssh2/build
	cd libwebsockets/build/ ; cmake ../ -DCMAKE_C_FLAGS=-fPIC -DLWS_HAVE_SYS_CAPABILITY_H=OFF -DLWS_IPV6=ON -DCMAKE_BUILD_TYPE=DEBUG -DLWS_WITH_LIBUV=ON ; make DEBUG=0 ; cd ../../
	cp -r libwebsockets/include/* libwebsockets/build/include/
	cd libssh2/build/ ; cmake ../ -DCMAKE_C_FLAGS=-fPIC -DCRYPTO_BACKEND:STRING=Libgcrypt ; make DEBUG=0 ; cd ../../
	cd openssl ; ./config no-shared ; make ; cd ..
	#mkdir -p libzmq/build
	#cd libzmq/build/ ; cmake ../ ; make DEBUG=0 ; cd ../../
	#for dir in $(LIB_DIR); do \
	#	make -C $$dir setup  FRIEND_PATH=$(FRIEND_PATH); \
	#done

clean:
	mkdir -p libwebsockets/build
	mkdir -p libssh2/build
	cd libwebsockets/build/ && rm -rf * && cd ../../
	cd libssh2/build/ && rm -rf * && cd ../../
	#cd libhttp/ ;make clean ; cd ..

compile:
	cd libwebsockets/build/ ;make DEBUG=1 ; cd ../../
	cd libssh2/build/ ;make DEBUG=1 ; cd ../../
	#cd libhttp/ ;make DEBUG=1 ; cd ../

release:
	cd libwebsockets/build/ ;make DEBUG=0 ; cd ../../
	cd libssh2/build/ ;make DEBUG=0 ; cd ../../
	#cd libhttp/ ;make DEBUG=0 ; cd ..

