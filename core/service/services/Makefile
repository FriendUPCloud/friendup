GCC		=	gcc
CFLAGS	=	--std=c99 -Wall -W -D_POSIX_SOURCE -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused-parameter -I../../../core/ -I../../../../core/ -I../../../libs/ -I../../../libs-ext/libwebsockets/lib/ -I../../../libs-ext/libwebsockets/  -L../../../libs-ext/libwebsockets/lib/ -I/usr/include/mysql/ -fPIC -I../ -I../mysql/
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ 
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
SERVICE	=	apacheserv mysqlserv nodejsserv mathserv helloserv phpserv
DEBUG	=	1
SERVICEFLAGS =  --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused  -shared -fPIC
MATHLIB	=	

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
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

ifeq ($(CYGWIN_BUILD),0)
MATHLIB  +=    -lmatheval
endif

C_FILES := $(wildcard service_apache.c service_mysql.c service_nodejs.c service_math.c service_hello.c service_php.c )
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
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_apache.c -o bin/apache.serv ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o -lwebsockets

mysqlserv: service_mysql.c service_mysql.d
	@echo "\033[34mCompile mysql.serv ...\033[0m"
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_mysql.c -o bin/mysql.serv ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o -lwebsockets
	
nodejsserv: service_nodejs.c service_nodejs.d
	@echo "\033[34mCompile nodejs.serv ...\033[0m"
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_nodejs.c -o bin/nodejs.serv ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o -lwebsockets

mathserv: service_math.c service_math.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_math.c -o bin/math.serv $(MATHLIB)  ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o -lwebsockets

helloserv: service_hello.c service_hello.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_hello.c -o bin/hello.serv $(MATHLIB) ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o -lwebsockets
	
phpserv: service_php.c service_php.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(GCC) $(CFLAGS) $(SERVICEFLAGS) service_php.c -o bin/php.serv  ../../../core/obj/thread_linux.o ../../../core/obj/log.o ../../../core/obj/library.o ../../../core/obj/buffered_string.o -lwebsockets
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

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d)

