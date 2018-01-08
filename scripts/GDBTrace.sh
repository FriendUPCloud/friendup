#bin/bash
echo 0 | gdb -batch-silent -ex "handle SIGPIPE pass nostop noprint" -ex "run" -ex "set logging overwrite on" -ex "set logging file gdb.bt" -ex "set logging on" -ex "set pagination off" -ex "handle SIG33 pass nostop noprint" -ex "echo backtrace:\n" -ex "backtrace full" -ex "echo \n\nregisters:\n" -ex "info registers" -ex "echo \n\ncurrent instructions:\n" -ex "x/16i \$pc" -ex "echo \n\nthreads backtrace:\n" -ex "thread apply all backtrace" -ex "set logging off" -ex "quit" ./FriendCore
mv gdb.bt gdb.bt_$(date +%F-%H:%M).log
kill -9 $( lsof -i:6500 -t )
pkill FriendCore

