
LIB_DIR = fcdb php 

ALL:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir; \
	done

install:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir install FRIEND_PATH=$(FRIEND_PATH); \
	done

setup:
	mkdir -p ../build/authmods
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir setup  WEBSOCKETS=$(WEBSOCKETS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD); \
	done

clean:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir clean; \
	done

compile:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir DEBUG=1  WEBSOCKETS=$(WEBSOCKETS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD); \
	done

compileprof:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir DEBUG=1 PROFILE=1 WEBSOCKETS=$(WEBSOCKETS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD); \
	done

release:
	for dir in $(LIB_DIR); do \
		$(MAKE) -C $$dir  WEBSOCKETS=$(WEBSOCKETS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD); \
        done


