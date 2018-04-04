
# default variables
FRIEND_PATH 			=	$(PWD)/build

FRIEND_CORE_BIN			= core/bin/FriendCore

# include custom configuration
-include Config
-include Makefile.defs

#compilation
all: compile
	@echo "Making default compilation with debug."

chrome_extension:
	@echo "Making the Chrome Extension."
	cd interfaces/chrome_extension; make

cleanfiles:
	@echo "Clean static files in progress"
	rm -fr $(FRIEND_PATH)/resources/webclient/*
	rm -fr $(FRIEND_PATH)/php/
	rm -fr $(FRIEND_PATH)/modules/
	rm -fr $(FRIEND_PATH)/resources/webclient/
	rm -fr $(FRIEND_PATH)/resources/themes/
	rm -fr $(FRIEND_PATH)/resources/iconthemes/
	rm -fr $(FRIEND_PATH)/devices/
	rm -fr $(FRIEND_PATH)/resources/repository/
	rm -fr $(FRIEND_PATH)/services/

cleanws:
	@echo "Cleaning Websocket lib"
	make -C libs-ext clean

clean:
	@echo "Clean process in progress."
	make -C core clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods clean WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	rm -fr $(FRIEND_PATH)/libs/*
	rm -fr $(FRIEND_PATH)/fsys/*
	rm -fr $(FRIEND_PATH)/emod/*
	rm -fr $(FRIEND_PATH)/authmods/*

updatefiles:
	@echo "Updating files."
	rsync -ravl php/* $(FRIEND_PATH)/php/
	rsync -ravl modules/* $(FRIEND_PATH)/modules/
	rsync -ravl interfaces/web_desktop/* $(FRIEND_PATH)/resources/webclient/
	rsync -ravl interfaces/themes/* $(FRIEND_PATH)/resources/themes/
	rsync -ravl interfaces/iconthemes/* $(FRIEND_PATH)/resources/iconthemes/
	rsync -ravl devices/* $(FRIEND_PATH)/devices/
	rsync -ravl repository/* $(FRIEND_PATH)/resources/repository/
	rsync -ravl services/* $(FRIEND_PATH)/services/

libs: $(FRIEND_CORE_BIN)
	@echo "Generate libraries."
	cd libs; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	cd libs-ext; make WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

friendcore:
	@echo "FriendCore compilation in progress."
	cd core; make FriendCore
	cp $(FRIEND_CORE_BIN) ./

flush:
	@echo "Cleaning up."
	cd interfaces; make clean
	cd core; make clean
	rm -f $(FRIEND_CORE_BIN)
	rm -fr $(FRIEND_HOME)

setup: cleanws
	@echo "Setup in progress."
	mkdir -p $(FRIEND_PATH)/docs/internal/webcalls
	mkdir -p $(FRIEND_PATH)/docs/internal/core
	mkdir -p $(FRIEND_HOME) $(FRIEND_PATH)/autostart $(FRIEND_PATH)/resources $(FRIEND_PATH)/resources/webclient $(FRIEND_PATH)/resources/repository $(FRIEND_PATH)/sqlupdatescripts
	make -C libs-ext setup CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext DEBUG=1 CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C core setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext setup FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)

compile:
	@echo "Making default compilation with debug."
	make -C core DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

compileprof:
	@echo "Making default compilation with debug and profiling settings."
	make -C core PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs-ext PROFILE=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

release:
	@echo "Making release version without debug."
	make -C core DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C libs DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)
	make -C authmods DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD)

install:
	@echo "Installation in progress."
	mkdir -p $(FRIEND_PATH)
	mkdir -p storage
	mkdir -p $(FRIEND_PATH)/libs $(FRIEND_PATH)/cfg
	mkdir -p $(FRIEND_PATH)/autostart
	mkdir -p $(FRIEND_PATH)/authmods
	mkdir -p $(FRIEND_PATH)/resources
	mkdir -p $(FRIEND_PATH)/resources/webclient

	rsync -ravl interfaces/web_desktop/* $(FRIEND_PATH)/resources/webclient/
	rsync -ravl interfaces/web_desktop/favicon.ico $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/themes $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/iconthemes/* $(FRIEND_PATH)/resources/iconthemes/

	rsync -ravl php $(FRIEND_PATH)/
	rsync -ravl modules $(FRIEND_PATH)/
	rsync -ravl storage $(FRIEND_PATH)/
	rsync -ravl db/sqlupdatescripts $(FRIEND_PATH)/
	rsync -ravl devices/* $(FRIEND_PATH)/devices/
	rsync -ravl services/* $(FRIEND_PATH)/services/

	make -C core install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	cp scripts/*.sh $(FRIEND_PATH)/

sync:
	@echo "Synchronization in progress."
	rsync -ravl resources $(FRIEND_PATH)/
	rsync -ravl php $(FRIEND_PATH)/
	rsync -ravl modules $(FRIEND_PATH)/

internaldoc:
	doxygen docs/doxygen/core/coreWebCalls
	@echo "Documentation ready in docs/core/webcalls/"
	doxygen docs/doxygen/core/coreInternal
	@echo "Documentation ready in docs/core/internal/"

gitclean:
	git clean -d -x -f


