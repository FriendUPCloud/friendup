
-include ../Config.defs
-include ../Config

CC			=	gcc
CPP			=	g++
OUTPUT			=	bin/FriendCore

#`mysql_config --libs`
#MYSQLLIBSREQ		=	-lmysqlclient -lpthread -lz -lm -lrt -latomic -lssl -lcrypto -ldl
MYSQLLIBSREQ		=	-lmysqlclient -lpthread -lz -lm -lrt -latomic 
CFLAGS			=	$(GLOBAL_CFLAGS) -I../libs/ -I../$(LIBWS_INCLUDE_DIR) -I. $(shell mysql_config --cflags) -I../$(LIBXML2_INCLUDE_DIR) -I$(SAMBA_INCLUDE_DIR)  -I../$(LIBSSH2_INCLUDE_DIR)
LFLAGS			=	
DFLAGS			=	-M $(CFLAGS)  
FPATH			=	$(shell pwd)

MODS			=	phpmod sysmod nodejsmod pythonmod javamod
FSYS			=	fsyslocal fsysssh2 fsysphp fsysnode fsysinram fsysremote fsyssmb
LOGGERS			=	sql.ulogger file.ulogger
SERVICES		=	apacheserv mysqlserv nodejsserv phpserv

SERVICEFLAGS		=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -Ofast -funroll-loops -I. -Wno-unused  -shared -fPIC
MATHLIB			=

GLOBAL_CFLAGS		+=	-DMOD_TIMEOUT=$(MOD_TIMEOUT) -DFILESYSTEM_MOD_TIMEOUT=$(FILESYSTEM_MOD_TIMEOUT) -DMOD_NUMBER_TRIES=$(MOD_NUMBER_TRIES) -DMUTEX_TIMEOUT_NUMBER_TRIES=$(MUTEX_TIMEOUT_NUMBER_TRIES) 

# we have to include Sanitizer lib before others
ifeq ($(USE_SANITIZER),1)
LFLAGS					+=	-lasan
endif

LFLAGS					+=	../$(LIBWS_LIB_DIR)/libwebsockets.a -Lsystem/bin/ -lm -lrt -lmagic -lxml2 $(MYSQLLIBSREQ) -lgd -lpng -lz -ljpeg -luv

ifeq ($(USE_MEMCHECK),1)
LFLAGS					+=	-lmcheck
endif

ifeq ($(OPENSSL_INTERNAL),1)
CFLAGS					+=	-I../libs-ext/openssl/include/
LFLAGS					+=	../libs-ext/openssl/libssl.a ../libs-ext/openssl/libcrypto.a -ldl -lpthread
else
LFLAGS					+=	-lssl -lcrypto -ldl -lpthread
endif

ifeq ($(LINK_LIB_STDCPP),1)
LFLAGS					+=	-lstdc++
endif

ifeq ($(USE_SSH_THREADS_LIB),1)
LFLAGS					+=      -lssh_threads
endif

ifeq ($(ENABLE_SSH),1)
LFLAGS					+=	-lssh
endif

ifeq ($(DEBUG),1)
CFLAGS					+=	-D__DEBUG -O0 -g
else
CFLAGS					+=	-O2
endif

ifeq ($(PERF_MEAS),1)
CFLAGS					+=	-D__PERF_MEAS
endif

ifeq ($(PROFILE),1)
CFLAGS 					+=	-pg -DPROFILE=1
endif

ifeq ($(WEBSOCKETS_THREADS),1)
CFLAGS					+=	-DENABLE_WEBSOCKETS_THREADS=1
endif

ifeq ($(USE_SELECT),1)
CFLAGS					+=	-DUSE_SELECT
endif

ifeq ($(NO_VALGRIND),1)
CFLAGS					+=	-DNO_VALGRIND_STUFF
endif

ifeq ($(CYGWIN_BUILD),1)
CFLAGS					+=	-DCYGWIN_BUILD
LFLAGS					+=	-Wl,--export-dynamic,--heap,200000000,--stack,8000000
else
LFLAGS					+=	-Wl,--export-dynamic
endif

ifeq ($(LINK_STDCPP),1)
LFLAGS					+=	-lstdc++
endif

ifeq ($(ENABLE_SSH),1)
CFLAGS					+=	-DENABLE_SSH
endif

C_FILES := $(wildcard main.c core/*.c system/cache/*.c network/*.c system/services/*.c util/*.c class/*.c ssh/*.c hardware/*.c system/*.c \
			system/dictionary/*.c system/module/*.c system/fsys/*.c system/json/*.c system/user/*.c util/log/*.c system/inram/*.c system/invar/*.c system/application/*.c system/auth/*.c \
			hardware/usb/*.c hardware/printer/*.c system/datatypes/images/*.c system/log/*.c system/admin/*.c communication/*.c system/autotask/*.c system/token/*.c \
			websockets/*.c security/*.c webdav/*.c system/connection/*.c mobile_app/*.c mutex/*.c system/usa/*.c system/mobile/*.c system/calendar/*.c config/*.c system/notification/*.c system/usergroup/*.c system/permission/*.c system/roles/*.c system/security/*.c system/service/*.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT) $(MODS) $(FSYS) $(LOGGERS) $(SERVICES)

#
#	FILESYSTEMS
#

fsyslocal: system/fsysdyn/fsyslocal.c obj/buffered_string.o system/fsysdyn/fsyslocal.d
	@echo "\033[34mCompile FSYSlocal ...\033[0m"
	@echo "$(LIBSSH2_INCLUDE_DIR)<<<"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -Isystem/ -I../core/ system/fsysdyn/fsyslocal.c obj/buffered_string.o -o system/bin/fsys/local.fsys -shared -fPIC

fsysssh2: system/fsysdyn/fsysssh2.c ../core/obj/buffered_string.o system/fsysdyn/fsysssh2.d
	@echo "\033[34mCompile FSYSssh2 ...\033[0m"
	$(CC) $(CFLAGS) -D__DEBUG -I. -I../core/ -Iproperties/ -I/usr/include/mysql/ -Isystem/ -I../libs/ -I../$(LIBWS_INCLUDE_DIR) -I../$(LIBSSH2_INCLUDE_DIR) -I$(SAMBA_INCLUDE_DIR) -fPIC --std=c11 -Wall -Wno-unused-variable -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/ system/fsysdyn/fsysssh2.c ../core/obj/buffered_string.o -o system/bin/fsys/ssh2.fsys -shared -I ../$(LIBSSH2_INCLUDE_DIR)/ ../$(LIBSSH2_LIB_DIR)libssh2.a -lssl -lgcrypt

fsysphp: system/fsysdyn/fsysphp.c ../core/obj/buffered_string.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/newpopen.o ../core/obj/list.o system/fsysdyn/fsysphp.d
	@echo "\033[34mCompile FSYSphp ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/  system/fsysdyn/fsysphp.c ../core/obj/buffered_string.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o -o system/bin/fsys/php.fsys -shared -fPIC -lcrypto

fsysnode: system/fsysdyn/fsysnode.c ../core/obj/buffered_string.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o system/fsysdyn/fsysnode.d
	@echo "\033[34mCompile FSYSnode ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/  system/fsysdyn/fsysnode.c ../core/obj/buffered_string.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o -o system/bin/fsys/node.fsys -shared -fPIC -lcrypto

fsysinram: system/fsysdyn/fsysinram.c ../core/obj/buffered_string.o ../core/obj/inramfs.o ../core/obj/string.o ../core/obj/list.o system/fsysdyn/fsysinram.d
	@echo "\033[34mCompile FSYSinram ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/  system/fsysdyn/fsysinram.c ../core/obj/buffered_string.o ../core/obj/inramfs.o ../core/obj/string.o ../core/obj/list.o -o system/bin/fsys/inram.fsys -shared -fPIC -lcrypto

fsysremote: system/fsysdyn/fsysremote.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o system/fsysdyn/fsysremote.d
	@echo "\033[34mCompile FSYSremote ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/  system/fsysdyn/fsysremote.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o -o system/bin/fsys/remote.fsys -shared -fPIC -lcrypto

fsyssmb: system/fsysdyn/fsyssmb.c ../core/obj/buffered_string.o system/fsysdyn/fsyssmb.d
	@echo "\033[34mCompile FSYSlocal ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/ system/fsysdyn/fsyssmb.c ../core/obj/buffered_string.o -o system/bin/fsys/smb.fsys -shared -fPIC -lsmbclient

#
#	EXECUTE MODULES
#

phpmod: system/moduledyn/phpmod.c ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/newpopen.o ../core/obj/library.o system/moduledyn/phpmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -Isystem ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o system/moduledyn/phpmod.c -o system/bin/emod/php.emod -shared -fPIC -lcrypto

pythonmod: system/moduledyn/pythonmod.c ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o system/moduledyn/pythonmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -Isystem  system/moduledyn/pythonmod.c ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o -o system/bin/emod/python.emod -shared -fPIC -lcrypto
	
javamod: system/moduledyn/javamod.c ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o system/moduledyn/javamod.d
	@echo "\033[34mCompile java.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -Isystem ../core/obj/log.o ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o  system/moduledyn/javamod.c -o system/bin/emod/java.emod -shared -fPIC -lcrypto

sysmod: system/moduledyn/sysmod.c ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o system/moduledyn/sysmod.d
	@echo "\033[34mCompile sys.emod ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -Isystem system/moduledyn/sysmod.c ../core/obj/string.o ../core/obj/list.o ../core/obj/list_string.o -o system/bin/emod/sys.emod -shared -fPIC -lcrypto

nodejsmod: system/moduledyn/nodejsmod.c ../core/obj/log.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o system/moduledyn/nodejsmod.d
	@echo "\033[34mCompile nodejs.emod ...\033[0m"
	$(CC) $(CFLAGS) -fPIC --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -Isystem system/moduledyn/nodejsmod.c ../core/obj/log.o ../core/obj/list.o ../core/obj/list_string.o ../core/obj/library.o -o system/bin/emod/nodejs.emod -shared -fPIC -lcrypto

#
#	LOGGERS
#

sql.ulogger: system/log/loggers/user_logger_sql.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o system/log/loggers/user_logger_sql.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/  system/log/loggers/user_logger_sql.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o -o system/bin/loggers/sql.ulogger -shared -fPIC -lcrypto

file.ulogger: system/log/loggers/user_logger_file.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o system/log/loggers/user_logger_file.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(CC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../core/ system/log/loggers/user_logger_file.c ../core/obj/buffered_string.o ../core/obj/library.o ../core/obj/log.o ../core/obj/string.o ../core/obj/list_string.o ../core/obj/list.o ../core/obj/comm_msg.o ../core/obj/jsmn.o -o system/bin/loggers/file.ulogger -shared -fPIC -lcrypto

#
#	SERVICES
#

apacheserv: system/servicesdyn/service_apache.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o system/servicesdyn/service_apache.d
	@echo "\033[34mCompile apache.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_apache.c -o system/bin/services/apache.serv ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o  -lpthread

mysqlserv: system/servicesdyn/service_mysql.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o system/servicesdyn/service_mysql.d
	@echo "\033[34mCompile mysql.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_mysql.c -o system/bin/services/mysql.serv ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o 
	
nodejsserv: system/servicesdyn/service_nodejs.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o system/servicesdyn/service_nodejs.d
	@echo "\033[34mCompile nodejs.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_nodejs.c -o system/bin/services/nodejs.serv ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o 

mathserv: system/servicesdyn/service_math.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o  system/servicesdyn/service_math.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_math.c -o system/bin/services/math.serv $(MATHLIB) $(LFLAGS) ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o 

helloserv: system/servicesdyn/service_hello.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o system/servicesdyn/service_hello.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_hello.c -o system/bin/services/hello.serv ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o 
	
phpserv: system/servicesdyn/service_php.c ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o ../core/obj/buffered_string.o system/servicesdyn/service_php.d
	@echo "\033[34mCompile math.serv ...\033[0m"
	$(CC) $(CFLAGS) $(SERVICEFLAGS) system/servicesdyn/service_php.c -o system/bin/services/php.serv ../core/obj/thread_linux.o ../core/obj/log.o ../core/obj/library.o ../core/obj/buffered_string.o

#
#	Main code
#

$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	#@echo "\n\n\n\n %(LFLAGS) \n\n\n\"
	$(CC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS)

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: core/%.c core/*.h core/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/cache/%.c system/cache/*.h system/cache/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: network/%.c network/*.h network/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/services/%.c system/services/*.h system/services/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/service/%.c system/service/*.h system/service/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: communication/%.c communication/*.h communication/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: util/%.c util/*.h util/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: class/%.c class/*.h class/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: ssh/%.c ssh/*.h ssh/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: hardware/%.c hardware/*.h hardware/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/%.c system/%.h system/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/dictionary/%.c system/dictionary/*.h system/dictionary/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/fsys/%.c system/fsys/*.h system/fsys/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/module/%.c system/module/*.h system/module/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: util/log/%.c util/log/*.h util/log/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/json/%.c system/json/*.h system/json/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/user/%.c system/user/*.h system/user/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/usergroup/%.c system/usergroup/*.h system/usergroup/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/inram/%.c system/inram/*.h system/inram/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/invar/%.c system/invar/*.h system/invar/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/application/%.c system/application/*.h system/application/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/auth/%.c system/auth/*.h system/auth/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: hardware/usb/%.c hardware/usb/*.h hardware/usb/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: hardware/printer/%.c hardware/printer/*.h hardware/printer/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/datatypes/images/%.c system/datatypes/images/*.h system/datatypes/images/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/log/%.c system/log/*.h system/log/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/admin/%.c system/admin/*.h system/admin/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/connection/%.c system/connection/*.h system/connection/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/autotask/%.c system/autotask/*.h system/autotask/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: websockets/%.c websockets/*.h websockets/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: security/%.c security/*.h security/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: webdav/%.c webdav/*.h webdav/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: mobile_app/%.c mobile_app/*.h mobile_app/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/token/%.c system/token/*.h system/token/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: mutex/%.c mutex/*.h mutex/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/usa/%.c system/usa/*.h system/usa/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/mobile/%.c system/mobile/*.h system/mobile/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/calendar/%.c system/calendar/*.h system/calendar/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: config/%.c config/*.h config/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/notification/%.c system/notification/*.h system/notification/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/permission/%.c system/permission/*.h system/permission/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/roles/%.c system/roles/*.h system/roles/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/security/%.c system/security/*.h system/security/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<
	
# build/install

compile: $(OBJ_FILES) $(OUTPUT) $(MODS) $(FSYS) $(LOGGERS) $(SERVICES)
	@echo "\033[34mDebug compilation\033[0m"

compileprof: $(OBJ_FILES) $(OUTPUT) $(MODS) $(FSYS) $(LOGGERS) $(SERVICES)
	@echo "\033[34mDebug compilation\033[0m"

release: $(OBJ_FILES) $(OUTPUT) $(MODS) $(FSYS) $(LOGGERS) $(SERVICES)
	@echo "\033[34mRelease compilation\033[0m"

UNITTESTSRC = $(wildcard unittests/*.c)
UNITTESTOBJ = $(addprefix unittests/bin/,$(notdir $(UNITTESTSRC:.c=.ut.bin)))
LUNITFLAGS			=	../$(LIBWS_LIB_DIR)/libwebsockets.a $(LFLAGS)

.PHONY: FORCE

PREPAREUT:
	@echo "\033[34mPrepareing unit tests\033[0m"
	cp obj/* unittests/obj
	$(CC) $(CFLAGS) -c unittests/main/main.c -o unittests/obj/main.o

$(UNITTESTOBJ): $(UNITTESTSRC)
	@echo "\033[34mCompile unit tests\033[0m"
	$(CC) $(CFLAGS) -o $@ $< unittests/obj/*.o $(LUNITFLAGS)
	cp $@ $(FRIEND_PATH)/

unittest: $(OBJ_FILES) $(OUTPUT) $(MODS) $(FSYS) $(LOGGERS) $(SERVICES)
	make PREPAREUT $(UNITTESTOBJ)

clean:
	@echo "\033[34mCleaning\033[0m"
	rm -f $(C_FILES:%.c=%.d*)
	rm -f $(CPP_FILES:%.cpp=%.d*)
	@rm -f obj/*o $(OUTPUT)
	@rm -fr obj/*
	@rm -f *.d*
	@rm -f $(C_FILES:%.c=%.d)
	@rm -rf system/obj/* system/*.d*
	@rm -f system/fsysdyn/*.d* system/moduledyn/*.d* system/servicesdyn/*.d* system/log/*.d* system/log/loggers/*.d* system/user/*.d system/usergroup/*.d
	@rm -rf system/bin/emod/*
	@rm -rf system/bin/fsys/*
	@rm -rf system/bin/loggers/*
	@rm -rf system/bin/services/*

install:
	@echo "\033[34mInstalling\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/
	cp -R system/bin/emod  $(FRIEND_PATH)/
	cp -R system/bin/fsys $(FRIEND_PATH)/
	cp -R system/bin/loggers $(FRIEND_PATH)/
	cp -R system/bin/services $(FRIEND_PATH)/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin
	mkdir -p obj system/bin system/bin/emod system/bin/fsys system/bin/loggers system/bin/services
	mkdir -p unittests/obj unittests/bin

# dependency system

%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) system/moduledyn/*.d system/fsysdyn/*.d system/log/loggers/*.d system/servicesdyn/*.d


