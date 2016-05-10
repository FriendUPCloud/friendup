

all: compile
	@echo "Making all releases."

chrome_extension:
	@echo "Making the Chrome Extension."
	cd interfaces/chrome_extension; make

webclient:
	mkdir -p resources/webclient
	mkdir -p resources/repository
	rsync -ravl interfaces/web_desktop/* resources/webclient/
	rsync -ravl repository/* resources/repository/
	
	#optimized - REMEMBER TO UPDATE - DEPRECATED! REMOVE
	cd interfaces/web_desktop; \
	cat js/3rdparty/hammer.js\
		templates/newline.txt\
		js/namespace.js\
		js/utils/json.js\
		js/utils/engine.js\
		js/utils/touch.js\
		js/utils/cssparser.js\
		js/utils/md5.js\
		js/utils/tool.js\
		js/utils/speech-input.js\
		js/io/cajax.js\
		js/io/request.js\
		js/io/directive.js\
		js/io/websocket.js\
		js/io/door.js\
		js/io/dormant.js\
		js/io/door_system.js\
		js/io/module.js\
		js/io/friendlibrary.js\
		js/io/file.js\
		js/io/applicationstorage.js\
		js/gui/template.js\
		js/gui/guibase.js\
		js/gui/window.js\
		js/gui/screen.js\
		js/gui/listview.js\
		js/gui/directoryview.js\
		js/gui/filedialog.js\
		js/gui/desklet.js\
		js/media/audio.js\
		js/apiwrapper.js\
		js/frienddos.js\
		js/workspace.js > ../../resources/webclient/js/compiled_index.js; \
	cd ../../
	
	cd interfaces/web_desktop; \
	cat js/utils/engine.js\
		js/io/cajax.js\
		js/io/friendlibrary.js\
		js/utils/json.js\
		js/utils/cssparser.js > ../../resources/webclient/js/compiled_apibase.js; \
	cd ../../
	
	cd interfaces/web_desktop; \
	cat css/friendup.css\
		theme/scrollbars.css > ../../resources/webclient/css/compiled_index.css;\
	cd ../../
	#done optimizing
	
	cp interfaces/web_desktop/favicon.ico resources/
	cp -R devices build/

iphone_launcher:
	
android_launcher:

libs:
	cd libs; make

friendcore:
	cd core; make FriendCore
	cp core/FriendCore ./

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

