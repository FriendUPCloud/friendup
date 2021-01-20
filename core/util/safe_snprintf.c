/*
 * file   : safe_snprintf.c
 * author : ning
 * date   : 2014-06-19 09:34:28
 */

#include <stdlib.h>
#include <stdarg.h>
#include <ctype.h>
#include <stdint.h>
#include <stdbool.h>

#include "safe_snprintf.h"

static const char HEX[] = "0123456789abcdef";

static char *
safe_utoa(int _base, uint64_t val, char *buf)
{
    uint32_t base = (uint32_t) _base;
    *buf-- = 0;
    do {
        *buf-- = HEX[val % base];
    } while ((val /= base) != 0);
    return buf + 1;
}

static char *
safe_itoa(int base, int64_t val, char *buf)
{
    char *orig_buf = buf;
    const int32_t is_neg = (val < 0);
    *buf-- = 0;

    if (is_neg) {
        val = -val;
    }
    if (is_neg && base == 16) {
        int ix;
        val -= 1;
        for (ix = 0; ix < 16; ++ix)
            buf[-ix] = '0';
    }

    do {
        *buf-- = HEX[val % base];
    } while ((val /= base) != 0);

    if (is_neg && base == 10) {
        *buf-- = '-';
    }

    if (is_neg && base == 16) {
        int ix;
        buf = orig_buf - 1;
        for (ix = 0; ix < 16; ++ix, --buf) {
            /* *INDENT-OFF* */
            switch (*buf) {
            case '0': *buf = 'f'; break;
            case '1': *buf = 'e'; break;
            case '2': *buf = 'd'; break;
            case '3': *buf = 'c'; break;
            case '4': *buf = 'b'; break;
            case '5': *buf = 'a'; break;
            case '6': *buf = '9'; break;
            case '7': *buf = '8'; break;
            case '8': *buf = '7'; break;
            case '9': *buf = '6'; break;
            case 'a': *buf = '5'; break;
            case 'b': *buf = '4'; break;
            case 'c': *buf = '3'; break;
            case 'd': *buf = '2'; break;
            case 'e': *buf = '1'; break;
            case 'f': *buf = '0'; break;
            }
            /* *INDENT-ON* */
        }
    }
    return buf + 1;
}

static const char *
safe_check_longlong(const char *fmt, int32_t * have_longlong)
{
    *have_longlong = false;
    if (*fmt == 'l') {
        fmt++;
        if (*fmt != 'l') {
            *have_longlong = (sizeof(long) == sizeof(int64_t));
        } else {
            fmt++;
            *have_longlong = true;
        }
    }
    return fmt;
}

int
_safe_vsnprintf(char *to, size_t size, const char *format, va_list ap)
{
    char *start = to;
    char *end = start + size - 1;
    for (; *format; ++format) {
        int32_t have_longlong = false;
        if (*format != '%') {
            if (to == end) {    /* end of buffer */
                break;
            }
            *to++ = *format;    /* copy ordinary char */
            continue;
        }
        ++format;               /* skip '%' */

        format = safe_check_longlong(format, &have_longlong);

        switch (*format) {
        case 'd':
        case 'i':
        case 'u':
        case 'x':
        case 'p':
            {
                int64_t ival = 0;
                uint64_t uval = 0;
                if (*format == 'p')
                    have_longlong = (sizeof(void *) == sizeof(uint64_t));
                if (have_longlong) {
                    if (*format == 'u') {
                        uval = va_arg(ap, uint64_t);
                    } else {
                        ival = va_arg(ap, int64_t);
                    }
                } else {
                    if (*format == 'u') {
                        uval = va_arg(ap, uint32_t);
                    } else {
                        ival = va_arg(ap, int32_t);
                    }
                }

                {
                    char buff[22];
                    const int base = (*format == 'x' || *format == 'p') ? 16 : 10;

		            /* *INDENT-OFF* */
                    char *val_as_str = (*format == 'u') ?
                        safe_utoa(base, uval, &buff[sizeof(buff) - 1]) :
                        safe_itoa(base, ival, &buff[sizeof(buff) - 1]);
		            /* *INDENT-ON* */

                    /* Strip off "ffffffff" if we have 'x' format without 'll' */
                    if (*format == 'x' && !have_longlong && ival < 0) {
                        val_as_str += 8;
                    }

                    while (*val_as_str && to < end) {
                        *to++ = *val_as_str++;
                    }
                    continue;
                }
            }
        case 's':
            {
                const char *val = va_arg(ap, char *);
                if (!val) {
                    val = "(null)";
                }
                while (*val && to < end) {
                    *to++ = *val++;
                }
                continue;
            }
        }
    }
    *to = 0;
    return (int)(to - start);
}

int
_safe_snprintf(char *to, size_t n, const char *fmt, ...)
{
    int result;
    va_list args;
    va_start(args, fmt);
    result = _safe_vsnprintf(to, n, fmt, args);
    va_end(args);
    return result;
}

#ifdef TEST_MAIN
#include <stdio.h>
#include <string.h>

#include "testhelp.h"

static void
test_snprintf(size_t bufsize, const char *fmt, ...)
{
    char *buf1 = calloc(bufsize, 1);
    char *buf2 = calloc(bufsize, 1);
    int r1, r2;
    va_list args;

    va_start(args, fmt);
    r1 = safe_snprintf(buf1, bufsize, fmt, args);
    va_end(args);

    va_start(args, fmt);
    r2 = snprintf(buf2, bufsize, fmt, args);
    va_end(args);

    /*printf("r1 = %d, r2 = %d \n", r1, r2); */
    /*printf("b1 = %s, b2 = %s \n", buf1, buf2); */

    test_cond(fmt, 0 == memcmp(buf1, buf2, bufsize));

    if (r2 < (int)bufsize) {
        /*
         * If the output was truncated due to this limit
         * for snprintf:
         *      the return value is the number of characters (not including the trailing '\0') which would have been written to the final string if enough space had been available.
         * for safe_snprintf:
         *      thre return value is bytes really written (n-1)
         * */
        test_cond(fmt, r1 == r2);
    }

    free(buf1);
    free(buf2);
}

/*
int
main(void)
{
    size_t i;

    test_snprintf(10, "0");
    test_snprintf(10, "01234567");
    test_snprintf(10, "012345678");
    test_snprintf(10, "0123456789");
    test_snprintf(10, "0123456789a");

    test_snprintf(10, "%s", "0");
    test_snprintf(10, "%s", "01234567");
    test_snprintf(10, "%s", "012345678");
    test_snprintf(10, "%s", "0123456789");
    test_snprintf(10, "%s", "01234567890");

    test_snprintf(10, "x%s", "0");
    test_snprintf(10, "x%s", "01234567");
    test_snprintf(10, "x%s", "012345678");
    test_snprintf(10, "x%s", "0123456789");
    test_snprintf(10, "x%s", "01234567890");

    test_snprintf(i, "%p", &i);
    test_snprintf(i, "%p", NULL);

    for (i = 0; i < 22; i++) {
        test_snprintf(i, "%d", 0);
        test_snprintf(i, "%d", 1234567);
        test_snprintf(i, "%d", 12345678);
        test_snprintf(i, "%d", 123456789);
        test_snprintf(i, "%d", 1234567890);

        test_snprintf(i, "%d", 2147483647);
        test_snprintf(i, "%d", 2147483648);
        test_snprintf(i, "%d", 4294967295);
        test_snprintf(i, "%d", 4294967296);

        test_snprintf(i, "%ld", 9223372036854775807L);
        test_snprintf(i, "%ld", 9223372036854775808UL);
        test_snprintf(i, "%ld", 18446744073709551615UL);
        //test_snprintf(i, "%ld", 18446744073709551616UL); 

        test_snprintf(i, "%lu", 9223372036854775807L);
        test_snprintf(i, "%lu", 9223372036854775808UL);
        test_snprintf(i, "%lu", 18446744073709551615UL);
        //test_snprintf(i, "%lu", 18446744073709551616UL); 

        test_snprintf(i, "%x", 0);
        test_snprintf(i, "%x", 1234567);
        test_snprintf(i, "%x", 12345678);
        test_snprintf(i, "%x", 123456789);

    }

    test_report();

    printf("%d\n", 1234567890);
    printf("%d\n", 2147483647);
    printf("%u\n", 4294967295U);

    printf("%ld\n", 9223372036854775807L);
    printf("%ld\n", 9223372036854775808UL);
}
*/
#endif

