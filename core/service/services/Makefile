GCC		=	gcc
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused-parameter -I../../../core/ -I/usr/include/mysql/ -fPIC -I../ -I../mysql/
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ 
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
SERVICE	=	apacheserv mysqlserv nodejsserv mathserv helloserv
#SERVICE	=	apacheserv mysqlserv
DEBUG	=	1

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
endif

C_FILES := $(wildcard service_apache.c service_mysql.c service_nodejs.c service_math.c service_hello.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(SERVICE)

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	gcc $(CFLAGS) -c -o $@ $<

#
#	SERVICES
#
	
apacheserv: service_apache.c service_apache.d
	@echo "\033[34mCompile apache.serv ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused service_apache.c -o bin/apache.serv -shared -fPIC

mysqlserv: service_mysql.c service_mysql.d
	@echo "\033[34mCompile mysql.serv ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused service_mysql.c -o bin/mysql.serv -shared -fPIC
	
nodejsserv: service_nodejs.c service_nodejs.d
	@echo "\033[34mCompile nodejs.serv ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused service_nodejs.c -o bin/nodejs.serv -shared -fPIC

mathserv: service_math.c service_math.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused service_math.c -o bin/math.serv -lmatheval -shared -fPIC

helloserv: service_hello.c service_hello.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused service_hello.c -o bin/hello.serv -lmatheval -shared -fPIC
#build system
	
clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf obj/*
	@rm -rf bin/serv/*

install:
	@echo "\033[34mInstalling files\033[0m"
	cp bin/*.serv ../../../build/services/ -R

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin
	mkdir -p ../../../build/services/

dummy:
	@echo "\033[34mJust skipping so Hogne can build :)\033[0m"

#test: ../../core/obj/buffered_string.o
#	$(GCC) $(CFLAGS) testlibrary.c ../../core/obj/library.o ../../core/obj/buffered_string.o -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d)

