Adding wolfSSL (formerly CyaSSL) support
=====

In order to support SSL *HTTPS* connections in LibHTTP,
you may wish to use the GPLv2 licensed CyaSSL library.  By using this
library, the resulting binary may have to have the GPL license unless
you buy a commercial license from [wolfSSL](http://www.yassl.com/).

*Note: The following instructions have not been checked for the most recent versions of LibHTTP and wolfSSL. Some information might be outdated.*


Getting Started
----

- Download Cayssl at https://www.wolfssl.com (formerly http://www.yassl.com/)
- Extract the zip file
    - To make this seemless, extract to a directory parallel to with LibHTTP is

### Example Project

If you download cyaSSL to cyassl-2.7.0 in a directory parallel to LibHTTP, you can open the *VS/libhttp_yassl* solution in Visual Studio.

Build Configuration
----

#### Required include paths for both LibHTTP and cyassl
 - *cyassl_directory*\
 - *cyassl_directory*\cyassl\

#### Required LibHTTP preprocessor defines
 - USE_YASSL
 - NO_SSL_DL

#### Required cySSL preprocessor defines
 - OPENSSL_EXTRA
 - HAVE_ERRNO_H
 - HAVE_GETHOSTBYNAME
 - HAVE_INET_NTOA
 - HAVE_LIMITS_H
 - HAVE_MEMSET
 - HAVE_SOCKET
 - HAVE_STDDEF_H
 - HAVE_STDLIB_H
 - HAVE_STRING_H
 - HAVE_SYS_STAT_H
 - HAVE_SYS_TYPES_H

#### Required CyaSSL source files

 - ctaocrypt/src/aes.c
 - ctaocrypt/src/arc4.c
 - ctaocrypt/src/asn.c
 - ctaocrypt/src/coding.c
 - ctaocrypt/src/des3.c
 - ctaocrypt/src/dh.c
 - ctaocrypt/src/dsa.c
 - ctaocrypt/src/ecc.c
 - ctaocrypt/src/error.c
 - ctaocrypt/src/hc128.c
 - ctaocrypt/src/hmac.c
 - ctaocrypt/src/integer.c
 - ctaocrypt/src/logging.c
 - ctaocrypt/src/md2.c
 - ctaocrypt/src/md4.c
 - ctaocrypt/src/md5.c
 - ctaocrypt/src/memory.c
 - ctaocrypt/src/misc.c
 - ctaocrypt/src/pwdbased.c
 - ctaocrypt/src/rabbit.c
 - ctaocrypt/src/random.c
 - ctaocrypt/src/ripemd.c
 - ctaocrypt/src/rsa.c
 - ctaocrypt/src/sha.c
 - ctaocrypt/src/sha256.c
 - ctaocrypt/src/sha512.c
 - ctaocrypt/src/tfm.c
 - src/crl.c
 - src/internal.c
 - src/io.c
 - src/keys.c
 - src/ocsp.c
 - src/sniffer.c
 - src/ssl.c
 - src/tls.c



