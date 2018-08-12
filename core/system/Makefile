
-include ../../Makefile.defs

CC			=	gcc
CFLAGS			=	$(GLOBAL_CFLAGS) -I. -I../../core/ -I../properties/ -I/usr/include/mysql/ -fPIC -I../ -I../../libs/ -I../../$(LIBWS_INCLUDE_DIR) -I$(SAMBA_INCLUDE_DIR)
LFLAGS			=	-shared -fPIC ../../$(LIBWS_LIB_DIR)/libwebsockets.a
DFLAGS			=	-M $(CFLAGS)

FPATH			=	$(shell pwd)
MODS			=	phpmod sysmod nodejsmod pythonmod javamod
FSYS			=	fsyslocal fsysssh2 fsysphp fsysnode fsysinram fsysremote fsyssmb
LOGGERS			=	sql.ulogger file.ulogger
SERVICES		=	apacheserv mysqlserv nodejsserv phpserv
SERVICEFLAGS		=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -Ofast -funroll-loops -I. -Wno-unused  -shared -fPIC
MATHLIB			=

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG -g
endif

ifeq ($(PROFILE),1)
CFLAGS  +=	-pg -DPROFILE=1
endif

ifeq ($(NO_VALGRIND),1)
CFLAGS  +=      -DNO_VALGRIND_STUFF
endif

ifeq ($(USE_SELECT),1)
CFLAGS  +=      -DUSE_SELECT
endif

ifeq ($(CYGWIN_BUILD),1)
CFLAGS  +=      -DCYGWIN_BUILD
endif

ifeq ($(CYGWIN_BUILD),0)
MATHLIB  +=     -lmath
endif

C_FILES := $(wildcard  )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(FSYS) $(MODS) $(LOGGERS)

#
#	EXECUTE MODULES
#
	
phpmod: moduledyn/phpmod.c moduledyn/phpmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o moduledyn/phpmod.c -o bin/emod/php.emod -shared -fPIC -lcrypto

pythonmod: moduledyn/pythonmod.c moduledyn/pythonmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/pythonmod.c  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o -o bin/emod/python.emod -shared -fPIC -lcrypto
	
javamod: moduledyn/javamod.c moduledyn/javamod.d
	@echo "\033[34mCompile java.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o  moduledyn/javamod.c -o bin/emod/java.emod -shared -fPIC -lcrypto

sysmod: moduledyn/sysmod.c moduledyn/sysmod.d
	@echo "\033[34mCompile sys.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/sysmod.c ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o -o bin/emod/sys.emod -shared -fPIC -lcrypto

nodejsmod: moduledyn/nodejsmod.c moduledyn/nodejsmod.d
	@echo "\033[34mCompile nodejs.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/nodejsmod.c  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o  -o bin/emod/nodejs.emod -shared -fPIC -lcrypto
	
#
#	FILESYSTEMS
#
	
fsyslocal: fsysdyn/fsyslocal.c ../../core/obj/buffered_string.o fsysdyn/fsyslocal.d
	@echo "\033[34mCompile FSYSlocal ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsyslocal.c ../../core/obj/buffered_string.o -o bin/fsys/local.fsys -shared -fPIC

fsysssh2: fsysdyn/fsysssh2.c ../../core/obj/buffered_string.o fsysdyn/fsysssh2.d
	@echo "\033[34mCompile FSYSssh2 ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsysssh2.c ../../core/obj/buffered_string.o -o bin/fsys/ssh2.fsys -shared -fPIC -lssh2

fsysphp: fsysdyn/fsysphp.c  ../../core/obj/buffered_string.o fsysdyn/fsysphp.d
	@echo "\033[34mCompile FSYSphp ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsysphp.c ../../core/obj/buffered_string.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o -o bin/fsys/php.fsys -shared -fPIC -lcrypto

fsysnode: fsysdyn/fsysnode.c  ../../core/obj/buffered_string.o fsysdyn/fsysnode.d
	@echo "\033[34mCompile FSYSnode ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsysnode.c ../../core/obj/buffered_string.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o -o bin/fsys/node.fsys -shared -fPIC -lcrypto

fsysinram: fsysdyn/fsysinram.c ../../core/obj/buffered_string.o fsysdyn/fsysinram.d
	@echo "\033[34mCompile FSYSinram ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsysinram.c ../../core/obj/buffered_string.o ../../core/obj/inramfs.o ../../core/obj/string.o ../../core/obj/list.o -o bin/fsys/inram.fsys -shared -fPIC -lcrypto

fsysremote: fsysdyn/fsysremote.c ../../core/obj/buffered_string.o fsysdyn/fsysremote.d
	@echo "\033[34mCompile FSYSremote ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsysremote.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/fsys/remote.fsys -shared -fPIC -lcrypto

fsyssmb: fsysdyn/fsyssmb.c ../../core/obj/buffered_string.o fsysdyn/fsyssmb.d
	@echo "\033[34mCompile FSYSlocal ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsysdyn/fsyssmb.c ../../core/obj/buffered_string.o -o bin/fsys/smb.fsys -shared -fPIC -lsmbclient


#
#	LOGGERS
#

sql.ulogger: log/loggers/user_logger_sql.c ../../core/obj/buffered_string.o log/loggers/user_logger_sql.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  log/loggers/user_logger_sql.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/loggers/sql.ulogger -shared -fPIC -lcrypto

file.ulogger: log/loggers/user_logger_file.c ../../core/obj/buffered_string.o log/loggers/user_logger_file.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  log/loggers/user_logger_file.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/loggers/file.ulogger -shared -fPIC -lcrypto

#
#	SERVICES
#
	
apacheserv: servicesdyn/service_apache.c servicesdyn/service_apache.d
	@echo "\033[34mCompile apache.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_apache.c -o bin/services/apache.serv ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o  -lpthread

mysqlserv: servicesdyn/service_mysql.c servicesdyn/service_mysql.d
	@echo "\033[34mCompile mysql.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_mysql.c -o bin/services/mysql.serv ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o 
	
nodejsserv: servicesdyn/service_nodejs.c servicesdyn/service_nodejs.d
	@echo "\033[34mCompile nodejs.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_nodejs.c -o bin/services/nodejs.serv ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o 

mathserv: servicesdyn/service_math.c servicesdyn/service_math.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_math.c -o bin/services/math.serv $(MATHLIB) $(LFLAGS) ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o 

helloserv: servicesdyn/service_hello.c servicesdyn/service_hello.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_hello.c -o bin/services/hello.serv ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o 
	
phpserv: servicesdyn/service_php.c servicesdyn/service_php.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) servicesdyn/service_php.c -o bin/services/php.serv  ../../core/obj/thread_linux.o ../../core/obj/log.o ../../core/obj/library.o ../../core/obj/buffered_string.o

#build system

compile: $(OBJ_FILES) $(FSYS) $(MODS) $(LOGGERS) $(SERVICES)

release: $(OBJ_FILES) $(FSYS) $(MODS) $(LOGGERS) $(SERVICES)
	
clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -rf obj/* *.d*
	@rm -f fsysdyn/*.d* moduledyn/*.d* servicesdyn/*.d* log/*.d* log/loggers/*.d*
	@rm -rf bin/emod/*
	@rm -rf bin/fsys/*
	@rm -rf bin/loggers/*
	@rm -rf bin/services/*

install: setup
	@echo "\033[34mInstalling files\033[0m"
	cp -R bin/emod  $(FRIEND_PATH)/
	cp -R bin/fsys $(FRIEND_PATH)/
	cp -R bin/loggers $(FRIEND_PATH)/
	cp -R bin/services $(FRIEND_PATH)/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin bin/emod bin/fsys bin/loggers bin/services

test: ../../core/obj/buffered_string.o
	$(CC) $(CFLAGS) testlibrary.c ../../core/obj/library.o ../../core/obj/buffered_string.o -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) moduledyn/phpmod.d moduledyn/sysmod.d moduledyn/nodejsmod.d fsys/fsyslocal.d fsys/fsysssh2.d fsys/fsysphp.d fsys/fsysnode.d log/loggers/user_logger_sql.d
