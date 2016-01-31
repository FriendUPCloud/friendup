

all: compile
	@echo "Making all releases."

chrome_extension:
	@echo "Making the Chrome Extension."
	cd interfaces/chrome_extension; make

webclient:
	mkdir -p resources/webclient
	rsync -ravl interfaces/web_desktop/* resources/webclient/
	cp interfaces/web_desktop/favicon.ico resources/
	cp -R devices build/

iphone_launcher:
	
android_launcher:

libs:
	cd libs; make

friendcore:
	cd core; make FriendCore
	cp core/FriendCore ./

website_friendstudios:
	mkdir -p resources/studios
	rsync -ravl interfaces/website_friendstudios/* resources/studios/

webserver:

clean:
#	make clean
	make -C core clean
	make -C libs clean

flush:
	@echo "Cleaning up."
	cd interfaces; make clean
	cd core; make clean
	rm -f FriendCore
	rm -fr build

setup:
	make -C core setup
	make -C libs setup

compile:
	make -C core DEBUG=1
	make -C libs DEBUG=1

release:
	make -C core DEBUG=0 release
	make -C libs DEBUG=0 release

install:
	mkdir -p build
	mkdir -p storage
	mkdir -p build/libs build/cfg
	#ifneq ("$(wildcard $(PATH_TO_FILE))","") \ 
	#	CLEAN_SRC = \
	#else  \
	#	CLEAN_SRC = *.h file3
	#endif
	make webclient
	rsync -ravl resources build/
	rsync -ravl php build/
	rsync -ravl modules build/
	rsync -ravl storage build/
	make -C core install
	make -C libs install
	#rsync -ravl core/bin/* build/

sync:
	rsync -ravl resources build/
	rsync -ravl php build/
	rsync -ravl modules build/

