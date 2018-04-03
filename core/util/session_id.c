/*******************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/
#include <core/types.h>
#include "session_id.h"
#include <openssl/sha.h>
#include <sys/types.h>
#include <unistd.h>
#include <stdio.h>

//fix for ancient glibc....
//https://stackoverflow.com/a/45239836
#if defined __GLIBC__ && defined __linux__

#if __GLIBC__ > 2 || __GLIBC_MINOR__ > 24
#include <sys/random.h>

int my_getentropy(void *buf, size_t buflen){
    return getentropy(buf, buflen);
}

#else /* older glibc */
int my_getentropy(void *buf, size_t buflen){
	FILE* urandom_handle = fopen("/dev/urandom", "rb");
	size_t bytes_read = fread(buf, 1, buflen, urandom_handle);
	fclose(urandom_handle);
	if (bytes_read == buflen){
		return 0;
	} else {
		return -1;
	}
}
#endif

#else /* not linux or not glibc */
#error "Need implementation for whatever operating system this is"
#endif



char* session_id_generate(void){
	const unsigned int ENTROPY_SIZE = 256;

	unsigned char entropy[ENTROPY_SIZE];

	int status = my_getentropy(entropy, ENTROPY_SIZE);

	if (status != 0){
		return NULL;
	}

	char *hashed_string = FCalloc(2*SHA_DIGEST_LENGTH + 1, sizeof(char));
	if (hashed_string == NULL){
		return NULL;
	}

	unsigned char temp[SHA_DIGEST_LENGTH];
	if (SHA1(entropy, sizeof(entropy), temp) == NULL){
		return NULL;
	}

	char *c = hashed_string;
	for (unsigned int i = 0; i < SHA_DIGEST_LENGTH; i++){
		sprintf(c, "%02x", temp[i]);
		c += 2;
	}

	return hashed_string;
}
