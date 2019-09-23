CC=gcc
CFLAGS=-O -DHAVE_AES --std=c99 -Wall -W -D_FILE_OFFSET_BITS=64 -g -O0 -I. -Wno-unused -I../../../core/ -fPIC
OBJS=aescrypt.o aeskey.o aestab.o entropy.o fileenc.o hmac.o prng.o pwd2key.o sha1.o
ARFLAGS=rv

.c.o:
	$(CC) -c $(CFLAGS) $*.c

libaes.a: $(OBJS)
	$(ECHO) $(AR) $(ARFLAGS) libaes.a $?
#	$(AR) $(ARFLAGS) libaes.a $?
#	$(RANLIB) libaes.a

all: libaes.a

.PHONY: clean

clean:
	rm -rf *.o *.a
