# LibHTTP API Reference

### `httplib_get_header( conn, name );`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
|**`conn`**|`struct httplib_connection *`| A pointer referencing the connection |
|**`name`**|`const char *`| The name of the request header |

### Return Value

| Type | Description |
| :--- | :--- |
|`const char *`| A pointer to the value of the request header, or NULL of no matching header count be found |

### Description

HTTP and HTTPS clients can send request headers to the server to provide details about the communication. These request headers can for example specify the preferred language in which the server should respond and the supported compression algorithms. The function `httplib_get_header()` can be called to return the contents of a specific request header. The function will return a pointer to the value text of the header when succesful, and NULL of no matching request header from the client could be found.

### See Also

* [`struct httplib_header;`](httplib_header.md)
* [`httplib_get_cookie();`](httplib_get_cookie.md)
