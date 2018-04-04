# LibHTTP API Reference

### `httplib_get_server_ports( ctx, size, ports );`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
|**`ctx`**|`const struct httplib_context *`|The context for which the server ports are requested|
|**`size`**|`int`|The size of the buffer to store the port information|
|**`ports`**|`struct httplib_server_ports *`|Buffer to store the port information|

### Return Value

| Type | Description |
| :--- | :--- |
|`int`|The actual number of ports returned, or an error condition|

### Description

The `httplib_get_server_ports()` returns a list with server ports on which the LibHTTP server is listening. The ports are returned for a given context and stored with additional information like the SSL and redirection state in a list of structures. The list of structures must be allocated by the calling routine. The size of the structure is also passed to `httplib_get_server_ports()`.

The function returns the number of items in the list, or a negative value if an error occured.

### See Also

* [`struct httplib_server_ports;`](httplib_server_ports.md)
