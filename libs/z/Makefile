-include ../../Config.defs

CC			=	gcc
OUTPUT		=	bin/z.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/application/ -I../../core/system/ -I../../
LFLAGS		=	`mysql_config --libs`  -shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt  -Laes `mysql_config --libs`
FPATH		=	$(shell pwd)

#CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -funroll-loops -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../system/ -DHAVE_AES -Iaes/ -I/usr/include/mysql/  -I../../libs-ext/libwebsockets/build/include/  -L../../libs-ext/libwebsockets/lib/

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

C_FILES := $(wildcard zlibrary.c zip.c unzip.c minizip.c miniunz.c ioapi_mem.c ioapi.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)

aes/libaes.a:
	make -C aes 

$(OUTPUT): aes/libaes.a $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) -laes

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d
	@rm -rf *.d*
	make -C aes clean

compile:	ALL
	
install:
	@echo "\033[34mInstalling library\033[0m"
	cp bin/z.library $(FRIEND_PATH)/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(CC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o ../../core/obj/buffered_string.o -ldl -lz

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 
