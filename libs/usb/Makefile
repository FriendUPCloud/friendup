-include ../../Config.defs

CC		=	gcc
CPP		=	g++
OUTPUT		=	bin/usb.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/usb/ -I../../core/system/ -I../../
LFLAGS		=	-shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl $(shell mysql_config --libs) -lc
CFLAGSTEST	=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -I../../libs/ -I../../libs/properties/ -I../../libs/usb/ -I../../core/system/ -I../../
LFLAGSTEST	=	-Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl $(shell mysql_config --libs)
FPATH		=	$(shell pwd)

#CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../system/ $(shell mysql_config --cflags) -I../../libs-ext/libwebsockets/build/include/ -I../../libs-ext/libwebsockets/  -L../../libs-ext/libwebsockets/lib/


ifeq ($(DEBUG),1)
CFLAGS  +=      -D__DEBUG
endif

ifeq ($(WEBSOCKETS_THREADS),1)
CFLAGS	+=	-DENABLE_WEBSOCKETS_THREADS
endif

ifeq ($(USE_SELECT),1)
CFLAGS  +=      -DUSE_SELECT
endif

ifeq ($(NO_VALGRIND),1)
CFLAGS  +=      -DNO_VALGRIND_STUFF
endif

ifeq ($(CYGWIN_BUILD),1)
CFLAGS  +=      -DCYGWIN_BUILD
endif

CFLAGS	+=	-DUSE_ELTIMA_USB_SDK -Iinclude/ -D_GLIBCXX_USE_CXX11_ABI=0
LFLAGS	+=	-Llib/ -leveusb
CFLAGSTEST	+=	-DUSE_ELTIMA_USB_SDK -Iinclude/ -D_GLIBCXX_USE_CXX11_ABI=0
LFLAGSTEST	+=	-Llib/ -leveusb 

C_FILES := $(wildcard *.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

CPP_FILES := $(wildcard usbcpp/*.cpp)
OBJ_CPP_FILES := $(addprefix obj/,$(notdir $(CPP_FILES:.cpp=.o)))

ALL:	$(OBJ_FILES) $(OBJ_CPP_FILES) $(OUTPUT)

compile:	$(OBJ_FILES) $(OBJ_CPP_FILES) $(OUTPUT)

$(OUTPUT): $(OBJ_FILES) $(OBJ_CPP_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) $(OBJ_CPP_FILES) ../../core/obj/json_converter.o

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: usbcpp/%.cpp usbcpp/%.h usbcpp/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CPP) $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	#@rm -f $(CPP_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d*
	rm -rf obj/* $(OUTPUT) *.d*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/libs/
	#sudo cp lib/*.so* /usr/lib/x86_64-linux-gnu/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test: test
	#$(CC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o -ldl
	$(CPP) $(CFLAGSTEST) test.cpp usbcpp/*.cpp ../../core/obj/jsmn.o ../../core/obj/string.o ../../core/obj/list.o $(LFLAGSTEST) -otest

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

%.d: %.cpp
	@set -e; rm -f $@; \
	$(CPP) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d)

-include $(CPP_FILES:%.cpp=%.d)

