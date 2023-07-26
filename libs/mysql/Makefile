-include ../../Config.defs

CC			=	gcc
OUTPUT		=	bin/mysql.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/application/ -I../../core/system/ -I../../
LFLAGS		=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ `mysql_config --libs` -lz -lpthread -lrt -lcrypt
FPATH		=	$(shell pwd)

#CFLAGS	=	--std=c99 -Wall  -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused-parameter -Wno-unused-variable -I../../core/ -I/usr/include/mysql/ -I../ -fPIC -I../properties/  -I../../libs-ext/libwebsockets/build/include/  

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

C_FILES := $(wildcard mysqllibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS) $(CFLAGS) ../../core/obj/library.o ../../core/obj/list_string.o 

obj/%.o: %.c %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -f obj/*o $(OUTPUT) *.d*
	@rm -fr obj/*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(CC) $(CFLAGS) testlibrary.c ../../core/core/library.c -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ 

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) mysqllibrary.d

