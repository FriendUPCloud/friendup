/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
#include "buffered_string.h"
#include <util/log/log.h>
#include <sys/time.h>

/* This is a very basic test code to benchmark buffer size increment speculation.
 *
 * Run it by simply placing at the very beginning of main.c:
 *
 *             extern void buffered_string_benchmark(void);
 *             buffered_string_benchmark();
 *
 * Results from Artur's HP laptop:
 *
 * Original code - 1100ms per iteration.
 * Improved code with size speculation - 80ms per iteration.
 *
 */

//https://www.gnu.org/software/libc/manual/html_node/Elapsed-Time.html
/* Subtract the ‘struct timeval’ values X and Y, storing the result in RESULT.
   Return 1 if the difference is negative, otherwise 0. */
int timeval_subtract (struct timeval *result, struct timeval *x, struct timeval *y){
  /* Perform the carry for the later subtraction by updating y. */
  if (x->tv_usec < y->tv_usec) {
    int nsec = (y->tv_usec - x->tv_usec) / 1000000 + 1;
    y->tv_usec -= 1000000 * nsec;
    y->tv_sec += nsec;
  }
  if (x->tv_usec - y->tv_usec > 1000000) {
    int nsec = (x->tv_usec - y->tv_usec) / 1000000;
    y->tv_usec += 1000000 * nsec;
    y->tv_sec -= nsec;
  }

  /* Compute the time remaining to wait. tv_usec is certainly positive. */
  result->tv_sec = x->tv_sec - y->tv_sec;
  result->tv_usec = x->tv_usec - y->tv_usec;

  /* Return 1 if result is negative. */
  return x->tv_sec < y->tv_sec;
}

void buffered_string_benchmark(void){

	//basic test to see if BufStringAdd is working at all, should print out <123456abcdefg>
	BufString *a = BufStringNewSize(10/*initial size*/);
	BufStringAdd(a, "123456");
	BufStringAdd(a, "abcdefg");
	DEBUG("Test <%s>\n", a->bs_Buffer);


	for (unsigned int i = 0; i < 25; i++){

		struct timeval start_time, end_time;
		gettimeofday(&start_time, NULL);

		BufString *b = BufStringNewSize(10/*initial size*/);

		for (unsigned int j = 0; j < 100000000; j++){
			BufStringAdd(b, "123456790");
		}
//		DEBUG("Total buffer size %d", b->bs_Size);

		gettimeofday(&end_time, NULL);

		struct timeval duration;
		timeval_subtract(&duration, &end_time, &start_time);

		DEBUG("Iteration %d execution time %ld.%04lds\n", i, duration.tv_sec, duration.tv_usec/1000);

		BufStringDelete(b);

	}
	exit(1);
}
