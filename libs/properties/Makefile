GCC		=	gcc
OUTPUT	=	bin/properties.library
CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused-parameters -I../../core/  -fPIC -I../../libs-ext/libwebsockets/lib/ -I../../libs-ext/libwebsockets/  -L../../libs-ext/libwebsockets/lib/
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ -lstdc++ -lz -lpthread -lrt -lcrypt
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)

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

C_FILES := $(wildcard propertieslibrary.c iniparser.c dictionary.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)

compile:	ALL

$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS)

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) ../../build/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(GCC) $(CFLAGS) testlibrary.c ../../core/core/library.c -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ 

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 
