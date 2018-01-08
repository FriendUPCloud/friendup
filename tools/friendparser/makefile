friendparser: obj main.o friendstring.o
	gcc -o ../../friendparser obj/main.o obj/friendstring.o

main.o: main.c main.h friendstring.h headers.txt
	gcc -c main.c -o obj/main.o

friendstring.o: friendstring.c friendstring.h
	gcc -c friendstring.c -o obj/friendstring.o

obj:
	mkdir obj

