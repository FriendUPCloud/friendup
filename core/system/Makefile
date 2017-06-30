GCC		=	gcc
OUTPUT	=	bin/libfcsystem.a
CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -I../../core/ -I../properties/ -I/usr/include/mysql/ -fPIC -I../ -I../../libs/ -I../../../libs/  -I../../libs-ext/libwebsockets/lib/ -I../../libs-ext/libwebsockets/ -Wno-unused-variable -Wno-unused-parameter `pkg-config --cflags --libs MagickWand`
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ 
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
MODS	=	phpmod sysmod nodejsmod pythonmod javamod
FSYS		=	fsyslocal fsysssh2 fsysphp fsysinram fsysremote
LOGGERS	=	sql.ulogger file.ulogger

ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
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

ALL:	$(OBJ_FILES) $(OUTPUT) $(FSYS) $(MODS) $(LOGGERS)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"

#
#	EXECUTE MODULES
#
	
phpmod: moduledyn/phpmod.c moduledyn/phpmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o moduledyn/phpmod.c -o bin/emod/php.emod -shared -fPIC -lcrypto

pythonmod: moduledyn/pythonmod.c moduledyn/pythonmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/pythonmod.c  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o -o bin/emod/python.emod -shared -fPIC -lcrypto
	
javamod: moduledyn/javamod.c moduledyn/javamod.d
	@echo "\033[34mCompile java.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o  moduledyn/javamod.c -o bin/emod/java.emod -shared -fPIC -lcrypto

sysmod: moduledyn/sysmod.c moduledyn/sysmod.d
	@echo "\033[34mCompile sys.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/sysmod.c ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o -o bin/emod/sys.emod -shared -fPIC -lcrypto

nodejsmod: moduledyn/nodejsmod.c moduledyn/nodejsmod.d
	@echo "\033[34mCompile nodejs.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I.  moduledyn/nodejsmod.c  ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list.o ../../core/obj/list_string.o ../../core/obj/library.o  -o bin/emod/nodejs.emod -shared -fPIC -lcrypto
	
#
#	FILESYSTEMS
#
	
fsyslocal: fsys/fsyslocal.c ../../core/obj/buffered_string.o fsys/fsyslocal.d
	@echo "\033[34mCompile FSYSlocal ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsyslocal.c ../../core/obj/buffered_string.o -o bin/fsys/local.fsys -shared -fPIC

fsysssh2: fsys/fsysssh2.c ../../core/obj/buffered_string.o fsys/fsysssh2.d
	@echo "\033[34mCompile FSYSssh2 ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsysssh2.c ../../core/obj/buffered_string.o -o bin/fsys/ssh2.fsys -shared -fPIC -lssh2

fsysphp: fsys/fsysphp.c  ../../core/obj/buffered_string.o fsys/fsysphp.d
	@echo "\033[34mCompile FSYSphp ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsysphp.c ../../core/obj/buffered_string.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o -o bin/fsys/php.fsys -shared -fPIC -lcrypto

fsysinram: fsys/fsysinram.c ../../core/obj/buffered_string.o fsys/fsysinram.d
	@echo "\033[34mCompile FSYSinram ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsysinram.c ../../core/obj/buffered_string.o ../../core/obj/inramfs.o ../../core/obj/string.o ../../core/obj/list.o -o bin/fsys/inram.fsys -shared -fPIC -lcrypto

fsysremote: fsys/fsysremote.c ../../core/obj/buffered_string.o fsys/fsysremote.d
	@echo "\033[34mCompile FSYSremote ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsysremote.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/fsys/remote.fsys -shared -fPIC -lcrypto

#
#	LOGGERS
#

sql.ulogger: log/loggers/user_logger_sql.c ../../core/obj/buffered_string.o log/loggers/user_logger_sql.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  log/loggers/user_logger_sql.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/loggers/sql.ulogger -shared -fPIC -lcrypto

file.ulogger: log/loggers/user_logger_file.c ../../core/obj/buffered_string.o log/loggers/user_logger_file.d
	@echo "\033[34mCompile SQL logger ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  log/loggers/user_logger_file.c ../../core/obj/buffered_string.o ../../core/obj/library.o ../../core/obj/log.o ../../core/obj/string.o ../../core/obj/list_string.o ../../core/obj/list.o ../../core/obj/comm_msg.o ../../core/obj/jsmn.o -o bin/loggers/file.ulogger -shared -fPIC -lcrypto
	

#build system

compile: $(TARGET) $(MODS) $(FSYS)

release: $(TARGET) $(MODS) $(FSYS)
	
clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -rf obj/* $(OUTPUT) *.d*
	@rm -f fsys/*.d moduledyn/*.d*
	@rm -rf bin/emod/*
	@rm -rf bin/fsys/*
	@rm -rf bin/loggers/*

install: setup
	@echo "\033[34mInstalling files\033[0m"
	#cp bin/system.library ../../build/libs/
	cp -R bin/emod ../../build/
	cp -R bin/fsys ../../build/
	cp -R bin/loggers ../../build/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin bin/emod bin/fsys bin/loggers

test: ../../core/obj/buffered_string.o
	$(GCC) $(CFLAGS) testlibrary.c ../../core/obj/library.o ../../core/obj/buffered_string.o -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) moduledyn/phpmod.d moduledyn/sysmod.d moduledyn/nodejsmod.d fsys/fsyslocal.d fsys/fsysssh2.d fsys/fsysphp.d log/loggers/user_logger_sql.d

