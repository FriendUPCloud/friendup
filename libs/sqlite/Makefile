-include ../../Config.defs

CC			=	gcc
OUTPUT		=	bin/sqlite.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/application/ -I../../core/system/ -I../../
LFLAGS		=	-shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl -lsqlite3 ../../core/obj/buffered_string.o ../../core/obj/list_string.o
FPATH		=	$(shell pwd)

#CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../system/ -I../../libs-ext/libwebsockets/build/include/  -L../../libs-ext/libwebsockets/lib/


ifeq ($(DEBUG),1)
CFLAGS  +=      -D__DEBUG
endif

ifeq ($(PROFILE),1)
CFLAGS  +=	-pg -DPROFILE=1
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

C_FILES := $(wildcard sqlitelibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES)

obj/%.o: %.c %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp bin/sqlite.library $(FRIEND_PATH)/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin bin/libs

test:
	$(GCC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o -ldl
	cp $(OUTPUT) bin/libs/

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 

