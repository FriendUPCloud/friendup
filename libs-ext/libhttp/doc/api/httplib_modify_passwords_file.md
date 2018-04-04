# LibHTTP API Reference

### `httplib_modify_passwords_file( passwords_file_name, domain, user, password );`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
|**`passwords_file_name`**|`const char *`|The path to the passwords file|
|**`domain`**|`const char *`|The domain of the user record|
|**`user`**|`const char *`|Username of the record to be added, changed or deleted|
|**`password`**|`const char *`|Password associated with the user or NULL if the record must be deleted|

### Return Value

| Type | Description |
| :--- | :--- |
|`int`|Success or error code|

### Description

The function `httplib_modify_passwords_file()` allows an application to manipulate .htpasswd files on the fly by adding, deleting and changing user records. This is one of the several ways to implement authentication on the server side.

If the password parameter is not `NULL` an entry is added to the password file. An existing records is modified in that case. If `NULL` is used as the password the enrty is removed from the file.

The function returns 1 when successful and 0 if an error occurs.

### See Also

* [`httplib_md5();`](httplib_md5.md)
