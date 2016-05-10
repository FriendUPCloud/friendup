GCC		=	gcc
OUTPUT	=	bin/mylibrary.library
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -I../ -I/usr/include/mysql/ -fPIC 
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ -lmysqld -lstdc++ -lz -lpthread -laio -lrt -lcrypt
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
DEBUG	=	1

#if $(DEBUG) == 1
CFLAGS	+=	-D__DEBUG
#endif

C_FILES := $(wildcard mylibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS)

obj/%.o: %.c *h
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<


clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -rf obj/* $(OUTPUT)

install:
	@echo "\033[34mInstalling library\033[0m"
	cp bin/mylibrary.library ../../build/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(GCC) $(CFLAGS) testlibrary.c ../../core/library.c -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

dep: $(C_FILES)
	$(GCC) $(DFLAGS) -o $^ -o $(FPATH)/$@.d

-include $(C_FILES:%.c=%.d)
