# default variables
FRIEND_PATH 			?=	$(PWD)/build
FRIEND_DEB_DEBIAN_TGT_PATH=$(PWD)/packaging/debian/debian/friendup/opt/friendup
FRIEND_DEB_UBUNTU_TGT_PATH=$(PWD)/packaging/ubuntu/debian/friendup/opt/friendup
FRIEND_CORE_BIN			= core/bin/FriendCore

# include custom configuration
#-include Config
-include Config.defs
-include Config

#compilation
all: compile
	@echo "Making default compilation with debug."

deb-debian:
	@echo "Valid targets are: make deb-ubuntu"
	cd packaging/debian && dpkg-buildpackage -b -uc

deb-ubuntu:
	@echo "Make package"
	cd packaging/ubuntu && dpkg-buildpackage -b -uc

installforpackage-debian:
	@echo "Make install for package"
	#mkdir -p $(FRIEND_DEB_DEBIAN_TGT_PATH)
	make FRIEND_PATH=$(FRIEND_DEB_DEBIAN_TGT_PATH) clean setup release install
	mkdir -p $(FRIEND_DEB_DEBIAN_TGT_PATH)/../../etc/systemd/system/
	mkdir -p $(FRIEND_DEB_DEBIAN_TGT_PATH)/db
	mkdir -p $(FRIEND_DEB_DEBIAN_TGT_PATH)/cfg/crt
	cp $(PWD)/docs/cfg.ini.example $(FRIEND_DEB_DEBIAN_TGT_PATH)/cfg/cfg.ini.example
	cp $(PWD)/docs/README.txt $(FRIEND_DEB_DEBIAN_TGT_PATH)/
	cp $(PWD)/scripts/friendup.service $(FRIEND_DEB_DEBIAN_TGT_PATH)/../../etc/systemd/system/
	cp $(PWD)/db/FriendCoreDatabase.sql $(FRIEND_DEB_DEBIAN_TGT_PATH)/db/


installforpackage-ubuntu:
	@echo "Make install for package"
	mkdir -p $(FRIEND_DEB_UBUNTU_TGT_PATH)
	make FRIEND_PATH=$(FRIEND_DEB_UBUNTU_TGT_PATH) clean setup release install
	mkdir -p $(FRIEND_DEB_UBUNTU_TGT_PATH)/../../etc/systemd/system/
	mkdir -p $(FRIEND_DEB_UBUNTU_TGT_PATH)/db
	mkdir -p $(FRIEND_DEB_DEBIAN_TGT_PATH)/cfg/crt
	cp $(PWD)/scripts/friendup.service $(FRIEND_DEB_UBUNTU_TGT_PATH)/../../etc/systemd/system/
	cp $(PWD)/docs/cfg.ini.example $(FRIEND_DEB_UBUNTU_TGT_PATH)/cfg/cfg.ini.example
	cp $(PWD)/docs/README.txt $(FRIEND_DEB_UBUNTU_TGT_PATH)/
	cp $(PWD)/db/FriendCoreDatabase.sql $(FRIEND_DEB_UBUNTU_TGT_PATH)/db/
#	make FRIEND_PATH=$(FRIEND_DEB_TGT_PATH) release install
#FIXME: cruft is copied to the target directory (eg. FriendNetwork server logs)

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
	rm -fr $(FRIEND_PATH)/resources/graphics/
	rm -fr $(FRIEND_PATH)/devices/
	rm -fr $(FRIEND_PATH)/resources/repository/
	rm -fr $(FRIEND_PATH)/services/

cleanlibs:
	@echo "Cleaning external libraries"
	make -C libs-ext clean

clean:
	#@echo "Cleaning Websocket lib"
	#make -C libs-ext clean
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
	rsync -ravl interfaces/graphics/* $(FRIEND_PATH)/resources/graphics/
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

# SETUP all additional libs - no debug
setup:
	@echo "Setup in progress."
	mkdir -p $(FRIEND_PATH)/docs/internal/webcalls
	mkdir -p $(FRIEND_PATH)/docs/internal/core
	mkdir -p $(FRIEND_HOME) $(FRIEND_PATH)/autostart $(FRIEND_PATH)/resources $(FRIEND_PATH)/resources/webclient $(FRIEND_PATH)/resources/repository $(FRIEND_PATH)/sqlupdatescripts
	make -C libs-ext setup CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C core setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)

# SETUP all additional libs - debug
setupdeb:
	@echo "Setup (debug) in progress."
	mkdir -p $(FRIEND_PATH)/docs/internal/webcalls
	mkdir -p $(FRIEND_PATH)/docs/internal/core
	mkdir -p $(FRIEND_HOME) $(FRIEND_PATH)/autostart $(FRIEND_PATH)/resources $(FRIEND_PATH)/resources/webclient $(FRIEND_PATH)/resources/repository $(FRIEND_PATH)/sqlupdatescripts
	make -C libs-ext setupdeb DEBUG=1 CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs-ext DEBUG=1 install CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C core setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C libs setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	make -C authmods setup WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)
	
compile:
	@echo "Making default compilation with debug."
	make -C core DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) USE_SSH_THREADS_LIB=$(USE_SSH_THREADS_LIB) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL) ENABLE_SSH=$(ENABLE_SSH)
	make -C libs DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C libs-ext DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C authmods DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)

unittest:
	@echo "Unit tests build in progress."
	make -C core unittest DEBUG=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)

compileprof:
	@echo "Making default compilation with debug and profiling settings."
	make -C core PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C libs PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C libs-ext PROFILE=1 WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C authmods PROFILE=1 compileprof WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)

release:
	@echo "Making release version without debug."
	make -C core DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) USE_SSH_THREADS_LIB=$(USE_SSH_THREADS_LIB) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL) ENABLE_SSH=$(ENABLE_SSH)
	make -C libs DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)
	make -C authmods DEBUG=0 release WEBSOCKETS_THREADS=$(WEBSOCKETS_THREADS) USE_SELECT=$(USE_SELECT) NO_VALGRIND=$(NO_VALGRIND) CYGWIN_BUILD=$(CYGWIN_BUILD) OPENSSL_INTERNAL=$(OPENSSL_INTERNAL)

install:
	@echo "Installing to: $(FRIEND_PATH)"
	mkdir -p $(FRIEND_PATH)
	mkdir -p storage
	mkdir -p $(FRIEND_PATH)/libs $(FRIEND_PATH)/cfg
	mkdir -p $(FRIEND_PATH)/autostart
	mkdir -p $(FRIEND_PATH)/authmods
	mkdir -p $(FRIEND_PATH)/resources
	mkdir -p $(FRIEND_PATH)/resources/webclient
	mkdir -p $(FRIEND_PATH)/repository
	mkdir -p $(FRIEND_PATH)/cfg/crt

	rsync -ravl interfaces/web_desktop/* $(FRIEND_PATH)/resources/webclient/
	rsync -ravl interfaces/web_desktop/favicon.ico $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/themes $(FRIEND_PATH)/resources/
	rsync -ravl interfaces/iconthemes/* $(FRIEND_PATH)/resources/iconthemes/
	rsync -ravl interfaces/graphics/* $(FRIEND_PATH)/resources/graphics/

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
	cp scripts/bash-ini-parser $(FRIEND_PATH)/

goinstall: install
	rm -f build/resources/webclient/index.html
	ln -s build/resources/webclient/go.html build/resources/webclient/index.html
	
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

dump:
	objdump -d build/FriendCore >FriendCore.dump

