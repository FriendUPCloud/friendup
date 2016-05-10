GCC		=	gcc
OUTPUT	=	bin/application.library
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -fPIC -I../ -I../properties/ -I../system/ $(shell mysql_config --cflags)
LFLAGS	=	-shared -fPIC -Wl,--no-as-needed  -lstdc++ -lz -lpthread -laio -lrt -lcrypt -lssl $(shell mysql_config --libs)
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
#DEBUG	=	1

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
endif

C_FILES := $(wildcard applicationlibrary.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(LFLAGS) $(OBJ_FILES) ../../core/obj/json_converter.o

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
	cp bin/application.library ../../build/libs/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin

test:
	$(GCC) -o bin/TestLibrary $(CFLAGS) testlibrary.c ../../core/obj/library.o -ldl

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) 
