
-include ../Makefile.defs

CC				=	gcc
CPP				=	g++
OUTPUT			=	bin/FriendCore

CFLAGS			=	$(GLOBAL_CFLAGS) -I. -I../libs/ -I../$(LIBWS_INCLUDE_DIR) $(shell mysql_config --cflags) -I$(LIBXML2_INCLUDE_DIR)
LFLAGS			=	../$(LIBWS_LIB_DIR)/libwebsockets.a -Lsystem/bin/ -lcrypto -lm -lpthread -ldl -lssh -lrt -lssh_threads -lssl -lmagic -lxml2 `mysql_config --libs` -lpng -lz
DFLAGS			=	-M $(CFLAGS)  
FPATH			=	$(shell pwd)

ifeq ($(DEBUG),1)
CFLAGS  +=      -D__DEBUG
endif

ifeq ($(PROFILE),1)
CFLAGS  +=	-pg -DPROFILE=1
endif

ifeq ($(WEBSOCKETS_THREADS),1)
CFLAGS	+=	-DENABLE_WEBSOCKETS_THREADS=1
endif

ifeq ($(USE_SELECT),1)
CFLAGS  +=      -DUSE_SELECT
endif

ifeq ($(NO_VALGRIND),1)
CFLAGS  +=      -DNO_VALGRIND_STUFF
endif

ifeq ($(CYGWIN_BUILD),1)
CFLAGS  +=      -DCYGWIN_BUILD
LFLAGS	+=		-Wl,--export-dynamic,--heap,200000000,--stack,8000000
else
LFLAGS	+=		-Wl,--export-dynamic
endif

C_FILES := $(wildcard main.c core/*.c system/cache/*.c network/*.c system/services/*.c util/*.c class/*.c ssh/*.c hardware/*.c system/*.c \
			system/dictionary/*.c system/module/*.c system/fsys/*.c system/json/*.c system/user/*.c util/log/*.c system/inram/*.c system/invar/*.c system/application/*.c system/auth/*.c \
			hardware/usb/*.c hardware/printer/*.c system/datatypes/images/*.c system/log/*.c system/admin/*.c communication/*.c system/autotask/*.c system/token/*.c \
			websockets/*.c security/*.c webdav/*.c system/connection/*.c mobile_app/*.c mutex/*.c system/usa/*.c )
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)
	make -C system DEBUG=$(DEBUG) NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD)

$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
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
	
# build/install

compile: $(OBJ_FILES) $(OUTPUT)
	@echo "\033[34mDebug compilation\033[0m"
	make -C system compile DEBUG=1 NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD)

compileprof: $(OBJ_FILES) $(OUTPUT)
	@echo "\033[34mDebug compilation\033[0m"
	make -C system compile PROFILE=1 DEBUG=1 NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD)

release:  $(OBJ_FILES) $(OUTPUT)
	@echo "\033[34mRelease compilation\033[0m"
	make -C system release DEBUG=0  NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD)
	
clean:
	@echo "\033[34mCleaning\033[0m"
	rm -f $(C_FILES:%.c=%.d*)
	rm -f $(CPP_FILES:%.cpp=%.d*)
	@rm -f obj/*o $(OUTPUT)
	@rm -fr obj/*
	@rm -f *.d*
	@rm -f $(C_FILES:%.c=%.d)
	make -C system clean NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD)
	
install:
	@echo "\033[34mInstalling\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/
	make -C system install FRIEND_PATH=$(FRIEND_PATH)

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin
	make -C system setup NO_VALGRIND=$(NO_VALGRIND) USE_SELECT=$(USE_SELECT) CYGWIN_BUILD=$(CYGWIN_BUILD) FRIEND_PATH=$(FRIEND_PATH)

# dependency system
	
%.d: %.c
	@set -e; rm -f $@; \
	$(CC) -M $(CFLAGS)  $< > $@.$$$$; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
	rm -f $@.$$$$

-include $(C_FILES:%.c=%.d)



