# LibHTTP API Reference

### `struct client_cert;`

### Fields

| Field | Type | Description |
| :--- | :--- | :--- |
|**`subject`**|`const char *`| The subject of the certificate |
|**`issuer`**|`const char *`| The issuer of the certificate |
|**`serial`**|`const char *`| The serial number of the certificate |
|**`finger`**|`const char *`| The fingerprint of the certificate |

### Description

The structure `client_cert` is used as a sub-structure in the [`httplib_request_info`](httplib_request_info.md) structure to store information of an optional client supplied certificate.

### See Also

* [`struct httplib_request_info;`](httplib_request_info.md)
* [`httplib_get_request_info();`](httplib_get_request_info.md)
