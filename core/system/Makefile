GCC		=	gcc
OUTPUT	=	bin/libfcsystem.a
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Os -I. -I../../core/ -I../properties/ -I/usr/include/mysql/ -fPIC -I../ -I../../libs/ -I../../../libs/ -Wno-unused-variable -Wno-unused-parameter `pkg-config --cflags --libs MagickWand`
LFLAGS	=	-shared -fPIC -L/usr/lib/x86_64-linux-gnu/ 
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)
MODS	=	phpmod sysmod nodejsmod pythonmod javamod
FSYS		=	fsyslocal fsysssh2 fsysphp


ifeq ($(DEBUG),1)
CFLAGS	+=	-D__DEBUG
endif

C_FILES := $(wildcard  )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT) $(FSYS) $(MODS) 


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"

#
#	EXECUTE MODULES
#
	
phpmod: moduledyn/phpmod.c moduledyn/phpmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I.  moduledyn/phpmod.c -o bin/emod/php.emod -shared -fPIC

pythonmod: moduledyn/pythonmod.c moduledyn/pythonmod.d
	@echo "\033[34mCompile php.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I.  moduledyn/pythonmod.c -o bin/emod/python.emod -shared -fPIC
	
javamod: moduledyn/javamod.c moduledyn/javamod.d
	@echo "\033[34mCompile java.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I.  moduledyn/javamod.c -o bin/emod/java.emod -shared -fPIC

sysmod: moduledyn/sysmod.c moduledyn/sysmod.d
	@echo "\033[34mCompile sys.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I.  moduledyn/sysmod.c -o bin/emod/sys.emod -shared -fPIC

nodejsmod: moduledyn/nodejsmod.c moduledyn/nodejsmod.d
	@echo "\033[34mCompile nodejs.emod ...\033[0m"
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I.  moduledyn/nodejsmod.c -o bin/emod/nodejs.emod -shared -fPIC
	
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
	$(GCC) $(CFLAGS) --std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -I../../core/  fsys/fsysphp.c ../../core/obj/buffered_string.o  ../../core/obj/string.o -o bin/fsys/php.fsys -shared -fPIC
	
#build system

compile: $(TARGET) $(MODS) $(FSYS)

release: $(TARGET) $(MODS) $(FSYS)
	
clean:
	@echo "\033[34mCleaning\033[0m"
	@rm -rf obj/* $(OUTPUT) *.d
	@rm -f fsys/*.d moduledyn/*.d
	@rm -rf bin/emod/*
	@rm -rf bin/fsys/*

install:
	@echo "\033[34mInstalling files\033[0m"
	#cp bin/system.library ../../build/libs/
	cp -R bin/emod ../../build/
	cp -R bin/fsys ../../build/

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin bin/emod bin/fsys

test: ../../core/obj/buffered_string.o
	$(GCC) $(CFLAGS) testlibrary.c ../../core/obj/library.o ../../core/obj/buffered_string.o -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d) moduledyn/phpmod.d moduledyn/sysmod.d moduledyn/nodejsmod.d fsys/fsyslocal.d fsys/fsysssh2.d fsys/fsysphp.d

