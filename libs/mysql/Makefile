GCC		=	gcc
OUTPUT	=	bin/mysql.library
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused-parameter -I../../core/ -I/usr/include/mysql/ -I../ -fPIC -I../properties/
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ `mysql_config --libs` -lstdc++ -lz -lpthread -laio -lrt -lcrypt
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)

#if $(DEBUG) == 1
CFLAGS	+=	-D__DEBUG
#endif

C_FILES := $(wildcard mysqllibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS) $(CFLAGS) ../../core/obj/library.o

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<

#build system

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -f obj/*o $(OUTPUT) *.d
	@rm -fr obj/*

install:
	@echo "\033[34mInstalling library\033[0m"
	cp bin/mysql.library ../../build/libs/

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

-include $(C_FILES:%.c=%.d) mysqllibrary.d

