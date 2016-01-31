GCC		=	gcc
OUTPUT	=	FriendCore
CFLAGS	=	--std=c11 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Os -fPIC -I. -Wno-unused -Wno-unused-parameter -I../libs/  $(shell mysql_config --cflags)  -D__USE_POSIX -DENABLE_SSH -DENABLE_SSL
LFLAGS	=	-Lsystem/bin/ -Wl,--export-dynamic -lcrypto -lm -lpthread -ldl -lssh -lrt -lssh_threads -lssl -lmagic
DFLAGS	=	-M $(CFLAGS)  
FPATH	=	$(shell pwd)

ifeq ($(WEBSOCKETS),1)
LFLAGS +) -lwebsockets
endif

ifeq ($(WEBSOCKETS),1)
LFLAGS +) -lwebsockets
endif

ifeq ($(WEBSOCKETS),1)
CFLAGS	+=	-DWEBSOCKETS
endif

C_FILES := $(wildcard main.c core/*.c system/cache/*.c network/*.c services/*.c util/*.c class/*.c service/*.c ssh/*.c hardware/*.c system/*.c \
			system/dictionary/*.c system/module/*.c system/handler/*.c system/json/*.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)
	make -C service/services  DEBUG=$(DEBUG)
	make -C system DEBUG=$(DEBUG)

$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(GCC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS)

obj/%.o: %.c *.h %.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: core/%.c core/*.h core/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/cache/%.c system/cache/*.h system/cache/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: network/%.c network/*.h network/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: services/%.c services/*.h services/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: util/%.c util/*.h util/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: class/%.c class/*.h class/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: service/%.c service/*.h service/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: ssh/%.c ssh/*.h ssh/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: hardware/%.c hardware/*.h hardware/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<
	
obj/%.o: system/%.c system/%.h system/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/dictionary/%.c system/dictionary/*.h system/dictionary/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/handler/%.c system/handler/*.h system/handler/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/module/%.c system/module/*.h system/module/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

obj/%.o: system/json/%.c system/json/*.h system/json/%.d
	@echo "\033[34mCompile ...\033[0m"
	$(GCC) $(CFLAGS) -c -o $@ $<

# build/install

compile: $(OBJ_FILES)  $(TARGET)
	@echo "\033[34mDebug compilation\033[0m"
	make -C system compile DEBUG=1

release:  $(OBJ_FILES)  $(TARGET)
	@echo "\033[34mRelease compilation\033[0m"
	make -C system release DEBUG=0
	
clean:
	@echo "\033[34mCleaning\033[0m"
	rm -f $(C_FILES:%.c=%.d)
	@rm -f obj/*o $(OUTPUT)
	@rm -fr obj/*
	@rm -f *.d
	make -C service/services clean
	make -C system clean
	
install:
	@echo "\033[34mInstalling\033[0m"
	cp $(OUTPUT) ../build/ 
	make -C service/services install
	make -C system install

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin
	make -C service/services setup
	make -C system setup
	
version:
	@echo "\033[34mGenerate version\033[0m"
	echo -n "#ifndef FRIENDCORE_VERSION\n" > version.h
	echo -n "#define FRIENDCORE_VERSION \"" >> version.h
	git show | grep Merge: >>version.h
	echo -n " \" " >>version.h
	echo "#endif\n" >> version.h

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(GCC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d)
