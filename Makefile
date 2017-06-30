
WEBSOCKETS_THREADS	=	1
USE_SELECT			=	0
NO_VALGRIND			=	0
CYGWIN_BUILD		=	0
DEBUG				=	1

all: compile
	@echo "Making all releases."

chrome_extension:
	@echo "Making the Chrome Extension."
	cd interfaces/chrome_extension; make

updatefiles:
	rsync -ravl php/* build/php/
	rsync -ravl modules/* build/modules/
	rsync -ravl interfaces/web_desktop/* build/resources/webclient/
#	rsync -ravl docs/userdocs build/resources/
	rsync -ravl interfaces/themes/* build/resources/themes/
	rsync -ravl interfaces/iconthemes/* build/resources/iconthemes/
	rsync -ravl devices/* build/devices/
	rsync -ravl repository/* build/resources/repository/
	rsync -ravl services/* build/services/

webclient:
	@echo "Deprecated. Use make updatefiles"

iphone_launcher:
	
android_launcher:

libs:
	cd libs; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	cd libs-ext; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

friendcore:
	cd core; make FriendCore
	cp core/FriendCore ./

webserver:

clean:
#	make clean
	make -C core clean
	make -C libs clean
	make -C authmods clean
	rm -fr build/libs/*
	rm -fr build/fsys/*
	rm -fr build/emod/*
	rm -fr build/authmods/*

flush:
	@echo "Cleaning up."
	cd interfaces; make clean
	cd core; make clean
	rm -f FriendCore
	rm -fr build

setup:
	mkdir -p build build/resources build/resources/webclient build/resources/repository build/sqlupdatescripts
	make -C libs-ext setup CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext DEBUG=1 CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext install CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C core setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext setup
	make -C authmods setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

compile:
	make -C core DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

release:
	make -C core DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

install:
	mkdir -p build
	mkdir -p storage
	mkdir -p build/libs build/cfg
	mkdir -p build/authmods
	mkdir -p build/resources
	mkdir -p build/resources/webclient
		
	#ifneq ("$(wildcard $(PATH_TO_FILE))","") \ 
	#	CLEAN_SRC = \
	#else  \
	#	CLEAN_SRC = *.h file3
	#endif


	rsync -ravl interfaces/web_desktop/* build/resources/webclient/
	rsync -ravl interfaces/themes build/resources/
	rsync -ravl interfaces/iconthemes/* build/resources/iconthemes/

	rsync -ravl php build/
	rsync -ravl modules build/
	rsync -ravl storage build/
	rsync -ravl db/sqlupdatescripts build/
	rsync -ravl devices/* build/devices/
	rsync -ravl services/* build/services/
	
	make -C core install CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs install CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods install CYGWIN_BUILD=$(CYGWIN_BUILD)
	cp docs/GDBFriendCore.sh build/
	cp docs/ValgrindFriendCore.sh build/
	#rsync -ravl core/bin/* build/

sync:
	rsync -ravl resources build/
	rsync -ravl php build/
	rsync -ravl modules build/

