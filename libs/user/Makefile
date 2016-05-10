GCC		=	gcc
OUTPUT	=	bin/user.library
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../application/ -I../system/ $(shell mysql_config --cflags)
LFLAGS	=	-shared -fPIC -Wl,--no-as-needed  -lstdc++ -lz -lpthread -laio -lrt -lcrypt -lssl $(shell mysql_config --libs)
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
endif

C_FILES := $(wildcard userlibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) $(CFLAGS) ../../core/obj/library.o ../../core/obj/http.o ../../core/obj/socket.o ../../core/obj/list.o ../../core/obj/string.o ../../core/obj/hashmap.o ../../core/obj/uri.o ../../core/obj/path.o

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
	cp bin/user.library ../../build/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(GCC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/core/library.c -ldl


# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 
