GCC		=	gcc
OUTPUT	=	bin/z.library
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../system/ -DHAVE_AES -Iaes/ 
LFLAGS	=	-shared -fPIC -Wl,--no-as-needed  -lstdc++ -lz -lpthread -laio -lrt  -Laes
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
DEBUG	=	1

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
endif

C_FILES := $(wildcard zlibrary.c zip.c unzip.c minizip.c miniunz.c ioapi_mem.c ioapi.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)

aes/libaes.a:
	make -C aes 

$(OUTPUT): aes/libaes.a $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) -laes

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/* $(OUTPUT) *.d
	make -C aes clean

install:
	@echo "\033[34mInstalling library\033[0m"
	cp bin/z.library ../../build/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(GCC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o -ldl -lz

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 
