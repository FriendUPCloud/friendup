-include ../../Config.defs

GCC		=	gcc
OUTPUT		=	bin/php.authmod
CFLAGS		+=	-I../../core/ -I../../libs/properties/ -I../../libs/application/ -I../../libs/ -fPIC -I../../libs-ext/libwebsockets/build/include/ -I/usr/include/libxml2/ 
LFLAGS		=	-shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl $(shell mysql_config --libs)
DFLAGS		=	-M $(CFLAGS)  
FPATH		=	$(shell pwd)

ifeq ($(DEBUG),1)
CFLAGS  +=      -D__DEBUG
endif

ifeq ($(PROFILE),1)
CFLAGS  +=	-pg -DPROFILE=1
endif

ifeq ($(WEBSOCKETS),1)
CFLAGS	+=	-DENABLE_WEBSOCKETS
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

C_FILES := $(wildcard php.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) $(CFLAGS) ../../core/obj/library.o ../../core/obj/list.o ../../core/obj/string.o ../../core/obj/hashmap.o ../../core/obj/uri.o ../../core/obj/path.o ../../core/obj/user_application.o -lcrypto

obj/php.o: php.c
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<
	
obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<

#build system

compile:	$(OBJ_FILES) $(OUTPUT)

release:	$(OBJ_FILES) $(OUTPUT)

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/authmods/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 

