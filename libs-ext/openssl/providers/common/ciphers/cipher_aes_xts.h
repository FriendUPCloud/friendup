/*
 * Copyright 2019 The OpenSSL Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License 2.0 (the "License").  You may not use
 * this file except in compliance with the License.  You can obtain a copy
 * in the file LICENSE in the source distribution or at
 * https://www.openssl.org/source/license.html
 */

#include <openssl/aes.h>
#include "internal/ciphers/ciphercommon.h"

PROV_CIPHER_FUNC(void, xts_stream,
                 (const unsigned char *in, unsigned char *out, size_t len,
                  const AES_KEY *key1, const AES_KEY *key2,
                  const unsigned char iv[16]));

typedef struct prov_aes_xts_ctx_st {
    PROV_CIPHER_CTX base;      /* Must be first */
    union {
        OSSL_UNION_ALIGN;
        AES_KEY ks;
    } ks1, ks2;                /* AES key schedules to use */
    XTS128_CONTEXT xts;
    OSSL_xts_stream_fn stream;
} PROV_AES_XTS_CTX;

const PROV_CIPHER_HW *PROV_CIPHER_HW_aes_xts(size_t keybits);
