-include ../../Config.defs

CC			=	gcc
OUTPUT		=	bin/application.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/application/ -I../../core/system/ -I../../
LFLAGS		=	-shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl $(shell mysql_config --libs)
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

C_FILES := $(wildcard applicationlibrary.c applicationlibrary_web.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)

compile:	$(OBJ_FILES) $(OUTPUT)

$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) ../../core/obj/json_converter.o

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(CC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o -ldl

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 

