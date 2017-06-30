#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "websockets" for configuration "Release"
set_property(TARGET websockets APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(websockets PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "C"
  IMPORTED_LINK_INTERFACE_LIBRARIES_RELEASE "/usr/lib/x86_64-linux-gnu/libz.so;/usr/lib/x86_64-linux-gnu/libssl.so;/usr/lib/x86_64-linux-gnu/libcrypto.so;m"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libwebsockets.a"
  )

list(APPEND _IMPORT_CHECK_TARGETS websockets )
list(APPEND _IMPORT_CHECK_FILES_FOR_websockets "${_IMPORT_PREFIX}/lib/libwebsockets.a" )

# Import target "websockets_shared" for configuration "Release"
set_property(TARGET websockets_shared APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(websockets_shared PROPERTIES
  IMPORTED_LINK_INTERFACE_LIBRARIES_RELEASE "/usr/lib/x86_64-linux-gnu/libz.so;/usr/lib/x86_64-linux-gnu/libssl.so;/usr/lib/x86_64-linux-gnu/libcrypto.so;m"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libwebsockets.so.10"
  IMPORTED_SONAME_RELEASE "libwebsockets.so.10"
  )

list(APPEND _IMPORT_CHECK_TARGETS websockets_shared )
list(APPEND _IMPORT_CHECK_FILES_FOR_websockets_shared "${_IMPORT_PREFIX}/lib/libwebsockets.so.10" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
