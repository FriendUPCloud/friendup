/*
 * file   : safe_snprintf.h
 * author : ning
 * date   : 2014-06-19 09:34:44
 */

#ifndef _SAFE_SNPRINTF_H_
#define _SAFE_SNPRINTF_H_

#include <sys/types.h>
#include <stdarg.h>

/**
  A (very) limited version of snprintf.
  @param   to   Destination buffer.
  @param   n    Size of destination buffer.
  @param   fmt  printf() style format string.
  @returns Number of bytes written, including terminating '\0'
  Supports 'd' 'i' 'u' 'x' 'p' 's' conversion.
  Supports 'l' and 'll' modifiers for integral types.
  Does not support any width/precision.
  Implemented with simplicity, and async-signal-safety in mind.
*/
int _safe_vsnprintf(char *to, size_t size, const char *format, va_list ap);
int _safe_snprintf(char *to, size_t n, const char *fmt, ...);

#define safe_snprintf(_s, _n, ...)         \
    _safe_snprintf((char *)(_s), (size_t)(_n), __VA_ARGS__)

#define safe_vsnprintf(_s, _n, _f, _a)     \
    _safe_vsnprintf((char *)(_s), (size_t)(_n), _f, _a)

#endif
/* vim: set expandtab ts=4 sw=4 sts=4 tw=100: */


