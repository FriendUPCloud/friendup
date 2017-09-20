#!/bin/bash

LIB_DIR = libwebsockets 

ALL:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir; \
	done

install:
ifeq ($(CYGWIN_BUILD),1)
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir install FRIEND_PATH=$(FRIEND_PATH); \
	done
	
else
	sudo cp libwebsockets/lib/libwebsockets.so* /usr/lib/
	for dir in $(LIB_DIR); do \
		sudo $(MAKE) -C $$dir install FRIEND_PATH=$(FRIEND_PATH); \
	done
endif

setup:
	cd libwebsockets/ ;cmake . ;cd ../
	#for dir in $(LIB_DIR); do \
	#	$(MAKE) -C $$dir setup  FRIEND_PATH=$(FRIEND_PATH); \
	#done

clean:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir clean; \
	done

compile:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir DEBUG=1; \
	done

release:
	for dir in $(LIB_DIR); do \
                $(MAKE) -C $$dir release; \
        done


