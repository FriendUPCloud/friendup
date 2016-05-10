
#ifndef __NETWORK_PROTOCOL_WEBDAV_H__
#define __NETWORK_PROTOCOL_WEBDAV_H__

#include <core/types.h>
#include <libxml2/libxml/tree.h>
#include <libxml2/libxml/parser.h>
#include <util/log/log.h>
#include <network/http.h>

#include <system/systembase.h>

Http *HandleWebDav( Http *req, char *data, int len );

#endif // __NETWORK_PROTOCOL_WEBDAV_H__
