-include ../../Config.defs

CC			=	gcc
OUTPUT		=	bin/notifications.library
CFLAGS		=	$(GLOBAL_CFLAGS) -I../../$(LIBWS_INCLUDE_DIR) -I../../core/ -fPIC -I../../libs/ -I../../libs/properties/ -I../../libs/application/ -I../../core/system/ -I../../
LFLAGS		=	-shared -fPIC -Wl,--no-as-needed -lz -lpthread -lrt -lcrypt -lssl $(shell mysql_config --libs)
FPATH		=	$(shell pwd)

#CFLAGS	=	--std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -Ofast -funroll-loops -I. -Wno-unused -I../../core/ -fPIC 

ifeq ($(DEBUG),1)
CFLAGS  +=      -D__DEBUG
endif

C_FILES := $(wildcard notifications.c)
OBJ_FILES := $(addprefix obj/,$(notdir $(C_FILES:.c=.o)))

ALL:	$(OBJ_FILES) $(OUTPUT)


$(OUTPUT): $(OBJ_FILES)
	@echo "\033[34mLinking ...\033[0m"
	$(CC) -o $(OUTPUT) $(OBJ_FILES) $(LFLAGS)

obj/%.o: %.c *h
	@echo "\033[34mCompile ...\033[0m"
	$(CC) $(CFLAGS) -c -o $@ $<

install:
	@echo "\033[34mInstalling library\033[0m"
	cp $(OUTPUT) $(FRIEND_PATH)/libs/

clean:
	@echo "\033[34mCleaning\033[0m"
	@rm obj/*o $(OUTPUT)
	@rm -fr obj/*

setup:
	@echo "\033[34mPrepare enviroment\033[0m"
	mkdir -p obj bin
	
test:
	$(CC) $(CFLAGS) testlibrary.c ../../core/library.c -obin/TestLibrary -ldl -D__DEBUG -L/usr/lib/x86_64-linux-gnu/ -lmysqld

dep: $(C_FILES)
	$(CC) $(DFLAGS) -o $^ -o $(FPATH)/$@.d

-include $(C_FILES:%.c=%.d)

