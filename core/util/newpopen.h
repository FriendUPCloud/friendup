

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

pid_t newpopen(const char *cmd, int *pipes);

int newpclose(pid_t pid, int *pipes);

