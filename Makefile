
# default variables
FRIEND_PATH 			=	$(PWD)/build
WEBSOCKETS_THREADS		=	1
USE_SELECT			=	0
NO_VALGRIND			=	0
CYGWIN_BUILD			=	0
DEBUG				=	1

# include custom configuration
-include Config

#compilation
all: compile
	@echo "Making all releases."

chrome_extension:
	@echo "Making the Chrome Extension."
	cd interfaces/chrome_extension; make

updatefiles:
	rsync -ravl php/* $(FRIEND_PATH)/php/
	rsync -ravl modules/* $(FRIEND_PATH)/modules/
	rsync -ravl interfaces/web_desktop/* $(FRIEND_PATH)/resources/webclient/
#	rsync -ravl docs/userdocs $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/themes/* $(FRIEND_PATH)/resources/themes/
	rsync -ravl interfaces/iconthemes/* $(FRIEND_PATH)/resources/iconthemes/
	rsync -ravl devices/* $(FRIEND_PATH)/devices/
	rsync -ravl repository/* $(FRIEND_PATH)/resources/repository/
	rsync -ravl services/* $(FRIEND_PATH)/services/

webclient:
	@echo "Deprecated. Use make updatefiles"

iphone_launcher:
	
android_launcher:

libs:
	cd libs; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	cd libs-ext; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

friendcore:
	cd core; make FriendCore
	cp core/bin/FriendCore ./

webserver:

clean:
	make -C core clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	rm -fr $(FRIEND_PATH)/libs/*
	rm -fr $(FRIEND_PATH)/fsys/*
	rm -fr $(FRIEND_PATH)/emod/*
	rm -fr $(FRIEND_PATH)/authmods/*

flush:
	@echo "Cleaning up."
	cd interfaces; make clean
	cd core; make clean
	rm -f bin/FriendCore
	rm -fr $(FRIEND_HOME)

setup:
	mkdir -p $(FRIEND_HOME) $(FRIEND_PATH)/autostart $(FRIEND_PATH)/resources $(FRIEND_PATH)/resources/webclient $(FRIEND_PATH)/resources/repository $(FRIEND_PATH)/sqlupdatescripts
	make -C libs-ext setup CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext DEBUG=1 CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C core setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext setup FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)

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
	mkdir -p $(FRIEND_PATH)
	mkdir -p storage
	mkdir -p $(FRIEND_PATH)/libs $(FRIEND_PATH)/cfg
	mkdir -p $(FRIEND_PATH)/autostart
	mkdir -p $(FRIEND_PATH)/authmods
	mkdir -p $(FRIEND_PATH)/resources
	mkdir -p $(FRIEND_PATH)/resources/webclient
		
	#ifneq ("$(wildcard $(PATH_TO_FILE))","") \ 
	#	CLEAN_SRC = \
	#else  \
	#	CLEAN_SRC = *.h file3
	#endif


	rsync -ravl interfaces/web_desktop/* $(FRIEND_PATH)/resources/webclient/
	rsync -ravl interfaces/themes $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/iconthemes/* $(FRIEND_PATH)/resources/iconthemes/

	rsync -ravl php $(FRIEND_PATH)/
	rsync -ravl modules $(FRIEND_PATH)/
	rsync -ravl storage $(FRIEND_PATH)/
	rsync -ravl db/sqlupdatescripts $(FRIEND_PATH)/
	rsync -ravl devices/* $(FRIEND_PATH)/devices/
	rsync -ravl services/* $(FRIEND_PATH)/services/
	#rsync -ravl autostart/* $(FRIEND_PATH)/autostart/	

	make -C core install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	cp docs/GDBFriendCore.sh $(FRIEND_PATH)/
	cp docs/ValgrindFriendCore.sh $(FRIEND_PATH)/
	cp docs/GDBTrace.sh $(FRIEND_PATH)/
	cp killfriend.sh $(FRIEND_PATH)/
	#rsync -ravl core/bin/* $(FRIEND_PATH)/

sync:
	rsync -ravl resources $(FRIEND_PATH)/
	rsync -ravl php $(FRIEND_PATH)/
	rsync -ravl modules $(FRIEND_PATH)/

